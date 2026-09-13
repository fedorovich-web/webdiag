from __future__ import annotations

import hmac
from datetime import UTC, datetime
from functools import lru_cache
from typing import Annotated, Literal
from uuid import UUID

from fastapi import APIRouter, Depends, Header, HTTPException, Response
from pydantic import BaseModel, ConfigDict

from webdiag_api.accounts.api import AccountServiceDependency, SessionCookie
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.config import settings
from webdiag_api.crawl.executor import CrawlConfig
from webdiag_api.crawl.models import (
    AccountCrawlDetail,
    AccountCrawlJob,
    AccountCrawlList,
    AccountSiteAuditDetail,
    AccountSiteAuditList,
    CrawlPage,
    CrawlResult,
    SiteAuditResult,
)
from webdiag_api.crawl.service import CrawlService, default_crawl_fetcher
from webdiag_api.crawl.storage import (
    CrawlIntegrityError,
    CrawlQueueCapacityError,
    CrawlUserLimitError,
    SqliteCrawlStore,
    StoredCrawlJob,
)

router = APIRouter(
    prefix="/v1/internal/crawl",
    tags=["internal-crawl"],
    include_in_schema=False,
)
account_router = APIRouter(prefix="/v1/account", tags=["account-crawl"])


class CrawlRunOneResponse(BaseModel):
    model_config = ConfigDict(extra="forbid", strict=True)

    contract_version: Literal["webdiag.crawl.worker.v1"] = "webdiag.crawl.worker.v1"
    processed: bool


@lru_cache(maxsize=1)
def get_crawl_store() -> SqliteCrawlStore:
    return SqliteCrawlStore(
        settings.account_database_path,
        lease_seconds=settings.crawler_lease_seconds,
        active_job_limit_per_user=settings.crawler_active_job_limit_per_user,
        active_job_limit_global=settings.crawler_active_job_limit_global,
    )


CrawlStoreDependency = Annotated[SqliteCrawlStore, Depends(get_crawl_store)]


@lru_cache(maxsize=1)
def get_crawl_service() -> CrawlService:
    return CrawlService(
        get_crawl_store(),
        fetcher_factory=lambda: default_crawl_fetcher(
            body_max_bytes=settings.crawler_page_body_max_bytes
        ),
        config=CrawlConfig(
            page_limit=settings.crawler_page_limit,
            deadline_seconds=settings.crawler_deadline_seconds,
        ),
    )


CrawlServiceDependency = Annotated[CrawlService, Depends(get_crawl_service)]


def _authorize(authorization: str | None) -> None:
    expected = settings.crawler_internal_token
    supplied = authorization.removeprefix("Bearer ") if authorization else ""
    if not expected or not hmac.compare_digest(supplied, expected):
        raise HTTPException(
            status_code=401,
            detail={"code": "crawl_internal_unauthorized", "message": "Unauthorized."},
            headers={"Cache-Control": "no-store"},
        )


@router.post("/run-one", response_model=CrawlRunOneResponse)
def run_one(
    response: Response,
    crawl: CrawlServiceDependency,
    authorization: Annotated[str | None, Header()] = None,
) -> CrawlRunOneResponse:
    _authorize(authorization)
    response.headers["cache-control"] = "no-store"
    return CrawlRunOneResponse(processed=crawl.run_one())


def _user_id(account_service: AccountServiceDependency, token: SessionCookie) -> str:
    try:
        return account_service.get_session(token).user.id
    except AccountServiceError as error:
        raise HTTPException(
            status_code=error.status_code,
            detail={"code": error.code, "message": error.message},
            headers={"Cache-Control": "no-store"},
        ) from error


def _public_job(job: StoredCrawlJob) -> AccountCrawlJob:
    return AccountCrawlJob(
        id=job.id,
        project_id=job.project_id,
        origin=job.origin,
        state=job.state,
        error_code=job.public_error_code,
        created_at=datetime.fromtimestamp(job.created_at, UTC),
        updated_at=datetime.fromtimestamp(job.updated_at, UTC),
    )


def _not_found() -> HTTPException:
    return HTTPException(
        status_code=404,
        detail={"code": "account_project_not_found", "message": "Project was not found."},
        headers={"Cache-Control": "no-store"},
    )


def _create_job(*, user_id: str, project_id: UUID, store: SqliteCrawlStore) -> StoredCrawlJob:
    try:
        return store.create_job(user_id=user_id, project_id=str(project_id))
    except CrawlUserLimitError as error:
        raise HTTPException(
            status_code=429,
            detail={
                "code": "crawl_user_limit_reached",
                "message": "Too many site audits are already queued or running.",
            },
            headers={"Cache-Control": "no-store", "Retry-After": "60"},
        ) from error
    except CrawlQueueCapacityError as error:
        raise HTTPException(
            status_code=503,
            detail={
                "code": "crawl_queue_capacity_reached",
                "message": "Site audit capacity is temporarily unavailable.",
            },
            headers={"Cache-Control": "no-store", "Retry-After": "60"},
        ) from error
    except ValueError as error:
        code = str(error)
        if code == "account_project_not_found":
            raise _not_found() from error
        if code == "crawl_job_active_exists":
            raise HTTPException(
                status_code=409,
                detail={"code": code, "message": "A site audit is already in progress."},
                headers={"Cache-Control": "no-store"},
            ) from error
        raise


