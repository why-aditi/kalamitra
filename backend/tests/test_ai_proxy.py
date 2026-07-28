"""Tests for the server-side Gemini proxy (routes/ai.py).

The bug being locked down: `NEXT_PUBLIC_GEMINI_API_KEY` was inlined into the
public JS bundle, so anyone could extract it and bill the Google Cloud project.
Moving the call server-side only helps if two things hold, and both are tested
here:

  1. The endpoints are capped, because they now spend our money on behalf of
     unauthenticated callers.
  2. The key never comes back out - not in a success body, not in an error
     body, not in the OpenAPI schema. Google's SDK raises errors that embed the
     request URL, and that URL carries `?key=<the API key>`; a naive
     `detail=str(e)` would re-publish exactly what we just moved server-side.

No network, no real key: `generate_text` is monkeypatched everywhere.
"""

import asyncio

import pytest

import main
from routes import ai

# Matches the value conftest puts in the environment.
FAKE_KEY = "AIzaSyFAKE-test-key-do-not-use"

# What a google-generativeai failure actually looks like: the key is in the URL.
SDK_ERROR = RuntimeError(
    "400 POST https://generativelanguage.googleapis.com/v1beta/models/"
    f"gemini-2.5-flash:generateContent?key={FAKE_KEY} : quota exceeded"
)


@pytest.fixture(autouse=True)
def clean_limiters():
    """Limiter state is module-level and would otherwise leak between tests."""
    limiters = (ai.CHAT_LIMITER, ai.TRANSLATE_LIMITER, ai.GLOBAL_LIMITER)
    saved = [(limiter, limiter.limit) for limiter in limiters]
    for limiter, _ in saved:
        limiter.reset()
    yield
    for limiter, limit in saved:
        limiter.limit = limit
        limiter.reset()


@pytest.fixture
def gemini(monkeypatch):
    """Stub the one shared Gemini entry point and record what it was sent."""
    state = {"reply": "Kalamitra connects artisans with buyers.", "error": None, "calls": []}

    async def _fake_generate_text(prompt, timeout=None):
        state["calls"].append({"prompt": prompt, "timeout": timeout})
        if state["error"] is not None:
            raise state["error"]
        return state["reply"]

    monkeypatch.setattr(ai, "generate_text", _fake_generate_text)
    return state


def _chat(client, message="How do I list a product?", **kwargs):
    return client.post("/api/chat", json={"message": message}, **kwargs)


# --------------------------------------------------------------------------- #
# 1. Happy path + the public-access decision.
# --------------------------------------------------------------------------- #
def test_chat_answers_an_anonymous_caller(app_client, gemini):
    """Deliberately public: the widget is mounted in the root layout and must
    keep working for logged-out visitors. No login_as() call here."""
    response = _chat(app_client)

    assert response.status_code == 200, response.text
    assert response.json() == {"reply": "Kalamitra connects artisans with buyers."}


def test_chat_prompt_is_assembled_on_the_server(app_client, gemini):
    """The frontend sends only `message`. The system prompt moved here, so a
    client cannot cheapen or replace it."""
    _chat(app_client, "What is Kalamitra?")

    prompt = gemini["calls"][0]["prompt"]
    assert "You are a helpful assistant for Kalamitra" in prompt
    assert "User question: What is Kalamitra?" in prompt
    assert gemini["calls"][0]["timeout"] == ai.CHAT_TIMEOUT_SECONDS


def test_chat_accepts_optional_history(app_client, gemini):
    response = app_client.post(
        "/api/chat",
        json={
            "message": "And how do I get paid?",
            "history": [
                {"role": "user", "text": "How do I list a product?"},
                {"role": "assistant", "text": "Use the artisan dashboard."},
            ],
        },
    )
    assert response.status_code == 200, response.text
    prompt = gemini["calls"][0]["prompt"]
    assert "Use the artisan dashboard." in prompt


def test_chat_rejects_an_oversized_message(app_client, gemini):
    response = _chat(app_client, "x" * (ai.MAX_MESSAGE_CHARS + 1))
    assert response.status_code == 422
    assert gemini["calls"] == [], "an over-long message must not reach Gemini"


# --------------------------------------------------------------------------- #
# 2. Rate limiting. These endpoints spend money per call.
# --------------------------------------------------------------------------- #
def test_chat_rejects_an_over_limit_caller(app_client, gemini):
    ai.CHAT_LIMITER.limit = 3

    for i in range(3):
        assert _chat(app_client).status_code == 200, f"call {i} should be allowed"

    blocked = _chat(app_client)
    assert blocked.status_code == 429
    assert blocked.headers["Retry-After"].isdigit()
    assert int(blocked.headers["Retry-After"]) >= 1
    assert len(gemini["calls"]) == 3, "a blocked call must never reach Gemini"


def test_translate_rejects_an_over_limit_caller(app_client, gemini):
    ai.TRANSLATE_LIMITER.limit = 2

    for _ in range(2):
        assert app_client.post("/api/search/translate", json={"text": "pottery"}).status_code == 200

    blocked = app_client.post("/api/search/translate", json={"text": "pottery"})
    assert blocked.status_code == 429
    assert len(gemini["calls"]) == 2


