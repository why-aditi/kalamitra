from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    display_name: str
    email: str
    
    # By using `Optional[str]` or `str | None`, you are explicitly telling
    # Pydantic that the value for these fields can be either a string or None.
    phone_number: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class UserProfileUpdate(BaseModel):
    # It's good practice to make update models fully optional as well
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None
    profile_picture: Optional[str] = None

class RoleUpdate(BaseModel):
    role: str
