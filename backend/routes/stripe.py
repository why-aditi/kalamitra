"""Stripe checkout + webhook.

Security invariants enforced here:
  * Prices are NEVER read from the request body. Every line item's amount is
    looked up from the `listings` collection by `listing_id`.
  * Orders are written with status "pending". They only become "paid" when
    Stripe tells us so over a signature-verified webhook.
  * The webhook is idempotent on the Stripe session id.
"""

import asyncio
import logging
import os
from datetime import datetime, timedelta
from typing import List, Optional

import stripe
from bson import ObjectId
from bson.errors import InvalidId
from dotenv import load_dotenv
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from fastapi.responses import JSONResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from pydantic import BaseModel, Field

from services.database import Database
from .auth import get_current_user

load_dotenv()

logger = logging.getLogger(__name__)

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:3000")
# ALLOWED_ORIGINS may be a comma-separated list; redirect URLs need exactly one.
PRIMARY_ORIGIN = ALLOWED_ORIGINS.split(",")[0].strip().rstrip("/")

stripe.api_key = os.getenv("STRIPE_SECRET_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# There were no timeouts anywhere in this codebase. A hung Stripe call used to
# be able to hold a worker indefinitely.
STRIPE_TIMEOUT_SECONDS = float(os.getenv("STRIPE_TIMEOUT_SECONDS", "15"))
try:
    stripe.default_http_client = stripe.RequestsClient(timeout=STRIPE_TIMEOUT_SECONDS)
    stripe.max_network_retries = 2
except Exception:  # pragma: no cover - defensive, never worth failing import
    logger.exception("Could not configure Stripe HTTP client")

MAX_ITEMS_PER_ORDER = 20
MAX_QUANTITY_PER_ITEM = 100

router = APIRouter()


# --------------------------------------------------------------------------- #
# Request models (frozen contract #2)
# --------------------------------------------------------------------------- #
class CheckoutItem(BaseModel):
    listing_id: str
    quantity: int = Field(1, ge=1, le=MAX_QUANTITY_PER_ITEM)


class CheckoutRequest(BaseModel):
    items: List[CheckoutItem] = Field(..., min_length=1, max_length=MAX_ITEMS_PER_ORDER)
    shipping_address: str = Field(..., min_length=1, max_length=1000)
    # Optional, purely informational fields carried onto the order record.
    buyer_name: Optional[str] = Field(None, max_length=200)
    phone_number: Optional[str] = Field(None, max_length=40)

    class Config:
        # Any stray `price`/`amount` field a client sends is dropped on the
        # floor rather than silently trusted.
        extra = "ignore"


class OrderStatusUpdate(BaseModel):
    status: str


ARTISAN_SETTABLE_ORDER_STATUSES = {"processing", "shipped", "delivered", "cancelled"}


def _as_object_id(value: str) -> Optional[ObjectId]:
    try:
        return ObjectId(value)
    except (InvalidId, TypeError):
        return None


@router.post("/create-checkout-session")
async def create_checkout_session(
    payload: CheckoutRequest,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    listings_collection = db.get_collection("listings")
    orders_collection = db.get_collection("orders")

    # ---- 1. Resolve every listing server-side, in ONE query. --------------- #
    object_ids = []
    for item in payload.items:
        oid = _as_object_id(item.listing_id)
        if oid is None:
            raise HTTPException(
                status_code=400, detail=f"Invalid listing id: {item.listing_id}"
            )
        object_ids.append(oid)

    cursor = listings_collection.find({"_id": {"$in": object_ids}})
    listings_by_id = {str(doc["_id"]): doc async for doc in cursor}

    line_items = []
    order_items = []
    total_amount = 0.0

    for item in payload.items:
        listing = listings_by_id.get(item.listing_id)
        if listing is None:
            raise HTTPException(
                status_code=404, detail=f"Listing not found: {item.listing_id}"
            )
        if listing.get("status") not in (None, "active", "published"):
            raise HTTPException(
                status_code=400,
                detail=f"Listing is not available for purchase: {item.listing_id}",
            )

        # THE fix: price comes from the database document, never the request.
        price = _listing_price(listing)
        if price <= 0:
            raise HTTPException(
                status_code=400,
                detail=f"Listing has no valid price: {item.listing_id}",
            )

        title = listing.get("title") or "Untitled Listing"
        description = (listing.get("description") or title)[:100]
        line_total = price * item.quantity
        total_amount += line_total

        line_items.append(
            {
                "price_data": {
                    "currency": "inr",
                    "product_data": {"name": title, "description": description},
                    # Stripe wants the smallest currency unit (paise).
                    "unit_amount": int(round(price * 100)),
                },
                "quantity": item.quantity,
            }
        )
        order_items.append(
            {
                "listing_id": item.listing_id,
                "product_title": title,
                "quantity": item.quantity,
                "unit_price": price,
                "line_total": line_total,
                "artist_id": listing.get("artist_id"),
            }
        )

    # ---- 2. Write the order as PENDING. ----------------------------------- #
    first = order_items[0]
    estimated_delivery = datetime.utcnow() + timedelta(days=7)
    buyer_email = current_user.get("email")
    buyer_name = payload.buyer_name or current_user.get("display_name") or ""

    order_data = {
        # Legacy single-product fields kept so existing readers (artisan
        # dashboard, buyer orders) keep working; `items` is the real record.
        "product_id": first["listing_id"],
        "product_title": first["product_title"],
        "quantity": first["quantity"],
        "items": order_items,
        "buyer_id": current_user["firebase_uid"],
        "buyer_name": buyer_name,
        "buyerEmail": buyer_email,
        "phone_number": payload.phone_number,
        "total_amount": total_amount,
        "status": "pending",
        "payment_status": "unpaid",
        "order_date": datetime.utcnow(),
        "shipping_address": payload.shipping_address,
        "payment_method": "Card",
        "tracking_number": None,
        "estimated_delivery": estimated_delivery,
        "delivered_date": None,
        "stripe_session_id": None,
    }

    result = await orders_collection.insert_one(order_data)
    order_id = str(result.inserted_id)
    logger.info("Created pending order %s for %s", order_id, current_user["firebase_uid"])

    # Mirror onto artist_orders, also pending.
    artist_orders_collection = db.get_collection("artist_orders")
    artist_rows = [
        {
            "order_id": order_id,
            "product_id": oi["listing_id"],
            "product_title": oi["product_title"],
            "buyer_name": buyer_name,
            "buyer_email": buyer_email,
            "total_amount": oi["line_total"],
            "quantity": oi["quantity"],
            "status": "pending",
            "order_date": order_data["order_date"],
            "shipping_address": payload.shipping_address,
            "payment_method": "Card",
            "tracking_number": None,
            "estimated_delivery": estimated_delivery,
            "delivered_date": None,
            "artist_id": oi["artist_id"],
        }
        for oi in order_items
        if oi.get("artist_id")
    ]
    if artist_rows:
        try:
            await artist_orders_collection.insert_many(artist_rows)
        except Exception:
            logger.exception("Could not mirror order %s to artist_orders", order_id)

    # ---- 3. Create the Stripe session. ------------------------------------ #
    try:
        # stripe-python's sync client blocks; keep it off the event loop.
        session = await asyncio.to_thread(
            stripe.checkout.Session.create,
            payment_method_types=["card"],
            line_items=line_items,
            mode="payment",
            client_reference_id=order_id,
            customer_email=buyer_email,
            success_url=f"{PRIMARY_ORIGIN}/marketplace/success?order_id={order_id}",
            cancel_url=f"{PRIMARY_ORIGIN}/marketplace/cancel?order_id={order_id}",
            metadata={"order_id": order_id, "buyer_id": current_user["firebase_uid"]},
        )
    except stripe.StripeError:
        logger.exception("Stripe session creation failed for order %s", order_id)
        await orders_collection.update_one(
            {"_id": result.inserted_id},
            {"$set": {"status": "failed", "updated_at": datetime.utcnow()}},
        )
        raise HTTPException(status_code=502, detail="Payment provider error")
    except Exception:
        logger.exception("Unexpected checkout failure for order %s", order_id)
        raise HTTPException(status_code=500, detail="Checkout failed")

    await orders_collection.update_one(
        {"_id": result.inserted_id},
        {"$set": {"stripe_session_id": session.id, "updated_at": datetime.utcnow()}},
    )

    return JSONResponse(
        {"url": session.url, "order_id": order_id, "total_amount": total_amount}
    )


def _listing_price(listing: dict) -> float:
    """Read the authoritative price off a listing document.

    Historic documents store price as a float, as "₹1,299", or only as
    `suggested_price`. All three are handled; anything unparseable is 0.0,
    which the caller rejects.
    """
    raw = listing.get("price")
    if raw in (None, "", 0, 0.0):
        raw = listing.get("suggested_price")
    if isinstance(raw, str):
        raw = raw.replace("₹", "").replace(",", "").strip()
    try:
        return float(raw)
    except (TypeError, ValueError):
        return 0.0


# --------------------------------------------------------------------------- #
# Webhook
# --------------------------------------------------------------------------- #
@router.post("/stripe/webhook")
async def stripe_webhook(
    request: Request,
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Stripe -> us. The ONLY place an order becomes `paid`.

    Signature-verified with STRIPE_WEBHOOK_SECRET, and idempotent: the first
    write for a given session id wins, replays are no-ops.
    """
    if not STRIPE_WEBHOOK_SECRET:
        logger.error("STRIPE_WEBHOOK_SECRET is not configured; refusing webhook")
        raise HTTPException(status_code=500, detail="Webhook not configured")

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")
    if not sig_header:
        raise HTTPException(status_code=400, detail="Missing Stripe-Signature header")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, STRIPE_WEBHOOK_SECRET
        )
    except ValueError:
        logger.warning("Stripe webhook: malformed payload")
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.SignatureVerificationError:
        logger.warning("Stripe webhook: signature verification FAILED")
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    obj = event["data"]["object"]

    if event_type == "checkout.session.completed":
        await _mark_order_paid(db, obj)
    elif event_type in ("checkout.session.expired", "checkout.session.async_payment_failed"):
        await _mark_order_failed(db, obj)
    else:
        logger.info("Stripe webhook: ignoring event type %s", event_type)

    # 200 quickly so Stripe stops retrying.
    return Response(status_code=200)


def _order_filter(session: dict):
    """Locate the order for a Stripe session without trusting metadata alone."""
    order_id = (session.get("metadata") or {}).get("order_id") or session.get(
        "client_reference_id"
    )
    oid = _as_object_id(order_id) if order_id else None
    if oid is not None:
        return {"_id": oid}
    return {"stripe_session_id": session.get("id")}


async def _mark_order_paid(db: AsyncIOMotorDatabase, session: dict):
    session_id = session.get("id")
    orders_collection = db.get_collection("orders")
    query = _order_filter(session)

    # Idempotency: only transition an order that is not already paid for this
    # session. A replayed event matches 0 documents and does nothing.
    query = {**query, "paid_session_id": {"$ne": session_id}}

    update = {
        "$set": {
            "status": "paid",
            "payment_status": "paid",
            "paid_session_id": session_id,
            "stripe_session_id": session_id,
            "stripe_payment_intent": session.get("payment_intent"),
            "paid_at": datetime.utcnow(),
            "updated_at": datetime.utcnow(),
        }
    }

    result = await orders_collection.update_one(query, update)
    if result.matched_count == 0:
        logger.info(
            "Stripe webhook: session %s already applied or order not found", session_id
        )
        return

    order = await orders_collection.find_one(
        {"paid_session_id": session_id}, {"_id": 1}
    )
    if order:
        await db.get_collection("artist_orders").update_many(
            {"order_id": str(order["_id"])},
            {"$set": {"status": "paid", "updated_at": datetime.utcnow()}},
        )
    logger.info("Stripe webhook: order marked paid for session %s", session_id)


async def _mark_order_failed(db: AsyncIOMotorDatabase, session: dict):
    session_id = session.get("id")
    query = _order_filter(session)
    query = {**query, "status": "pending"}
    await db.get_collection("orders").update_one(
        query,
        {
            "$set": {
                "status": "failed",
                "payment_status": "failed",
                "updated_at": datetime.utcnow(),
            }
        },
    )
    logger.info("Stripe webhook: order marked failed for session %s", session_id)


# --------------------------------------------------------------------------- #
# Order read / status endpoints (now authenticated + ownership-checked)
# --------------------------------------------------------------------------- #
@router.patch("/orders/{order_id}/status")
async def update_order_status(
    order_id: str,
    body: OrderStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Fulfilment status update. Only the artisan who owns a line item may do
    this, and payment states (`paid`/`pending`) are not settable by hand -
    those belong to the webhook."""
    new_status = (body.status or "").strip().lower()
    if new_status not in ARTISAN_SETTABLE_ORDER_STATUSES:
        raise HTTPException(
            status_code=400,
            detail=f"Status must be one of: {sorted(ARTISAN_SETTABLE_ORDER_STATUSES)}",
        )

    oid = _as_object_id(order_id)
    if oid is None:
        raise HTTPException(status_code=400, detail="Invalid order id")

    orders_collection = db.get_collection("orders")
    order = await orders_collection.find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not await _user_owns_order(db, order, current_user):
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    await orders_collection.update_one(
        {"_id": oid},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
    )
    await db.get_collection("artist_orders").update_many(
        {"order_id": order_id},
        {"$set": {"status": new_status, "updated_at": datetime.utcnow()}},
    )
    return {"message": "Order status updated successfully"}


@router.get("/orders/{order_id}")
async def get_order(
    order_id: str,
    current_user: dict = Depends(get_current_user),
    db: AsyncIOMotorDatabase = Depends(Database.get_db),
):
    """Order detail. Previously unauthenticated - it returned any user's name,
    email and shipping address to anyone who could guess an ObjectId."""
    oid = _as_object_id(order_id)
    if oid is None:
        raise HTTPException(status_code=400, detail="Invalid order id")

    order = await db.get_collection("orders").find_one({"_id": oid})
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not await _user_owns_order(db, order, current_user, allow_buyer=True):
        raise HTTPException(status_code=403, detail="Not authorized for this order")

    order["_id"] = str(order["_id"])
    for key in ("order_date", "estimated_delivery", "delivered_date", "paid_at", "updated_at"):
        if isinstance(order.get(key), datetime):
            order[key] = order[key].isoformat()
    return JSONResponse(order)


async def _user_owns_order(
    db: AsyncIOMotorDatabase,
    order: dict,
    current_user: dict,
    allow_buyer: bool = False,
) -> bool:
    """The buyer owns their order; an artisan owns an order containing one of
    their listings."""
    uid = current_user.get("firebase_uid")
    if not uid:
        return False

    if order.get("buyer_id") == uid:
        return True
    if allow_buyer and order.get("buyerEmail") and order["buyerEmail"] == current_user.get("email"):
        return True

    artist_ids = {
        item.get("artist_id") for item in (order.get("items") or []) if item.get("artist_id")
    }
    if artist_ids:
        return uid in artist_ids

    # Legacy single-product orders carry no `items`; fall back to the listing.
    oid = _as_object_id(order.get("product_id", ""))
    if oid is None:
        return False
    listing = await db.get_collection("listings").find_one(
        {"_id": oid}, {"artist_id": 1}
    )
    return bool(listing and listing.get("artist_id") == uid)
