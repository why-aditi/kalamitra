import os
from motor.motor_asyncio import AsyncIOMotorClient
from bson import ObjectId
from datetime import datetime, timedelta
import asyncio

# --- Configuration ---
# IMPORTANT: Replace with your MongoDB connection string
MONGO_URI = "mongodb+srv://aditi25kala:Meesho123@cluster0.qf3xtrq.mongodb.net/" # Your provided URI
DATABASE_NAME = "kalamitra" # Your provided database name

async def seed_orders_data():
    client = None
    try:
        client = AsyncIOMotorClient(MONGO_URI)
        db = client[DATABASE_NAME]
        orders_collection = db.orders
        listings_collection = db.listings
        users_collection = db.users # Access the users collection

        print("Starting to seed sample orders data...")

        # --- Automatically find an artisan and their listing ---
        artisan_firebase_uid = None
        artisan_listing_id = None

        # 1. Try to find an artisan (e.g., the first one with role 'artisan' or 'artist')
        # You might want to adjust this query if you have a specific test artisan UID
        sample_artisan = await users_collection.find_one({"role": {"$in": ["artisan", "artist"]}})
        if sample_artisan:
            artisan_firebase_uid = sample_artisan.get("firebase_uid")
            print(f"Found artisan: {sample_artisan.get('name')} (UID: {artisan_firebase_uid})")
        else:
            print("No artisan found in 'users' collection. Please ensure you have an artisan user created.")
            print("You might need to register an artisan and complete their onboarding first.")
            return # Exit if no artisan is found

        # 2. Find a listing belonging to this artisan
        if artisan_firebase_uid:
            sample_listing = await listings_collection.find_one({"artist_id": artisan_firebase_uid})
            if sample_listing:
                artisan_listing_id = str(sample_listing["_id"])
                print(f"Found listing for artisan: '{sample_listing.get('title')}' (ID: {artisan_listing_id})")
            else:
                print(f"No listings found for artisan {artisan_firebase_uid}.")
                print("Please create at least one listing for this artisan before seeding orders.")
                return # Exit if no listing is found for the artisan

        if not artisan_listing_id:
            print("Could not determine a listing ID to link orders to. Exiting.")
            return

        # 3. Define sample order data using the dynamically found listing ID
        sample_orders = [
            {
                "product_id": artisan_listing_id,
                "buyer_name": "Priya Sharma",
                "buyer_email": "priya.sharma@example.com",
                "total_amount": 599.00,
                "quantity": 2,
                "status": "pending",
                "order_date": datetime.utcnow() - timedelta(days=5),
                "shipping_address": "Flat 101, Green Apartments, Bandra, Mumbai, Maharashtra - 400050",
                "payment_method": "COD",
                "tracking_number": None,
                "estimated_delivery": (datetime.utcnow() + timedelta(days=7)).isoformat(),
                "delivered_date": None,
            },
            {
                "product_id": artisan_listing_id,
                "buyer_name": "Amit Kumar",
                "buyer_email": "amit.kumar@example.com",
                "total_amount": 1250.00,
                "quantity": 1,
                "status": "confirmed",
                "order_date": datetime.utcnow() - timedelta(days=10),
                "shipping_address": "House 23, Sector 15, Gurgaon, Haryana - 122001",
                "payment_method": "UPI",
                "tracking_number": "TRK987654321",
                "estimated_delivery": (datetime.utcnow() + timedelta(days=3)).isoformat(),
                "delivered_date": None,
            },
            {
                "product_id": artisan_listing_id,
                "buyer_name": "Sneha Reddy",
                "buyer_email": "sneha.reddy@example.com",
                "total_amount": 899.50,
                "quantity": 3,
                "status": "shipped",
                "order_date": datetime.utcnow() - timedelta(days=15),
                "shipping_address": "Plot 45, Jubilee Hills, Hyderabad, Telangana - 500033",
                "payment_method": "Card",
                "tracking_number": "TRK112233445",
                "estimated_delivery": (datetime.utcnow() - timedelta(days=2)).isoformat(), # Should be in past
                "delivered_date": None, # Will be updated to delivered
            },
            {
                "product_id": artisan_listing_id,
                "buyer_name": "Rajesh Singh",
                "buyer_email": "rajesh.singh@example.com",
                "total_amount": 250.00,
                "quantity": 1,
                "status": "delivered",
                "order_date": datetime.utcnow() - timedelta(days=20),
                "shipping_address": "Shop 7, Gandhi Market, Lucknow, Uttar Pradesh - 226001",
                "payment_method": "COD",
                "tracking_number": "TRK556677889",
                "estimated_delivery": (datetime.utcnow() - timedelta(days=10)).isoformat(),
                "delivered_date": (datetime.utcnow() - timedelta(days=18)).isoformat(),
            },
        ]

        # 4. Insert data into the 'orders' collection
        print(f"Inserting {len(sample_orders)} sample orders...")
        results = await orders_collection.insert_many(sample_orders)
        print(f"Successfully inserted {len(results.inserted_ids)} orders.")

        # Optional: Update the status of the 'shipped' order to 'delivered' after a short delay
        shipped_order_id = results.inserted_ids[2] if len(results.inserted_ids) > 2 else None
        if shipped_order_id:
            print(f"Simulating delivery for order ID: {shipped_order_id}...")
            await orders_collection.update_one(
                {"_id": shipped_order_id},
                {"$set": {"status": "delivered", "delivered_date": datetime.utcnow()}}
            )
            print(f"Order {shipped_order_id} status updated to 'delivered'.")

        print("Order seeding complete.")

    except Exception as e:
        print(f"An error occurred during order seeding: {e}")
    finally:
        if client:
            client.close()
            print("MongoDB connection closed.")

if __name__ == "__main__":
    asyncio.run(seed_orders_data())
