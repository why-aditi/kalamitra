from pydantic import BaseModel
from typing import Optional

class UserProfile(BaseModel):
    display_name: str
    email: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    is_onboarded: Optional[bool] = False

class UserProfileUpdate(BaseModel):
    # It's good practice to make update models fully optional as well
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class RoleUpdate(BaseModel):
    role: str
