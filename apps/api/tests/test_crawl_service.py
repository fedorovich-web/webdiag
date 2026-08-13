from __future__ import annotations

from dataclasses import dataclass

from webdiag_api.crawl.executor import CrawlExecutionError
from webdiag_api.crawl.service import CrawlService
from webdiag_api.crawl.storage import StoredCrawlClaim, StoredCrawlJob
from webdiag_api.security.url_policy import UrlPolicyError


def job() -> StoredCrawlJob:
    return StoredCrawlJob(
        id="11111111-1111-4111-8111-111111111111",
        user_id="user",
        project_id="project",
        origin="https://example.com",
        state="running",
        result_json=None,
        result_sha256=None,
        public_error_code=None,
        created_at=1,
        updated_at=1,
    )


@dataclass
class StubStore:
    claim: StoredCrawlClaim | None

    def __post_init__(self) -> None:
        self.completed = []
        self.failed = []

    def claim_pending(self):
        return self.claim

    def complete_job(self, **kwargs):
        self.completed.append(kwargs)

    def fail_job(self, **kwargs):
        self.failed.append(kwargs)


def test_crawl_service_returns_false_without_pending_job() -> None:
    store = StubStore(None)
    service = CrawlService(store, fetcher_factory=lambda: object())

    assert service.run_one() is False
    assert store.completed == []
    assert store.failed == []


def test_crawl_service_persists_only_stable_public_error_code(monkeypatch) -> None:
    claim = StoredCrawlClaim(job(), 1, "lease-token", 999)
    store = StubStore(claim)
    service = CrawlService(store, fetcher_factory=lambda: object())

    def fail(*args, **kwargs):
        raise CrawlExecutionError("crawl_root_fetch_failed")

    monkeypatch.setattr("webdiag_api.crawl.service.crawl_origin", fail)

    assert service.run_one() is True
    assert store.completed == []
    assert store.failed == [
        {
            "job_id": claim.job.id,
            "lease_token": claim.lease_token,
            "error_code": "crawl_root_fetch_failed",
        }
    ]


def test_crawl_service_normalizes_fetch_policy_errors_without_releasing_lease(
    monkeypatch,
) -> None:
    claim = StoredCrawlClaim(job(), 1, "lease-token", 999)
    store = StubStore(claim)
    service = CrawlService(store, fetcher_factory=lambda: object())

    def fail(*args, **kwargs):
        raise UrlPolicyError("internal DNS detail must not be persisted")

    monkeypatch.setattr("webdiag_api.crawl.service.crawl_origin", fail)

    assert service.run_one() is True
    assert store.failed[0]["error_code"] == "crawl_execution_failed"
    assert "DNS" not in store.failed[0]["error_code"]
