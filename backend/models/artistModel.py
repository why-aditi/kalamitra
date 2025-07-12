from pydantic import BaseModel
from typing import Optional

class ArtistProfile(BaseModel):
    display_name: str
    email: str
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    specialization: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_picture: Optional[str] = None
    years_of_experience: Optional[int] = None

class ArtistProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    specialization: Optional[str] = None
    portfolio_url: Optional[str] = None
    profile_picture: Optional[str] = None
    years_of_experience: Optional[int] = None