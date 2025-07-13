from pydantic import BaseModel
from typing import List

class Listing(BaseModel):
    title: str
    description: str
    tags: List[str]
    category: str
    suggestedPrice: str
    story: str
