from pydantic import BaseModel, EmailStr, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

from models.common import PyObjectId

class UserBase(BaseModel):
    email: EmailStr
    display_name: str
    role: Optional[str] = None
    is_active: bool = True

class UserDB(UserBase):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    firebase_uid: str  
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    role: Optional[str] = None
    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class UserResponse(UserBase):
    id: str = Field(alias="_id")
    firebase_uid: str
    created_at: datetime
    updated_at: datetime

    class Config:
        validate_by_name = True
        json_encoders = {ObjectId: str}
        
class UserCreate(BaseModel):
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    display_name: str
    # `role` is NOT a field here on purpose. It used to be client-supplied and
    # was written straight into a Firebase custom claim, so any registration
    # could ask for "admin". The server assigns the role (routes/auth.py).

    class Config:
        extra = "ignore"

# NOTE: UserLogin and TokenResponse were removed along with POST /api/login,
# which minted a token without ever verifying the password.

class UserUpdate(BaseModel):
    display_name: Optional[str] = None
    is_active: Optional[bool] = None