from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

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

    artist_id: str
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
    reviews: Optional[List[Dict[str, Any]]] = []
    shippingInfo: Optional[Dict[str, str]] = {}

    class Config:
        populate_by_name = True # Allows Pydantic to map by field name or alias (e.g., _id to id)
        arbitrary_types_allowed = True # Allows types like datetime
        json_encoders = {datetime: lambda dt: dt.isoformat()} # Encodes datetime to ISO format for JSON
        # CRUCIAL: Allow extra fields in the database document that are not explicitly defined in the model.
        # This prevents validation errors if your MongoDB documents have more fields than your Pydantic model.
        extra = "allow"

class ListingsResponse(BaseModel):
    listings: List[Listing]
    total: int
    limit: int
    skip: int

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
