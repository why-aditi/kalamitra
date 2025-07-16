print("--- CONFIRMATION: This listing module is being loaded! ---")
from fastapi import APIRouter, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import Response
from models.listingModel import Listing, ListingsResponse # Ensure Listing and ListingsResponse are imported
from typing import List, Optional, Dict, Any
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from services.database import Database
from services.generateListing import generate_listing_with_gemini
from datetime import datetime
from bson import ObjectId
from bson.errors import InvalidId
import uuid
from routes.auth import get_current_user
import os # Ensure os is imported for environment variables

router = APIRouter()

# Re-using serialize_listing_doc from artist.py for consistency
def serialize_listing_doc(listing_doc: dict) -> dict:
    """Helper function to serialize MongoDB listing document for Pydantic models"""
    # Create a copy to avoid modifying the original document during serialization
    serialized_doc = listing_doc.copy()
    # CRUCIAL: Handle _id to 'id' mapping for Pydantic model
    if "_id" in serialized_doc and isinstance(serialized_doc["_id"], ObjectId):
        serialized_doc["id"] = str(serialized_doc["_id"]) # Map _id to 'id'
        del serialized_doc["_id"] # Remove _id as Pydantic model uses 'id'
    elif "_id" in serialized_doc: # If _id is already a string (e.g., from a previous serialization)
        serialized_doc["id"] = str(serialized_doc["_id"])
        del serialized_doc["_id"]
    else:
        # This case should ideally not happen for documents fetched from MongoDB
        serialized_doc["id"] = "missing_id_fallback" # Fallback for debugging
        print(f"DEBUG_LISTING: WARNING: Listing document missing _id. Using fallback.")
    # Ensure image_ids is a list of strings
    if "image_ids" in serialized_doc and isinstance(serialized_doc["image_ids"], list):
        serialized_doc["image_ids"] = [str(img_id) if isinstance(img_id, ObjectId) else str(img_id) for img_id in serialized_doc["image_ids"]]
    else:
        serialized_doc["image_ids"] = [] # Default to empty list if not present or not a list
    # Ensure all other fields expected by Pydantic model are present with defaults
    serialized_doc["tags"] = serialized_doc.get("tags", [])
    serialized_doc["story"] = serialized_doc.get("story", "")
    serialized_doc["created_at"] = serialized_doc.get("created_at", datetime.utcnow())
    serialized_doc["updated_at"] = serialized_doc.get("updated_at", datetime.utcnow())
    serialized_doc["status"] = serialized_doc.get("status", "active")
    serialized_doc["ai_generated"] = serialized_doc.get("ai_generated", False)
    serialized_doc["ai_metadata"] = serialized_doc.get("ai_metadata", {})
    # Ensure price is float, handle potential string prices from old data/AI
    try:
        price_val = serialized_doc.get("price", serialized_doc.get("suggested_price", "0.0"))
        if isinstance(price_val, str):
            price_val = float(price_val.replace('₹', '').replace(',', '')) # Also handle commas
        serialized_doc["price"] = float(price_val)
    except (ValueError, TypeError):
        serialized_doc["price"] = 0.0
        print(f"DEBUG_LISTING: WARNING: Could not parse price for listing {serialized_doc.get('id')}. Setting to 0.0.")
    try:
        original_price_val = serialized_doc.get("originalPrice", serialized_doc.get("price", "0.0"))
        if isinstance(original_price_val, str):
            original_price_val = float(original_price_val.replace('₹', '').replace(',', ''))
        serialized_doc["originalPrice"] = float(original_price_val)
    except (ValueError, TypeError):
        serialized_doc["originalPrice"] = serialized_doc["price"] # Fallback to parsed price
        print(f"DEBUG_LISTING: WARNING: Could not parse originalPrice for listing {serialized_doc.get('id')}. Setting to price.")
    serialized_doc["inStock"] = serialized_doc.get("inStock", True)
    serialized_doc["stockCount"] = serialized_doc.get("stockCount", 0)
    serialized_doc["features"] = serialized_doc.get("features", [])
    serialized_doc["specifications"] = serialized_doc.get("specifications", {})
    serialized_doc["reviews"] = serialized_doc.get("reviews", [])
    serialized_doc["shippingInfo"] = serialized_doc.get("shippingInfo", {})
    return serialized_doc


