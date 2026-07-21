from __future__ import annotations

from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urljoin, urlsplit, urlunsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.audit.robots import DEFAULT_ROBOTS_USER_AGENT, RobotsTxtRule, analyze_robots_txt
from webdiag_api.security.url_policy import UrlPolicyError, validate_url

router = APIRouter(prefix="/v1/tools/robots-txt", tags=["tools"])


class RobotsTxtRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)
    user_agent: str = Field(default=DEFAULT_ROBOTS_USER_AGENT, min_length=1, max_length=120)


class RobotsTxtRuleResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    user_agent: str = Field(min_length=1, max_length=120)
    directive: Literal["allow", "disallow"]
    value: str = Field(max_length=2_048)


class RobotsTxtSitemapResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class RobotsTxtToolResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.robots_txt.v1"] = "webdiag.tool.robots_txt.v1"
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    target_url: str = Field(min_length=1, max_length=2_048)
    target_path: str = Field(min_length=1, max_length=2_048)
    robots_url: str = Field(min_length=1, max_length=2_048)
    user_agent: str = Field(min_length=1, max_length=120)
    status_code: int | None = Field(default=None, ge=100, le=599)
    available: bool
    allows_target: bool | None
    matched_allow_rule: str | None = Field(default=None, max_length=2_048)
    matched_disallow_rule: str | None = Field(default=None, max_length=2_048)
    disallow_count: int = Field(ge=0)
    disallow_rules: tuple[RobotsTxtRuleResponse, ...]
    sitemap_count: int = Field(ge=0)
    sitemap_urls: tuple[RobotsTxtSitemapResponse, ...]
    recommendation: str = Field(min_length=1, max_length=700)


def get_robots_txt_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=512_000))


RobotsTxtFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_robots_txt_fetcher)]


@router.post("", response_model=RobotsTxtToolResponse)
def inspect_robots_txt(
    payload: RobotsTxtRequest,
    fetcher: RobotsTxtFetcherDependency,
) -> RobotsTxtToolResponse:
    try:
        target_url = validate_url(payload.url).normalized
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc

    robots_url = urljoin(_origin_from_url(target_url), "/robots.txt")
    try:
        fetched = fetcher.fetch(robots_url)
        body_text = fetched.body_text
        status_code_value: int | None = fetched.status_code
        fetch_error = None
    except UrlPolicyError as exc:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail={"code": "tool_url_rejected", "message": str(exc)},
        ) from exc
    except SafeFetchError as exc:
        body_text = ""
        status_code_value = None
        fetch_error = str(exc)

    summary = analyze_robots_txt(
        body_text,
        robots_url=robots_url,
        target_url=target_url,
        status_code=status_code_value,
        fetch_error=fetch_error,
        user_agent=payload.user_agent,
    )

    return RobotsTxtToolResponse(
        requested_url=payload.url,
        target_url=target_url,
        target_path=_target_path(target_url),
        robots_url=robots_url,
        user_agent=payload.user_agent,
        status_code=summary.status_code,
        available=summary.available,
        allows_target=summary.allows_target,
        matched_allow_rule=summary.matched_allow_rule,
        matched_disallow_rule=summary.matched_disallow_rule,
        disallow_count=len(summary.disallow_rules),
        disallow_rules=tuple(_rule_response(rule) for rule in summary.disallow_rules),
        sitemap_count=len(summary.sitemap_urls),
        sitemap_urls=tuple(RobotsTxtSitemapResponse(url=url) for url in summary.sitemap_urls),
        recommendation=_recommendation(
            available=summary.available,
            allows_target=summary.allows_target,
            matched_allow_rule=summary.matched_allow_rule,
            matched_disallow_rule=summary.matched_disallow_rule,
            sitemap_count=len(summary.sitemap_urls),
            fetch_error=summary.fetch_error,
        ),
    )


def _rule_response(rule: RobotsTxtRule) -> RobotsTxtRuleResponse:
    return RobotsTxtRuleResponse(
        user_agent=rule.user_agent,
        directive=rule.directive,  # type: ignore[arg-type]
        value=rule.value,
    )


def _origin_from_url(raw_url: str) -> str:
    parsed = urlsplit(raw_url)
    return urlunsplit((parsed.scheme, parsed.netloc, "/", "", ""))


def _target_path(target_url: str) -> str:
    parsed = urlsplit(target_url)
    path = parsed.path or "/"
    if parsed.query:
        return f"{path}?{parsed.query}"
    return path


def _recommendation(
    *,
    available: bool,
    allows_target: bool | None,
    matched_allow_rule: str | None,
    matched_disallow_rule: str | None,
    sitemap_count: int,
    fetch_error: str | None,
) -> str:
    if not available and fetch_error:
        return (
            "robots.txt could not be fetched. Check DNS, hosting availability, firewall rules, "
            "or a temporary server-side error before relying on crawl directives."
        )
    if not available:
        return (
            "robots.txt is not available with a successful HTTP response. "
            "Search crawlers may still crawl public URLs; add robots.txt when "
            "crawl rules or Sitemap declarations are required."
        )
    if allows_target is False:
        return (
            f"The tested URL is blocked by robots.txt rule `{matched_disallow_rule}`. "
            "Keep this only for pages that must not be crawled; unblock important "
            "SEO landing pages."
        )
    if matched_allow_rule:
        return (
            f"The tested URL is explicitly allowed by `{matched_allow_rule}`. "
            "Keep the rule specific enough so private sections remain blocked."
        )
    if sitemap_count == 0:
        return (
            "The tested URL is allowed, but robots.txt does not declare a Sitemap. "
            "Add a Sitemap line when you want search engines to discover canonical URLs faster."
        )
    return (
        "The tested URL is allowed and robots.txt declares Sitemap URLs. Review the listed rules "
        "after template or section changes to avoid accidental crawl blocking."
    )
