from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class UserProfile(BaseModel):
    display_name: str
    email: str
    phone_number: Optional[str] = None
    address: Optional[str] = None
    role: Optional[str] = None
    is_onboarded: Optional[bool] = False
    created_at: Optional[datetime] = None

    class Config:
        populate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {
            datetime: lambda v: v.isoformat() if v else None
        }

class UserProfileUpdate(BaseModel):
    # It's good practice to make update models fully optional as well
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class RoleUpdate(BaseModel):
    role: str
