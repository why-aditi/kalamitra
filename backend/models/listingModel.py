from pydantic import BaseModel
from typing import List

class Listing(BaseModel):
    title: str
    description: str
    tags: List[str]
    category: str
    suggestedPrice: str
    story: str
    artisan_id: str
    
class ListingsResponse(BaseModel):
    listings: List[Listing]
    total: int
    limit: int
    skip: int
