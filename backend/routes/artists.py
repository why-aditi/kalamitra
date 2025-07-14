from fastapi import APIRouter, Depends, HTTPException, status
from firebase_admin import auth
from typing import List, Optional
from .auth import get_current_user, check_artist_role
from models.artistModel import ArtistProfile, ArtistProfileUpdate, ArtisanOnboardingData, ArtisanProfileDB, ArtisanProfileResponse
from services.database import Database

def serialize_artisan_doc(artisan_doc: dict) -> dict:
    """Helper function to serialize MongoDB document for Pydantic models"""
    if artisan_doc:
        # Convert ObjectId to string
        artisan_doc["_id"] = str(artisan_doc["_id"])
        return artisan_doc
    return None

router = APIRouter()

@router.post("/artist/onboarding", response_model=ArtisanProfileResponse)
async def complete_artisan_onboarding(
    onboarding_data: ArtisanOnboardingData,
    current_user: dict = Depends(get_current_user)
):
    try:
        # Check if user role is artisan
        if current_user.get("role") != "artisan":
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Only artisans can complete onboarding"
            )
        
        # Create artisan profile in MongoDB
        artisan_profile = ArtisanProfileDB(
            firebase_uid=current_user["firebase_uid"],
            name=onboarding_data.name,
            craft=onboarding_data.craft,
            region=onboarding_data.region,
            state=onboarding_data.state,
            language=onboarding_data.language,
            experience=onboarding_data.experience,
            bio=onboarding_data.bio
        )
        
        db = Database.get_db()
        
        # Check if artisan profile already exists
        existing_profile = await db["users"].find_one({"firebase_uid": current_user["uid"]})
        
        if existing_profile:
            # Update existing profile
            result = await db["users"].update_one(
                {"firebase_uid": current_user["firebase_uid"]},
                {"$set": artisan_profile.model_dump(by_alias=True, exclude={"id", "created_at"})}
            )
            updated_profile = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})
            serialized_profile = serialize_artisan_doc(updated_profile)
            return ArtisanProfileResponse(**serialized_profile)
        else:
            # Create new profile
            result = await db["users"].insert_one(artisan_profile.model_dump(by_alias=True))
            created_profile = await db["users"].find_one({"_id": result.inserted_id})
            serialized_profile = serialize_artisan_doc(created_profile)
            return ArtisanProfileResponse(**serialized_profile)
        
    except Exception as e:
        if isinstance(e, HTTPException):
            raise e
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to save artisan profile"
        )

# In your FastAPI router file

@router.get("/artist/me", response_model=ArtisanProfileResponse) # Use the more detailed response model
async def get_artist_profile(current_user: dict = Depends(check_artist_role)):
    try:
        db = Database.get_db()
        # Fetch the artisan's profile from your MongoDB collection
        artisan_profile_doc = await db["users"].find_one({"firebase_uid": current_user["firebase_uid"]})

        if not artisan_profile_doc:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Artisan profile not found in database. Please complete onboarding."
            )

        # Serialize the document to make it compatible with the Pydantic model
        serialized_profile = serialize_artisan_doc(artisan_profile_doc)
        return ArtisanProfileResponse(**serialized_profile)

    except auth.UserNotFoundError:
        # This case might be redundant if check_artist_role already handles it
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Artist not found in Firebase."
        )
    except Exception as e:
        # General error handler
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"An unexpected error occurred: {str(e)}"
        )

@router.put("/artist/me", response_model=ArtistProfile)
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
