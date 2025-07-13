from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
import os
from dotenv import load_dotenv

load_dotenv()

# Your MongoDB configuration
MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kalamitra")

class Database:
    _client: AsyncIOMotorClient = None
    _db: AsyncIOMotorDatabase = None

    @classmethod
    async def connect_db(cls):
        if cls._client is None:
            cls._client = AsyncIOMotorClient(MONGO_URI)
            cls._db = cls._client[DATABASE_NAME]
            
            # Test the connection
            await cls._client.admin.command('ping')
            print("✅ MongoDB connected successfully")
            print(f"📊 Database: {DATABASE_NAME}")
            
            # Optional: Create indexes for listings collection
            await cls._create_indexes()

    @classmethod
    async def _create_indexes(cls):
        """Create indexes for better query performance"""
        try:
            # Create index on common query fields
            await cls._db.listings.create_index("created_at")
            await cls._db.listings.create_index("artist_id")
            await cls._db.listings.create_index("category")
            print("✅ Database indexes created")
        except Exception as e:
            print(f"⚠️  Index creation warning: {e}")

    @classmethod
    async def close_db(cls):
        if cls._client:
            cls._client.close()
            print("✅ MongoDB connection closed")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        if cls._db is None:
            raise RuntimeError("Database not initialized. Call connect_db() first.")
        return cls._db
    
    @classmethod
    def get_collection(cls, collection_name: str):
        """Get a specific collection"""
        if cls._db is None:
            raise RuntimeError("Database not initialized. Call connect_db() first.")
        return cls._db[collection_name]
    
    @classmethod
    def get_listings_collection(cls):
        """Get the listings collection specifically"""
        return cls.get_collection("listings")