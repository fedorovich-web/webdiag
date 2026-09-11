from __future__ import annotations

import hashlib

import pytest
from redis.exceptions import ConnectionError as RedisConnectionError

from webdiag_api.auth.rate_limit import (
    AuthRateLimiter,
    RateLimitExceeded,
    RateLimitUnavailable,
)


class FakeRedis:
    def __init__(self, *, result: int = 1, error: Exception | None = None) -> None:
        self.result = result
        self.error = error
        self.calls: list[tuple[str, int, str, int]] = []

    async def eval(
        self,
        script: str,
        numkeys: int,
        key: str,
        window_seconds: int,
    ) -> int:
        self.calls.append((script, numkeys, key, window_seconds))
        if self.error is not None:
            raise self.error
        return self.result


@pytest.mark.asyncio
async def test_rate_limit_uses_atomic_counter_and_hashes_sensitive_identifier() -> None:
    redis = FakeRedis(result=3)
    limiter = AuthRateLimiter(redis)
    email = "roman@example.com"

    await limiter.enforce(
        scope="login",
        identifier=email,
        limit=10,
        window_seconds=300,
    )

    assert len(redis.calls) == 1
    script, numkeys, key, window_seconds = redis.calls[0]
    assert numkeys == 1
    assert window_seconds == 300
    assert "INCR" in script
    assert "EXPIRE" in script
    assert email not in key
    expected_digest = hashlib.sha256(email.encode("utf-8")).hexdigest()
    assert key == f"webdiag:auth-rate:login:{expected_digest}"


@pytest.mark.asyncio
async def test_rate_limit_rejects_request_above_limit() -> None:
    limiter = AuthRateLimiter(FakeRedis(result=6))

    with pytest.raises(RateLimitExceeded, match="rate_limit_exceeded"):
        await limiter.enforce(
            scope="register",
            identifier="roman@example.com",
            limit=5,
            window_seconds=3600,
        )


@pytest.mark.asyncio
async def test_rate_limit_fails_closed_when_redis_is_unavailable() -> None:
    redis = FakeRedis(error=RedisConnectionError("redis unavailable"))
    limiter = AuthRateLimiter(redis)

    with pytest.raises(RateLimitUnavailable, match="rate_limit_unavailable"):
        await limiter.enforce(
            scope="forgot-password",
            identifier="roman@example.com",
            limit=5,
            window_seconds=3600,
        )
