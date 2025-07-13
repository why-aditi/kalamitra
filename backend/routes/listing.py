from fastapi import APIRouter, Form, File, UploadFile, Depends, HTTPException
from fastapi.responses import Response
from models.listingModel import Listing
from typing import List, Optional
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket
from services.database import Database
from services.generateListing import generate_listing_with_gemini
from datetime import datetime
from bson import ObjectId
import uuid

router = APIRouter()

@router.get("/listings")
async def get_listings(
    skip: int = 0,
    limit: int = 100,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)
):
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
    db: AsyncIOMotorDatabase = Depends(Database.get_db)
):
    """Get a specific listing by ID"""
    try:
        listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        # Convert ObjectId to string
        listing["_id"] = str(listing["_id"])
        if "image_ids" in listing:
            listing["image_ids"] = [str(img_id) for img_id in listing["image_ids"]]
        
        return {"listing": listing}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching listing: {str(e)}")

@router.post("/create-listing")
async def create_listing(
    transcription: str = Form(...),
    images: List[UploadFile] = File(...),
    artist_id: Optional[str] = Form(None),
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
        
        # Generate AI listing content
        ai_listing = await generate_listing_with_gemini(transcription, images)
        
        # Create listing document
        listing_data = {
            **ai_listing,
            "transcription": transcription,
            "image_ids": image_ids,
            "artist_id": artist_id,
            "created_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
            "status": "active"
        }
        
        # Insert into listings collection
        result = await db.listings.insert_one(listing_data)
        
        return {
            "message": "Listing created successfully",
            "listing_id": str(result.inserted_id),
            "image_ids": [str(img_id) for img_id in image_ids],
            "ai_listing": ai_listing,
            "created_at": listing_data["created_at"].isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error creating listing: {str(e)}")

@router.get("/listings/{listing_id}/images/{image_id}")
async def get_image(
    listing_id: str,
    image_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)
):
    """Get an image file from GridFS"""
    try:
        bucket = AsyncIOMotorGridFSBucket(db)
        
        # Verify the image belongs to the listing
        listing = await db.listings.find_one({"_id": ObjectId(listing_id)})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")
        
        if ObjectId(image_id) not in listing.get("image_ids", []):
            raise HTTPException(status_code=404, detail="Image not found in listing")
        
        # Get image from GridFS
        download_stream = await bucket.open_download_stream(ObjectId(image_id))
        image_data = await download_stream.read()
        
        # Get file info
        file_info = await bucket.find({"_id": ObjectId(image_id)}).to_list(length=1)
        if not file_info:
            raise HTTPException(status_code=404, detail="Image file not found")
        
        content_type = file_info[0].metadata.get("content_type", "image/jpeg")
        
        return Response(content=image_data, media_type=content_type)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving image: {str(e)}")

@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db)
):
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