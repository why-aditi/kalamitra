import asyncio
import logging

from fastapi import APIRouter, HTTPException, status, Depends, Header
from firebase_admin import auth
from services.database import Database
from models.userModel import UserCreate, UserDB, UserResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

logger = logging.getLogger(__name__)

router = APIRouter()
oauth2_scheme = HTTPBearer()

# The only role a self-service registration may ever receive. Roles are never
# taken from the request body (privilege escalation); see PUT /api/role for the
# single, gated role-change path.
DEFAULT_ROLE = "user"


def serialize_user_doc(user_doc: dict) -> dict:
    """Helper function to serialize MongoDB document for Pydantic models"""
    if user_doc:
        # Convert ObjectId to string
        user_doc["_id"] = str(user_doc["_id"])
        return user_doc
    return None


@router.post("/register", response_model=UserResponse)
async def register_user(user_data: UserCreate):
    firebase_user = None
    try:
        # Create user in Firebase (blocking SDK -> worker thread)
        firebase_user = await asyncio.to_thread(
            auth.create_user,
            email=user_data.email,
            password=user_data.password,
            display_name=user_data.display_name,
        )

        # Role is assigned by the server, never by the client.
        await asyncio.to_thread(
            auth.set_custom_user_claims, firebase_user.uid, {"role": DEFAULT_ROLE}
        )

        user_db = UserDB(
            email=firebase_user.email,
            display_name=firebase_user.display_name,
            role=DEFAULT_ROLE,
            firebase_uid=firebase_user.uid,
        )

        db = Database.get_db()
        result = await db["users"].insert_one(user_db.model_dump(by_alias=True))
        created_user = await db["users"].find_one({"_id": result.inserted_id})

        return UserResponse(**serialize_user_doc(created_user))

    except HTTPException:
        raise
    except Exception:
        logger.exception("Registration failed for %s", user_data.email)
        # Clean up Firebase user if MongoDB insertion fails
        if firebase_user is not None:
            try:
                await asyncio.to_thread(auth.delete_user, firebase_user.uid)
            except Exception:
                logger.exception("Failed to roll back Firebase user %s", firebase_user.uid)
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Registration failed",
        )


# NOTE: POST /api/login was deleted deliberately. It called
# auth.get_user_by_email() and minted a custom token WITHOUT EVER CHECKING THE
# PASSWORD - any email address was a valid login. The frontend authenticates
# with the Firebase client SDK and exchanges the resulting ID token at
# POST /api/verify-token; nothing ever called /api/login.


@router.post("/verify-token", response_model=UserResponse)
async def verify_token(authorization: str = Header(...)):
    try:
        token = authorization.replace("Bearer ", "")
        decoded_token = await asyncio.to_thread(auth.verify_id_token, token)
        firebase_uid = decoded_token["uid"]
    except HTTPException:
        raise
    except Exception:
        logger.warning("Token verification failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token",
        )

    db = Database.get_db()
    user_db = await db["users"].find_one({"firebase_uid": firebase_uid})

    # JIT-provision the user on first sign-in. role defaults to DEFAULT_ROLE so
    # downstream role checks never KeyError on a missing key.
    if not user_db:
        new_user = UserDB(
            email=decoded_token.get("email"),
            display_name=decoded_token.get("name", ""),
            firebase_uid=firebase_uid,
            role=DEFAULT_ROLE,
        )
        result = await db["users"].insert_one(new_user.model_dump(by_alias=True))
        user_db = await db["users"].find_one({"_id": result.inserted_id})

    return UserResponse(**serialize_user_doc(user_db))


# Dependency for protected routes
async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(oauth2_scheme),
) -> dict:
    """
    Dependency to get the current user from the provided bearer token.
    Verifies the Firebase ID token and fetches the user profile from MongoDB.
    """
    try:
        token = credentials.credentials
        decoded_token = await asyncio.to_thread(auth.verify_id_token, token)
        uid = decoded_token.get("uid")
    except Exception:
        logger.warning("ID token verification failed", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token claims")

    db = Database.get_db()
    user_doc = await db["users"].find_one({"firebase_uid": uid})

    # Deliberately raised AFTER the try block: the old code wrapped this in the
    # same `except Exception` that handled token failures, so a real 404 was
    # swallowed and re-raised as a misleading 401.
    if not user_doc:
        raise HTTPException(status_code=404, detail="User not found in database")

    return serialize_user_doc(user_doc)


# Dependency for role-based access
async def check_artist_role(current_user: dict = Depends(get_current_user)):
    # .get() not [] - users JIT-provisioned before this change have no role key.
    if current_user.get("role") != "artisan":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only artists can access this endpoint",
        )
    return current_user


# NOTE: PATCH /api/update-role was deleted. It accepted an arbitrary role
# string from the query and wrote it straight to the user document, so any
# authenticated user could make themselves "admin". The single, gated
# role-change path is now PUT /api/role (routes/users.py).
