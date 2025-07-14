from fastapi import APIRouter, HTTPException, status, Depends, Header
from firebase_admin import auth
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from services.database import Database
from models.userModel import UserLogin, TokenResponse, UserCreate, UserDB, UserResponse
import firebase_admin.auth
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

router = APIRouter()
oauth2_scheme = HTTPBearer()


def serialize_user_doc(user_doc: dict) -> dict:
    """Helper function to serialize MongoDB document for Pydantic models"""
    if user_doc:
        # Convert ObjectId to string
        user_doc["_id"] = str(user_doc["_id"])
        return user_doc
    return None

@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    try:
        # Create user in Firebase
        firebase_user = auth.create_user(
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name
        )
        
        # Set custom claims for role-based access
        auth.set_custom_user_claims(firebase_user.uid, {"role": user_data.role})
        
        # Create user in MongoDB
        user_db = UserDB(
            email=firebase_user.email,
            display_name=firebase_user.display_name,
            role=user_data.role,
            firebase_uid=firebase_user.uid
        )
        
        result = await Database.get_db()["users"].insert_one(user_db.model_dump(by_alias=True))
        created_user = await Database.get_db()["users"].find_one({"_id": result.inserted_id})
        
        # Serialize the document
        serialized_user = serialize_user_doc(created_user)
        return UserResponse(**serialized_user)
        
    except Exception as e:
        # Clean up Firebase user if MongoDB insertion fails
        try:
            if 'firebase_user' in locals():
                auth.delete_user(firebase_user.uid)
        except:
            pass
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )

@router.post("/login", response_model=TokenResponse)
async def login_user(user_data: UserLogin):
    try:
        # Sign in with Firebase and verify password
        try:
            user_record = auth.get_user_by_email(user_data.email)
        except firebase_admin.auth.UserNotFoundError:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password"
            )
        
        # Get custom token from Firebase
        custom_token = auth.create_custom_token(user_record.uid)
        
        # Get user from MongoDB
        user_db = await Database.get_db()["users"].find_one({"firebase_uid": user_record.uid})
        if not user_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )
        
        # Serialize the document
        serialized_user = serialize_user_doc(user_db)
        return TokenResponse(
            access_token=custom_token.decode(),
            user=UserResponse(**serialized_user)
        )
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/verify-token", response_model=UserResponse)
async def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = auth.verify_id_token(token)
        firebase_uid = decoded_token["uid"]

        db = Database.get_db()
        user_db = await db["users"].find_one({"firebase_uid": firebase_uid})

        # If user doesn't exist, create them
        if not user_db:
            new_user = UserDB(
                email=decoded_token.get("email"),
                display_name=decoded_token.get("name", ""),
                firebase_uid=firebase_uid
            )
            result = await db["users"].insert_one(new_user.model_dump(by_alias=True))
            user_db = await db["users"].find_one({"_id": result.inserted_id})

        # Serialize the document before passing to Pydantic
        serialized_user = serialize_user_doc(user_db)
        return UserResponse(**serialized_user)

    except Exception as e:
        print("Token verification failed:", e)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Invalid token"
        )

# Dependency for protected routes
async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme)) -> dict:
    """
    Dependency to get the current user from the provided bearer token.
    Verifies the Firebase ID token and fetches the user profile from MongoDB.
    """
    try:
        token = credentials.credentials
        decoded_token = auth.verify_id_token(token)
        uid = decoded_token.get("uid")
        if not uid:
            raise HTTPException(status_code=401, detail="Invalid token claims")

        db = Database.get_db()
        user_doc = await db["users"].find_one({"firebase_uid": uid})

        if not user_doc:
            raise HTTPException(status_code=404, detail="User not found in database")

        return serialize_user_doc(user_doc)
    except Exception as e:
        print(f"Auth error: {e}") # Add logging for easier debugging
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
# Dependency for role-based access
async def check_artist_role(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "artist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only artists can access this endpoint"
        )
    return current_user

@router.patch("/update-role", response_model=UserResponse)
async def update_role(new_role: str, current_user: dict = Depends(get_current_user)):
    db = Database.get_db()
    await db["users"].update_one(
        {"firebase_uid": current_user["firebase_uid"]},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )
    updated_user = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
    return UserResponse(**serialize_user_doc(updated_user))