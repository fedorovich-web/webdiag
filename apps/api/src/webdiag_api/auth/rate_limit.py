from __future__ import annotations

import hashlib
from typing import Protocol

from redis.exceptions import RedisError

_RATE_LIMIT_SCRIPT = """
local current = redis.call('INCR', KEYS[1])
if current == 1 then
    redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
""".strip()


class RedisEvalClient(Protocol):
    async def eval(
        self,
        script: str,
        numkeys: int,
        key: str,
        window_seconds: int,
    ) -> object: ...


class RateLimitExceeded(RuntimeError):
    def __init__(self) -> None:
        super().__init__("rate_limit_exceeded")


class RateLimitUnavailable(RuntimeError):
    def __init__(self) -> None:
        super().__init__("rate_limit_unavailable")


class AuthRateLimiter:
    def __init__(self, redis: RedisEvalClient) -> None:
        self._redis = redis

    async def enforce(
        self,
        *,
        scope: str,
        identifier: str,
        limit: int,
        window_seconds: int,
    ) -> None:
        if not scope or not identifier:
            raise ValueError("Rate-limit scope and identifier must not be empty")
        if limit <= 0 or window_seconds <= 0:
            raise ValueError("Rate-limit limit and window must be positive")

        identifier_digest = hashlib.sha256(identifier.encode("utf-8")).hexdigest()
        key = f"webdiag:auth-rate:{scope}:{identifier_digest}"

        try:
            result = await self._redis.eval(
                _RATE_LIMIT_SCRIPT,
                1,
                key,
                window_seconds,
            )
        except RedisError as exc:
            raise RateLimitUnavailable() from exc

        if isinstance(result, bool):
            raise RateLimitUnavailable()
        if isinstance(result, int):
            count = result
        elif isinstance(result, bytes):
            try:
                count = int(result.decode("ascii"))
            except (UnicodeDecodeError, ValueError) as exc:
                raise RateLimitUnavailable() from exc
        elif isinstance(result, str):
            try:
                count = int(result)
            except ValueError as exc:
                raise RateLimitUnavailable() from exc
        else:
            raise RateLimitUnavailable()

        if count > limit:
            raise RateLimitExceeded()
