import os
# Change: Import AsyncIOMotorClient instead of MongoClient
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorGridFSBucket
from bson import ObjectId
from datetime import datetime
import asyncio
from PIL import Image
import io

# Import the modified generate_listing_with_gemini
from services.generateListing import generate_listing_with_gemini

# --- Configuration ---
# IMPORTANT: Replace with your MongoDB connection string
MONGO_URI = "mongodb+srv://aditi25kala:Meesho123@cluster0.qf3xtrq.mongodb.net/" # Your provided URI
DATABASE_NAME = "kalamitra" # Your provided database name

async def migrate_listings_data():
    client = None
    try:
        # Change: Use AsyncIOMotorClient for asynchronous operations
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DATABASE_NAME]
        listings_collection = db.listings
        bucket = AsyncIOMotorGridFSBucket(db) # This now correctly receives an AsyncIOMotorDatabase

        print("Starting migration of existing listings...")

        # Fetch all listings asynchronously
        listings_cursor = listings_collection.find({})
        # Change: Use .to_list(None) for async cursor to get all documents
        all_listings = await listings_cursor.to_list(None)

        print(f"Found {len(all_listings)} listings to process.")

        for i, listing in enumerate(all_listings):
            listing_id = str(listing["_id"])
            print(f"\nProcessing listing {i+1}/{len(all_listings)}: ID {listing_id}")

            # --- 1. Handle artist_id inconsistency ---
            if listing.get("artist_id") is None and listing.get("firebase_uid"):
                listing["artist_id"] = listing["firebase_uid"]
                print(f"  - Corrected artist_id from firebase_uid: {listing['artist_id']}")

            # --- 2. Prepare images for Gemini (fetch from GridFS) ---
            image_bytes_for_gemini = []
            if listing.get("image_ids") and len(listing["image_ids"]) > 0:
                # Only fetch the first image for AI generation to save tokens/time
                first_image_id = listing["image_ids"][0]
                try:
                    # Ensure it's an ObjectId for GridFS
                    if isinstance(first_image_id, dict) and "$oid" in first_image_id:
                        first_image_id = ObjectId(first_image_id["$oid"])
                    elif isinstance(first_image_id, str):
                        first_image_id = ObjectId(first_image_id)

                    # Use await for async GridFS operations
                    download_stream = await bucket.open_download_stream(first_image_id)
                    image_bytes_for_gemini.append(await download_stream.read())
                    print(f"  - Fetched primary image {first_image_id} for AI enrichment.")
                except Exception as e:
                    print(f"  - Warning: Could not fetch image {first_image_id} from GridFS: {e}")
            else:
                print("  - No images found for AI enrichment.")

            # --- 3. Enrich data using generate_listing_with_gemini ---
            transcription = listing.get("transcription", listing.get("description", "default product"))
            if not transcription:
                print(f"  - Warning: No transcription or description for listing {listing_id}. Skipping AI enrichment.")
                continue # Skip AI enrichment if no text to work with

            try:
                # Call the modified generate_listing_with_gemini
                enriched_data = await generate_listing_with_gemini(transcription, image_bytes_for_gemini)
                print("  - AI enrichment successful.")
            except Exception as e:
                print(f"  - Error during AI enrichment for listing {listing_id}: {e}. Using existing data.")
                enriched_data = {} # Use empty dict if AI fails, so we don't overwrite existing good data

            # --- 4. Prepare update data for MongoDB ---
            update_fields = {}

            # Price conversion
            suggested_price_str = enriched_data.get("suggestedPrice", listing.get("suggested_price", "₹0")).replace('₹', '')
            try:
                update_fields["price"] = float(suggested_price_str)
                update_fields["originalPrice"] = float(enriched_data.get("originalPrice", update_fields["price"]))
            except ValueError:
                print(f"  - Warning: Could not convert suggestedPrice '{suggested_price_str}' to float. Setting price to 0.0.")
                update_fields["price"] = 0.0
                update_fields["originalPrice"] = 0.0

            # Copy other fields from enriched_data, prioritizing AI output
            for key in ["title", "description", "tags", "category", "story",
                        "features", "specifications", "inStock", "stockCount", "shippingInfo", "reviews"]:
                if key in enriched_data:
                    update_fields[key] = enriched_data[key]
                elif key not in listing: # If AI didn't provide and it's missing in original, add default
                    if key == "tags": update_fields[key] = ["Handmade"]
                    elif key == "features": update_fields[key] = []
                    elif key == "specifications": update_fields[key] = {}
                    elif key == "inStock": update_fields[key] = True
                    elif key == "stockCount": update_fields[key] = 10
                    elif key == "shippingInfo": update_fields[key] = {"estimatedDays": "N/A", "returnPolicy": "N/A"}
                    elif key == "reviews": update_fields[key] = []

            # Ensure artist_id is set if it was corrected
            if "artist_id" in listing:
                update_fields["artist_id"] = listing["artist_id"]

            # Preserve existing image_ids (migration won't add more images if they weren't uploaded)
            if "image_ids" in listing:
                # Ensure image_ids are stored as ObjectId in DB, but converted to string for frontend
                # The original image_ids might be ObjectId or dict with $oid
                cleaned_image_ids = []
                for img_id in listing["image_ids"]:
                    if isinstance(img_id, dict) and "$oid" in img_id:
                        cleaned_image_ids.append(ObjectId(img_id["$oid"]))
                    elif isinstance(img_id, str):
                        try:
                            cleaned_image_ids.append(ObjectId(img_id))
                        except:
                            cleaned_image_ids.append(img_id) # Keep as string if not valid ObjectId
                    else:
                        cleaned_image_ids.append(img_id) # Keep as is
                update_fields["image_ids"] = cleaned_image_ids
            else:
                update_fields["image_ids"] = [] # Default if missing

            update_fields["updated_at"] = datetime.utcnow() # Mark as updated

            # --- 5. Update document in MongoDB ---
            # Use await for async update operation
            result = await listings_collection.update_one(
                {"_id": listing["_id"]},
                {"$set": update_fields}
            )

            if result.matched_count > 0:
                if result.modified_count > 0:
                    print(f"  - Successfully updated listing {listing_id}.")
                else:
                    print(f"  - Listing {listing_id} found, but no changes were made (data might already be complete).")
            else:
                print(f"  - Error: Listing {listing_id} not found during update.")

    except Exception as e:
        print(f"An error occurred during migration: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    # Run the async migration function
    asyncio.run(migrate_listings_data())
