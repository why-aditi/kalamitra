from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime
from bson import ObjectId

class PyObjectId(ObjectId):
    @classmethod
    def __get_validators__(cls):
        yield cls.validate

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid objectid")
        return ObjectId(v)

    @classmethod
    def __get_pydantic_json_schema__(cls, field_schema):
        field_schema.update(type="string")

class ArtisanOnboardingData(BaseModel):
    name: str
    craft: str
    region: Optional[str] = None
    state: str
    language: Optional[str] = None
    experience: Optional[str] = None
    bio: Optional[str] = None

class ArtisanProfileDB(BaseModel):
    id: PyObjectId = Field(default_factory=PyObjectId, alias="_id")
    firebase_uid: str
    name: str
    craft: str
    region: Optional[str] = None
    state: str
    language: Optional[str] = None
    experience: Optional[str] = None
    bio: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_onboarded: Optional[bool] = False


    class Config:
        validate_by_name = True
        arbitrary_types_allowed = True
        json_encoders = {ObjectId: str}

class ArtisanProfileResponse(BaseModel):
    id: str = Field(alias="_id")
    firebase_uid: str
    name: Optional[str] = None
    craft: Optional[str] = None
    region: Optional[str] = None
    state: Optional[str] = None
    language: Optional[str] = None
    experience: Optional[str] = None
    bio: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        validate_by_name = True
        json_encoders = {ObjectId: str}

    class Config:
        validate_by_name = True
        json_encoders = {ObjectId: str}

# Legacy models for backward compatibility
class ArtistProfile(BaseModel):
    display_name: str
    email: str
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    specialization: Optional[str] = None
    portfolio_url: Optional[str] = None
    years_of_experience: Optional[str] = None

class ArtistProfileUpdate(BaseModel):
    display_name: Optional[str] = None
    phone_number: Optional[str] = None
    bio: Optional[str] = None
    specialization: Optional[str] = None
    portfolio_url: Optional[str] = None
    years_of_experience: Optional[str] = None
