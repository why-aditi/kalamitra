import asyncio
import hashlib
import io
import logging
import re
import uuid
from datetime import datetime
from typing import List, Optional

from PIL import Image
from bson import ObjectId
from bson.errors import InvalidId
from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from fastapi.responses import Response, StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase, AsyncIOMotorGridFSBucket

from models.listingModel import Listing, ListingsResponse, Review, ReviewCreate
from routes.auth import get_current_user
from services.database import Database
from services.generateListing import generate_listing_with_gemini
from utils.image_helpers import construct_image_urls
from utils.serialization import (
    build_artisan_block,
    fetch_artisans_by_uid,
    serialize_listing_doc,
)

logger = logging.getLogger(__name__)

router = APIRouter()

# Upload limits. Previously every uploaded image was read fully into RAM twice
# (once for GridFS, once for Gemini) with no size cap, no count cap and no
# total cap - a single request could OOM the process.
MAX_IMAGES_PER_LISTING = 8
MAX_IMAGE_BYTES = 8 * 1024 * 1024  # 8 MB per file
MAX_TOTAL_UPLOAD_BYTES = 24 * 1024 * 1024  # 24 MB per request

IMAGE_CACHE_CONTROL = "public, max-age=31536000, immutable"

# Stored images are downscaled + re-encoded to WebP on the way in. Phone photos
# were previously written to GridFS at full resolution and then served twelve at
# a time on the marketplace grid.
STORED_IMAGE_MAX_EDGE = 1600
STORED_IMAGE_QUALITY = 82

# `GET /listings` renders cards, so descriptions are truncated server-side.
LIST_DESCRIPTION_CHARS = 300

_GRIDFS_BUCKETS: dict = {}


def _bucket(db: AsyncIOMotorDatabase) -> AsyncIOMotorGridFSBucket:
    """Reuse the GridFS bucket. It used to be rebuilt on every request."""
    key = id(db)
    bucket = _GRIDFS_BUCKETS.get(key)
    if bucket is None:
        bucket = AsyncIOMotorGridFSBucket(db)
        _GRIDFS_BUCKETS[key] = bucket
    return bucket


def _optimize_for_storage(content: bytes) -> tuple:
    """Downscale and re-encode an upload to WebP before it goes into GridFS.

    Uploads used to be stored exactly as received - full-resolution phone
    photos, several MB each - and then served twelve at a time on the
    marketplace grid. Cache headers only help the *second* visit; this is the
    one that helps the first. CPU-bound, so callers run it in a thread.

    Returns (bytes, content_type). Falls back to the original bytes if the
    image cannot be decoded (e.g. an exotic format), so an upload never fails
    purely because optimization did.
    """
    try:
        with Image.open(io.BytesIO(content)) as img:
            img.load()
            # WebP has no alpha issue, but paletted/CMYK modes need converting.
            if img.mode not in ("RGB", "RGBA"):
                img = img.convert("RGBA" if "A" in img.getbands() else "RGB")
            if max(img.size) > STORED_IMAGE_MAX_EDGE:
                img.thumbnail(
                    (STORED_IMAGE_MAX_EDGE, STORED_IMAGE_MAX_EDGE),
                    Image.Resampling.LANCZOS,
                )
            buffer = io.BytesIO()
            img.save(buffer, format="WEBP", quality=STORED_IMAGE_QUALITY, method=4)
            optimized = buffer.getvalue()
    except Exception:
        logger.warning("Could not optimize upload; storing original", exc_info=True)
        return content, None

    # Only keep the re-encode if it actually helped.
    if len(optimized) >= len(content):
        return content, None
    return optimized, "image/webp"


def _object_id_or_400(value: str, what: str = "id") -> ObjectId:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        raise HTTPException(status_code=400, detail=f"Invalid {what} format")


