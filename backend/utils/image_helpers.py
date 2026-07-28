import logging
import os
from typing import List

from bson import ObjectId
from dotenv import load_dotenv

load_dotenv()

logger = logging.getLogger(__name__)

# Resolved once at import instead of re-read (and re-logged) per image URL.
API_BASE_URL = (
    os.getenv("API_BASE_URL")
    or os.getenv("NEXT_PUBLIC_API_BASE_URL")
    or "https://kalamitra-backend-latest.onrender.com"
).rstrip("/")

if not (os.getenv("API_BASE_URL") or os.getenv("NEXT_PUBLIC_API_BASE_URL")):
    logger.warning(
        "Neither API_BASE_URL nor NEXT_PUBLIC_API_BASE_URL is set; "
        "image URLs will use the hardcoded fallback %s",
        API_BASE_URL,
    )


def _image_id_str(img_id) -> str:
    if isinstance(img_id, ObjectId):
        return str(img_id)
    if isinstance(img_id, dict) and "$oid" in img_id:
        return str(img_id["$oid"])
    if isinstance(img_id, str):
        return img_id
    return ""


def construct_image_urls(listing_id: str, image_ids: List[str]) -> List[str]:
    """Construct full image URLs from a listing ID and its image IDs."""
    urls = []
    for img_id in image_ids:
        img_id_str = _image_id_str(img_id)
        if img_id_str:
            urls.append(f"{API_BASE_URL}/api/listings/{listing_id}/images/{img_id_str}")
        else:
            urls.append("/placeholder.svg")
    return urls or ["/placeholder.svg"]


def get_first_image_url(listing_id: str, image_ids: List[str]) -> str:
    """Get the first image URL, or a placeholder if there are none."""
    return construct_image_urls(listing_id, image_ids)[0]
