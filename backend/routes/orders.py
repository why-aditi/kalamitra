import logging
from datetime import datetime
from typing import Optional

from bson import ObjectId
from bson.errors import InvalidId
from fastapi import APIRouter, Depends, HTTPException, Query, status
from motor.motor_asyncio import AsyncIOMotorDatabase

from models.orderModel import Order, OrdersResponse
from services.database import Database
from utils.image_helpers import get_first_image_url
from .auth import get_current_user

logger = logging.getLogger(__name__)

router = APIRouter()

MAX_ORDERS = 200


def _first_image_id(listing: dict) -> Optional[str]:
    ids = (listing or {}).get("image_ids") or []
    if not ids:
        return None
    item = ids[0]
    if isinstance(item, dict) and "$oid" in item:
        return item["$oid"]
    if isinstance(item, ObjectId):
        return str(item)
    if isinstance(item, str):
        return item
    return None


@router.get("/orders", response_model=OrdersResponse)
async def get_orders(
    email: Optional[str] = Query(
        None,
        deprecated=True,
        description="Ignored. The buyer identity is taken from the bearer token.",
    ),
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """The signed-in buyer's own orders.

    Was `GET /api/orders?email=<anyone>` with NO authentication: it returned any
    user's full order history - name, email, shipping address. The `email` query
    parameter is now ignored entirely; identity comes from the token.
    """
    buyer_uid = current_user.get("firebase_uid")
    buyer_email = current_user.get("email")

    if email and buyer_email and email.lower() != (buyer_email or "").lower():
        logger.warning(
            "User %s passed a foreign email to GET /orders; ignoring it", buyer_uid
        )

    try:
        orders_collection = db.get_collection("orders")

        # Match on the uid, falling back to the email for pre-existing orders
        # that predate buyer_id being written.
        or_clause = [{"buyer_id": buyer_uid}]
        if buyer_email:
            or_clause.append({"buyerEmail": buyer_email})

        raw_orders = (
            await orders_collection.find({"$or": or_clause})
            .sort("order_date", -1)
            .to_list(length=MAX_ORDERS)  # was .to_list(None) - unbounded
        )
        if not raw_orders:
            return OrdersResponse(orders=[])

        # --- Batch the two lookups that used to run per order row. --------- #
        listing_object_ids = []
        for order_doc in raw_orders:
            pid = order_doc.get("product_id")
            if pid:
                try:
                    listing_object_ids.append(ObjectId(pid))
                except (InvalidId, TypeError):
                    continue

        listings_by_id = {}
        if listing_object_ids:
            cursor = db.get_collection("listings").find(
                {"_id": {"$in": listing_object_ids}}, {"title": 1, "image_ids": 1}
            )
            listings_by_id = {str(doc["_id"]): doc async for doc in cursor}

        # The buyer is always the caller, so the per-row users lookup is gone
        # entirely (it re-fetched the same user document once per order).
        buyer_name = (
            current_user.get("display_name")
            or current_user.get("name")
            or buyer_email
            or "Unknown Buyer"
        )

        serialized_orders = []
        for order_doc in raw_orders:
            order_id_str = str(order_doc["_id"])
            listing = listings_by_id.get(str(order_doc.get("product_id", "")))

            product_title = (
                (listing or {}).get("title")
                or order_doc.get("product_title")
                or order_doc.get("productTitle")
                or order_doc.get("product_name")
                or "Unknown Product"
            )

            product_image_url = "/placeholder.svg"
            image_id = _first_image_id(listing)
            if listing and image_id:
                # NameError fix: listing_id_str used to be referenced in a
                # branch where it had never been assigned.
                product_image_url = get_first_image_url(str(listing["_id"]), [image_id])

            estimated = order_doc.get("estimated_delivery")
            delivered = order_doc.get("delivered_date")

            serialized_orders.append(
                Order(
                    id=order_id_str,
                    productTitle=product_title,
                    productImage=product_image_url,
                    buyer=buyer_name,
                    amount=f"₹{order_doc.get('total_amount', 0):.2f}",
                    status=order_doc.get("status", "pending"),
                    date=order_doc.get("order_date", datetime.utcnow()).isoformat(),
                    quantity=order_doc.get("quantity", 1),
                    shippingAddress=order_doc.get("shipping_address", "N/A"),
                    paymentMethod=order_doc.get("payment_method", "N/A"),
                    trackingNumber=order_doc.get("tracking_number"),
                    estimatedDelivery=estimated.isoformat()
                    if isinstance(estimated, datetime)
                    else estimated,
                    deliveredDate=delivered.isoformat()
                    if isinstance(delivered, datetime)
                    else delivered,
                )
            )
        return OrdersResponse(orders=serialized_orders)
    except HTTPException:
        raise
    except Exception:
        logger.exception("Error fetching orders for %s", buyer_uid)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to fetch orders",
        )
