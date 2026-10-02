from __future__ import annotations

import os
import sqlite3
from collections.abc import Iterable
from contextlib import closing
from pathlib import Path


def sqlite_database_ready(database_path: str) -> bool:
    path = Path(database_path)
    try:
        if path.exists():
            if path.is_symlink() or not path.is_file():
                return False
            uri = f"{path.resolve(strict=True).as_uri()}?mode=rw"
            with closing(
                sqlite3.connect(uri, uri=True, timeout=2)
            ) as connection:
                return connection.execute("PRAGMA schema_version").fetchone() is not None

        parent = path.absolute().parent
        return (
            parent.is_dir()
            and os.access(parent, os.W_OK)
            and os.access(parent, os.X_OK)
        )
    except (OSError, RuntimeError, sqlite3.Error, ValueError):
        return False


def persistent_storage_ready(database_paths: Iterable[str]) -> bool:
    return all(sqlite_database_ready(path) for path in database_paths)
