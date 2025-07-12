from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth
from typing import List, Optional
from .auth import get_current_user, check_artist_role
from models.artistModel import ArtistProfile, ArtistProfileUpdate

router = APIRouter()

@router.get("/me", response_model=ArtistProfile)
async def get_artist_profile(current_user: dict = Depends(check_artist_role)):
    try:
        user = auth.get_user(current_user["uid"])
        return ArtistProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            profile_picture=user.photo_url,
            # Additional fields would need to be fetched from your database
            bio=None,
            specialization=None,
            portfolio_url=None,
            years_of_experience=None
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

@router.put("/me", response_model=ArtistProfile)
async def update_artist_profile(
    profile_update: ArtistProfileUpdate,
    current_user: dict = Depends(check_artist_role)
):
    try:
        # Update artist in Firebase
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

        return ArtistProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            profile_picture=user.photo_url,
            bio=profile_update.bio,
            specialization=profile_update.specialization,
            portfolio_url=profile_update.portfolio_url,
            years_of_experience=profile_update.years_of_experience
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )

@router.get("/public/{artist_id}", response_model=ArtistProfile)
async def get_public_artist_profile(artist_id: str):
    try:
        user = auth.get_user(artist_id)
        # Verify if the user is an artist
        claims = auth.get_user_claims(artist_id)
        if claims.get("role") != "artist":
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artist not found"
            )
            
        return ArtistProfile(
            display_name=user.display_name,
            email=user.email,
            phone_number=user.phone_number,
            profile_picture=user.photo_url,
            # Additional fields would need to be fetched from your database
            bio=None,
            specialization=None,
            portfolio_url=None,
            years_of_experience=None
        )
    except auth.UserNotFoundError:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found"
        )