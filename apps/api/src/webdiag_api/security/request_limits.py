from collections.abc import Awaitable, Callable, Iterable
from typing import Any

Receive = Callable[[], Awaitable[dict[str, Any]]]
Send = Callable[[dict[str, Any]], Awaitable[None]]
ASGIApp = Callable[[dict[str, Any], Receive, Send], Awaitable[None]]


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
        if _declared_content_length_exceeds_limit(scope.get("headers", ()), limit):
            await _send_request_too_large(send, code)
            return

        request_messages = await _read_request_messages(receive, limit)
        if request_messages is None:
            await _send_request_too_large(send, code)
            return

        message_index = 0

        async def receive_replay() -> dict[str, Any]:
            nonlocal message_index
            if message_index < len(request_messages):
                message = request_messages[message_index]
                message_index += 1
                return message
            return await receive()

        await self.app(scope, receive_replay, send)

    def _limit_for_path(self, path: str) -> tuple[int, str]:
        if path == "/v1/account" or path.startswith("/v1/account/"):
            return self.account_request_body_max_bytes, "account_request_too_large"
        return self.http_request_body_max_bytes, "request_too_large"


async def _read_request_messages(receive: Receive, limit: int) -> list[dict[str, Any]] | None:
    messages: list[dict[str, Any]] = []
    body_size = 0

    while True:
        message = await receive()
        messages.append(message)
        if message["type"] != "http.request":
            return messages

        body_size += len(message.get("body", b""))
        if body_size > limit:
            return None
        if not message.get("more_body", False):
            return messages


def _declared_content_length_exceeds_limit(
    headers: Iterable[tuple[bytes, bytes]], limit: int
) -> bool:
    values = [value for name, value in headers if name.lower() == b"content-length"]
    if len(values) != 1:
        return False

    try:
        value = values[0].decode("ascii")
    except UnicodeDecodeError:
        return False
    if not value or any(character < "0" or character > "9" for character in value):
        return False

    normalized_value = value.lstrip("0") or "0"
    normalized_limit = str(limit)
    return len(normalized_value) > len(normalized_limit) or (
        len(normalized_value) == len(normalized_limit)
        and normalized_value > normalized_limit
    )


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
