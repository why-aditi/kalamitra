from pydantic import BaseModel, Field
from typing import List

class Listing(BaseModel):
    _id: str
    title: str
    description: str
    images: List[str] = []
    suggested_price: str = Field(..., alias="suggested_price")
    category: str
    artist_id: str = Field(..., alias="artist_id")
    
class ListingsResponse(BaseModel):
    listings: List[Listing]
    total: int
    limit: int
    skip: int
