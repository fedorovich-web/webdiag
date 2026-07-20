import asyncio
from collections.abc import Callable

import httpx
import pytest

from webdiag_api.audit import service as audit_service_module
from webdiag_api.audit.api import get_audit_service
from webdiag_api.audit.fetcher import SafeHttpFetcher
from webdiag_api.audit.models import AuditJob, AuditJobStatus
from webdiag_api.audit.service import AuditExecutionService, InMemoryAuditStore
from webdiag_api.main import app

SAFE_IP = "93.184.216.34"
Resolver = Callable[[str, int], list[str]]


def streaming_response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
    content: bytes = b"",
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(content),
        request=request,
    )


def build_service(
    handler: Callable[[httpx.Request], httpx.Response],
    *,
    resolver: Resolver | None = None,
    store: InMemoryAuditStore | None = None,
) -> AuditExecutionService:
    transport = httpx.MockTransport(handler)
    effective_resolver = resolver or (lambda _hostname, _port: [SAFE_IP])

    def fetcher_factory() -> SafeHttpFetcher:
        return SafeHttpFetcher(
            resolver=effective_resolver,
            peer_address_provider=lambda _response: [SAFE_IP],
            transport=transport,
        )

    return AuditExecutionService(
        store=store or InMemoryAuditStore(),
        fetcher_factory=fetcher_factory,
    )


async def request(
    method: str,
    path: str,
    *,
    json: dict[str, object] | None = None,
) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.request(method, path, json=json)


def with_service(service: AuditExecutionService) -> None:
    app.dependency_overrides[get_audit_service] = lambda: service


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def healthy_html() -> bytes:
    return b"""
    <!doctype html>
    <html>
      <head>
        <title>Technical SEO audit page</title>
        <meta name="description" content="A clean test page for WebDiag audit API checks.">
        <link rel="canonical" href="https://example.com/">
      </head>
      <body><h1>Technical SEO audit page</h1></body>
    </html>
    """


def healthy_sitemap() -> bytes:
    return b"""
    <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
      <url><loc>https://example.com/</loc></url>
    </urlset>
    """


def healthy_headers() -> dict[str, str]:
    return {
        "content-type": "text/html; charset=utf-8",
        "strict-transport-security": "max-age=31536000",
        "content-security-policy": "default-src 'self'",
        "x-content-type-options": "nosniff",
        "referrer-policy": "strict-origin-when-cross-origin",
        "permissions-policy": "geolocation=()",
        "x-frame-options": "DENY",
    }


def healthy_resource_response(request: httpx.Request) -> httpx.Response:
    if request.url.path == "/robots.txt":
        return streaming_response(
            200,
            headers={"content-type": "text/plain"},
            content=b"User-agent: *\nAllow: /\nSitemap: https://example.com/sitemap.xml",
            request=request,
        )
    if request.url.path == "/sitemap.xml":
        return streaming_response(
            200,
            headers={"content-type": "application/xml"},
            content=healthy_sitemap(),
            request=request,
        )
    return streaming_response(
        200,
        headers=healthy_headers(),
        content=healthy_html(),
        request=request,
    )


