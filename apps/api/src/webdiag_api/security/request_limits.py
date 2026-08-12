from collections.abc import Awaitable, Callable, Iterable
from typing import Any

Receive = Callable[[], Awaitable[dict[str, Any]]]
Send = Callable[[dict[str, Any]], Awaitable[None]]
ASGIApp = Callable[[dict[str, Any], Receive, Send], Awaitable[None]]


class _RequestBodyTooLarge(Exception):
    def __init__(self, code: str) -> None:
        self.code = code


class RequestBodyLimitMiddleware:
    def __init__(
        self,
        app: ASGIApp,
        *,
        http_request_body_max_bytes: int,
        account_request_body_max_bytes: int,
    ) -> None:
        self.app = app
        self.http_request_body_max_bytes = http_request_body_max_bytes
        self.account_request_body_max_bytes = account_request_body_max_bytes

    async def __call__(self, scope: dict[str, Any], receive: Receive, send: Send) -> None:
        if scope["type"] != "http":
            await self.app(scope, receive, send)
            return

        limit, code = self._limit_for_path(scope.get("path", ""))
        content_length = _declared_content_length(scope.get("headers", ()))
        if content_length is not None and content_length > limit:
            await _send_request_too_large(send, code)
            return

        body_size = 0

        async def receive_with_limit() -> dict[str, Any]:
            nonlocal body_size

            message = await receive()
            if message["type"] == "http.request":
                body_size += len(message.get("body", b""))
                if body_size > limit:
                    raise _RequestBodyTooLarge(code)
            return message

        try:
            await self.app(scope, receive_with_limit, send)
        except _RequestBodyTooLarge as error:
            await _send_request_too_large(send, error.code)

    def _limit_for_path(self, path: str) -> tuple[int, str]:
        if path == "/v1/account" or path.startswith("/v1/account/"):
            return self.account_request_body_max_bytes, "account_request_too_large"
        return self.http_request_body_max_bytes, "request_too_large"


def _declared_content_length(headers: Iterable[tuple[bytes, bytes]]) -> int | None:
    values = [value for name, value in headers if name.lower() == b"content-length"]
    if len(values) != 1:
        return None

    try:
        value = values[0].decode("ascii")
    except UnicodeDecodeError:
        return None
    if not value.isdecimal():
        return None
    return int(value)


async def _send_request_too_large(send: Send, code: str) -> None:
    body = (
        b'{"detail":{"code":"'
        + code.encode("ascii")
        + b'","message":"Request body is too large."}}'
    )
    await send(
        {
            "type": "http.response.start",
            "status": 413,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", str(len(body)).encode("ascii")),
                (b"cache-control", b"no-store"),
            ],
        }
    )
    await send({"type": "http.response.body", "body": body})
