from fastapi import APIRouter, Depends, HTTPException, status
from typing import List
from pydantic import BaseModel # Assuming BaseModel is imported for UserProfile, UserProfileUpdate, RoleUpdate
from .auth import get_current_user
from models.profileModel import UserProfile, UserProfileUpdate, RoleUpdate # Assuming these models are defined here
from models.userModel import UserDB # Assuming UserDB is defined here
from services.database import Database
from datetime import datetime

router = APIRouter()

@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    try:
        firebase_uid = current_user["firebase_uid"]

        db = Database.get_db()
        user = await db["users"].find_one({"firebase_uid": firebase_uid})

        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return UserProfile(
            display_name=user.get("display_name"),
            email=user.get("email"),
            phone_number=user.get("phone_number"),
            role=user.get("role"),
            address=user.get("address"),
            is_onboarded=user.get("is_onboarded"),
            created_at=user.get("created_at")
        )
    except KeyError:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not find 'firebase_uid' in the user session data."
        )

@router.patch("/me", response_model=UserProfile, tags=["Users & Profile"])
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user)
):
    """
    Partially updates the current user's profile information in MongoDB for custom data.
    """
    firebase_uid = current_user["firebase_uid"]
    mongo_update = {"updated_at": datetime.utcnow()}
    
    if profile_update.display_name is not None:
        mongo_update["display_name"] = profile_update.display_name
    if profile_update.phone_number is not None:
        mongo_update["phone_number"] = profile_update.phone_number
    if profile_update.address is not None:
        mongo_update["address"] = profile_update.address

    try:
        db = Database.get_db()
        await db["users"].update_one(
            {"firebase_uid": firebase_uid},
            {"$set": mongo_update}
        )
        # Fetch and return the fully updated profile
        updated_user_doc = await db["users"].find_one({"firebase_uid": firebase_uid})

        if not updated_user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found after update"
            )
        # Directly construct UserProfile from the fetched document
        return UserProfile(
            display_name=updated_user_doc.get("display_name"),
            email=updated_user_doc.get("email"),
            phone_number=updated_user_doc.get("phone_number"),
            role=updated_user_doc.get("role"),
            address=updated_user_doc.get("address"),
            is_onboarded=updated_user_doc.get("is_onboarded")
        )

    except Exception as e:
        print(f"Error updating profile for {firebase_uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to update user profile.")

@router.put("/role", tags=["Users & Profile"])
async def update_user_role(role_update: RoleUpdate, current_user: dict = Depends(get_current_user)):
    firebase_uid = current_user["firebase_uid"]
    new_role = role_update.role
    valid_roles = ["user", "artisan", "buyer"]
    if new_role not in valid_roles:
        raise HTTPException(status_code=400, detail="Invalid role.")

    db = Database.get_db()
    await db["users"].update_one(
        {"firebase_uid": firebase_uid},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}}
    )
    return {"message": "Role updated successfully", "role": new_role}

@router.delete("/me", tags=["Users & Profile"])
async def delete_user_account(current_user: dict = Depends(get_current_user)):
    firebase_uid = current_user["firebase_uid"]
    try:
        db = Database.get_db()
        await db["users"].delete_one({"firebase_uid": firebase_uid})
        return {"message": "User account successfully deleted"}
    except Exception as e:
        print(f"Error deleting user {firebase_uid}: {e}")
        raise HTTPException(status_code=500, detail="Failed to delete user account.")
