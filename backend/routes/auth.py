from fastapi import APIRouter, HTTPException, status, Depends
from firebase_admin import auth
from typing import Optional
from pydantic import BaseModel, EmailStr
from datetime import datetime
from services.database import Database
from models.userModel import UserLogin, TokenResponse, UserCreate, UserDB, UserResponse
import firebase_admin.auth

router = APIRouter()

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
        
        return UserResponse(**created_user)
    except Exception as e:
        # Clean up Firebase user if MongoDB insertion fails
        try:
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
            # Attempt to sign in with custom token to verify password
            auth._get_auth().sign_in_with_email_and_password(user_data.email, user_data.password)
        except (firebase_admin.auth.EmailNotFoundError, firebase_admin.auth.InvalidPasswordError):
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
        
        return TokenResponse(
            access_token=custom_token.decode(),
            user=UserResponse(**user_db)
        )
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid credentials"
        )

@router.post("/verify-token")
async def verify_token(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        user_db = await Database.get_db()["users"].find_one({"firebase_uid": decoded_token["uid"]})
        
        if not user_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )
            
        return {
            "uid": decoded_token["uid"],
            "role": user_db["role"]
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

# Dependency for protected routes
async def get_current_user(token: str):
    try:
        decoded_token = auth.verify_id_token(token)
        user_db = await Database.get_db()["users"].find_one({"firebase_uid": decoded_token["uid"]})
        
        if not user_db:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )
            
        return user_db
    except:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials"
        )

# Dependency for role-based access
async def check_artist_role(current_user: dict = Depends(get_current_user)):
    if current_user["role"] != "artist":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only artists can access this endpoint"
        )
    return current_user