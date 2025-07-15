from fastapi import APIRouter, Request, HTTPException
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os

router = APIRouter()

client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database("kalamitra")  # Updated database name
orders_collection = db.get_collection("orders")

@router.get("/orders")
async def get_orders(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    try:
        orders = list(orders_collection.find({"buyerEmail": email}))
        for order in orders:
            order["_id"] = str(order["_id"])  # convert ObjectId to str
            # Ensure all required fields are present
            order.setdefault("productTitle", "Unknown Product")
            order.setdefault("status", "pending")
            order.setdefault("createdAt", datetime.utcnow().isoformat())
            order.setdefault("quantity", 1)
            order.setdefault("totalAmount", 0)
            order.setdefault("productImage", None)

        return {"orders": orders}
    except Exception as e:
        print(f"Error fetching orders: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch orders")
