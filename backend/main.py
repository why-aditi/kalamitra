from routes import auth, users, artists, listing
from fastapi import FastAPI
import uvicorn
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import firebase_admin
from firebase_admin import credentials
from services.database import Database
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Firebase Admin
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if not cred_path:
    raise RuntimeError("Missing FIREBASE_SERVICE_ACCOUNT_PATH in environment variables")
cred = credentials.Certificate(cred_path)
firebase_admin_app = firebase_admin.initialize_app(cred)

# Lifespan context for FastAPI
@asynccontextmanager
async def lifespan(app: FastAPI):
    await Database.connect_db()
    yield
    await Database.close_db()

app = FastAPI(
    title="Kalamitra API",
    description="API for Kalamitra - Artist Management Platform",
    version="1.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(artists.router, prefix="/api", tags=["Artists"])
app.include_router(listing.router, prefix="/api", tags=["Listings"])

@app.get("/")
async def root():
    return {
        "message": "Welcome to Kalamitra API",
        "version": "1.0.0",
        "docs": "/docs"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app", 
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=True
    )
