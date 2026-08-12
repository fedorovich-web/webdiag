import asyncio

import httpx

from webdiag_api.main import app

try:
    from webdiag_api.security.request_limits import RequestBodyLimitMiddleware
except ModuleNotFoundError:
    RequestBodyLimitMiddleware = None


async def get(path: str) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.get(path)


def test_health() -> None:
    response = asyncio.run(get("/health"))
    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "service": "webdiag-api",
        "version": "0.5.11",
    }


def test_public_tools_are_limited_to_ready_entries() -> None:
    response = asyncio.run(get("/v1/tools"))
    assert response.status_code == 200
    payload = response.json()
    assert payload["count"] == 103
    assert len(payload["items"]) == 103


async def call_asgi(
    app: object,
    scope: dict[str, object],
    incoming: list[dict[str, object]],
) -> list[dict[str, object]]:
    message_index = 0
    sent: list[dict[str, object]] = []

    async def receive() -> dict[str, object]:
        nonlocal message_index
        if message_index == len(incoming):
            return {"type": "http.disconnect"}
        message = incoming[message_index]
        message_index += 1
        return message

    async def send(message: dict[str, object]) -> None:
        sent.append(message)

    await app(scope, receive, send)  # type: ignore[operator]
    return sent


def test_request_limit_rejects_declared_global_body_before_downstream() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        raise AssertionError("downstream must not run for an oversized declared body")

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {
                "type": "http",
                "path": "/v1/tools",
                "headers": [(b"content-length", b"5")],
            },
            [],
        )
    )

    assert sent == [
        {
            "type": "http.response.start",
            "status": 413,
            "headers": [
                (b"content-type", b"application/json"),
                (b"content-length", b"78"),
                (b"cache-control", b"no-store"),
            ],
        },
        {
            "type": "http.response.body",
            "body": (
                b'{"detail":{"code":"request_too_large",'
                b'"message":"Request body is too large."}}'
            ),
        },
    ]


def test_request_limit_rejects_streamed_account_body_with_account_envelope() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        while True:
            message = await receive()  # type: ignore[operator]
            if message["type"] != "http.request" or not message.get("more_body", False):
                return

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=10,
        account_request_body_max_bytes=4,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {"type": "http", "path": "/v1/account/login", "headers": []},
            [
                {"type": "http.request", "body": b"123", "more_body": True},
                {"type": "http.request", "body": b"45", "more_body": False},
            ],
        )
    )

    assert sent[0]["status"] == 413
    assert sent[0]["headers"][-1] == (b"cache-control", b"no-store")
    assert sent[1]["body"] == (
        b'{"detail":{"code":"account_request_too_large",'
        b'"message":"Request body is too large."}}'
    )


def test_request_limit_rejects_oversized_stream_before_downstream_that_never_reads() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"
    downstream_started = False

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        nonlocal downstream_started
        downstream_started = True

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {"type": "http", "path": "/v1/tools", "headers": []},
            [{"type": "http.request", "body": b"12345", "more_body": False}],
        )
    )

    assert downstream_started is False
    assert sent[0]["status"] == 413


def test_request_limit_rejects_oversized_stream_before_downstream_response_start() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"
    downstream_started = False

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        nonlocal downstream_started
        downstream_started = True
        await send(  # type: ignore[operator]
            {"type": "http.response.start", "status": 200, "headers": []}
        )

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {"type": "http", "path": "/v1/tools", "headers": []},
            [{"type": "http.request", "body": b"12345", "more_body": False}],
        )
    )

    assert downstream_started is False
    assert sent[0]["status"] == 413


def test_request_limit_compares_arbitrarily_long_decimal_content_length() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        raise AssertionError("downstream must not run for an oversized declared body")

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {
                "type": "http",
                "path": "/v1/tools",
                "headers": [(b"content-length", b"0" * 5_000 + b"5")],
            },
            [],
        )
    )

    assert sent[0]["status"] == 413


def test_request_limit_coalesces_empty_and_fragmented_request_chunks() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"
    replayed: list[dict[str, object]] = []

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        replayed.append(await receive())  # type: ignore[operator]

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=8,
        account_request_body_max_bytes=2,
    )
    empty_chunks = [
        {"type": "http.request", "body": b"", "more_body": True} for _ in range(64)
    ]

    sent = asyncio.run(
        call_asgi(
            middleware,
            {"type": "http", "path": "/v1/tools", "headers": []},
            [
                *empty_chunks,
                {"type": "http.request", "body": b"ab", "more_body": True},
                {"type": "http.request", "body": b"cd", "more_body": False},
            ],
        )
    )

    assert sent == []
    assert replayed == [
        {"type": "http.request", "body": b"abcd", "more_body": False}
    ]


def test_request_limit_replays_partial_body_before_disconnect() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"
    replayed: list[dict[str, object]] = []

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        replayed.append(await receive())  # type: ignore[operator]
        replayed.append(await receive())  # type: ignore[operator]

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=8,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {"type": "http", "path": "/v1/tools", "headers": []},
            [
                {"type": "http.request", "body": b"abcd", "more_body": True},
                {"type": "http.disconnect"},
            ],
        )
    )

    assert sent == []
    assert replayed == [
        {"type": "http.request", "body": b"abcd", "more_body": True},
        {"type": "http.disconnect"},
    ]


def test_request_limit_counts_invalid_content_length_stream_chunks() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        while True:
            message = await receive()  # type: ignore[operator]
            if message["type"] != "http.request" or not message.get("more_body", False):
                return

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {
                "type": "http",
                "path": "/v1/tools",
                "headers": [(b"content-length", b"-1"), (b"content-length", b"bad")],
            },
            [{"type": "http.request", "body": b"12345", "more_body": False}],
        )
    )

    assert sent[0]["status"] == 413
    assert sent[1]["body"] == (
        b'{"detail":{"code":"request_too_large",'
        b'"message":"Request body is too large."}}'
    )


def test_request_limit_preserves_at_limit_body_and_non_http_scopes() -> None:
    assert RequestBodyLimitMiddleware is not None, "request body limit middleware is missing"

    seen: list[object] = []

    async def downstream(
        scope: dict[str, object],
        receive: object,
        send: object,
    ) -> None:
        seen.append(scope["type"])
        if scope["type"] == "http":
            message = await receive()  # type: ignore[operator]
            assert message["body"] == b"1234"

    middleware = RequestBodyLimitMiddleware(
        downstream,
        http_request_body_max_bytes=4,
        account_request_body_max_bytes=2,
    )

    sent = asyncio.run(
        call_asgi(
            middleware,
            {
                "type": "http",
                "path": "/v1/tools",
                "headers": [(b"content-length", b"4")],
            },
            [{"type": "http.request", "body": b"1234", "more_body": False}],
        )
    )
    asyncio.run(call_asgi(middleware, {"type": "lifespan"}, []))

    assert sent == []
    assert seen == ["http", "lifespan"]
