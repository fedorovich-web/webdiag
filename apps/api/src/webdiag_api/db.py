from __future__ import annotations

from collections.abc import AsyncIterator

from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine

from webdiag_api.config import settings

engine = create_async_engine(
    settings.database_url.get_secret_value(),
    pool_pre_ping=True,
)
session_factory = async_sessionmaker(engine, expire_on_commit=False)


async def get_db_session() -> AsyncIterator[AsyncSession]:
    async with session_factory() as session:
        yield session
