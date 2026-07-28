# services/database.py
import logging
import os

from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from pymongo import ASCENDING, DESCENDING, TEXT

load_dotenv()

logger = logging.getLogger(__name__)

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kalamitra")

# There were no timeouts anywhere: a Mongo blip meant requests hung on the
# driver's 30s default (or forever, for socket reads).
SERVER_SELECTION_TIMEOUT_MS = int(os.getenv("MONGO_SERVER_SELECTION_TIMEOUT_MS", "5000"))
CONNECT_TIMEOUT_MS = int(os.getenv("MONGO_CONNECT_TIMEOUT_MS", "5000"))
SOCKET_TIMEOUT_MS = int(os.getenv("MONGO_SOCKET_TIMEOUT_MS", "20000"))


class Database:
    _client: AsyncIOMotorClient = None
    _db: AsyncIOMotorDatabase = None

    @classmethod
    async def connect_db(cls):
        if cls._client is None:
            logger.info("Connecting to MongoDB database %s", DATABASE_NAME)
            cls._client = AsyncIOMotorClient(
                MONGO_URI,
                serverSelectionTimeoutMS=SERVER_SELECTION_TIMEOUT_MS,
                connectTimeoutMS=CONNECT_TIMEOUT_MS,
                socketTimeoutMS=SOCKET_TIMEOUT_MS,
                maxPoolSize=int(os.getenv("MONGO_MAX_POOL_SIZE", "50")),
                retryWrites=True,
            )
            cls._db = cls._client[DATABASE_NAME]

            try:
                await cls._client.admin.command("ping")
                logger.info("MongoDB connected (database=%s)", DATABASE_NAME)
            except Exception:
                logger.exception("MongoDB connection failed")
                raise

            await cls._create_indexes()

    # (collection, keys, kwargs). Created independently so one failure - e.g. a
    # unique index rejected because of pre-existing duplicates - cannot skip
    # every index declared after it.
    _INDEXES = [
        ("listings", [("created_at", DESCENDING)], {}),
        ("listings", "artist_id", {}),
        ("listings", "category", {}),
        ("listings", "price", {}),
        ("listings", "status", {}),
        # users.firebase_uid is queried on EVERY authenticated request by
        # get_current_user and had no index at all - a collection scan per call.
        ("users", "firebase_uid", {"unique": True}),
        # Order queries: by buyer (buyer dashboard), by product (artisan).
        ("orders", [("buyer_id", ASCENDING), ("order_date", DESCENDING)], {}),
        ("orders", "buyerEmail", {}),
        ("orders", "product_id", {}),
        # Webhook lookup + idempotency.
        ("orders", "stripe_session_id", {"sparse": True}),
        ("orders", "paid_session_id", {"sparse": True}),
        ("artist_orders", [("artist_id", ASCENDING), ("order_date", DESCENDING)], {}),
        ("artist_orders", "order_id", {}),
        # Regex search is the primary listings query; a text index makes it
        # possible to move to $text. Best effort - only one per collection.
        (
            "listings",
            [("title", TEXT), ("description", TEXT), ("tags", TEXT)],
            {"name": "listings_text"},
        ),
    ]

    @classmethod
    async def _create_indexes(cls):
        """Create indexes for better query performance"""
        created = 0
        for collection, keys, kwargs in cls._INDEXES:
            try:
                await cls._db[collection].create_index(keys, **kwargs)
                created += 1
            except Exception:
                logger.warning(
                    "Could not create index %s on %s", keys, collection, exc_info=True
                )
        logger.info("Database indexes ensured (%s/%s)", created, len(cls._INDEXES))

    @classmethod
    async def close_db(cls):
        if cls._client:
            cls._client.close()
            cls._client = None
            cls._db = None
            logger.info("MongoDB connection closed")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        if cls._db is None:
            raise RuntimeError("Database not initialized. Call connect_db() first.")
        return cls._db

    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a specific collection"""
        return cls.get_db()[collection_name]

    @classmethod
    def get_listings_collection(cls):
        """Get the listings collection specifically"""
        return cls.get_collection("listings")
