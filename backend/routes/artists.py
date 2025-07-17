from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth
from typing import List, Optional, Dict, Any
from .auth import get_current_user, check_artist_role
from models.artistModel import ArtistProfile, ArtistProfileUpdate, ArtisanOnboardingData, ArtisanProfileDB, ArtisanProfileResponse
from models.listingModel import Listing, ListingsResponse # Ensure Listing and ListingsResponse are imported
from services.database import Database
from datetime import datetime # CRUCIAL: Import datetime
from bson import ObjectId # CRUCIAL: Import ObjectId for explicit conversion
import os

router = APIRouter()

def serialize_artisan_doc(artisan_doc: dict) -> dict:
    """Helper function to serialize MongoDB document for Pydantic models"""
    if artisan_doc:
        # Convert ObjectId to string
        if "_id" in artisan_doc:
            artisan_doc["_id"] = str(artisan_doc["_id"])
        
        # Ensure required fields for ArtisanProfileResponse are present
        # Assuming ArtisanProfileResponse expects 'name', 'email', 'display_name'
        # and that 'name' is the primary name field, 'display_name' is optional.
        # The error specifically mentions 'display_name' and 'email' as missing.
        artisan_doc["name"] = artisan_doc.get("name", artisan_doc.get("display_name", "Unknown Artisan"))
        artisan_doc["display_name"] = artisan_doc.get("display_name", artisan_doc.get("name", "Unknown Artisan")) # Ensure display_name is present
        artisan_doc["email"] = artisan_doc.get("email", "unknown@example.com") # Ensure email is present
        
        return artisan_doc
    return None

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
        print(f"DEBUG_ARTIST_LISTINGS: WARNING: Listing document missing _id. Using fallback.")
    # Ensure image_ids is a list of strings
    if "image_ids" in serialized_doc and isinstance(serialized_doc["image_ids"], list):
        serialized_doc["image_ids"] = [str(img_id) if isinstance(img_id, ObjectId) else str(img_id) for img_id in serialized_doc["image_ids"]]
    else:
        serialized_doc["image_ids"] = [] # Default to empty list if not present or not a list
    # Ensure all other fields expected by Pydantic model are present with defaults
    # This is crucial if the DB document is missing some fields after AI enrichment or initial creation
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
            price_val = float(price_val.replace('₹', ''))
        serialized_doc["price"] = float(price_val)
    except (ValueError, TypeError):
        serialized_doc["price"] = 0.0
        print(f"DEBUG_ARTIST_LISTINGS: WARNING: Could not parse price for listing {serialized_doc.get('id')}. Setting to 0.0.")
    try:
        original_price_val = serialized_doc.get("originalPrice", serialized_doc.get("price", "0.0"))
        if isinstance(original_price_val, str):
            original_price_val = float(original_price_val.replace('₹', ''))
        serialized_doc["originalPrice"] = float(original_price_val)
    except (ValueError, TypeError):
        serialized_doc["originalPrice"] = serialized_doc["price"] # Fallback to parsed price
        print(f"DEBUG_ARTIST_LISTINGS: WARNING: Could not parse originalPrice for listing {serialized_doc.get('id')}. Setting to price.")
    serialized_doc["inStock"] = serialized_doc.get("inStock", True)
    serialized_doc["stockCount"] = serialized_doc.get("stockCount", 0)
    serialized_doc["features"] = serialized_doc.get("features", [])
    serialized_doc["specifications"] = serialized_doc.get("specifications", {})
    serialized_doc["reviews"] = serialized_doc.get("reviews", [])
    serialized_doc["shippingInfo"] = serialized_doc.get("shippingInfo", {})
    # Ensure artist_id is handled properly
    if "artist_id" in serialized_doc and serialized_doc["artist_id"] is None:
        serialized_doc["artist_id"] = None  # Keep as None, now allowed by the model
    return serialized_doc

@router.post("/artist/onboarding", response_model=ArtisanProfileResponse)
async def complete_artisan_onboarding(
    onboarding_data: ArtisanOnboardingData,
    current_user: dict = Depends(get_current_user)):
    print(onboarding_data)
    try:
        # Check if user role is artisan
        if current_user.get("role") != "artisan":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only artisans can complete onboarding"
            )
        # Create artisan profile in MongoDB
        artisan_profile = ArtisanProfileDB(
            firebase_uid=current_user["firebase_uid"],
            name=onboarding_data.name,
            craft=onboarding_data.craft,
            region=onboarding_data.region,
            state=onboarding_data.state,
            language=onboarding_data.language,
            experience=onboarding_data.experience,
            bio=onboarding_data.bio
        )
        db = Database.get_db()
        existing_profile = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
        if existing_profile:
            await db["users"].update_one(
                {"firebase_uid": current_user["firebase_uid"]},
                {
                    "$set": {
                        **artisan_profile.model_dump(by_alias=True, exclude={"id", "created_at"}),
                        "is_onboarded": True
                    }
                }
            )
            updated_profile = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
            serialized_profile = serialize_artisan_doc(updated_profile)
            return ArtisanProfileResponse(**serialized_profile)
        else:
            result = await db["users"].insert_one(
                {
                    **artisan_profile.model_dump(by_alias=True),
                    "is_onboarded": True
                }
            )
            created_profile = await db["users"].find_one({"_id": result.inserted_id})
            serialized_profile = serialize_artisan_doc(created_profile)
            return ArtisanProfileResponse(**serialized_profile)
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save artisan profile"
        )

