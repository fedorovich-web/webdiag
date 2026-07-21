from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(prefix="/v1/tools/security-headers", tags=["tools"])


class SecurityHeadersRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class SecurityHeaderCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    header: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=160)
    value: str | None = Field(default=None, max_length=2_048)
    present: bool
    status: Literal["pass", "warning", "fail"]
    severity: Literal["info", "medium", "high"]
    recommendation: str = Field(min_length=1, max_length=500)


class SecurityHeadersResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.security_headers.v1"] = (
        "webdiag.tool.security_headers.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    is_https: bool
    redirect_count: int = Field(ge=0)
    score: int = Field(ge=0, le=100)
    risk_level: Literal["low", "medium", "high"]
    present_count: int = Field(ge=0)
    missing_count: int = Field(ge=0)
    checks: tuple[SecurityHeaderCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


def get_security_headers_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_024))


SecurityHeadersFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_security_headers_fetcher)]


@router.post("", response_model=SecurityHeadersResponse)
def inspect_security_headers(
    payload: SecurityHeadersRequest,
    fetcher: SecurityHeadersFetcherDependency,
) -> SecurityHeadersResponse:
    try:
        fetched = fetcher.fetch(payload.url, read_body=False)
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        raise HTTPException(
            status_code=status.HTTP_502_BAD_GATEWAY,
            detail={"code": "tool_fetch_failed", "message": str(exc)},
        ) from exc

    checks = _build_checks(fetched.headers, final_url=fetched.final_url)
    present_count = sum(1 for check in checks if check.present)
    missing_count = len(checks) - present_count
    pass_count = sum(1 for check in checks if check.status == "pass")
    score = round((pass_count / len(checks)) * 100) if checks else 0
    risk_level: Literal["low", "medium", "high"] = (
        "low" if score >= 80 else "medium" if score >= 50 else "high"
    )

    return SecurityHeadersResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        is_https=urlsplit(fetched.final_url).scheme.lower() == "https",
        redirect_count=len(fetched.redirect_chain),
        score=score,
        risk_level=risk_level,
        present_count=present_count,
        missing_count=missing_count,
        checks=tuple(checks),
        recommendation=_recommendation(
            status_code=fetched.status_code,
            score=score,
            risk_level=risk_level,
            final_url=fetched.final_url,
        ),
    )


def _build_checks(headers: dict[str, str], *, final_url: str) -> list[SecurityHeaderCheckResponse]:
    normalized = {key.lower(): value for key, value in headers.items()}
    is_https = urlsplit(final_url).scheme.lower() == "https"
    csp = normalized.get("content-security-policy")
    x_frame = normalized.get("x-frame-options")
    frame_ancestors = "frame-ancestors" in csp.lower() if csp else False

    return [
        _check_hsts(normalized.get("strict-transport-security"), is_https=is_https),
        _check_csp(csp),
        _check_nosniff(normalized.get("x-content-type-options")),
        _check_clickjacking(x_frame, csp=csp, frame_ancestors=frame_ancestors),
        _check_referrer_policy(normalized.get("referrer-policy")),
        _check_permissions_policy(normalized.get("permissions-policy")),
    ]


def _check_hsts(value: str | None, *, is_https: bool) -> SecurityHeaderCheckResponse:
    if not is_https:
        return SecurityHeaderCheckResponse(
            id="hsts",
            header="Strict-Transport-Security",
            title="HTTPS transport policy",
            value=value,
            present=value is not None,
            status="fail",
            severity="high",
            recommendation=(
                "Serve the final URL over HTTPS before relying on HSTS. "
                "HSTS is only effective for HTTPS responses."
            ),
        )
    if value:
        return SecurityHeaderCheckResponse(
            id="hsts",
            header="Strict-Transport-Security",
            title="HTTPS transport policy",
            value=value,
            present=True,
            status="pass",
            severity="info",
            recommendation=(
                "HSTS is present. Keep max-age and subdomain coverage aligned "
                "with your HTTPS rollout plan."
            ),
        )
    return SecurityHeaderCheckResponse(
        id="hsts",
        header="Strict-Transport-Security",
        title="HTTPS transport policy",
        value=None,
        present=False,
        status="warning",
        severity="medium",
        recommendation=(
            "Add HSTS after confirming HTTPS is stable for the whole host and required subdomains."
        ),
    )


