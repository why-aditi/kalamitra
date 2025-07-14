from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth
from typing import List
from pydantic import BaseModel
from .auth import get_current_user
from models.profileModel import UserProfile, UserProfileUpdate, RoleUpdate
from models.userModel import UserDB
from services.database import Database


router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        user = auth.get_user(current_user["uid"])
        return UserProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            # Additional fields would need to be fetched from your database
            address=None,
            profile_picture=user.photo_url
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.put("/me", response_model=UserProfile)
async def update_user_profile(profile_update: UserProfileUpdate, current_user: dict = Depends(get_current_user)):
    try:
        # Update user in Firebase
        update_kwargs = {}
        if profile_update.display_name:
            update_kwargs["display_name"] = profile_update.display_name
        if profile_update.phone_number:
            update_kwargs["phone_number"] = profile_update.phone_number
        if profile_update.profile_picture:
            update_kwargs["photo_url"] = profile_update.profile_picture

        user = auth.update_user(
            current_user["uid"],
            **update_kwargs
        )

        return UserProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            address=profile_update.address,  # This would need to be stored in your database
            profile_picture=user.photo_url
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

@router.put("/role")
async def update_user_role(role_update: RoleUpdate, current_user: dict = Depends(get_current_user)):
    try:
        # Validate role
        valid_roles = ["user", "artisan", "buyer"]
        if role_update.role not in valid_roles:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid role. Must be one of: {', '.join(valid_roles)}"
            )
        
        # Update role in Firebase custom claims
        auth.set_custom_user_claims(current_user["firebase_uid"], {"role": role_update.role})
        
        # Update role in MongoDB
        db = Database.get_db()
        result = await db["users"].update_one(
            {"firebase_uid": current_user["firebase_uid"]},
            {"$set": {"role": role_update.role}}
        )
        
        if result.matched_count == 0:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found in database"
            )
        
        return {"message": "Role updated successfully", "role": role_update.role}
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update user role"
        )

@router.delete("/me")
async def delete_user_account(current_user: dict = Depends(get_current_user)):
    try:
        auth.delete_user(current_user["uid"])
        return {"message": "User account successfully deleted"}
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
