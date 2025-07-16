# services/database.py

import os
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from dotenv import load_dotenv



load_dotenv() # Ensure environment variables are loaded here too

class Database:
    client: Optional[AsyncIOMotorClient] = None
    db: Optional[AsyncIOMotorDatabase] = None

    @classmethod
    async def connect_db(cls):
        """Establishes a connection to the MongoDB database."""
        if cls.client is None or cls.db is None:
            mongo_uri = os.getenv("MONGO_URI")
            db_name = os.getenv("DATABASE_NAME")

            if not mongo_uri:
                raise ValueError("MONGO_URI environment variable not set.")
            if not db_name:
                raise ValueError("DATABASE_NAME environment variable not set.")

            cls.client = AsyncIOMotorClient(mongo_uri)
            cls.db = cls.client[db_name]
            print(f"Connected to MongoDB: {db_name}")

    @classmethod
    async def close_db(cls):
        """Closes the MongoDB connection."""
        if cls.client:
            cls.client.close()
            cls.client = None
            cls.db = None
            print("MongoDB connection closed.")

    @classmethod
    def get_db(cls) -> AsyncIOMotorDatabase:
        """Returns the database instance."""
        if cls.db is None:
            raise RuntimeError("Database not connected. Call connect_db() first.")
        return cls.db

# Example usage (for testing or if you want to connect outside FastAPI lifespan)
async def main():
    await Database.connect_db()
    db_instance = Database.get_db()
    print(f"Database instance retrieved: {db_instance.name}")
    # Example: Check if a collection exists
    # collections = await db_instance.list_collection_names()
    # print(f"Collections: {collections}")
    await Database.close_db()

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())