
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from bson import ObjectId

# New Pydantic models for Reviews
class ReviewCreate(BaseModel):
    """Model for incoming review data from the frontend."""
    rating: int = Field(..., ge=1, le=5, description="Star rating from 1 to 5")
    comment: str = Field(..., min_length=1, description="Review comment, at least 1 character") # CHANGED: min_length from 10 to 1
    userId: str = Field(..., description="Firebase UID of the user submitting the review")
    userName: str = Field(..., description="Display name of the user submitting the review")
    userEmail: Optional[str] = Field(None, description="Email of the user submitting the review (optional)")

class Review(ReviewCreate):
    """Model for a review as stored in the database."""
    # Use default_factory for id to generate a new ObjectId string if not provided
    id: str = Field(default_factory=lambda: str(ObjectId()), description="Unique ID for the review (MongoDB ObjectId)")
    # Format date as "Month Day, Year" for consistency with frontend display
    date: str = Field(default_factory=lambda: datetime.utcnow().strftime("%B %d, %Y"), description="Formatted date of the review")
    verified: bool = Field(True, description="Indicates if the review is verified (e.g., from a real purchase)")

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

class Order(BaseModel):
    id: str
    productTitle: str
    productImage: str
    buyer: str
    amount: str
    status: str
    date: str
    quantity: int
    shippingAddress: Optional[str] = None
    paymentMethod: Optional[str] = None
    trackingNumber: Optional[str] = None
    estimatedDelivery: Optional[str] = None
    deliveredDate: Optional[str] = None