def _list_jobs(
    *, user_id: str, project_id: UUID, store: SqliteCrawlStore
) -> tuple[StoredCrawlJob, ...]:
    try:
        return store.list_jobs(user_id=user_id, project_id=str(project_id))
    except ValueError as error:
        if str(error) == "account_project_not_found":
            raise _not_found() from error
        raise


def _get_job(
    *, user_id: str, project_id: UUID, job_id: UUID, store: SqliteCrawlStore
) -> StoredCrawlJob:
    try:
        job = store.get_job(
            user_id=user_id,
            project_id=str(project_id),
            job_id=str(job_id),
        )
    except CrawlIntegrityError as error:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "crawl_result_unavailable",
                "message": "Site audit result is unavailable.",
            },
            headers={"Cache-Control": "no-store"},
        ) from error
    if job is None:
        raise _not_found()
    return job


def _legacy_result(result: SiteAuditResult | CrawlResult | None) -> CrawlResult | None:
    if result is None or isinstance(result, CrawlResult):
        return result
    return CrawlResult(
        origin=result.origin,
        pages=tuple(
            CrawlPage(
                url=page.url,
                status_code=page.status_code,
                title=page.title,
                meta_description=page.meta_description,
                internal_links=page.internal_links,
            )
            for page in result.pages
        ),
        page_failures=result.page_failures,
        page_limit=result.page_limit,
        page_budget_exhausted=result.page_budget_exhausted,
        sitemap_url=result.sitemap_url,
        sitemap_url_count=result.sitemap_url_count,
        duplicate_titles=result.duplicate_titles,
        duplicate_descriptions=result.duplicate_descriptions,
        orphan_urls=result.orphan_urls,
        completed_at=result.completed_at,
    )


@account_router.post(
    "/projects/{project_id}/crawls",
    response_model=AccountCrawlDetail,
    status_code=201,
)
def create_crawl(
    project_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountCrawlDetail:
    response.headers["cache-control"] = "no-store"
    job = _create_job(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        store=store,
    )
    return AccountCrawlDetail(job=_public_job(job))


@account_router.get("/projects/{project_id}/crawls", response_model=AccountCrawlList)
def list_crawls(
    project_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountCrawlList:
    response.headers["cache-control"] = "no-store"
    jobs = _list_jobs(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        store=store,
    )
    return AccountCrawlList(jobs=tuple(_public_job(job) for job in jobs))


@account_router.get(
    "/projects/{project_id}/crawls/{job_id}", response_model=AccountCrawlDetail
)
def get_crawl(
    project_id: UUID,
    job_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountCrawlDetail:
    response.headers["cache-control"] = "no-store"
    job = _get_job(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        job_id=job_id,
        store=store,
    )
    return AccountCrawlDetail(job=_public_job(job), result=_legacy_result(job.result()))


@account_router.post(
    "/projects/{project_id}/site-audits",
    response_model=AccountSiteAuditDetail,
    status_code=201,
)
def create_site_audit(
    project_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSiteAuditDetail:
    response.headers["cache-control"] = "no-store"
    job = _create_job(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        store=store,
    )
    return AccountSiteAuditDetail(job=_public_job(job))


@account_router.get(
    "/projects/{project_id}/site-audits",
    response_model=AccountSiteAuditList,
)
def list_site_audits(
    project_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSiteAuditList:
    response.headers["cache-control"] = "no-store"
    jobs = _list_jobs(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        store=store,
    )
    return AccountSiteAuditList(jobs=tuple(_public_job(job) for job in jobs))


@account_router.get(
    "/projects/{project_id}/site-audits/{job_id}",
    response_model=AccountSiteAuditDetail,
)
def get_site_audit(
    project_id: UUID,
    job_id: UUID,
    response: Response,
    store: CrawlStoreDependency,
    account_service: AccountServiceDependency,
    webdiag_session: SessionCookie = None,
) -> AccountSiteAuditDetail:
    response.headers["cache-control"] = "no-store"
    job = _get_job(
        user_id=_user_id(account_service, webdiag_session),
        project_id=project_id,
        job_id=job_id,
        store=store,
    )
    result = job.result()
    if isinstance(result, CrawlResult):
        raise HTTPException(
            status_code=409,
            detail={
                "code": "site_audit_result_version_unavailable",
                "message": "This historical result does not contain a full site audit.",
            },
            headers={"Cache-Control": "no-store"},
        )
    return AccountSiteAuditDetail(job=_public_job(job), result=result)
