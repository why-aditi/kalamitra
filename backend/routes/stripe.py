from fastapi import APIRouter, Request, HTTPException, Depends, status
from fastapi.responses import JSONResponse
import os
import stripe
from dotenv import load_dotenv
from motor.motor_asyncio import AsyncIOMotorDatabase # Import for type hinting
from bson import ObjectId
from datetime import datetime, timedelta
from services.database import Database # Import your Database service
from .auth import get_current_user # Import get_current_user

# Load environment variables (ensure this is done once at app startup, e.g., in main.py)
# load_dotenv() # Removed from here, assumed to be in main.py

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")

router = APIRouter()

# REMOVED direct MongoDB client initialization here.
# It will now be injected via FastAPI's Depends system.

@router.post("/create-checkout-session")
async def create_checkout_session(
    request: Request,
    current_user: dict = Depends(get_current_user), # Inject current_user
    db: AsyncIOMotorDatabase = Depends(Database.get_db) # Inject db
):
    try:
        data = await request.json()
        product = data.get("product")
        buyer = data.get("buyer")

        if not product or not buyer:
            raise HTTPException(status_code=400, detail="Product and buyer info required")

        # Access orders collection via the injected 'db' object
        orders_collection = db.get_collection("orders")

        # Calculate estimated delivery (7 days from now)
        estimated_delivery = datetime.utcnow() + timedelta(days=7)

        # Save order to database matching your schema first
        order_data = {
            "product_id": str(product.get("id", "")),
            "product_title": product.get("title", "Unknown Product"),  # <-- Add this line
            "buyer_id": current_user["firebase_uid"],
            "buyer_name": buyer.get("name", ""),
            "buyerEmail": buyer["email"],
            "total_amount": float(product["price"]) * product.get("quantity", 1),
            "quantity": product.get("quantity", 1),
            "status": "confirmed",
            "order_date": datetime.utcnow(),
            "shipping_address": buyer.get("address", ""),
            "payment_method": "Card",
            "tracking_number": None,
            "estimated_delivery": estimated_delivery,
            "delivered_date": None
        }

        # Insert order into database
        result = await orders_collection.insert_one(order_data)
        print(f"Order inserted with ID: {result.inserted_id}")

        # Create Stripe checkout session
        session = stripe.checkout.Session.create(
            payment_method_types=["card"],
            line_items=[{
                "price_data": {
                    "currency": "inr",
                    "product_data": {
                        "name": product["title"],
                        "description": product["description"][:100] if product.get("description") else product["title"],
                    },
                    "unit_amount": int(float(product["price"]) * 100),
                },
                "quantity": product.get("quantity", 1),
            }],
            mode="payment",
            success_url=f"http://localhost:3000/marketplace/success?order_id={result.inserted_id}",
            cancel_url=f"http://localhost:3000/marketplace/cancel?order_id={result.inserted_id}",
            metadata={
                "order_id": str(result.inserted_id),
                "buyerEmail": buyer["email"],  
                "buyer_name": buyer.get("name", ""),
                "product_title": product["title"],
                "product_id": str(product.get("id", "")),
                "quantity": str(product.get("quantity", 1))
            }
        )
        return JSONResponse({"url": session.url, "order_id": str(result.inserted_id)})
    except stripe.error.StripeError as e:
        print(f"Stripe error: {e}")
        raise HTTPException(status_code=500, detail=f"Stripe session creation failed: {str(e)}")
    except Exception as e:
        print(f"General error: {e}")
        raise HTTPException(status_code=500, detail=f"Order creation failed: {str(e)}")

# Optional: Endpoint to update order status manually if needed
@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    request: Request,
    db: AsyncIOMotorDatabase = Depends(Database.get_db) # Inject db
):
    try:
        orders_collection = db.get_collection("orders") # Access collection
        data = await request.json()
        new_status = data.get("status")

        if not new_status:
            raise HTTPException(status_code=400, detail="Status is required")

        result = await orders_collection.update_one(
            {"_id": ObjectId(order_id)},
            {"$set": {"status": new_status, "updated_at": datetime.utcnow()}}
        )

        if result.matched_count == 0:
            raise HTTPException(status_code=404, detail="Order not found")

        return JSONResponse({"message": "Order status updated successfully"})
    except Exception as e:
        print(f"Error updating order status: {e}")
        raise HTTPException(status_code=500, detail="Failed to update order status")

# Optional: Endpoint to get order details
@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    db: AsyncIOMotorDatabase = Depends(Database.get_db) # Inject db
):
    try:
        orders_collection = db.get_collection("orders") # Access collection
        order = await orders_collection.find_one({"_id": ObjectId(order_id)})

        if not order:
            raise HTTPException(status_code=404, detail="Order not found")

        # Convert ObjectId to string for JSON response
        order["_id"] = str(order["_id"])

        return JSONResponse(order)
    except Exception as e:
        print(f"Error fetching order: {e}")
        raise HTTPException(status_code=500, detail="Failed to fetch order")