@router.get("/listings", response_model=ListingsResponse) # Specify response model
async def get_listings(
    skip: int = 0,
    limit: int = 100,
    search: str = "",
    min_price: float = 0,
    max_price: float = 50000,
    category: str = "all",
    state: str = "all", # Assuming 'state' is a filter for listings
    db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """Get all listings with pagination and filters"""
    try:
        # Build filter query
        filter_query = {}

        # Search in title, description, and tags
        if search:
            filter_query["$or"] = [
                {"title": {"$regex": search, "$options": "i"}},
                {"description": {"$regex": search, "$options": "i"}},
                {"tags": {"$regex": search, "$options": "i"}}
            ]

        # Price range filter (using the 'price' field which is float)
        # Assuming 'price' field is already a float in DB or handled by serialize_listing_doc
        if min_price > 0 or max_price < 50000:
            filter_query["price"] = {"$gte": min_price, "$lte": max_price}

        # Category filter
        if category != "all":
            filter_query["category"] = {"$regex": f"^{category}$", "$options": "i"}
        
        # State filter (assuming listings have a 'state' field, e.g., from artist's location)
        if state != "all":
            # This might require a lookup to the 'users' collection if state is on the artist profile
            # For simplicity, assuming 'state' might be directly on the listing or can be added.
            # If it's on the artist, you'd need an aggregation pipeline or a separate query.
            # For now, assuming a direct field on listing for demonstration.
            filter_query["state"] = {"$regex": f"^{state}$", "$options": "i"}


        # Get listings from the collection
        listings_cursor = db.listings.find(filter_query).skip(skip).limit(limit).sort("created_at", -1)
        raw_listings = await listings_cursor.to_list(length=limit)

        # Get total count with filters
        total_count = await db.listings.count_documents(filter_query)

        # Serialize each listing and validate with Pydantic model, constructing full image URLs
        serialized_listings = []
        for listing_doc in raw_listings:
            serialized_doc = serialize_listing_doc(listing_doc)

            full_image_urls = []
            if "image_ids" in serialized_doc and isinstance(serialized_doc["image_ids"], list):
                for img_id in serialized_doc["image_ids"]:
                    listing_id_str = serialized_doc.get("id")
                    if listing_id_str:
                        api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
                        if not api_base_url:
                            print("DEBUG_LISTINGS: WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder for image URL.")
                            full_image_urls.append("/placeholder.svg")
                        else:
                            full_image_urls.append(f"{api_base_url}/api/listings/{listing_id_str}/images/{img_id}")
                    else:
                        print(f"DEBUG_LISTINGS: WARNING: Listing ID missing for image {img_id}. Cannot construct full URL.")
            serialized_doc["images"] = full_image_urls # Assign the constructed URLs to the 'images' field

            try:
                pydantic_listing = Listing(**serialized_doc)
                serialized_listings.append(pydantic_listing)
            except Exception as e:
                print(f"DEBUG_LISTINGS: Pydantic validation error for listing: {e} on doc: {serialized_doc}")
                continue # Skip problematic listing

        return ListingsResponse(
            listings=serialized_listings,
            total=total_count,
            limit=limit,
            skip=skip
        )
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
        
        # Use the serialization helper to ensure consistency and Pydantic compatibility
        serialized_listing = serialize_listing_doc(listing)

        # Construct full image URLs for the 'images' array
        full_image_urls = []
        if "image_ids" in serialized_listing and isinstance(serialized_listing["image_ids"], list):
            for img_id in serialized_listing["image_ids"]:
                listing_id_str = serialized_listing.get("id")
                if listing_id_str:
                    api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
                    if not api_base_url:
                        print("DEBUG_LISTING: WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder for image URL.")
                        full_image_urls.append("/placeholder.svg")
                    else:
                        full_image_urls.append(f"{api_base_url}/api/listings/{listing_id_str}/images/{img_id}")
                else:
                    print(f"DEBUG_LISTING: WARNING: Listing ID missing for image {img_id}. Cannot construct full URL.")
        serialized_listing["images"] = full_image_urls # Assign the constructed URLs to the 'images' field

        # Fetch Artisan details if artist_id exists
        if "artist_id" in serialized_listing and serialized_listing["artist_id"]:
            artisan_profile = await db.users.find_one({"firebase_uid": serialized_listing["artist_id"]})
            if artisan_profile:
                serialized_listing["artisan"] = {
                    "name": artisan_profile.get("display_name", "Unknown Artisan"),
                    "location": artisan_profile.get("address", "N/A"),
                    "experience": artisan_profile.get("experience", "N/A"),
                    "rating": artisan_profile.get("rating", 0),
                    "bio": artisan_profile.get("bio", "No bio available."),
                    "avatar": artisan_profile.get("avatar_url", "/placeholder.svg")
                }
            else:
                serialized_listing["artisan"] = {
                    "name": "Unknown Artisan", "location": "N/A", "experience": "N/A",
                    "rating": 0, "bio": "No bio available.", "avatar": "/placeholder.svg"
                }
        else:
            serialized_listing["artisan"] = {
                "name": "Unknown Artisan", "location": "N/A", "experience": "N/A",
                "rating": 0, "bio": "No bio available.", "avatar": "/placeholder.svg"
            }
        
        # Validate with Pydantic model before returning
        pydantic_listing = Listing(**serialized_listing)
        return {"listing": pydantic_listing} # Return the validated Pydantic object
    except HTTPException:
        raise # Let FastAPI handle expected errors
    except Exception as e:
        print(f"DEBUG_LISTING: Unexpected error in get_listing: {e}")
        raise HTTPException(status_code=500, detail=f"Error fetching listing: {str(e)}")

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
            await img.seek(0)   # Reset pointer for reading
            image_contents_for_gemini.append(await img.read())
            await img.seek(0)   # Reset pointer again for GridFS upload
        # Generate AI listing content
        ai_listing = await generate_listing_with_gemini(transcription, image_contents_for_gemini)
        firebase_uid = current_user["firebase_uid"]
        print(f"DEBUG_CREATE: ai_listing suggestedPrice: {ai_listing.get('suggestedPrice')}")
        raw_price_str = ai_listing.get("suggestedPrice", "₹299").replace('₹', '').replace(',', '') # Handle commas
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
