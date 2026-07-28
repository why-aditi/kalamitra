"""Money-path regression tests.

Each test here corresponds to a bug that was live in production:

  1. Checkout took `price` from the request body -> anyone could buy anything
     for one rupee.
  2. There was no webhook at all, so nothing verified a Stripe signature.
  3. ...and therefore nothing had to be idempotent either.
  4. DELETE /api/listings/{id} had no authentication of any kind.
"""

import hashlib
import hmac
import json
import time
import types

import pytest
import stripe
from bson import ObjectId

WEBHOOK_SECRET = "whsec_test_secret"

BUYER = {
    "firebase_uid": "buyer-uid-1",
    "email": "buyer@example.com",
    "display_name": "Buyer One",
    "role": "buyer",
}
OWNER = {
    "firebase_uid": "artisan-owner",
    "email": "owner@example.com",
    "display_name": "Owner",
    "role": "artisan",
}
INTRUDER = {
    "firebase_uid": "artisan-intruder",
    "email": "intruder@example.com",
    "display_name": "Intruder",
    "role": "artisan",
}


@pytest.fixture
def listing(db):
    """A ₹4,500 listing owned by OWNER."""
    doc = {
        "_id": ObjectId(),
        "title": "Blue Pottery Vase",
        "description": "Hand-thrown Jaipur blue pottery.",
        "price": 4500.0,
        "suggested_price": "₹4,500",
        "category": "Crafts",
        "status": "active",
        "artist_id": OWNER["firebase_uid"],
        "image_ids": [],
    }
    db.get_collection("listings").docs.append(doc)
    return doc


@pytest.fixture
def fake_stripe(monkeypatch):
    """Capture what we would have sent to Stripe, without any network call."""
    captured = {}

    def _create(**kwargs):
        captured.update(kwargs)
        return types.SimpleNamespace(
            id="cs_test_session_1", url="https://checkout.stripe.com/c/pay/cs_test_session_1"
        )

    monkeypatch.setattr(stripe.checkout.Session, "create", staticmethod(_create))
    return captured


def sign(payload: bytes, secret: str = WEBHOOK_SECRET, timestamp: int = None) -> str:
    """Build a genuine Stripe-Signature header so construct_event runs for real."""
    timestamp = timestamp or int(time.time())
    signed = b"%d.%s" % (timestamp, payload)
    signature = hmac.new(secret.encode(), signed, hashlib.sha256).hexdigest()
    return f"t={timestamp},v1={signature}"


def completed_event(order_id: str, session_id: str = "cs_test_session_1") -> bytes:
    return json.dumps(
        {
            "id": "evt_test_1",
            "object": "event",
            "type": "checkout.session.completed",
            "data": {
                "object": {
                    "id": session_id,
                    "object": "checkout.session",
                    "payment_intent": "pi_test_1",
                    "client_reference_id": order_id,
                    "metadata": {"order_id": order_id},
                }
            },
        }
    ).encode()


# --------------------------------------------------------------------------- #
# 1. Price comes from the database, never from the client.
# --------------------------------------------------------------------------- #
def test_checkout_ignores_client_supplied_price(app_client, db, listing, fake_stripe):
    app_client.login_as(BUYER)

    response = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 2}],
            "shipping_address": "12 MI Road, Jaipur",
            # The attack: a price injected into the request body.
            "price": 1,
            "total_amount": 1,
            "product": {"price": 1},
        },
    )

    assert response.status_code == 200, response.text
    body = response.json()

    # 2 x ₹4500 from the DB, not the injected ₹1.
    assert body["total_amount"] == 9000.0

    line_item = fake_stripe["line_items"][0]
    assert line_item["price_data"]["unit_amount"] == 450000  # paise
    assert line_item["quantity"] == 2

    order = db.get_collection("orders").docs[0]
    assert order["total_amount"] == 9000.0
    assert order["items"][0]["unit_price"] == 4500.0


def test_checkout_writes_order_as_pending_not_confirmed(app_client, db, listing, fake_stripe):
    """The order used to be written "confirmed" before the Stripe session even
    existed, so an abandoned checkout still looked like a completed sale."""
    app_client.login_as(BUYER)

    response = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    assert response.status_code == 200, response.text

    order = db.get_collection("orders").docs[0]
    assert order["status"] == "pending"
    assert order["payment_status"] == "unpaid"
    assert order["stripe_session_id"] == "cs_test_session_1"


def test_checkout_rejects_unknown_listing(app_client, db, fake_stripe):
    app_client.login_as(BUYER)
    response = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(ObjectId()), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    assert response.status_code == 404
    assert db.get_collection("orders").docs == []


def test_checkout_requires_authentication(app_client, listing, fake_stripe):
    # No login_as() call -> the overridden dependency raises 401.
    response = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    assert response.status_code == 401


# --------------------------------------------------------------------------- #
# 2. The webhook verifies signatures.
# --------------------------------------------------------------------------- #
def test_webhook_rejects_bad_signature(app_client, db):
    order_id = str(ObjectId())
    payload = completed_event(order_id)

    response = app_client.post(
        "/api/stripe/webhook",
        content=payload,
        headers={
            "stripe-signature": sign(payload, secret="whsec_the_wrong_secret"),
            "content-type": "application/json",
        },
    )
    assert response.status_code == 400
    assert response.json()["detail"] == "Invalid signature"


