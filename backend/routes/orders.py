
from fastapi import APIRouter, HTTPException, status, Depends
from pymongo import MongoClient
from bson import ObjectId
from datetime import datetime
import os
from motor.motor_asyncio import AsyncIOMotorDatabase # Import for type hinting
from services.database import Database # Import your Database service

router = APIRouter()

# REMOVE THESE LINES:
# client = MongoClient(os.getenv("MONGODB_URI"))
# db = client.get_database(os.getenv("MONGODB_DATABASE"))
# orders_collection = db.get_collection("orders")
# listings_collection = db.get_collection("listings")
# users_collection = db.get_collection("users")

@router.get("/orders")
async def get_orders(email: str, db: AsyncIOMotorDatabase = Depends(Database.get_db)):
    """
    Retrieves orders associated with a specific buyer email from the database.
    Includes product details and constructs full image URLs.
    """
    if not email:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email required")

    try:
        # Access collections via the injected 'db' object
        orders_collection = db.get_collection("orders")
        listings_collection = db.get_collection("listings")
        users_collection = db.get_collection("users")

        # Find orders for the given buyer email, sorted by order_date descending
        raw_orders = await orders_collection.find({"buyerEmail": email}).sort("order_date", -1).to_list(None)

        serialized_orders = []
        for order_doc in raw_orders:
            # Convert ObjectId to string for the order ID
            order_id_str = str(order_doc["_id"])

            # --- Fetch Product Listing Details ---
            product_listing = None
            if "product_id" in order_doc and order_doc["product_id"]:
                try:
                    # Ensure product_id is an ObjectId for lookup
                    product_listing = await listings_collection.find_one({"_id": ObjectId(order_doc["product_id"])})
                except Exception as e:
                    print(f"DEBUG_ORDERS_API: Error fetching listing {order_doc['product_id']}: {e}")

            product_title = product_listing.get("title", "Unknown Product") if product_listing else "Unknown Product"
            product_image_url = "/placeholder.svg" # Default placeholder

            if product_listing and product_listing.get("image_ids"):
                first_image_id_item = product_listing["image_ids"][0]
                first_image_id_str = None

                # Handle different types of image_ids (ObjectId, dict with $oid, string)
                if isinstance(first_image_id_item, dict) and "$oid" in first_image_id_item:
                    first_image_id_str = first_image_id_item["$oid"]
                elif isinstance(first_image_id_item, ObjectId):
                    first_image_id_str = str(first_image_id_item)
                elif isinstance(first_image_id_item, str):
                    first_image_id_str = first_image_id_item

                if first_image_id_str:
                    listing_id_str = str(product_listing["_id"])
                    api_base_url = os.getenv('NEXT_PUBLIC_API_BASE_URL')
                    if not api_base_url:
                        print("DEBUG_ORDERS_API: WARNING: NEXT_PUBLIC_API_BASE_URL environment variable is not set. Using placeholder for image URL.")
                    else:
                        product_image_url = f"{api_base_url}/api/listings/{listing_id_str}/images/{first_image_id_str}"
                else:
                    print(f"DEBUG_ORDERS_API: No valid image ID extracted for listing {listing_id_str}. Using placeholder.")
            else:
                print(f"DEBUG_ORDERS_API: Product listing or image_ids missing for order {order_id_str}. Using placeholder.")

            # --- Fetch Buyer Name ---
            buyer_name = "Unknown Buyer"
            if "buyer_id" in order_doc and order_doc["buyer_id"]:
                buyer_profile = await users_collection.find_one({"firebase_uid": order_doc["buyer_id"]})
                if buyer_profile:
                    buyer_name = buyer_profile.get("name") or buyer_profile.get("display_name") or order_doc.get("buyerEmail", "Unknown Buyer")
            else:
                buyer_name = order_doc.get("buyerEmail", "Unknown Buyer")


            # --- Construct the order object for the frontend ---
            serialized_orders.append({
                "id": order_id_str,
                "productTitle": product_title,
                "productImage": product_image_url,
                "buyer": buyer_name,
                "amount": f"₹{order_doc.get('total_amount', 0):.2f}",
                "status": order_doc.get("status", "pending"),
                "date": order_doc.get("order_date", datetime.utcnow()).isoformat(),
                "quantity": order_doc.get("quantity", 1),
                "shippingAddress": order_doc.get("shipping_address", "N/A"),
                "paymentMethod": order_doc.get("payment_method", "N/A"),
                "trackingNumber": order_doc.get("tracking_number", None),
                "estimatedDelivery": order_doc.get("estimated_delivery", None),
                "deliveredDate": order_doc.get("delivered_date", None),
            })
        return {"orders": serialized_orders}
    except Exception as e:
        print(f"Error fetching orders: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Failed to fetch orders")