@router.get("/artist/me", response_model=ArtisanProfileResponse) # Use the more detailed response model
async def get_artist_profile(current_user: dict = Depends(check_artist_role)):
    try:
        db = Database.get_db()
        # Fetch the artisan's profile from your MongoDB collection
        artisan_profile_doc = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
        if not artisan_profile_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artisan profile not found in database. Please complete onboarding."
            )
        # Serialize the document to make it compatible with the Pydantic model
        serialized_profile = serialize_artisan_doc(artisan_profile_doc)
        return ArtisanProfileResponse(**serialized_profile)
    except auth.UserNotFoundError:
        # This case might be redundant if check_artist_role already handles it
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found in Firebase."
        )
    except Exception as e:
        # General error handler
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.put("/artist/me", response_model=ArtistProfile)
async def update_artist_profile(
    profile_update: ArtistProfileUpdate,
    current_user: dict = Depends(check_artist_role)):
    try:
        # Update artist in Firebase
        update_kwargs = {}
        if profile_update.display_name:
            update_kwargs["display_name"] = profile_update.display_name
        if profile_update.phone_number:
            update_kwargs["phone_number"] = profile_update.phone_number
        user = auth.update_user(
            current_user["uid"],
            **update_kwargs
        )
        return ArtistProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            bio=profile_update.bio,
            specialization=profile_update.specialization,
            portfolio_url=profile_update.portfolio_url,
            years_of_experience=profile_update.years_of_experience
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

@router.get("/artist/listings", response_model=ListingsResponse)
async def get_artist_listings(current_user: dict = Depends(check_artist_role)):
    try:
        db = Database.get_db()
        artisan_profile_doc = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
        if not artisan_profile_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artisan profile not found in database."
            )
                # Fetch listings
        listings_cursor = db["listings"].find({"artist_id": artisan_profile_doc["firebase_uid"]})
        listings = await listings_cursor.to_list(None) # Fetch all listings
        # Calculate total count for pagination
        total_count = await db["listings"].count_documents({"artist_id": artisan_profile_doc["firebase_uid"]})
        # Serialize each listing and validate with Pydantic model
        serialized_listings = []
        for listing_doc in listings:
            serialized_doc = serialize_listing_doc(listing_doc)
                        # --- CRITICAL CHANGE FOR LISTINGS IMAGES ---
            # Construct full image URLs for the 'images' array
            full_image_urls = []
            if "image_ids" in serialized_doc and isinstance(serialized_doc["image_ids"], list):
                for img_id in serialized_doc["image_ids"]:
                    # Ensure listing_id is available and is a string
                    listing_id_str = serialized_doc.get("id") # 'id' is already a string from serialize_listing_doc
                    if listing_id_str:
                        api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
                        if not api_base_url:
                            print("DEBUG_ARTIST_LISTINGS: WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder for image URL.")
                            full_image_urls.append("/placeholder.svg") # Fallback to generic placeholder
                        else:
                            full_image_urls.append(f"{api_base_url}/api/listings/{listing_id_str}/images/{img_id}")
                    else:
                        print(f"DEBUG_ARTIST_LISTINGS: WARNING: Listing ID missing for image {img_id}. Cannot construct full URL.")
            serialized_doc["images"] = full_image_urls # Assign the constructed URLs to the 'images' field
            try:
                pydantic_listing = Listing(**serialized_doc)
                serialized_listings.append(pydantic_listing)
            except Exception as e:
                print(f"DEBUG_ARTIST_LISTINGS: Pydantic validation error for listing: {e} on doc: {serialized_doc}")
                continue # Skip problematic listing
        return ListingsResponse(
            listings=serialized_listings,
            total=total_count,
            limit=len(serialized_listings), # Use actual number of listings returned
            skip=0 # Assuming no skip parameter for this endpoint yet
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch listings: {str(e)}"
        )

