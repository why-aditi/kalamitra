from pydantic import BaseModel

class UserProfile(BaseModel):
    display_name: str
    email: str
    phone_number: str = None
    address: str = None
    profile_picture: str = None

class UserProfileUpdate(BaseModel):
    display_name: str = None
    phone_number: str = None
    address: str = None
    profile_picture: str = None
    

class RoleUpdate(BaseModel):
    role: str