import asyncio

import httpx

from webdiag_api.main import app


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
    assert payload["count"] == 100
    assert len(payload["items"]) == 100
