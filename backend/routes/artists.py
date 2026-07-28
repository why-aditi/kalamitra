import asyncio
import logging
from datetime import datetime
from typing import Any, Dict, List, Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth

from models.artistModel import (
    ArtisanOnboardingData,
    ArtisanProfileDB,
    ArtisanProfileResponse,
    ArtistProfile,
    ArtistProfileUpdate,
)
from models.listingModel import Listing, ListingsResponse
from services.database import Database
from utils.image_helpers import construct_image_urls, get_first_image_url
from utils.serialization import serialize_listing_doc

from .auth import check_artist_role, get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_ARTIST_LISTINGS = 200
MAX_ARTIST_ORDERS = 200


def serialize_artisan_doc(artisan_doc: dict) -> Optional[dict]:
    """Helper function to serialize MongoDB document for Pydantic models"""
    if not artisan_doc:
        return None
    if "_id" in artisan_doc:
        artisan_doc["_id"] = str(artisan_doc["_id"])
    artisan_doc["name"] = artisan_doc.get("name") or artisan_doc.get("display_name") or "Unknown Artisan"
    artisan_doc["display_name"] = artisan_doc.get("display_name") or artisan_doc["name"]
    artisan_doc["email"] = artisan_doc.get("email", "unknown@example.com")
    return artisan_doc


def _first_image_id(listing: Optional[dict]) -> Optional[str]:
    ids = (listing or {}).get("image_ids") or []
    if not ids:
        return None
    item = ids[0]
    if isinstance(item, dict) and "$oid" in item:
        return item["$oid"]
    if isinstance(item, ObjectId):
        return str(item)
    if isinstance(item, str):
        return item
    return None


def _product_image(listing: Optional[dict]) -> str:
    image_id = _first_image_id(listing)
    if listing and image_id:
        return get_first_image_url(str(listing["_id"]), [image_id])
    return "/placeholder.svg"


async def _listings_by_id(db, raw_ids) -> Dict[str, dict]:
    """One `$in` query for all the listings referenced by a batch of orders."""
    object_ids = []
    for value in raw_ids:
        if not value:
            continue
        try:
            object_ids.append(ObjectId(str(value)))
        except (InvalidId, TypeError):
            continue
    if not object_ids:
        return {}
    cursor = db["listings"].find(
        {"_id": {"$in": object_ids}}, {"title": 1, "image_ids": 1}
    )
    return {str(doc["_id"]): doc async for doc in cursor}


@router.post("/artist/onboarding", response_model=ArtisanProfileResponse)
async def complete_artisan_onboarding(
    onboarding_data: ArtisanOnboardingData,
    current_user: dict = Depends(get_current_user),
):
    if current_user.get("role") != "artisan":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only artisans can complete onboarding",
        )
    try:
        artisan_profile = ArtisanProfileDB(
            firebase_uid=current_user["firebase_uid"],
            name=onboarding_data.name,
            craft=onboarding_data.craft,
            region=onboarding_data.region,
            state=onboarding_data.state,
            language=onboarding_data.language,
            experience=onboarding_data.experience,
            bio=onboarding_data.bio,
        )
        db = Database.get_db()
        existing_profile = await db["users"].find_one(
            {"firebase_uid": current_user["firebase_uid"]}, {"_id": 1}
        )
        if existing_profile:
            await db["users"].update_one(
                {"firebase_uid": current_user["firebase_uid"]},
                {
                    "$set": {
                        **artisan_profile.model_dump(
                            by_alias=True, exclude={"id", "created_at"}
                        ),
                        "is_onboarded": True,
                    }
                },
            )
            profile = await db["users"].find_one(
                {"firebase_uid": current_user["firebase_uid"]}
            )
        else:
            result = await db["users"].insert_one(
                {**artisan_profile.model_dump(by_alias=True), "is_onboarded": True}
            )
            profile = await db["users"].find_one({"_id": result.inserted_id})
        return ArtisanProfileResponse(**serialize_artisan_doc(profile))
    except HTTPException:
        raise
    except Exception:
        logger.exception("Failed to save artisan profile")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save artisan profile",
        )