def _check_csp(value: str | None) -> SecurityHeaderCheckResponse:
    if value:
        return SecurityHeaderCheckResponse(
            id="csp",
            header="Content-Security-Policy",
            title="Content security policy",
            value=value,
            present=True,
            status="pass",
            severity="info",
            recommendation=(
                "CSP is present. Review directives after releases and avoid broad "
                "wildcards where possible."
            ),
        )
    return SecurityHeaderCheckResponse(
        id="csp",
        header="Content-Security-Policy",
        title="Content security policy",
        value=None,
        present=False,
        status="warning",
        severity="medium",
        recommendation=(
            "Add a Content-Security-Policy to reduce XSS impact and control "
            "trusted script, style, image, and frame sources."
        ),
    )


def _check_nosniff(value: str | None) -> SecurityHeaderCheckResponse:
    valid = value is not None and value.lower().strip() == "nosniff"
    return SecurityHeaderCheckResponse(
        id="x-content-type-options",
        header="X-Content-Type-Options",
        title="MIME sniffing protection",
        value=value,
        present=value is not None,
        status="pass" if valid else "warning",
        severity="info" if valid else "medium",
        recommendation=(
            "Set X-Content-Type-Options: nosniff to prevent browsers "
            "from guessing executable content types."
        )
        if not valid
        else ("nosniff is present. Keep it on HTML, JS, CSS and uploaded file responses."),
    )


def _check_clickjacking(
    value: str | None, *, csp: str | None, frame_ancestors: bool
) -> SecurityHeaderCheckResponse:
    present = value is not None or frame_ancestors
    if present:
        label = value if value is not None else f"CSP frame-ancestors in: {csp}"
        return SecurityHeaderCheckResponse(
            id="clickjacking",
            header="X-Frame-Options / CSP frame-ancestors",
            title="Clickjacking protection",
            value=label,
            present=True,
            status="pass",
            severity="info",
            recommendation=(
                "Frame protection is present. Keep allowed framing origins intentionally narrow."
            ),
        )
    return SecurityHeaderCheckResponse(
        id="clickjacking",
        header="X-Frame-Options / CSP frame-ancestors",
        title="Clickjacking protection",
        value=None,
        present=False,
        status="warning",
        severity="medium",
        recommendation=(
            "Add frame-ancestors in CSP or X-Frame-Options to prevent "
            "unwanted embedding of sensitive pages."
        ),
    )


def _check_referrer_policy(value: str | None) -> SecurityHeaderCheckResponse:
    return SecurityHeaderCheckResponse(
        id="referrer-policy",
        header="Referrer-Policy",
        title="Referrer data control",
        value=value,
        present=value is not None,
        status="pass" if value else "warning",
        severity="info" if value else "medium",
        recommendation=(
            "Referrer-Policy is present. Confirm it balances analytics needs "
            "with leakage reduction."
        )
        if value
        else (
            "Add Referrer-Policy, for example strict-origin-when-cross-origin, "
            "to reduce accidental URL leakage."
        ),
    )


def _check_permissions_policy(value: str | None) -> SecurityHeaderCheckResponse:
    return SecurityHeaderCheckResponse(
        id="permissions-policy",
        header="Permissions-Policy",
        title="Browser feature permissions",
        value=value,
        present=value is not None,
        status="pass" if value else "warning",
        severity="info" if value else "medium",
        recommendation=(
            "Permissions-Policy is present. Keep allowed browser features "
            "limited to real product needs."
        )
        if value
        else (
            "Add Permissions-Policy to limit unused browser capabilities such "
            "as camera, microphone, geolocation, and fullscreen."
        ),
    )


def _recommendation(*, status_code: int, score: int, risk_level: str, final_url: str) -> str:
    if status_code >= 400:
        return (
            "The tested URL does not return a successful response. Fix availability "
            "before treating security header coverage as final."
        )
    if urlsplit(final_url).scheme.lower() != "https":
        return (
            "The final URL is not HTTPS. Migrate to HTTPS first, then configure "
            "HSTS and the remaining browser security headers."
        )
    if risk_level == "high":
        return (
            "Several important browser security headers are missing. Prioritize "
            "CSP, HSTS, nosniff, frame protection, Referrer-Policy, "
            "and Permissions-Policy."
        )
    if score < 100:
        return (
            "Core headers are partially configured. Add the missing headers and "
            "verify them on the final URL after redirects."
        )
    return (
        "Security headers are present for the checked URL. Re-test after deploys, "
        "CDN changes, and template changes."
    )
