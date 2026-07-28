
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

# New Pydantic models for Reviews
class ReviewCreate(BaseModel):
    """Incoming review data (frozen API contract #3).

    userId / userName are deliberately NOT accepted from the client - they used
    to be required body fields, which let anyone post a review under any other
    user's name. The server fills them in from the bearer token.
    """
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: str = Field(..., min_length=1, max_length=5000, description="Review comment")

    class Config:
        extra = "ignore"  # tolerate old clients still sending userId/userName

class Review(BaseModel):
    """Model for a review as stored in the database."""
    id: str = Field(default_factory=lambda: str(ObjectId()), description="Unique ID for the review (MongoDB ObjectId)")
    rating: int = Field(..., ge=1, le=5)
    comment: str
    # Server-populated identity, taken from the authenticated user.
    userId: str
    userName: str
    userEmail: Optional[str] = None
    # Format date as "Month Day, Year" for consistency with frontend display
    date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%B %d, %Y"), description="Formatted date of the review")
    # Computed from order history, not hardcoded.
    verified: bool = False

class Listing(BaseModel):
    # CRUCIAL CHANGE: Use 'id' as the primary identifier in Pydantic, aliasing MongoDB's '_id'
    # This correctly maps the MongoDB ObjectId (which is named _id) to 'id' in your Pydantic model.
    id: str = Field(alias="_id")
    title: str
    description: str
    tags: List[str] = []
    category: str
    suggested_price: str # Keep as string as per AI output
    story: str = ""
    image_ids: List[str] = [] # Ensure this is List[str]
    images: List[str] = [] # Full image URLs for frontend consumption
    artist_id: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    status: str = "active"
    ai_generated: bool = False
    ai_metadata: Dict[str, Any] = {}
    # IMPORTANT: Made these fields Optional to prevent validation errors if they are missing
    # or have unexpected types in some MongoDB documents.
    price: Optional[float] = 0.0
    originalPrice: Optional[float] = 0.0
    inStock: Optional[bool] = True
    stockCount: Optional[int] = 0
    features: Optional[List[str]] = []
    specifications: Optional[Dict[str, str]] = {}
    # CRUCIAL CHANGE: Update reviews field to use the new Review Pydantic model
    reviews: List[Review] = [] # Changed from Optional[List[Dict[str, Any]]]
    shippingInfo: Optional[Dict[str, str]] = {}
    # Frozen API contract #1: embedded artisan block so the marketplace does not
    # have to fetch one artist per card.
    artisan: Optional[Dict[str, Any]] = None
    # Review aggregates, so the list endpoint never has to ship whole review
    # arrays. `rating` is None when a listing has no reviews yet.
    review_count: Optional[int] = None
    rating: Optional[float] = None

    class Config:
        populate_by_name = True # Allows Pydantic to map by field name or alias (e.g., _id to id)
        arbitrary_types_allowed = True # Allows types like datetime
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            ObjectId: str  # Convert ObjectId to string for JSON serialization
        }
        # CRUCIAL: Allow extra fields in the database document that are not explicitly defined in the model.
        # This prevents validation errors if your MongoDB documents have more fields than your Pydantic model.
        extra = "allow"

class ListingsResponse(BaseModel):
    listings: List[Listing]
    total: int
    limit: int
    skip: int

    class Config:
        json_encoders = {
            datetime: lambda dt: dt.isoformat(),
            ObjectId: str  # Convert ObjectId to string for JSON serialization
        }
# NOTE: the duplicate `Order` model that used to live here was removed.
# The single definition is models/orderModel.py.
