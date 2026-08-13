import hashlib
import sqlite3
import threading
from pathlib import Path

import pytest

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.accounts.workspace_storage import SqliteWorkspaceStore
from webdiag_api.crawl.models import CrawlResult
from webdiag_api.crawl.storage import CrawlIntegrityError, CrawlLeaseLostError, SqliteCrawlStore


def seed_project(database_path: Path) -> tuple[str, str]:
    user = SqliteAccountStore(str(database_path)).create_user(
        email="crawler@example.com",
        display_name="Crawler Owner",
        password_hash="test-only-password-hash",
    )
    project = SqliteWorkspaceStore(str(database_path)).create_project(
        user_id=user.id,
        name="Crawler",
        origin="https://example.com",
    )
    return user.id, project.id


def test_only_one_concurrent_crawl_claim_wins_and_plaintext_lease_is_not_stored(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id, project_id = seed_project(database_path)
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    job = store.create_job(user_id=user_id, project_id=project_id)
    barrier = threading.Barrier(2)
    claims = []

    def claim() -> None:
        barrier.wait(timeout=5)
        claims.append(store.claim_pending(now=100))

    threads = [threading.Thread(target=claim) for _ in range(2)]
    for thread in threads:
        thread.start()
    for thread in threads:
        thread.join(timeout=10)

    winners = [claim for claim in claims if claim is not None]
    assert len(winners) == 1
    assert winners[0].job.id == job.id
    with sqlite3.connect(database_path) as connection:
        stored_hash = connection.execute(
            "SELECT lease_token_hash FROM crawl_job_attempts WHERE job_id = ?",
            (job.id,),
        ).fetchone()[0]
    assert stored_hash == hashlib.sha256(winners[0].lease_token.encode()).hexdigest()
    assert winners[0].lease_token not in stored_hash


def test_expired_crawl_lease_is_reclaimed_and_stale_completion_is_rejected(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id, project_id = seed_project(database_path)
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    job = store.create_job(user_id=user_id, project_id=project_id)
    first = store.claim_pending(now=100)
    second = store.claim_pending(now=160)
    assert first is not None and second is not None
    assert second.attempt_number == 2
    with pytest.raises(CrawlLeaseLostError):
        store.complete_job(
            job_id=job.id,
            lease_token=first.lease_token,
            result=CrawlResult(origin="https://example.com", pages=()),
            now=161,
        )


def test_crawl_jobs_are_owner_scoped_and_tampered_result_is_rejected(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id, project_id = seed_project(database_path)
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    job = store.create_job(user_id=user_id, project_id=project_id)
    claim = store.claim_pending(now=100)
    assert claim is not None
    store.complete_job(
        job_id=job.id,
        lease_token=claim.lease_token,
        result=CrawlResult(origin="https://example.com", pages=()),
        now=101,
    )
    assert store.get_job(user_id="other", project_id=project_id, job_id=job.id) is None
    with sqlite3.connect(database_path) as connection:
        connection.execute(
            "UPDATE crawl_jobs SET result_json = ? WHERE id = ?",
            ('{"contract_version":"tampered"}', job.id),
        )
    with pytest.raises(CrawlIntegrityError):
        store.get_job(user_id=user_id, project_id=project_id, job_id=job.id)


def test_crawl_job_origin_is_loaded_from_owned_active_project_and_history_is_bounded(
    tmp_path: Path,
) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id, project_id = seed_project(database_path)
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)

    first = store.create_job(user_id=user_id, project_id=project_id)
    assert first.origin == "https://example.com"
    with pytest.raises(ValueError, match="crawl_job_active_exists"):
        store.create_job(user_id=user_id, project_id=project_id)

    claim = store.claim_pending(now=100)
    assert claim is not None
    store.fail_job(
        job_id=claim.job.id,
        lease_token=claim.lease_token,
        error_code="crawl_root_fetch_failed",
        now=101,
    )
    second = store.create_job(user_id=user_id, project_id=project_id)

    assert [job.id for job in store.list_jobs(user_id=user_id, project_id=project_id)] == [
        second.id,
        first.id,
    ]
    with pytest.raises(ValueError, match="account_project_not_found"):
        store.list_jobs(user_id="other", project_id=project_id)
    with pytest.raises(ValueError, match="account_project_not_found"):
        store.create_job(user_id="other", project_id=project_id)


def test_archiving_project_fails_active_crawl_and_invalidates_lease(tmp_path: Path) -> None:
    database_path = tmp_path / "accounts.sqlite3"
    user_id, project_id = seed_project(database_path)
    store = SqliteCrawlStore(str(database_path), lease_seconds=60)
    job = store.create_job(user_id=user_id, project_id=project_id)
    claim = store.claim_pending(now=100)
    assert claim is not None

    SqliteWorkspaceStore(str(database_path)).archive_project(
        user_id=user_id,
        project_id=project_id,
    )

    archived = store.get_job(user_id=user_id, project_id=project_id, job_id=job.id)
    assert archived is not None
    assert archived.state == "failed"
    assert archived.public_error_code == "crawl_project_archived"
    with pytest.raises(CrawlLeaseLostError):
        store.complete_job(
            job_id=job.id,
            lease_token=claim.lease_token,
            result=CrawlResult(origin="https://example.com", pages=()),
            now=101,
        )
