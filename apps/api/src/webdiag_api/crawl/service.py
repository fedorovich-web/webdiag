from __future__ import annotations

from collections.abc import Callable

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.crawl.executor import CrawlConfig, CrawlExecutionError, crawl_origin
from webdiag_api.crawl.storage import (
    CrawlResultTooLargeError,
    SqliteCrawlStore,
)
from webdiag_api.security.url_policy import UrlPolicyError


class CrawlService:
    def __init__(
        self,
        store: SqliteCrawlStore,
        *,
        fetcher_factory: Callable[[], SafeHttpFetcher],
        config: CrawlConfig | None = None,
    ) -> None:
        self._store = store
        self._fetcher_factory = fetcher_factory
        self._config = config or CrawlConfig()

    def run_one(self) -> bool:
        claim = self._store.claim_pending()
        if claim is None:
            return False
        try:
            result = crawl_origin(
                claim.job.origin,
                fetcher=self._fetcher_factory(),
                config=self._config,
            )
            self._store.complete_job(
                job_id=claim.job.id,
                lease_token=claim.lease_token,
                result=result,
            )
        except (CrawlExecutionError, UrlPolicyError) as error:
            self._store.fail_job(
                job_id=claim.job.id,
                lease_token=claim.lease_token,
                error_code=_public_error_code(str(error)),
            )
        except CrawlResultTooLargeError:
            self._store.fail_job(
                job_id=claim.job.id,
                lease_token=claim.lease_token,
                error_code="crawl_result_too_large",
            )
        return True


def default_crawl_fetcher(*, body_max_bytes: int) -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(
            timeout_seconds=4,
            max_redirects=5,
            max_body_bytes=body_max_bytes,
        )
    )


def _public_error_code(value: str) -> str:
    allowed = {
        "crawl_origin_changed",
        "crawl_origin_invalid",
        "crawl_root_disallowed",
        "crawl_root_fetch_failed",
        "crawl_root_not_html",
    }
    return value if value in allowed else "crawl_execution_failed"
