from __future__ import annotations

import asyncio
import sqlite3
from pathlib import Path

import httpx
import pytest

import webdiag_api.main as main_module
from webdiag_api.main import app
from webdiag_api.readiness import persistent_storage_ready, sqlite_database_ready


def test_missing_sqlite_database_is_ready_when_parent_is_writable(
    tmp_path: Path,
) -> None:
    assert sqlite_database_ready(str(tmp_path / "new.sqlite3")) is True


def test_existing_sqlite_database_must_open_read_write(tmp_path: Path) -> None:
    database = tmp_path / "ready.sqlite3"
    with sqlite3.connect(database) as connection:
        connection.execute("CREATE TABLE readiness_probe(id INTEGER PRIMARY KEY)")

    assert sqlite_database_ready(str(database)) is True


def test_corrupt_or_invalid_sqlite_target_is_not_ready(tmp_path: Path) -> None:
    corrupt = tmp_path / "corrupt.sqlite3"
    corrupt.write_bytes(b"not a sqlite database")
    directory = tmp_path / "directory.sqlite3"
    directory.mkdir()

    assert sqlite_database_ready(str(corrupt)) is False
    assert sqlite_database_ready(str(directory)) is False
    assert sqlite_database_ready(str(tmp_path / "missing" / "db.sqlite3")) is False


def test_persistent_storage_requires_every_database_path(tmp_path: Path) -> None:
    account = tmp_path / "accounts.sqlite3"
    audit = tmp_path / "audits.sqlite3"
    with sqlite3.connect(account), sqlite3.connect(audit):
        pass

    assert persistent_storage_ready((str(account), str(audit))) is True
    (audit).write_bytes(b"broken")
    assert persistent_storage_ready((str(account), str(audit))) is False


async def _get_ready() -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.get("/ready")


def test_ready_endpoint_is_fail_closed_without_exposing_paths(
    monkeypatch: pytest.MonkeyPatch,
) -> None:
    monkeypatch.setattr(main_module, "persistent_storage_ready", lambda _paths: False)
    unavailable = asyncio.run(_get_ready())

    assert unavailable.status_code == 503
    assert unavailable.headers["cache-control"] == "no-store"
    assert unavailable.json() == {
        "status": "unavailable",
        "service": "webdiag-api",
        "version": "0.5.11",
    }
    assert "sqlite" not in unavailable.text.lower()
    assert "/data" not in unavailable.text

    monkeypatch.setattr(main_module, "persistent_storage_ready", lambda _paths: True)
    ready = asyncio.run(_get_ready())

    assert ready.status_code == 200
    assert ready.headers["cache-control"] == "no-store"
    assert ready.json() == {
        "status": "ok",
        "service": "webdiag-api",
        "version": "0.5.11",
    }
