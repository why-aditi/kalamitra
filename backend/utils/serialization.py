"""Single source of truth for turning a Mongo document into something the
Pydantic models accept.

`serialize_listing_doc` used to exist twice - routes/listing.py and
routes/artists.py - with divergent logic (only one of them stripped thousands
separators from string prices, only one recursed into nested ObjectIds), so the
same listing serialized differently depending on which endpoint you hit.
"""

import logging
from datetime import datetime
from typing import Any, Dict, Iterable, List, Optional

from bson import ObjectId

logger = logging.getLogger(__name__)

DEFAULT_ARTISAN = {
    "id": None,
    "name": "Unknown Artisan",
    "craft": None,
    "region": None,
    "location": "N/A",
    "experience": "N/A",
    "rating": 0,
    "bio": "No bio available.",
    "avatar": "/placeholder.svg",
}


def _convert_objectids(obj: Any) -> Any:
    if isinstance(obj, ObjectId):
        return str(obj)
    if isinstance(obj, dict):
        return {k: _convert_objectids(v) for k, v in obj.items()}
    if isinstance(obj, list):
        return [_convert_objectids(item) for item in obj]
    return obj


def parse_price(value: Any, default: float = 0.0) -> float:
    """Prices live in the DB as floats, as "₹1,299" strings, or not at all."""
    if isinstance(value, str):
        value = value.replace("₹", "").replace(",", "").strip()
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def serialize_listing_doc(listing_doc: dict) -> dict:
    """Normalise a raw `listings` document for the `Listing` Pydantic model."""
    # _convert_objectids already rebuilds every dict/list, so the caller's
    # document is never mutated - no copy.deepcopy needed (it used to run
    # inside the per-listing loop on every request).
    doc: Dict[str, Any] = _convert_objectids(listing_doc)

    if "_id" in doc:
        doc["id"] = str(doc.pop("_id"))
    else:
        doc["id"] = "missing_id_fallback"
        logger.warning("Listing document missing _id; using fallback id")

    image_ids = doc.get("image_ids")
    doc["image_ids"] = [str(i) for i in image_ids] if isinstance(image_ids, list) else []

    doc.setdefault("tags", [])
    doc.setdefault("story", "")
    doc.setdefault("created_at", datetime.utcnow())
    doc.setdefault("updated_at", datetime.utcnow())
    doc.setdefault("status", "active")
    doc.setdefault("ai_generated", False)
    doc.setdefault("ai_metadata", {})
    doc.setdefault("inStock", True)
    doc.setdefault("stockCount", 0)
    doc.setdefault("features", [])
    doc.setdefault("specifications", {})
    doc.setdefault("reviews", [])
    doc.setdefault("shippingInfo", {})

    doc["price"] = parse_price(doc.get("price") or doc.get("suggested_price"), 0.0)
    doc["originalPrice"] = parse_price(doc.get("originalPrice"), doc["price"])
    doc.setdefault("suggested_price", str(doc["price"]))

    return doc


def build_artisan_block(user_doc: Optional[dict]) -> Dict[str, Any]:
    """The embedded artisan block (frozen API contract #1).

    Superset of the two shapes previously in play so both the marketplace list
    and the product detail page can read it: id/name/craft/region plus the
    location/experience/rating/bio/avatar fields the detail page already used.
    """
    if not user_doc:
        return dict(DEFAULT_ARTISAN)
    return {
        "id": user_doc.get("firebase_uid"),
        "name": user_doc.get("display_name") or user_doc.get("name") or "Unknown Artisan",
        "craft": user_doc.get("craft"),
        "region": user_doc.get("region") or user_doc.get("state"),
        "location": user_doc.get("address") or user_doc.get("state") or "N/A",
        "experience": user_doc.get("experience", "N/A"),
        "rating": user_doc.get("rating", 0),
        "bio": user_doc.get("bio") or "No bio available.",
        "avatar": user_doc.get("avatar_url") or "/placeholder.svg",
    }


async def fetch_artisans_by_uid(db, uids: Iterable[str]) -> Dict[str, dict]:
    """One `$in` query instead of one query per listing (the marketplace N+1)."""
    unique = [u for u in {u for u in uids if u}]
    if not unique:
        return {}
    cursor = db["users"].find(
        {"firebase_uid": {"$in": unique}},
        {
            "firebase_uid": 1,
            "display_name": 1,
            "name": 1,
            "craft": 1,
            "region": 1,
            "state": 1,
            "address": 1,
            "experience": 1,
            "rating": 1,
            "bio": 1,
            "avatar_url": 1,
        },
    )
    return {doc["firebase_uid"]: doc async for doc in cursor}


def serialize_datetimes(doc: dict, keys: List[str]) -> dict:
    for key in keys:
        if isinstance(doc.get(key), datetime):
            doc[key] = doc[key].isoformat()
    return doc
