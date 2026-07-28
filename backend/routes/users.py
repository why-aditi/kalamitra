import asyncio
import logging
from datetime import datetime

import firebase_admin
from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth

from models.profileModel import RoleUpdate, UserProfile, UserProfileUpdate
from services.database import Database

from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

# The ONLY roles a user may self-assign. "admin" is deliberately absent: it is
# granted out-of-band, never over the API.
SELF_ASSIGNABLE_ROLES = {"buyer", "artisan"}
# Roles that, once held, can no longer be changed by the holder.
LOCKED_ROLES = {"admin"}


@router.get("/me", response_model=UserProfile)
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    firebase_uid = current_user.get("firebase_uid")
    if not firebase_uid:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not find 'firebase_uid' in the user session data.",
        )

    user = await Database.get_db()["users"].find_one({"firebase_uid": firebase_uid})
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
        )

    return UserProfile(
        display_name=user.get("display_name") or "",
        email=user.get("email") or "",
        phone_number=user.get("phone_number"),
        role=user.get("role"),
        address=user.get("address"),
        is_onboarded=user.get("is_onboarded"),
        created_at=user.get("created_at"),
    )


@router.patch("/me", response_model=UserProfile, tags=["Users & Profile"])
async def update_user_profile(
    profile_update: UserProfileUpdate,
    current_user: dict = Depends(get_current_user),
):
    """Partially update the current user's profile."""
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
        updated_user_doc = await db["users"].find_one_and_update(
            {"firebase_uid": firebase_uid},
            {"$set": mongo_update},
            return_document=True,
        )
        if not updated_user_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND, detail="User not found"
            )
        return UserProfile(
            display_name=updated_user_doc.get("display_name") or "",
            email=updated_user_doc.get("email") or "",
            phone_number=updated_user_doc.get("phone_number"),
            role=updated_user_doc.get("role"),
            address=updated_user_doc.get("address"),
            is_onboarded=updated_user_doc.get("is_onboarded"),
        )
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error updating profile for %s", firebase_uid)
        raise HTTPException(status_code=500, detail="Failed to update user profile.")


@router.put("/role", tags=["Users & Profile"])
async def update_user_role(
    role_update: RoleUpdate, current_user: dict = Depends(get_current_user)
):
    """The single, gated role-change path.

    Previously this accepted "user"/"artisan"/"buyer" with no other checks, and
    two more endpoints (PATCH /api/update-role, and the client-supplied
    UserCreate.role at registration) could set an arbitrary string including
    "admin". Both of those are gone; this one is restricted to the two
    self-serviceable roles and refuses to touch a privileged account.
    """
    firebase_uid = current_user["firebase_uid"]
    new_role = (role_update.role or "").strip().lower()
    current_role = (current_user.get("role") or "").lower()

    if new_role not in SELF_ASSIGNABLE_ROLES:
        raise HTTPException(
            status_code=400,
            detail=f"Role must be one of: {sorted(SELF_ASSIGNABLE_ROLES)}",
        )
    if current_role in LOCKED_ROLES:
        logger.warning(
            "User %s (role=%s) attempted to change their own role to %s",
            firebase_uid,
            current_role,
            new_role,
        )
        raise HTTPException(status_code=403, detail="This account's role cannot be changed here")

    db = Database.get_db()
    await db["users"].update_one(
        {"firebase_uid": firebase_uid},
        {"$set": {"role": new_role, "updated_at": datetime.utcnow()}},
    )
    # Keep the Firebase custom claim in step with Mongo, otherwise the two
    # sources of truth for "role" drift apart.
    try:
        await asyncio.to_thread(
            auth.set_custom_user_claims, firebase_uid, {"role": new_role}
        )
    except Exception:
        logger.exception("Could not sync role claim for %s", firebase_uid)

    logger.info("Role for %s set to %s", firebase_uid, new_role)
    return {"message": "Role updated successfully", "role": new_role}


@router.delete("/me", tags=["Users & Profile"])
async def delete_user_account(current_user: dict = Depends(get_current_user)):
    firebase_uid = current_user["firebase_uid"]
    try:
        await Database.get_db()["users"].delete_one({"firebase_uid": firebase_uid})
    except Exception:
        logger.exception("Error deleting user %s", firebase_uid)
        raise HTTPException(status_code=500, detail="Failed to delete user account.")

    # Also remove the Firebase account. Without this, POST /verify-token simply
    # re-provisions the user on the next request and the deletion looks like it
    # silently failed.
    try:
        await asyncio.to_thread(auth.delete_user, firebase_uid)
    except firebase_admin.auth.UserNotFoundError:
        pass
    except Exception:
        logger.exception("Mongo user %s deleted but Firebase account remains", firebase_uid)

    return {"message": "User account successfully deleted"}