def test_start_audit_runs_single_url_check_and_returns_snapshot() -> None:
    with_service(build_service(healthy_resource_response))
    try:
        response = asyncio.run(
            request("POST", "/v1/audits", json={"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 201
    payload = response.json()
    assert payload["contract_version"] == "webdiag.audit.snapshot.v1"
    assert payload["summary"]["status"] == "succeeded"
    assert payload["summary"]["run"]["score"] == 100
    assert payload["summary"]["run"]["issue_count"] == 0
    assert payload["summary"]["run"]["checks_by_status"] == {
        "passed": len(payload["run"]["checks"])
    }
    assert payload["job"]["status"] == "succeeded"
    assert payload["run"]["status"] == "succeeded"
    assert payload["run"]["score"] == 100
    assert payload["run"]["issues"] == []
    assert payload["run"]["target"]["hostname"] == "example.com"
    assert len(payload["run"]["checks"]) >= 10
    assert {check["check_id"] for check in payload["run"]["checks"]} >= {
        "crawlability.robots_txt",
        "crawlability.sitemap_xml",
    }


def test_get_audit_returns_stored_snapshot() -> None:
    service = build_service(healthy_resource_response)
    with_service(service)
    try:
        created = asyncio.run(
            request("POST", "/v1/audits", json={"url": "https://example.com/"})
        )
        job_id = created.json()["job"]["job_id"]
        fetched = asyncio.run(request("GET", f"/v1/audits/{job_id}"))
    finally:
        clear_overrides()

    assert fetched.status_code == 200
    payload = fetched.json()
    assert payload["job"]["job_id"] == job_id
    assert payload["run"]["job_id"] == job_id
    assert payload["summary"]["job_id"] == job_id
    assert payload["summary"]["run"]["status"] == "succeeded"


def test_start_audit_rejects_disallowed_url_before_fetch() -> None:
    service = build_service(
        lambda request: streaming_response(200, request=request),
    )
    with_service(service)
    try:
        response = asyncio.run(
            request("POST", "/v1/audits", json={"url": "http://127.0.0.1/"})
        )
    finally:
        clear_overrides()

    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "audit_url_rejected"


def test_fetch_failure_returns_error_with_stored_failed_job() -> None:
    def handler(request: httpx.Request) -> httpx.Response:
        raise httpx.TimeoutException("timeout", request=request)

    service = build_service(handler)
    with_service(service)
    try:
        response = asyncio.run(
            request("POST", "/v1/audits", json={"url": "https://example.com/"})
        )
        detail = response.json()["detail"]
        fetched = asyncio.run(request("GET", f"/v1/audits/{detail['job_id']}"))
    finally:
        clear_overrides()

    assert response.status_code == 502
    assert detail["code"] == "audit_fetch_failed"
    assert detail["run_id"] is not None
    assert fetched.status_code == 200
    assert fetched.json()["job"]["status"] == "failed"
    assert fetched.json()["run"]["status"] == "failed"


def test_resolved_url_policy_failure_returns_stored_failed_job() -> None:
    requested_urls: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        requested_urls.append(str(request.url))
        return streaming_response(200, content=healthy_html(), request=request)

    service = build_service(
        handler,
        resolver=lambda _hostname, _port: ["127.0.0.1"],
    )
    with_service(service)
    try:
        response = asyncio.run(
            request("POST", "/v1/audits", json={"url": "https://example.com/"})
        )
        detail = response.json()["detail"]
        fetched = asyncio.run(request("GET", f"/v1/audits/{detail['job_id']}"))
    finally:
        clear_overrides()

    assert requested_urls == []
    assert response.status_code == 502
    assert detail["code"] == "audit_fetch_failed"
    assert detail["run_id"] is not None
    assert fetched.json()["job"]["status"] == "failed"
    assert fetched.json()["run"]["status"] == "failed"


def test_site_resource_policy_failure_fails_audit_instead_of_reporting_missing() -> None:
    seen_paths: list[str] = []

    def handler(request: httpx.Request) -> httpx.Response:
        seen_paths.append(request.url.path)
        if request.url.path == "/robots.txt":
            return streaming_response(
                302,
                headers={"location": "http://127.0.0.1/robots.txt"},
                request=request,
            )
        return streaming_response(
            200,
            headers=healthy_headers(),
            content=healthy_html(),
            request=request,
        )

    service = build_service(handler)
    with_service(service)
    try:
        response = asyncio.run(
            request("POST", "/v1/audits", json={"url": "https://example.com/"})
        )
        detail = response.json()["detail"]
        fetched = asyncio.run(request("GET", f"/v1/audits/{detail['job_id']}"))
    finally:
        clear_overrides()

    assert seen_paths == ["/", "/robots.txt"]
    assert response.status_code == 502
    assert fetched.json()["job"]["status"] == "failed"
    assert fetched.json()["run"]["status"] == "failed"


def test_unexpected_execution_failure_still_persists_failed_state(monkeypatch) -> None:
    class RecordingStore(InMemoryAuditStore):
        def __init__(self) -> None:
            super().__init__()
            self.saved_jobs: list[AuditJob] = []

        def save_job(self, job: AuditJob) -> AuditJob:
            self.saved_jobs.append(job)
            return super().save_job(job)

    store = RecordingStore()
    service = build_service(healthy_resource_response, store=store)

    def fail_report(**_kwargs):
        raise RuntimeError("report assembly failed")

    monkeypatch.setattr(audit_service_module, "assemble_single_page_report", fail_report)

    with pytest.raises(RuntimeError, match="report assembly failed"):
        service.start_single_url_audit("https://example.com/")

    assert [job.status for job in store.saved_jobs] == [
        AuditJobStatus.RUNNING,
        AuditJobStatus.FAILED,
    ]
    snapshot = store.get_snapshot(store.saved_jobs[-1].job_id)
    assert snapshot is not None
    assert snapshot.job.status is AuditJobStatus.FAILED
    assert snapshot.run is not None
    assert snapshot.run.status is AuditJobStatus.FAILED


def test_get_unknown_audit_returns_404() -> None:
    with_service(AuditExecutionService())
    try:
        response = asyncio.run(
            request("GET", "/v1/audits/00000000-0000-4000-8000-000000000000")
        )
    finally:
        clear_overrides()

    assert response.status_code == 404
    assert response.json()["detail"]["code"] == "audit_not_found"
