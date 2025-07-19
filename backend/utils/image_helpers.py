import os
from typing import List
from bson import ObjectId

def construct_image_urls(listing_id: str, image_ids: List[str]) -> List[str]:
    """
    Construct full image URLs from listing ID and image IDs.
    
    Args:
        listing_id: The listing's ID (should be a string)
        image_ids: List of image IDs (can be ObjectId, strings, or dict format)
    
    Returns:
        List of full image URLs
    """
    api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
    
    if not api_base_url:
        print(f"WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder images.")
        return ["/placeholder.svg"] * len(image_ids)
    
    full_image_urls = []
    
    for img_id in image_ids:
        # Handle different image ID formats
        if isinstance(img_id, ObjectId):
            img_id_str = str(img_id)
        elif isinstance(img_id, dict) and "$oid" in img_id:
            img_id_str = img_id["$oid"]
        elif isinstance(img_id, str):
            img_id_str = img_id
        else:
            print(f"WARNING: Unexpected image ID format: {type(img_id)}. Using placeholder.")
            img_id_str = None
        
        if img_id_str:
            full_image_urls.append(f"{api_base_url}/api/listings/{listing_id}/images/{img_id_str}")
        else:
            full_image_urls.append("/placeholder.svg")
    
    # Return at least one placeholder if no images
    if not full_image_urls:
        full_image_urls = ["/placeholder.svg"]
    
    return full_image_urls

def get_first_image_url(listing_id: str, image_ids: List[str]) -> str:
    """
    Get the first image URL from a list of image IDs.
    
    Args:
        listing_id: The listing's ID (should be a string)
        image_ids: List of image IDs
    
    Returns:
        First image URL or placeholder if no images
    """
    image_urls = construct_image_urls(listing_id, image_ids)
    return image_urls[0] if image_urls else "/placeholder.svg"
