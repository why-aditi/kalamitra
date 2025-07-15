from fastapi import APIRouter, Request, HTTPException
from pymongo import MongoClient
import os

router = APIRouter()

client = MongoClient(os.getenv("MONGO_URI"))
db = client.get_database("your_database_name")
orders_collection = db.get_collection("orders")

@router.get("/orders")
async def get_orders(email: str):
    if not email:
        raise HTTPException(status_code=400, detail="Email required")
    
    orders = list(orders_collection.find({"buyerEmail": email}))
    for order in orders:
        order["_id"] = str(order["_id"])  # convert ObjectId to str

    return {"orders": orders}
