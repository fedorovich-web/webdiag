from __future__ import annotations

from collections.abc import Callable
from dataclasses import dataclass
from datetime import UTC, datetime
from threading import Lock
from uuid import UUID

from webdiag_api.audit.fetcher import SafeFetchError, SafeHttpFetcher
from webdiag_api.audit.intake import build_audit_target
from webdiag_api.audit.models import AuditJob, AuditJobStatus, AuditRun, AuditTarget
from webdiag_api.audit.report import assemble_single_page_report
from webdiag_api.audit.site_resources import collect_site_resources
from webdiag_api.security.url_policy import UrlPolicyError


class AuditRequestError(ValueError):
    """Raised when an audit request cannot be accepted safely."""


class AuditExecutionError(RuntimeError):
    """Raised when an accepted audit cannot be executed successfully."""

    def __init__(self, message: str, *, job_id: UUID, run_id: UUID | None = None) -> None:
        super().__init__(message)
        self.job_id = job_id
        self.run_id = run_id


@dataclass(frozen=True, slots=True)
class AuditSnapshot:
    job: AuditJob
    run: AuditRun | None


class InMemoryAuditStore:
    """Small development store for audit jobs and runs.

    This is intentionally process-local. It gives the API deterministic behavior before a
    database and queue are introduced, without pretending to be production persistence.
    """

    def __init__(self) -> None:
        self._lock = Lock()
        self._jobs: dict[UUID, AuditJob] = {}
        self._runs_by_job: dict[UUID, AuditRun] = {}

    def save_job(self, job: AuditJob) -> AuditJob:
        with self._lock:
            self._jobs[job.job_id] = job
        return job

    def save_run(self, run: AuditRun) -> AuditRun:
        with self._lock:
            self._runs_by_job[run.job_id] = run
        return run

    def get_snapshot(self, job_id: UUID) -> AuditSnapshot | None:
        with self._lock:
            job = self._jobs.get(job_id)
            if job is None:
                return None
            return AuditSnapshot(job=job, run=self._runs_by_job.get(job_id))


FetcherFactory = Callable[[], SafeHttpFetcher]


def _utc_now() -> datetime:
    return datetime.now(UTC)


class AuditExecutionService:
    """Runs the synchronous single-URL audit flow used by the development API."""

    def __init__(
        self,
        *,
        store: InMemoryAuditStore | None = None,
        fetcher_factory: FetcherFactory | None = None,
    ) -> None:
        self.store = store or InMemoryAuditStore()
        self._fetcher_factory = fetcher_factory or SafeHttpFetcher

    def start_single_url_audit(self, raw_url: str) -> AuditSnapshot:
        target = self._build_target(raw_url)
        job = self.store.save_job(AuditJob(target=target, status=AuditJobStatus.RUNNING))

        try:
            fetcher = self._fetcher_factory()
            fetched = fetcher.fetch(str(target.normalized_url))
            site_resources = collect_site_resources(
                fetcher=fetcher,
                target_url=str(target.normalized_url),
                final_url=fetched.final_url,
            )
            run = assemble_single_page_report(
                job_id=job.job_id,
                target=target,
                fetched=fetched,
                site_resources=site_resources,
            )
            run = run.model_copy(update={"completed_at": _utc_now()})
        except (SafeFetchError, UrlPolicyError) as exc:
            failed, failed_run = self._record_failed_execution(job=job, target=target)
            raise AuditExecutionError(
                str(exc),
                job_id=failed.job_id,
                run_id=failed_run.run_id,
            ) from exc
        except Exception:
            self._record_failed_execution(job=job, target=target)
            raise

        job = self.store.save_job(
            job.model_copy(update={"status": AuditJobStatus.SUCCEEDED, "updated_at": _utc_now()})
        )
        self.store.save_run(run)
        return AuditSnapshot(job=job, run=run)

    def get_snapshot(self, job_id: UUID) -> AuditSnapshot | None:
        return self.store.get_snapshot(job_id)

    def _build_target(self, raw_url: str) -> AuditTarget:
        try:
            return build_audit_target(raw_url)
        except UrlPolicyError as exc:
            raise AuditRequestError(str(exc)) from exc

    def _record_failed_execution(
        self,
        *,
        job: AuditJob,
        target: AuditTarget,
    ) -> tuple[AuditJob, AuditRun]:
        failed = self._mark_job_failed(job)
        failed_run = self._create_failed_run(job=failed, target=target)
        return failed, failed_run

    def _mark_job_failed(self, job: AuditJob) -> AuditJob:
        failed = job.model_copy(
            update={"status": AuditJobStatus.FAILED, "updated_at": _utc_now()}
        )
        return self.store.save_job(failed)

    def _create_failed_run(self, *, job: AuditJob, target: AuditTarget) -> AuditRun:
        failed_run = AuditRun(
            job_id=job.job_id,
            target=target,
            status=AuditJobStatus.FAILED,
            completed_at=_utc_now(),
        )
        return self.store.save_run(failed_run)