def _attach_images(serialized_doc: dict) -> dict:
    listing_id_str = serialized_doc.get("id")
    image_ids = serialized_doc.get("image_ids", [])
    serialized_doc["images"] = (
        construct_image_urls(listing_id_str, image_ids)
        if listing_id_str and image_ids
        else ["/placeholder.svg"]
    )
    return serialized_doc


@router.get("/listings", response_model=ListingsResponse)
async def get_listings(
    skip: int = Query(0, ge=0),
    # An unbounded `limit` used to be accepted (limit=10000000 worked).
    limit: int = Query(100, ge=1, le=100),
    search: str = "",
    # Both default to None = unbounded. They used to default to 0/20000, and a
    # guard made the filter inert unless you went below 20000 - so max_price
    # above 20000 filtered nothing, and a bare min_price silently capped
    # everything at 20000.
    min_price: Optional[float] = Query(None, ge=0),
    max_price: Optional[float] = Query(None, ge=0),
    category: str = "all",
    state: str = "all",
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Get all listings with pagination and filters."""
    try:
        filter_query = {}

        if search:
            # re.escape: the raw user string used to be interpolated straight
            # into $regex, so `(((((((` was a ReDoS and `.*` a full scan.
            escaped = re.escape(search.strip())
            filter_query["$or"] = [
                {"title": {"$regex": escaped, "$options": "i"}},
                {"description": {"$regex": escaped, "$options": "i"}},
                {"tags": {"$regex": escaped, "$options": "i"}},
            ]

        # The old guard (`if min_price > 0 or max_price < 20000`) meant
        # max_price=50000 silently filtered nothing. Always apply the bounds.
        #
        # CANONICAL PRICE FIELD: `price` (float). `suggested_price` is the raw
        # AI string ("₹1,299") and is display-only/legacy. The filter, the sort
        # and - critically - what Stripe actually charges all read `price`, so
        # the UI must render `price` too or the filter will keep looking broken.
        price_filter = {}
        if min_price is not None:
            price_filter["$gte"] = min_price
        if max_price is not None:
            price_filter["$lte"] = max_price
        if price_filter:
            filter_query["price"] = price_filter

        if category != "all":
            filter_query["category"] = {
                "$regex": f"^{re.escape(category)}$",
                "$options": "i",
            }
        if state != "all":
            filter_query["state"] = {"$regex": f"^{re.escape(state)}$", "$options": "i"}

        # Projection: this endpoint renders a card grid, but it used to return
        # whole documents - full descriptions, stories, raw voice
        # transcriptions, entire review arrays, plus every undeclared field
        # that `extra = "allow"` lets through - 100 at a time.
        pipeline = [
            {"$match": filter_query},
            {"$sort": {"created_at": -1}},
            {"$skip": skip},
            {"$limit": limit},
            {
                "$project": {
                    "title": 1,
                    "category": 1,
                    "tags": 1,
                    "price": 1,
                    "originalPrice": 1,
                    "suggested_price": 1,
                    "image_ids": 1,
                    "artist_id": 1,
                    "status": 1,
                    "inStock": 1,
                    "stockCount": 1,
                    "created_at": 1,
                    "updated_at": 1,
                    "state": 1,
                    # Card blurb only; the full text is on the detail endpoint.
                    "description": {
                        "$substrCP": [{"$ifNull": ["$description", ""]}, 0, LIST_DESCRIPTION_CHARS]
                    },
                    # Aggregates instead of shipping every review body.
                    "review_count": {"$size": {"$ifNull": ["$reviews", []]}},
                    "rating": {"$avg": "$reviews.rating"},
                }
            },
        ]
        raw_listings = await db.listings.aggregate(pipeline).to_list(length=limit)
        total_count = await db.listings.count_documents(filter_query)

        serialized_docs = [serialize_listing_doc(doc) for doc in raw_listings]

        # Contract #1: embed the artisan so the marketplace stops firing one
        # request per card. 1 + N queries -> 2 queries.
        artisans = await fetch_artisans_by_uid(
            db, (d.get("artist_id") for d in serialized_docs)
        )

        serialized_listings = []
        skipped = 0
        for doc in serialized_docs:
            _attach_images(doc)
            doc["artisan"] = build_artisan_block(artisans.get(doc.get("artist_id")))
            try:
                serialized_listings.append(Listing(**doc))
            except Exception:
                skipped += 1
                logger.warning(
                    "Skipping listing %s: does not validate against the Listing model",
                    doc.get("id"),
                    exc_info=True,
                )

        if skipped:
            # `total` used to keep counting documents that were silently
            # dropped, which broke pagination with no signal at all.
            logger.error(
                "%s listing(s) failed validation and were omitted from this page", skipped
            )
            total_count = max(total_count - skipped, len(serialized_listings))

        return ListingsResponse(
            listings=serialized_listings, total=total_count, limit=limit, skip=skip
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching listings")
        raise HTTPException(status_code=500, detail="Error fetching listings")


@router.get("/listings/{listing_id}")
async def get_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Get a specific listing by ID."""
    object_id = _object_id_or_400(listing_id, "listing ID")
    try:
        listing = await db.listings.find_one({"_id": object_id})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found")

        serialized = _attach_images(serialize_listing_doc(listing))

        artisan_doc = None
        if serialized.get("artist_id"):
            artisan_doc = await db.users.find_one(
                {"firebase_uid": serialized["artist_id"]}
            )
        serialized["artisan"] = build_artisan_block(artisan_doc)

        return {"listing": Listing(**serialized)}
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching listing %s", listing_id)
        raise HTTPException(status_code=500, detail="Error fetching listing")


@router.post("/listings/{listing_id}/reviews", response_model=Review)
async def submit_listing_review(
    listing_id: str,
    review_data: ReviewCreate = Body(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Submit a review (frozen contract #3).

    The reviewer identity comes from the bearer token, never from the body -
    the old model took userId/userName from JSON, so anyone could post a review
    as anyone. `verified` is computed from real order history instead of being
    hardcoded True.
    """
    object_id = _object_id_or_400(listing_id, "listing ID")
    try:
        listing = await db.listings.find_one({"_id": object_id}, {"_id": 1})
        if not listing:
            raise HTTPException(status_code=404, detail="Listing not found.")

        uid = current_user["firebase_uid"]

        # verified == this buyer actually paid for this listing.
        paid_order = await db.orders.find_one(
            {
                "buyer_id": uid,
                "status": {"$in": ["paid", "shipped", "delivered", "processing"]},
                "$or": [
                    {"product_id": listing_id},
                    {"items.listing_id": listing_id},
                ],
            },
            {"_id": 1},
        )

        new_review_doc = Review(
            id=str(ObjectId()),
            rating=review_data.rating,
            comment=review_data.comment,
            userId=uid,
            userName=current_user.get("display_name") or current_user.get("name") or "Anonymous",
            userEmail=current_user.get("email"),
            date=datetime.utcnow().strftime("%B %d, %Y"),
            verified=paid_order is not None,
        )

        update_result = await db.listings.update_one(
            {"_id": object_id}, {"$push": {"reviews": new_review_doc.model_dump()}}
        )
        if update_result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Listing not found.")

        return new_review_doc
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error submitting review for listing %s", listing_id)
        raise HTTPException(status_code=500, detail="Error submitting review")


@router.post("/create-listing")
async def create_listing(
    transcription: str = Form(...),
    images: List[UploadFile] = File(...),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Create a new listing with images and AI-generated content."""
    if len(images) > MAX_IMAGES_PER_LISTING:
        raise HTTPException(
            status_code=413,
            detail=f"At most {MAX_IMAGES_PER_LISTING} images per listing",
        )

    try:
        bucket = _bucket(db)
        image_ids = []
        image_contents = []
        total_bytes = 0

        # Read each upload exactly once and reuse the bytes for both GridFS and
        # Gemini (it used to read every file twice).
        for img in images:
            if not (img.content_type or "").startswith("image/"):
                raise HTTPException(
                    status_code=400, detail=f"File {img.filename} is not an image"
                )
            content = await img.read()
            if len(content) > MAX_IMAGE_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"{img.filename} exceeds the {MAX_IMAGE_BYTES // (1024 * 1024)}MB per-image limit",
                )
            total_bytes += len(content)
            if total_bytes > MAX_TOTAL_UPLOAD_BYTES:
                raise HTTPException(
                    status_code=413,
                    detail=f"Upload exceeds the {MAX_TOTAL_UPLOAD_BYTES // (1024 * 1024)}MB total limit",
                )
            # Keep the ORIGINAL bytes for Gemini (it does its own downscale),
            # but store an optimized copy. CPU-bound work goes to a thread.
            image_contents.append(content)
            stored_bytes, stored_type = await asyncio.to_thread(
                _optimize_for_storage, content
            )
            logger.info(
                "Upload %s: %d bytes -> %d bytes stored",
                img.filename,
                len(content),
                len(stored_bytes),
            )

            unique_filename = f"{uuid.uuid4()}_{img.filename}"
            upload_stream = bucket.open_upload_stream(
                unique_filename,
                metadata={
                    "content_type": stored_type or img.content_type,
                    "original_filename": img.filename,
                    "original_bytes": len(content),
                    "uploaded_at": datetime.utcnow(),
                },
            )
            await upload_stream.write(stored_bytes)
            await upload_stream.close()
            image_ids.append(upload_stream._id)

        ai_listing = await generate_listing_with_gemini(transcription, image_contents)
        firebase_uid = current_user["firebase_uid"]

        raw_price_str = (
            str(ai_listing.get("suggestedPrice", "₹299")).replace("₹", "").replace(",", "")
        )
        try:
            converted_price = float(raw_price_str)
        except ValueError:
            logger.warning("Could not parse AI suggested price %r", raw_price_str)
            converted_price = 0.0

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
                "fallback_used": ai_listing.get("fallback_used", False),
            },
            "price": converted_price,
            "originalPrice": converted_price,
            "inStock": True,
            "stockCount": 10,
            "features": ai_listing.get("features", []),
            "specifications": ai_listing.get("specifications", {}),
            "reviews": [],
            "shippingInfo": {
                "estimatedDays": "3-5 business days",
                "returnPolicy": "30-day returns",
            },
        }

        result = await db.listings.insert_one(listing_data)

        return {
            "message": "Listing created successfully",
            "listing_id": str(result.inserted_id),
            "image_ids": [str(img_id) for img_id in image_ids],
            "ai_listing": {
                "title": listing_data["title"],
                "description": listing_data["description"],
                "tags": listing_data["tags"],
                "category": listing_data["category"],
                "suggestedPrice": listing_data["suggested_price"],
                "story": listing_data["story"],
            },
            "created_at": listing_data["created_at"].isoformat(),
            "status": "success",
        }
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error creating listing")
        raise HTTPException(status_code=500, detail="Error creating listing")


async def _require_listing_owner(
    db: AsyncIOMotorDatabase, listing_id: str, current_user: dict
) -> dict:
    """403 unless the caller is the artisan who owns this listing."""
    object_id = _object_id_or_400(listing_id, "listing ID")
    listing = await db.listings.find_one({"_id": object_id})
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    if listing.get("artist_id") != current_user.get("firebase_uid"):
        raise HTTPException(
            status_code=403, detail="You do not own this listing"
        )
    return listing


@router.patch("/listings/{listing_id}/status")
async def update_listing_status(
    listing_id: str,
    status: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Update listing status. Was completely unauthenticated."""
    valid_statuses = ["active", "inactive", "draft", "published"]
    if status not in valid_statuses:
        raise HTTPException(
            status_code=400, detail=f"Invalid status. Must be one of: {valid_statuses}"
        )

    await _require_listing_owner(db, listing_id, current_user)
    await db.listings.update_one(
        {"_id": ObjectId(listing_id)},
        {"$set": {"status": status, "updated_at": datetime.utcnow()}},
    )
    return {"message": f"Listing status updated to {status}"}


@router.get("/listings/{listing_id}/verify")
async def verify_listing(
    listing_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Verify that a listing exists and return basic info."""
    object_id = _object_id_or_400(listing_id, "listing ID")
    listing = await db.listings.find_one(
        {"_id": object_id},
        {"title": 1, "status": 1, "created_at": 1, "artist_id": 1},
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")
    created_at = listing.get("created_at")
    return {
        "listing_id": str(listing["_id"]),
        "title": listing.get("title"),
        "status": listing.get("status"),
        "created_at": created_at.isoformat() if isinstance(created_at, datetime) else None,
        "artist_id": listing.get("artist_id"),
        "exists": True,
    }


@router.get("/listings/{listing_id}/images/{image_id}")
async def get_image(
    listing_id: str,
    image_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Serve an image out of GridFS.

    Frozen contract #5: long-lived Cache-Control + ETag. GridFS ids are
    immutable, so the content behind a URL can never change - `immutable` is
    accurate here. The body is streamed rather than read into memory.
    """
    listing_object_id = _object_id_or_400(listing_id, "listing ID")
    image_object_id = _object_id_or_400(image_id, "image ID")

    # ETag is derived from the ids alone, so a conditional request is answered
    # without touching GridFS at all.
    etag = '"%s"' % hashlib.sha1(f"{listing_id}:{image_id}".encode()).hexdigest()
    if request.headers.get("if-none-match") == etag:
        return Response(
            status_code=304,
            headers={"ETag": etag, "Cache-Control": IMAGE_CACHE_CONTROL},
        )

    listing = await db.listings.find_one(
        {"_id": listing_object_id}, {"image_ids": 1}
    )
    if not listing:
        raise HTTPException(status_code=404, detail="Listing not found")

    image_ids_in_listing = {
        str(i.get("$oid")) if isinstance(i, dict) and "$oid" in i else str(i)
        for i in listing.get("image_ids", [])
    }
    if image_id not in image_ids_in_listing:
        raise HTTPException(status_code=404, detail="Image not found in listing")

    try:
        download_stream = await _bucket(db).open_download_stream(image_object_id)
    except Exception:
        logger.warning("GridFS file %s missing for listing %s", image_id, listing_id)
        raise HTTPException(status_code=404, detail="Image file not found")

    content_type = "image/jpeg"
    metadata = getattr(download_stream, "metadata", None)
    if isinstance(metadata, dict):
        content_type = metadata.get("content_type", content_type)

    async def _iter():
        try:
            while True:
                chunk = await download_stream.readchunk()
                if not chunk:
                    break
                yield chunk
        finally:
            close = getattr(download_stream, "close", None)
            if close is not None:
                result = close()
                if asyncio.iscoroutine(result):
                    await result

    headers = {"Cache-Control": IMAGE_CACHE_CONTROL, "ETag": etag}
    length = getattr(download_stream, "length", None)
    if isinstance(length, int):
        headers["Content-Length"] = str(length)

    return StreamingResponse(_iter(), media_type=content_type, headers=headers)


@router.delete("/listings/{listing_id}")
async def delete_listing(
    listing_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Delete a listing and its images. Was completely unauthenticated - anyone
    could wipe any artisan's catalogue with a single curl."""
    listing = await _require_listing_owner(db, listing_id, current_user)

    image_ids = listing.get("image_ids") or []
    if image_ids:
        bucket = _bucket(db)
        for image_id in image_ids:
            try:
                await bucket.delete(
                    image_id if isinstance(image_id, ObjectId) else ObjectId(str(image_id))
                )
            except Exception:
                logger.warning("Could not delete GridFS image %s", image_id, exc_info=True)

    result = await db.listings.delete_one({"_id": ObjectId(listing_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Listing not found")
    return {"message": "Listing deleted successfully"}