def test_webhook_rejects_missing_signature_header(app_client):
    payload = completed_event(str(ObjectId()))
    response = app_client.post(
        "/api/stripe/webhook", content=payload, headers={"content-type": "application/json"}
    )
    assert response.status_code == 400
    assert "Signature" in response.json()["detail"]


def test_webhook_rejects_replayed_old_timestamp(app_client, db):
    """A correctly-signed payload from an hour ago is outside Stripe's default
    300s tolerance and must not be accepted."""
    payload = completed_event(str(ObjectId()))
    stale = int(time.time()) - 3600
    response = app_client.post(
        "/api/stripe/webhook",
        content=payload,
        headers={
            "stripe-signature": sign(payload, timestamp=stale),
            "content-type": "application/json",
        },
    )
    assert response.status_code == 400


def test_webhook_marks_order_paid_on_valid_signature(app_client, db, listing, fake_stripe):
    app_client.login_as(BUYER)
    checkout = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    order_id = checkout.json()["order_id"]
    assert db.get_collection("orders").docs[0]["status"] == "pending"

    payload = completed_event(order_id)
    response = app_client.post(
        "/api/stripe/webhook",
        content=payload,
        headers={"stripe-signature": sign(payload), "content-type": "application/json"},
    )
    assert response.status_code == 200

    order = db.get_collection("orders").docs[0]
    assert order["status"] == "paid"
    assert order["payment_status"] == "paid"
    assert order["paid_session_id"] == "cs_test_session_1"
    # The artisan's mirrored row follows.
    assert db.get_collection("artist_orders").docs[0]["status"] == "paid"


# --------------------------------------------------------------------------- #
# 3. The webhook is idempotent. Stripe delivers at-least-once.
# --------------------------------------------------------------------------- #
def test_webhook_is_idempotent_on_session_id(app_client, db, listing, fake_stripe):
    app_client.login_as(BUYER)
    checkout = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    order_id = checkout.json()["order_id"]
    payload = completed_event(order_id)

    def deliver():
        return app_client.post(
            "/api/stripe/webhook",
            content=payload,
            headers={"stripe-signature": sign(payload), "content-type": "application/json"},
        )

    assert deliver().status_code == 200
    first_paid_at = db.get_collection("orders").docs[0]["paid_at"]

    # Replay it three more times, exactly as Stripe would on a retry.
    for _ in range(3):
        assert deliver().status_code == 200

    orders = db.get_collection("orders").docs
    assert len(orders) == 1, "a replay must never create a second order"
    assert orders[0]["status"] == "paid"
    # Untouched on replay: the second write was filtered out, not re-applied.
    assert orders[0]["paid_at"] == first_paid_at


def test_webhook_does_not_downgrade_a_paid_order_on_expiry_replay(
    app_client, db, listing, fake_stripe
):
    app_client.login_as(BUYER)
    checkout = app_client.post(
        "/api/create-checkout-session",
        json={
            "items": [{"listing_id": str(listing["_id"]), "quantity": 1}],
            "shipping_address": "12 MI Road, Jaipur",
        },
    )
    order_id = checkout.json()["order_id"]

    paid = completed_event(order_id)
    app_client.post(
        "/api/stripe/webhook",
        content=paid,
        headers={"stripe-signature": sign(paid), "content-type": "application/json"},
    )

    expired = json.dumps(
        {
            "id": "evt_test_2",
            "object": "event",
            "type": "checkout.session.expired",
            "data": {
                "object": {
                    "id": "cs_test_session_1",
                    "object": "checkout.session",
                    "client_reference_id": order_id,
                    "metadata": {"order_id": order_id},
                }
            },
        }
    ).encode()
    response = app_client.post(
        "/api/stripe/webhook",
        content=expired,
        headers={"stripe-signature": sign(expired), "content-type": "application/json"},
    )
    assert response.status_code == 200
    assert db.get_collection("orders").docs[0]["status"] == "paid"


# --------------------------------------------------------------------------- #
# 4. Ownership checks on destructive endpoints.
# --------------------------------------------------------------------------- #
def test_foreign_delete_is_blocked(app_client, db, listing):
    """DELETE /api/listings/{id} had no auth at all: one curl wiped any
    artisan's catalogue."""
    app_client.login_as(INTRUDER)

    response = app_client.delete(f"/api/listings/{listing['_id']}")

    assert response.status_code == 403
    assert len(db.get_collection("listings").docs) == 1, "listing must survive"


def test_owner_can_delete_their_own_listing(app_client, db, listing):
    app_client.login_as(OWNER)
    response = app_client.delete(f"/api/listings/{listing['_id']}")
    assert response.status_code == 200
    assert db.get_collection("listings").docs == []


def test_unauthenticated_delete_is_blocked(app_client, db, listing):
    response = app_client.delete(f"/api/listings/{listing['_id']}")
    assert response.status_code == 401
    assert len(db.get_collection("listings").docs) == 1


def test_foreign_status_patch_is_blocked(app_client, db, listing):
    app_client.login_as(INTRUDER)
    response = app_client.patch(
        f"/api/listings/{listing['_id']}/status", params={"status": "inactive"}
    )
    assert response.status_code == 403
    assert db.get_collection("listings").docs[0]["status"] == "active"
