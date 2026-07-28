import logging
import os
from contextlib import asynccontextmanager

import firebase_admin
import uvicorn
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from firebase_admin import credentials

from routes import ai, auth, users, artists, listing, stripe, orders
from services.database import Database

# Load environment variables
load_dotenv()

logging.basicConfig(
    level=os.getenv("LOG_LEVEL", "INFO").upper(),
    format="%(asctime)s %(levelname)s %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# Initialize Firebase Admin
cred_path = os.getenv("FIREBASE_SERVICE_ACCOUNT_PATH")
if not cred_path:
    raise RuntimeError("Missing FIREBASE_SERVICE_ACCOUNT_PATH in environment variables")
if not firebase_admin._apps:
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

# CORS. allow_origins=["*"] together with allow_credentials=True is invalid per
# the CORS spec (browsers reject the wildcard on credentialed requests), so the
# origins must be enumerated. ALLOWED_ORIGINS is a comma-separated list.
_raw_origins = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
ALLOWED_ORIGINS = [o.strip().rstrip("/") for o in _raw_origins.split(",") if o.strip()]
logger.info("CORS allowed origins: %s", ALLOWED_ORIGINS)

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type"],
    # Retry-After is not a CORS-safelisted response header, so without this the
    # browser hides it and the rate-limited chat widget can't show a countdown.
    expose_headers=["Retry-After"],
)

# Compress JSON list responses (the listings payload is the big one).
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Include routers
app.include_router(auth.router, prefix="/api", tags=["Authentication"])
app.include_router(users.router, prefix="/api", tags=["Users"])
app.include_router(artists.router, prefix="/api", tags=["Artists"])
app.include_router(listing.router, prefix="/api", tags=["Listings"])
app.include_router(stripe.router, prefix="/api", tags=["Stripe"])
app.include_router(orders.router, prefix="/api", tags=["Orders"])
# Server-side Gemini proxy. Replaces the browser-side NEXT_PUBLIC_GEMINI_API_KEY.
app.include_router(ai.router, prefix="/api", tags=["AI"])


@app.get("/")
async def root():
    return {
        "message": "Welcome to Kalamitra API",
        "version": "1.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health():
    return {"status": "ok"}


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=os.getenv("HOST", "0.0.0.0"),
        port=int(os.getenv("PORT", 8000)),
        reload=os.getenv("RELOAD", "false").lower() == "true",
    )