@router.get("/artist/orders", response_model=List[Dict[str, Any]])
async def get_artist_orders(current_user: dict = Depends(check_artist_role)):
    """Fetch orders for the logged-in artisan."""
    print(f"DEBUG_ORDERS: get_artist_orders invoked for user: {current_user.get('firebase_uid')}")
    try:
        db = Database.get_db()
        artisan_firebase_uid = current_user["firebase_uid"]
        print(f"DEBUG_ORDERS: Artisan Firebase UID: {artisan_firebase_uid}")
        # Find listings created by this artisan to get their listing IDs
        artisan_listings_cursor = db["listings"].find({"artist_id": artisan_firebase_uid}, {"_id": 1})
        artisan_listing_ids = [str(listing["_id"]) for listing in await artisan_listings_cursor.to_list(None)]
        print(f"DEBUG_ORDERS: Artisan's listing IDs found: {artisan_listing_ids}")
        if not artisan_listing_ids:
            print("DEBUG_ORDERS: No listings found for this artisan. Returning empty orders list.")
            return []
        # Find orders where the product_id is one of the artisan's listing IDs
        # Assuming 'product_id' in orders collection stores the listing's _id
        orders_cursor = db["orders"].find({"product_id": {"$in": artisan_listing_ids}}).sort("order_date", -1)
        print(f"DEBUG_ORDERS: Querying orders with product_id in: {artisan_listing_ids}")
        orders = await orders_cursor.to_list(None)
        print(f"DEBUG_ORDERS: Raw orders fetched from DB: {orders}")
        serialized_orders = []
        for order_doc in orders:
            print(f"DEBUG_ORDERS: Processing order_doc: {order_doc.get('_id')}, product_id: {order_doc.get('product_id')}")
            # Convert ObjectId to string for _id
            order_doc["_id"] = str(order_doc["_id"])
            # Fetch product details (especially image_ids) from the listings collection
            product_listing = await db["listings"].find_one({"_id": ObjectId(order_doc["product_id"])})
            print(f"DEBUG_ORDERS: Fetched product listing for order: {product_listing.get('title') if product_listing else 'None'}")
            product_image_url = "/placeholder.svg"
            if product_listing and product_listing.get("image_ids"):
                # Extract the string ID from the {"$oid": "..."} dictionary
                first_image_id_item = product_listing["image_ids"][0]
                if isinstance(first_image_id_item, dict) and "$oid" in first_image_id_item:
                    first_image_id_str = first_image_id_item["$oid"]
                elif isinstance(first_image_id_item, ObjectId):
                    first_image_id_str = str(first_image_id_item)
                elif isinstance(first_image_id_item, str):
                    first_image_id_str = first_image_id_item
                else:
                    first_image_id_str = None # Fallback if unexpected type
                if first_image_id_str:
                    listing_id_str = str(product_listing["_id"])
                    api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
                    if not api_base_url:
                        print("DEBUG_ORDERS: WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder for image URL.")
                        product_image_url = "/placeholder.svg"
                    else:
                        product_image_url = f"{api_base_url}/api/listings/{listing_id_str}/images/{first_image_id_str}"
                        print(f"DEBUG_ORDERS: Constructed image URL: {product_image_url}")
                else:
                    print("DEBUG_ORDERS: No valid image ID extracted from product_listing['image_ids'][0]. Using placeholder.")
            else:
                print("DEBUG_ORDERS: Product listing or image_ids missing. Using placeholder.")
            serialized_orders.append({
                "id": order_doc["_id"], # Use MongoDB _id as the order ID
                "productTitle": product_listing.get("title", "Unknown Product") if product_listing else "Unknown Product",
                "productImage": product_image_url,
                "buyer": order_doc.get("buyer_name", "Unknown Buyer"), # Assuming buyer_name field
                "amount": f"₹{order_doc.get('total_amount', 0):.2f}", # Assuming total_amount field
                "status": order_doc.get("status", "pending"),
                "date": order_doc.get("order_date", datetime.utcnow()).isoformat(),
                "quantity": order_doc.get("quantity", 1),
                # Add other relevant order fields here if they exist in your order model
                "shippingAddress": order_doc.get("shipping_address", "N/A"),
                "paymentMethod": order_doc.get("payment_method", "N/A"),
                "trackingNumber": order_doc.get("tracking_number", None),
                "estimatedDelivery": order_doc.get("estimated_delivery", "N/A"),
                "deliveredDate": order_doc.get("delivered_date", None),
            })
        print(f"DEBUG_ORDERS: Final serialized orders count: {len(serialized_orders)}")
        return serialized_orders
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to fetch artisan orders: {str(e)}"
        )

@router.get("/public/{artist_id}", response_model=ArtisanProfileResponse)
async def get_public_artist_profile(artist_id: str):
    try:
        db = Database.get_db()
        # Fetch from MongoDB first
        artisan_profile_doc = await db["users"].find_one({"firebase_uid": artist_id})
        if artisan_profile_doc:
            serialized_profile = serialize_artisan_doc(artisan_profile_doc)
            return ArtisanProfileResponse(**serialized_profile)
        # If not found in DB, optionally skip Firebase check, or leave as fallback:
        try:
            user = auth.get_user(artist_id)
            claims = auth.get_user_claims(artist_id)
            if claims.get("role") != "artisan": # Adjusted to match MongoDB role convention
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Artist not found"
                )
            return ArtisanProfileResponse(
                firebase_uid=user.uid,
                name=user.display_name,
                state="",
                craft=None
            )
        except auth.UserNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artist not found in Firebase."
            )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error fetching public artist profile: {str(e)}"
        )
