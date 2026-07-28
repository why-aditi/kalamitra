"""Frozen API contract tests.

Agent A codes against these shapes, so a silent drift here breaks the frontend
at runtime while still compiling. Kept separate from the payment tests.
"""

from bson import ObjectId

ARTISAN = {
    "_id": ObjectId(),
    "firebase_uid": "artisan-1",
    "display_name": "Rekha Devi",
    "craft": "Blue Pottery",
    "region": "Jaipur",
    "state": "Rajasthan",
    "bio": "Third-generation potter.",
}


def _seed(db, price=4500.0, reviews=None):
    listing = {
        "_id": ObjectId(),
        "title": "Blue Pottery Vase",
        "description": "x" * 900,
        "story": "y" * 900,
        "transcription": "z" * 900,
        "price": price,
        "suggested_price": f"₹{price:,.0f}",
        "category": "Crafts",
        "status": "active",
        "artist_id": ARTISAN["firebase_uid"],
        "image_ids": [str(ObjectId())],
        "reviews": reviews if reviews is not None else [{"rating": 4}, {"rating": 5}],
    }
    db.get_collection("listings").docs.append(listing)
    db.get_collection("users").docs.append(dict(ARTISAN))
    return listing


# --- Contract #1: embedded artisan block ----------------------------------- #
def test_listings_embed_the_artisan_block(app_client, db):
    """The marketplace fired 1 + 12 requests per load because it fetched an
    artist per card. The artisan now ships inside each listing."""
    _seed(db)

    response = app_client.get("/api/listings")
    assert response.status_code == 200, response.text

    listing = response.json()["listings"][0]
    artisan = listing["artisan"]
    assert artisan["id"] == "artisan-1"
    assert artisan["name"] == "Rekha Devi"
    assert artisan["craft"] == "Blue Pottery"
    assert artisan["region"] == "Jaipur"


def test_listings_are_projected_not_dumped_whole(app_client, db):
    """Card grid payload: no story, no raw voice transcription, no review
    bodies, and a truncated description."""
    _seed(db)
    listing = app_client.get("/api/listings").json()["listings"][0]

    assert len(listing["description"]) == 300
    assert listing.get("story") == ""
    assert "transcription" not in listing
    assert listing["reviews"] == []
    # Aggregates instead.
    assert listing["review_count"] == 2
    assert listing["rating"] == 4.5


def test_listing_rating_is_null_without_reviews(app_client, db):
    _seed(db, reviews=[])
    listing = app_client.get("/api/listings").json()["listings"][0]
    assert listing["review_count"] == 0
    assert listing["rating"] is None


# --- Canonical price field -------------------------------------------------- #
def test_price_filter_uses_the_canonical_price_field(app_client, db):
    """`price` (float) is canonical - it is what the filter, the sort and
    Stripe all read. `suggested_price` is a display string.

    The old guard `if min_price > 0 or max_price < 20000` meant an upper bound
    above the default silently filtered nothing.
    """
    _seed(db, price=4500.0)
    _seed(db, price=45000.0)

    # No bounds -> everything.
    assert len(app_client.get("/api/listings").json()["listings"]) == 2
    # An upper bound above the old 20000 default used to be a silent no-op.
    assert len(app_client.get("/api/listings?max_price=50000").json()["listings"]) == 2
    # Bounds are actually applied now, in both directions and independently.
    assert len(app_client.get("/api/listings?max_price=10000").json()["listings"]) == 1
    # A bare min_price used to be silently capped at the 20000 default.
    assert len(app_client.get("/api/listings?min_price=10000").json()["listings"]) == 1


def test_limit_is_capped(app_client, db):
    """limit=10000000 used to be accepted verbatim."""
    assert app_client.get("/api/listings?limit=10000000").status_code == 422
    assert app_client.get("/api/listings?limit=100").status_code == 200


# --- Contract #4: POST /api/login is gone ----------------------------------- #
def test_login_endpoint_no_longer_exists(app_client):
    """It called get_user_by_email() and minted a token without ever checking
    the password."""
    response = app_client.post(
        "/api/login", json={"email": "anyone@example.com", "password": "wrong"}
    )
    assert response.status_code == 405 or response.status_code == 404
    assert "/api/login" not in {r.path for r in app_client.app.routes if hasattr(r, "path")}


def test_update_role_escalation_endpoint_is_gone(app_client):
    paths = {r.path for r in app_client.app.routes if hasattr(r, "path")}
    assert "/api/update-role" not in paths
