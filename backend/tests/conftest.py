"""Test harness for the money paths.

Deliberately requires NO live MongoDB, NO Firebase credentials and NO Stripe
keys: Mongo is a small in-memory fake, Firebase Admin's initialisation is
stubbed, and Stripe's network call is monkeypatched. Only the webhook signature
check runs for real - that is the thing under test.
"""

import os
import sys
from pathlib import Path

import pytest

BACKEND_ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND_ROOT))

# Must be set BEFORE main/routes are imported: several modules read env at
# import time. setdefault-style assignment wins over .env because python-dotenv
# does not override already-present variables.
os.environ["FIREBASE_SERVICE_ACCOUNT_PATH"] = "test-service-account.json"
os.environ["MONGO_URI"] = "mongodb://testing.invalid:27017"
os.environ["DATABASE_NAME"] = "kalamitra_test"
os.environ["ALLOWED_ORIGINS"] = "http://localhost:3000"
os.environ["STRIPE_SECRET_KEY"] = "sk_test_dummy"
os.environ["STRIPE_WEBHOOK_SECRET"] = "whsec_test_secret"
os.environ["API_BASE_URL"] = "http://localhost:8000"
# A deliberately fake Gemini key: routes/ai.py only checks that one is present,
# and every test monkeypatches the SDK call, so no request ever leaves the box.
# The value doubles as the canary in the key-leakage tests.
os.environ["GEMINI_API_KEY"] = "AIzaSyFAKE-test-key-do-not-use"

import firebase_admin  # noqa: E402
from firebase_admin import credentials  # noqa: E402

credentials.Certificate = lambda *a, **k: object()  # type: ignore[assignment]
firebase_admin.initialize_app = lambda *a, **k: object()  # type: ignore[assignment]

from fastapi.testclient import TestClient  # noqa: E402

import main  # noqa: E402
from routes.auth import get_current_user  # noqa: E402
from services.database import Database  # noqa: E402

from .fake_mongo import FakeDB  # noqa: E402


@pytest.fixture
def db() -> FakeDB:
    return FakeDB()


@pytest.fixture
def app_client(db):
    """TestClient with Mongo and the auth dependency overridden.

    Not used as a context manager on purpose - that would run the lifespan and
    try to open a real Mongo connection.
    """
    state = {"user": None}

    def _get_db():
        return db

    def _get_user():
        if state["user"] is None:
            from fastapi import HTTPException

            raise HTTPException(status_code=401, detail="Not authenticated")
        return state["user"]

    main.app.dependency_overrides[Database.get_db] = _get_db
    main.app.dependency_overrides[get_current_user] = _get_user

    client = TestClient(main.app)
    client.login_as = lambda user: state.__setitem__("user", user)  # type: ignore[attr-defined]
    try:
        yield client
    finally:
        main.app.dependency_overrides.clear()
