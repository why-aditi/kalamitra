from routes import auth
from database import Database
from fastapi import Depends, HTTPException, status
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