@router.get("/artist/me", response_model=ArtisanProfileResponse)
async def get_artist_profile(current_user: dict = Depends(check_artist_role)):
    db = Database.get_db()
    artisan_profile_doc = await db["users"].find_one(
        {"firebase_uid": current_user["firebase_uid"]}
    )
    if not artisan_profile_doc:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artisan profile not found in database. Please complete onboarding.",
        )
    return ArtisanProfileResponse(**serialize_artisan_doc(artisan_profile_doc))


@router.put("/artist/me", response_model=ArtistProfile)
async def update_artist_profile(
    profile_update: ArtistProfileUpdate,
    current_user: dict = Depends(check_artist_role),
):
    """Was a guaranteed KeyError: it read current_user["uid"], but
    get_current_user returns the Mongo document, which is keyed firebase_uid."""
    firebase_uid = current_user["firebase_uid"]

    update_kwargs = {}
    if profile_update.display_name:
        update_kwargs["display_name"] = profile_update.display_name
    if profile_update.phone_number:
        update_kwargs["phone_number"] = profile_update.phone_number

    try:
        if update_kwargs:
            user = await asyncio.to_thread(auth.update_user, firebase_uid, **update_kwargs)
        else:
            user = await asyncio.to_thread(auth.get_user, firebase_uid)
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )
    except Exception:
        logger.exception("Firebase update failed for %s", firebase_uid)
        raise HTTPException(status_code=502, detail="Identity provider error")

    # Mirror the editable fields into Mongo so /api/me stays consistent.
    mongo_update = {"updated_at": datetime.utcnow()}
    for field in (
        "display_name",
        "phone_number",
        "bio",
        "specialization",
        "portfolio_url",
        "years_of_experience",
    ):
        value = getattr(profile_update, field, None)
        if value is not None:
            mongo_update[field] = value
    await Database.get_db()["users"].update_one(
        {"firebase_uid": firebase_uid}, {"$set": mongo_update}
    )

    return ArtistProfile(
        display_name=user.display_name or "",
        email=user.email or "",
        phone_number=user.phone_number,
        bio=profile_update.bio,
        specialization=profile_update.specialization,
        portfolio_url=profile_update.portfolio_url,
        years_of_experience=profile_update.years_of_experience,
    )


@router.get("/artist/listings", response_model=ListingsResponse)
async def get_artist_listings(current_user: dict = Depends(check_artist_role)):
    db = Database.get_db()
    firebase_uid = current_user["firebase_uid"]

    listings = (
        await db["listings"]
        .find({"artist_id": firebase_uid})
        .sort("created_at", -1)
        .to_list(length=MAX_ARTIST_LISTINGS)  # was .to_list(None)
    )

    serialized_listings = []
    skipped = 0
    for listing_doc in listings:
        doc = serialize_listing_doc(listing_doc)
        image_ids = doc.get("image_ids", [])
        doc["images"] = (
            construct_image_urls(doc["id"], image_ids) if image_ids else ["/placeholder.svg"]
        )
        try:
            serialized_listings.append(Listing(**doc))
        except Exception:
            skipped += 1
            logger.warning(
                "Skipping artist listing %s: fails Listing validation",
                doc.get("id"),
                exc_info=True,
            )
    if skipped:
        logger.error("%s of this artisan's listings failed validation", skipped)

    return ListingsResponse(
        listings=serialized_listings,
        # count_documents used to re-run a filter already answered by len().
        total=len(listings),
        limit=MAX_ARTIST_LISTINGS,
        skip=0,
    )


