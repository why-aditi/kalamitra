from motor.motor_asyncio import AsyncIOMotorClient
import os
from dotenv import load_dotenv

load_dotenv()

MONGO_URI = os.getenv("MONGO_URI", "mongodb://localhost:27017")
DATABASE_NAME = os.getenv("DATABASE_NAME", "kalamitra")

class Database:
    client: AsyncIOMotorClient = None
    db = None

    @classmethod
    async def connect_db(cls):
        try:
            cls.client = AsyncIOMotorClient(MONGO_URI)
            cls.db = cls.client[DATABASE_NAME]
            # Verify the connection
            await cls.client.admin.command('ping')
            print("Successfully connected to MongoDB.")
        except Exception as e:
            print("Failed to connect to MongoDB. Check your connection string.")
            raise

    @classmethod
    async def close_db(cls):
        if cls.client:
            cls.client.close()
            print("MongoDB connection closed.")

    @classmethod
    def get_db(cls):
        return cls.db