# D:\kalamitra\backend\routes\listing.py
print("--- CONFIRMATION: This listing module is being loaded! ---")
from fastapi import APIRouter, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import Response
from models.listingModel import Listing # Assuming Listing model defines these fields
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from services.database import Database
from services.generateListing import generate_listing_with_gemini
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
import uuid
from routes.auth import get_current_user

router = APIRouter()

@router.get("/listings")
async def get_listings(
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Get all listings with pagination"""
    try:
        # Get listings from the collection
        listings_cursor = db.listings.find().skip(skip).limit(limit).sort("created_at", -1)
        listings = await listings_cursor.to_list(length=limit)
        # Convert ObjectId to string for JSON serialization
        for listing in listings:
            if "_id" in listing:
                listing["_id"] = str(listing["_id"])
            if "image_ids" in listing:
                listing["image_ids"] = [str(img_id) for img_id in listing["image_ids"]]
        # Get total count
        total_count = await db.listings.count_documents({})
        return {
            "listings": listings,
            "total": total_count,
            "skip": skip,
            "limit": limit
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching listings: {str(e)}")

@router.get("/listings/{listing_id}")
async def get_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Get a specific listing by ID"""
    print(f"!!! ABSOLUTE ENTRY: get_listing function invoked for ID: {listing_id} !!!")
    try:
        try:
            object_id = ObjectId(listing_id)
            print(f"DEBUG_LISTING: Received listing_id: {listing_id}")
            print(f"DEBUG_LISTING: Converted to ObjectId: {object_id}")
        except InvalidId:
            print(f"DEBUG_LISTING: Invalid listing ID format for: {listing_id}")
            raise HTTPException(status_code=400, detail="Invalid listing ID format")

        listing = await db.listings.find_one({
            "$or": [
                {"_id": object_id},
                {"_id": listing_id}
            ]
        })

        if not listing:
            print(f"DEBUG_LISTING: Listing with ID {listing_id} NOT FOUND in database.")
            raise HTTPException(status_code=404, detail="Listing not found")

        print(f"DEBUG_LISTING: Listing FOUND: {listing.get('title', 'No Title')} (ID: {listing_id})")

        # Convert ObjectId to string
        listing["_id"] = str(listing["_id"])

        # Ensure image_ids is an array of strings
        if "image_ids" in listing and isinstance(listing["image_ids"], list):
            listing["image_ids"] = [str(img_id) for img_id in listing["image_ids"]]
        else:
            listing["image_ids"] = [] # Default to empty list if not present or not a list

        # --- START: ADDING MISSING PRODUCT DETAILS ---
        # Ensure price is set first, as other fields might depend on it
        listing["price"] = float(listing.get("price", 0.0)) # Default to 0.0 if not specified

        # Fetch Artisan details if artist_id exists
        if "artist_id" in listing and listing["artist_id"]:
            # Assuming 'users' collection stores artisan profiles
            # You might need to adjust the query based on how artist_id maps to user_id
            artisan_profile = await db.users.find_one({"firebase_uid": listing["artist_id"]})
            if artisan_profile:
                listing["artisan"] = {
                    "name": artisan_profile.get("display_name", "Unknown Artisan"),
                    "location": artisan_profile.get("address", "N/A"), # Assuming address can be location
                    "experience": artisan_profile.get("experience", "N/A"), # Add this field to your user model if needed
                    "rating": artisan_profile.get("rating", 0), # Add this field to your user model if needed
                    "bio": artisan_profile.get("bio", "No bio available."), # Add this field to your user model if needed
                    "avatar": artisan_profile.get("avatar_url", "/placeholder.svg") # Add this field to your user model if needed
                }
            else:
                listing["artisan"] = {
                    "name": "Unknown Artisan",
                    "location": "N/A",
                    "experience": "N/A",
                    "rating": 0,
                    "bio": "No bio available.",
                    "avatar": "/placeholder.svg"
                }
        else:
            listing["artisan"] = {
                "name": "Unknown Artisan",
                "location": "N/A",
                "experience": "N/A",
                "rating": 0,
                "bio": "No bio available.",
                "avatar": "/placeholder.svg"
            }

        # Ensure other fields are present, providing defaults if missing
        listing["reviews"] = listing.get("reviews", []) # Assuming reviews are stored directly in listing or fetched separately
        listing["specifications"] = listing.get("specifications", {}) # Assuming specifications are stored as a dict
        listing["inStock"] = listing.get("inStock", True) # Default to True if not specified
        listing["originalPrice"] = listing.get("originalPrice", listing["price"]) # Default to current price
        listing["stockCount"] = listing.get("stockCount", 999) # Default to a high number
        listing["shippingInfo"] = listing.get("shippingInfo", {
            "estimatedDays": "3-5 business days",
            "returnPolicy": "30-day returns"
        })
        listing["features"] = listing.get("features", []) # Default to empty list

        # --- END: ADDING MISSING PRODUCT DETAILS ---

        return {"listing": listing}
    except HTTPException:
        raise # Let FastAPI handle expected errors
    except Exception as e:
        print(f"DEBUG_LISTING: Unexpected error in get_listing: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching listing: {str(e)}")

# ... (rest of your router code)

@router.post("/create-listing")
async def create_listing(
    transcription: str = Form(...),
    images: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Create a new listing with images and AI-generated content"""
    try:
        # Initialize GridFS bucket for file storage
        bucket = AsyncIOMotorGridFSBucket(db)

        # Store uploaded images
        image_ids = []
        for img in images:
            # Validate image
            if not img.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail=f"File {img.filename} is not an image")

            # Read image content
            content = await img.read()

            # Generate unique filename
            unique_filename = f"{uuid.uuid4()}_{img.filename}"

            # Upload to GridFS
            upload_stream = bucket.open_upload_stream(
                unique_filename,
                metadata={
                    "content_type": img.content_type,
                    "original_filename": img.filename,
                    "uploaded_at": datetime.utcnow()
                }
            )
            await upload_stream.write(content)
            await upload_stream.close()

            image_ids.append(upload_stream._id)

        # Collect image contents for Gemini
        image_contents_for_gemini = []
        for img in images:
            await img.seek(0)  # Reset pointer for reading
            image_contents_for_gemini.append(await img.read())
            await img.seek(0)  # Reset pointer again for GridFS upload

        # Generate AI listing content
        ai_listing = await generate_listing_with_gemini(transcription, image_contents_for_gemini)
        firebase_uid = current_user["firebase_uid"]

        print(f"DEBUG_CREATE: ai_listing suggestedPrice: {ai_listing.get('suggestedPrice')}")
        raw_price_str = ai_listing.get("suggestedPrice", "₹299").replace('₹', '')
        print(f"DEBUG_CREATE: raw_price_str after replace: {raw_price_str}")
        try:
            converted_price = float(raw_price_str)
            print(f"DEBUG_CREATE: Converted price: {converted_price}")
        except ValueError as e:
            print(f"DEBUG_CREATE: Error converting price to float: {e} for value: {raw_price_str}")
            converted_price = 0.0 # Fallback to 0.0 on error

        # Create listing document
        listing_data = {
            "artist_id": firebase_uid,
            "title": ai_listing.get("title", "Untitled Listing"),
            "description": ai_listing.get("description", ""),
            "tags": ai_listing.get("tags", []),
            "category": ai_listing.get("category", "Crafts"),
            "suggested_price": ai_listing.get("suggestedPrice", "₹299"),
            "story": ai_listing.get("story", ""),
            "transcription": transcription,
            "image_ids": image_ids,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active",
            "ai_generated": True,
            "ai_metadata": {
                "model": "gemini-2.5-flash",
                "generated_at": datetime.utcnow(),
                "fallback_used": ai_listing.get("fallback_used", False)
            },
            "price": converted_price, # Use the debugged converted_price
            "originalPrice": converted_price, # Use the debugged converted_price
            "inStock": True,
            "stockCount": 10,
            "features": ai_listing.get("features", []),
            "specifications": ai_listing.get("specifications", {}),
            "reviews": [],
            "shippingInfo": {
                "estimatedDays": "3-5 business days",
                "returnPolicy": "30-day returns"
            }
        }

        # Insert into listings collection
        result = await db.listings.insert_one(listing_data)

        # Return the response with proper structure
        return {
            "message": "Listing created successfully",
            "listing_id": str(result.inserted_id),
            "image_ids": [str(img_id) for img_id in image_ids],
            "ai_listing": {
                "title": ai_listing.get("title", "Untitled Listing"),
                "description": ai_listing.get("description", ""),
                "tags": ai_listing.get("tags", []),
                "category": ai_listing.get("category", "Crafts"),
                "suggestedPrice": ai_listing.get("suggestedPrice", "₹299"),
                "story": ai_listing.get("story", "")
            },
            "created_at": listing_data["created_at"].isoformat(),
            "status": "success"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating listing: {str(e)}")

# Also add an endpoint to update listing status if needed
@router.patch("/listings/{listing_id}/status")
async def update_listing_status(
    listing_id: str,
    status: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Update listing status (active, inactive, draft, published)"""
    try:
        valid_statuses = ["active", "inactive", "draft", "published"]
        if status not in valid_statuses:
            raise HTTPException(status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}")

        result = await db.listings.update_one(
            {"_id": ObjectId(listing_id)},
            {
                "$set": {
                    "status": status,
                    "updated_at": datetime.utcnow()
                }
            }
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Listing not found")

        return {"message": f"Listing status updated to {status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error updating listing status: {str(e)}")

# Add an endpoint to get listing by ID for verification
@router.get("/listings/{listing_id}/verify")
async def verify_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Verify that a listing exists and return basic info"""
    try:
        listing = await db.listings.find_one(
            {"_id": ObjectId(listing_id)},
            {"title": 1, "status": 1, "created_at": 1, "artist_id": 1}
        )

        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        return {
            "listing_id": str(listing["_id"]),
            "title": listing["title"],
            "status": listing["status"],
            "created_at": listing["created_at"].isoformat(),
            "artist_id": listing.get("artist_id"),
            "exists": True
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error verifying listing: {str(e)}")

@router.get("/listings/{listing_id}/images/{image_id}")
async def get_image(
    listing_id: str,
    image_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Get an image file from GridFS"""
    print(f"DEBUG_IMAGE: Attempting to retrieve image. Listing ID: {listing_id}, Image ID: {image_id}")
    try:
        bucket = AsyncIOMotorGridFSBucket(db)
        # Step 1: Fetch listing
        try:
            listing_object_id = ObjectId(listing_id)
        except InvalidId:
            print(f"DEBUG_IMAGE: Invalid listing ID format: {listing_id}")
            raise HTTPException(status_code=400, detail="Invalid listing ID format")

        listing = await db.listings.find_one({"_id": listing_object_id})
        if not listing:
            print(f"DEBUG_IMAGE: Listing {listing_id} not found.")
            raise HTTPException(status_code=404, detail="Listing not found")
        print(f"DEBUG_IMAGE: Listing found: {listing.get('title')}")

        # Step 2: Verify the image belongs to the listing
        # Ensure image_ids are correctly handled (can be ObjectId or string)
        image_ids_in_listing = [str(img_id) if isinstance(img_id, ObjectId) else (img_id["$oid"] if isinstance(img_id, dict) and "$oid" in img_id else str(img_id)) for img_id in listing.get("image_ids", [])]
        
        print(f"DEBUG_IMAGE: Image IDs in listing: {image_ids_in_listing}")
        print(f"DEBUG_IMAGE: Checking if {image_id} is in {image_ids_in_listing}")

        if image_id not in image_ids_in_listing:
            print(f"DEBUG_IMAGE: Image {image_id} not found in listing {listing_id}'s image_ids.")
            raise HTTPException(status_code=404, detail="Image not found in listing")
        print(f"DEBUG_IMAGE: Image {image_id} verified to belong to listing.")

        # Step 3: Open download stream from GridFS
        try:
            image_object_id = ObjectId(image_id)
            download_stream = await bucket.open_download_stream(image_object_id)
            print(f"DEBUG_IMAGE: GridFS download stream opened for {image_id}.")
        except Exception as e:
            print(f"DEBUG_IMAGE: Error opening GridFS download stream for {image_id}: {e}")
            raise HTTPException(status_code=404, detail="Image file not found in GridFS")

        # Step 4: Get metadata-based content type (fallback to image/jpeg)
        content_type = "image/jpeg"
        if hasattr(download_stream, "file") and hasattr(download_stream.file, "metadata"):
            content_type = download_stream.file.metadata.get("content_type", "image/jpeg")
        print(f"DEBUG_IMAGE: Content type determined: {content_type}")

        # Step 5: Read image data and return as response
        image_data = await download_stream.read()
        print(f"DEBUG_IMAGE: Image data read. Size: {len(image_data)} bytes.")
        return Response(content=image_data, media_type=content_type)
    except HTTPException:
        raise # Let FastAPI handle expected errors
    except Exception as e:
        print(f"DEBUG_IMAGE: Unexpected error in get_image: {e}")
        raise HTTPException(status_code=500, detail=f"Error retrieving image: {str(e)}")

@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Delete a listing and its associated images"""
    try:
        # Get listing first
        listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        # Delete associated images from GridFS
        bucket = AsyncIOMotorGridFSBucket(db)
        for image_id in listing.get("image_ids", []):
            try:
                await bucket.delete(image_id)
            except Exception as e:
                print(f"Warning: Could not delete image {image_id}: {e}")

        # Delete the listing
        result = await db.listings.delete_one({"_id": ObjectId(listing_id)})

        if result.deleted_count == 0:
            raise HTTPException(status_code=404, detail="Listing not found")

        return {"message": "Listing deleted successfully"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error deleting listing: {str(e)}")