@router.get("/artist/orders", response_model=List[Dict[str, Any]])
async def get_artist_orders(current_user: dict = Depends(check_artist_role)):
    """Fetch orders for the logged-in artisan."""
    db = Database.get_db()
    artisan_firebase_uid = current_user["firebase_uid"]

    artist_orders = (
        await db["artist_orders"]
        .find({"artist_id": artisan_firebase_uid})
        .sort("order_date", -1)
        .to_list(length=MAX_ARTIST_ORDERS)
    )

    artisan_listing_ids = [
        str(doc["_id"])
        async for doc in db["listings"].find({"artist_id": artisan_firebase_uid}, {"_id": 1})
    ]

    orders = []
    if artisan_listing_ids:
        orders = (
            await db["orders"]
            .find({"product_id": {"$in": artisan_listing_ids}})
            .sort("order_date", -1)
            .to_list(length=MAX_ARTIST_ORDERS)
        )

    # One batched listings lookup for BOTH sources instead of one find_one per
    # order row inside two separate loops.
    listings_by_id = await _listings_by_id(
        db,
        [o.get("product_id") for o in artist_orders] + [o.get("product_id") for o in orders],
    )

    all_orders = []
    processed_order_ids = set()

    for artist_order in artist_orders:
        order_id = str(artist_order.get("order_id") or artist_order.get("_id", ""))
        if order_id in processed_order_ids:
            continue
        processed_order_ids.add(order_id)
        listing = listings_by_id.get(str(artist_order.get("product_id", "")))
        all_orders.append(
            _order_row(order_id, artist_order, _product_image(listing), artist_order.get("product_title"))
        )

    for order_doc in orders:
        order_id = str(order_doc["_id"])
        if order_id in processed_order_ids:
            continue
        processed_order_ids.add(order_id)
        listing = listings_by_id.get(str(order_doc.get("product_id", "")))
        title = (listing or {}).get("title") or order_doc.get("product_title")
        all_orders.append(_order_row(order_id, order_doc, _product_image(listing), title))

    return all_orders


def _order_row(order_id: str, doc: dict, image_url: str, title: Optional[str]) -> dict:
    def _iso(value):
        return value.isoformat() if isinstance(value, datetime) else value

    return {
        "id": order_id,
        "productTitle": title or "Unknown Product",
        "productImage": image_url,
        "buyer": doc.get("buyer_name", "Unknown Buyer"),
        "amount": f"₹{doc.get('total_amount', 0):.2f}",
        "status": doc.get("status", "pending"),
        "date": _iso(doc.get("order_date", datetime.utcnow())),
        "quantity": doc.get("quantity", 1),
        "shippingAddress": doc.get("shipping_address", "N/A"),
        "paymentMethod": doc.get("payment_method", "N/A"),
        "trackingNumber": doc.get("tracking_number"),
        "estimatedDelivery": _iso(doc.get("estimated_delivery")) or "N/A",
        "deliveredDate": _iso(doc.get("delivered_date")),
    }


@router.get("/public/{artist_id}", response_model=ArtisanProfileResponse)
async def get_public_artist_profile(artist_id: str):
    db = Database.get_db()
    artisan_profile_doc = await db["users"].find_one({"firebase_uid": artist_id})
    if artisan_profile_doc:
        return ArtisanProfileResponse(**serialize_artisan_doc(artisan_profile_doc))

    # Fallback to Firebase. The old code called auth.get_user_claims(), which
    # does not exist in firebase_admin.auth (AttributeError -> 500 every time),
    # and then built an ArtisanProfileResponse without the required _id.
    try:
        user = await asyncio.to_thread(auth.get_user, artist_id)
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )
    except Exception:
        logger.exception("Firebase lookup failed for %s", artist_id)
        raise HTTPException(status_code=502, detail="Identity provider error")

    # Custom claims live on the UserRecord itself.
    if (user.custom_claims or {}).get("role") != "artisan":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Artist not found"
        )

    return ArtisanProfileResponse(
        **{
            "_id": user.uid,
            "firebase_uid": user.uid,
            "name": user.display_name,
            "state": None,
            "craft": None,
        }
    )
