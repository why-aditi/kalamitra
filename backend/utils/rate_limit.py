"""A tiny in-process sliding-window rate limiter.

Deliberately dependency-light. `slowapi` + Redis is the right answer for a
multi-instance deployment, but the immediate problem is narrower: the Gemini
proxy endpoints spend real money per call and had no cap of any kind
(IMPROVEMENTS.md sec.9 - "Rate limiting: none, anywhere"). A dict and a deque
close that hole today without adding a broker to the stack.

KNOWN LIMITATIONS - read these before relying on it for anything else:

  * State lives in this process. With N uvicorn workers the effective ceiling
    is N x the configured limit, and every deploy resets the counters. It is a
    spend guard, not an authorization boundary.
  * Memory is bounded by `max_keys` with LRU eviction, so a flood of distinct
    keys evicts old ones rather than growing without limit. An attacker who can
    cycle through more than `max_keys` identities inside one window can
    therefore push their own bucket out - which is why the callers also apply a
    single global limiter that no per-key rotation can escape.
"""

import asyncio
import time
from collections import OrderedDict, deque
from typing import Deque, Optional


class SlidingWindowLimiter:
    """Allow at most `limit` hits per `window_seconds`, per key.

    A true sliding window (timestamps in a deque) rather than a fixed window,
    because a fixed window lets a caller fire 2x the limit across a boundary.
    """

    def __init__(self, limit: int, window_seconds: float, max_keys: int = 10_000):
        if limit < 1:
            raise ValueError("limit must be >= 1")
        if window_seconds <= 0:
            raise ValueError("window_seconds must be > 0")
        self.limit = limit
        self.window = float(window_seconds)
        self.max_keys = max_keys
        self._hits: "OrderedDict[str, Deque[float]]" = OrderedDict()
        self._lock = asyncio.Lock()

    async def hit(self, key: str) -> Optional[float]:
        """Record one hit.

        Returns None when the call is allowed, or the number of seconds the
        caller must wait when it is not. A blocked call is NOT recorded, so a
        client hammering a closed window does not push its own reset further
        out.
        """
        now = time.monotonic()
        cutoff = now - self.window

        async with self._lock:
            bucket = self._hits.get(key)
            if bucket is None:
                bucket = deque()
                self._hits[key] = bucket
            self._hits.move_to_end(key)

            while bucket and bucket[0] <= cutoff:
                bucket.popleft()

            if len(bucket) >= self.limit:
                return max(0.0, bucket[0] + self.window - now)

            bucket.append(now)

            # LRU-evict cold keys. Buckets that emptied out are worthless.
            while len(self._hits) > self.max_keys:
                self._hits.popitem(last=False)

            return None

    def reset(self) -> None:
        """Drop all state. Used by tests; never called at runtime."""
        self._hits.clear()