def test_anonymous_callers_are_bucketed_by_ip(app_client, gemini):
    """Public endpoint -> the rate-limit key is the client IP."""
    ai.CHAT_LIMITER.limit = 1

    first = _chat(app_client, headers={"X-Forwarded-For": "203.0.113.10"})
    assert first.status_code == 200

    # Same IP, second call: blocked.
    assert _chat(app_client, headers={"X-Forwarded-For": "203.0.113.10"}).status_code == 429
    # A different visitor is unaffected.
    assert _chat(app_client, headers={"X-Forwarded-For": "198.51.100.7"}).status_code == 200


def test_authenticated_callers_are_bucketed_by_uid(app_client, gemini):
    """A signed-in user gets their own bucket rather than sharing the NAT/CGNAT
    IP of everyone else on the same mobile network."""
    ai.CHAT_LIMITER.limit = 1
    main.app.dependency_overrides[ai.optional_current_user] = lambda: {"uid": "user-42"}

    shared_ip = {"X-Forwarded-For": "203.0.113.10"}
    assert _chat(app_client, headers=shared_ip).status_code == 200
    assert _chat(app_client, headers=shared_ip).status_code == 429

    # Same IP, different uid: separate bucket.
    main.app.dependency_overrides[ai.optional_current_user] = lambda: {"uid": "user-99"}
    assert _chat(app_client, headers=shared_ip).status_code == 200


def test_global_ceiling_survives_identity_rotation(app_client, gemini):
    """X-Forwarded-For is client-supplied, so per-IP limits alone are dodgeable.
    The process-wide ceiling is the limit that actually bounds the bill."""
    ai.CHAT_LIMITER.limit = 100
    ai.GLOBAL_LIMITER.limit = 3

    for i in range(3):
        assert _chat(app_client, headers={"X-Forwarded-For": f"203.0.113.{i}"}).status_code == 200

    blocked = _chat(app_client, headers={"X-Forwarded-For": "203.0.113.250"})
    assert blocked.status_code == 429
    assert len(gemini["calls"]) == 3


# --------------------------------------------------------------------------- #
# 3. The key never leaves the server.
# --------------------------------------------------------------------------- #
def test_chat_error_response_does_not_leak_the_api_key(app_client, gemini):
    gemini["error"] = SDK_ERROR

    response = _chat(app_client)

    assert response.status_code == 502
    assert FAKE_KEY not in response.text
    assert "AIza" not in response.text
    assert "googleapis.com" not in response.text
    assert response.json()["detail"] == "The assistant is unavailable right now. Please try again."


def test_chat_timeout_returns_504_without_leaking(app_client, gemini):
    gemini["error"] = asyncio.TimeoutError()

    response = _chat(app_client)

    assert response.status_code == 504
    assert FAKE_KEY not in response.text


def test_translate_degrades_locally_without_leaking_the_api_key(app_client, gemini):
    """The search box has no error state, so a Gemini failure returns the local
    heuristic result - and still must not carry the key out with it."""
    gemini["error"] = SDK_ERROR

    response = app_client.post(
        "/api/search/translate", json={"text": "I want Madhubani paintings"}
    )

    assert response.status_code == 200
    assert FAKE_KEY not in response.text
    assert "AIza" not in response.text
    body = response.json()
    assert body["language"] == "en"
    assert "madhubani" in body["keywords"]


def test_unconfigured_key_returns_503_without_naming_the_variable(
    app_client, gemini, monkeypatch
):
    monkeypatch.setattr(ai, "GEMINI_CONFIGURED", False)

    response = _chat(app_client)

    assert response.status_code == 503
    assert "GEMINI" not in response.text.upper()
    assert gemini["calls"] == []


def test_no_response_on_any_path_contains_the_key(app_client, gemini):
    """Sweep every reachable status code on both endpoints."""
    ai.CHAT_LIMITER.limit = 1
    responses = [
        _chat(app_client),                                              # 200
        _chat(app_client),                                              # 429
        app_client.post("/api/chat", json={}),                          # 422
        app_client.post("/api/search/translate", json={"text": "vase"}),  # 200
        app_client.post("/api/search/translate", json={"text": ""}),    # 422
        app_client.get("/openapi.json"),                                # schema
    ]
    for response in responses:
        assert FAKE_KEY not in response.text, response.request.url
        assert "AIza" not in response.text, response.request.url
        assert "GEMINI_API_KEY" not in response.text, response.request.url


# --------------------------------------------------------------------------- #
# 4. Translation parsing (the logic that moved out of voice-utils.ts).
# --------------------------------------------------------------------------- #
def test_translate_parses_a_fenced_json_reply(app_client, gemini):
    gemini["reply"] = (
        '```json\n{"language":"hi","english":"Madhubani painting",'
        '"keywords":["madhubani","painting"]}\n```'
    )

    response = app_client.post(
        "/api/search/translate", json={"text": "मुझे मधुबनी पेंटिंग चाहिए"}
    )

    assert response.status_code == 200, response.text
    assert response.json() == {
        "language": "hi",
        "english": "Madhubani painting",
        "keywords": ["madhubani", "painting"],
    }


def test_translate_falls_back_when_the_reply_is_not_json(app_client, gemini):
    gemini["reply"] = "Sure! Here is what I found for you."

    response = app_client.post("/api/search/translate", json={"text": "blue pottery vase"})

    assert response.status_code == 200
    body = response.json()
    assert body["english"] == "blue pottery vase"
    assert body["keywords"] == ["blue", "pottery", "vase"]


def test_translate_detects_devanagari_in_the_local_fallback():
    assert ai.detect_language("मुझे मधुबनी पेंटिंग चाहिए") == "hi"
    assert ai.detect_language("blue pottery") == "en"
