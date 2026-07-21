from __future__ import annotations

from collections import Counter
from dataclasses import dataclass
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal, cast
from urllib.parse import urljoin, urlsplit

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

ToolStatus = Literal["pass", "warning", "fail"]
FindingSeverity = Literal["info", "medium", "high"]
CspPolicySource = Literal["header", "report-only", "meta"]
ScriptHostClassification = Literal[
    "analytics-pattern",
    "tag-manager-pattern",
    "advertising-pattern",
    "social-pattern",
    "cdn-pattern",
    "other",
]
ResourceHintRel = Literal[
    "preconnect",
    "dns-prefetch",
    "preload",
    "prefetch",
    "modulepreload",
    "preinit",
]

_MAX_HTML_BYTES = 1_000_000
_MAX_CSP_RAW_CHARS = 20_000
_MAX_CSP_POLICIES = 20
_MAX_CSP_DIRECTIVES = 200
_MAX_FINDINGS = 100
_MAX_SCRIPT_ITEMS = 100
_MAX_SCRIPT_HOST_GROUPS = 50
_MAX_HINT_ITEMS = 100
_MAX_PRECONNECTS = 6
_SUPPORTED_HINT_RELS = frozenset(
    {"preconnect", "dns-prefetch", "preload", "prefetch", "modulepreload", "preinit"}
)


class PageUrlRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class CspDirectiveResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    values: tuple[str, ...]


class CspPolicyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source: CspPolicySource
    raw: str = Field(min_length=1, max_length=_MAX_CSP_RAW_CHARS)
    directive_count: int = Field(ge=0)
    duplicate_directive_count: int = Field(ge=0)
    directives: tuple[CspDirectiveResponse, ...]


class CspFindingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    severity: FindingSeverity
    source: CspPolicySource | Literal["document"]
    directive: str | None = Field(default=None, max_length=120)
    value: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=600)


class CspAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.csp_analyzer.v1"] = (
        "webdiag.tool.csp_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    enforced_policy_count: int = Field(ge=0)
    report_only_policy_count: int = Field(ge=0)
    meta_policy_count: int = Field(ge=0)
    directive_count: int = Field(ge=0)
    finding_count: int = Field(ge=0)
    high_risk_finding_count: int = Field(ge=0)
    policies: tuple[CspPolicyResponse, ...]
    findings: tuple[CspFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class ScriptItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    source_kind: Literal["inline", "external"]
    raw_src: str | None = Field(default=None, max_length=2_048)
    resolved_url: str | None = Field(default=None, max_length=2_048)
    hostname: str | None = Field(default=None, max_length=253)
    same_host: bool | None = None
    cross_host_candidate: bool
    host_classification: ScriptHostClassification | None = None
    async_attribute: bool
    defer_attribute: bool
    module: bool
    nomodule: bool
    parser_blocking_candidate: bool
    integrity_present: bool
    crossorigin_present: bool
    issues: tuple[str, ...]


class ScriptHostGroupResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    hostname: str = Field(min_length=1, max_length=253)
    count: int = Field(ge=1)
    classification: ScriptHostClassification


class ThirdPartyScriptAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.third_party_script_analyzer.v1"] = (
        "webdiag.tool.third_party_script_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    classification_basis: Literal["hostname"] = "hostname"
    script_count: int = Field(ge=0)
    inline_script_count: int = Field(ge=0)
    external_script_count: int = Field(ge=0)
    same_host_script_count: int = Field(ge=0)
    cross_host_script_count: int = Field(ge=0)
    parser_blocking_candidate_count: int = Field(ge=0)
    async_count: int = Field(ge=0)
    defer_count: int = Field(ge=0)
    module_count: int = Field(ge=0)
    nomodule_count: int = Field(ge=0)
    integrity_count: int = Field(ge=0)
    crossorigin_count: int = Field(ge=0)
    duplicate_src_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    scripts: tuple[ScriptItemResponse, ...]
    host_groups: tuple[ScriptHostGroupResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


class ResourceHintItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    rel: ResourceHintRel
    raw_href: str | None = Field(default=None, max_length=2_048)
    resolved_url: str | None = Field(default=None, max_length=2_048)
    hostname: str | None = Field(default=None, max_length=253)
    same_host: bool | None = None
    as_value: str | None = Field(default=None, max_length=120)
    type_value: str | None = Field(default=None, max_length=240)
    media: str | None = Field(default=None, max_length=500)
    crossorigin_present: bool
    fetchpriority: str | None = Field(default=None, max_length=80)
    issues: tuple[str, ...]


class ResourceHintFindingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    severity: Literal["info", "medium"]
    rel: ResourceHintRel | None = None
    value: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=600)


class ResourceHintsAnalyzerResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.resource_hints_analyzer.v1"] = (
        "webdiag.tool.resource_hints_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    hint_count: int = Field(ge=0)
    preconnect_count: int = Field(ge=0)
    dns_prefetch_count: int = Field(ge=0)
    preload_count: int = Field(ge=0)
    prefetch_count: int = Field(ge=0)
    modulepreload_count: int = Field(ge=0)
    preinit_count: int = Field(ge=0)
    cross_host_hint_count: int = Field(ge=0)
    duplicate_hint_count: int = Field(ge=0)
    finding_count: int = Field(ge=0)
    hints: tuple[ResourceHintItemResponse, ...]
    findings: tuple[ResourceHintFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


@dataclass(frozen=True, slots=True)
class _ParsedScript:
    position: int
    src_present: bool
    raw_src: str | None
    async_attribute: bool
    defer_attribute: bool
    module: bool
    nomodule: bool
    integrity_present: bool
    crossorigin_present: bool


@dataclass(frozen=True, slots=True)
class _ParsedHint:
    position: int
    rel: ResourceHintRel
    raw_href: str | None
    as_value: str | None
    type_value: str | None
    media: str | None
    crossorigin_present: bool
    fetchpriority: str | None


class _DocumentSurfaceParser(HTMLParser):
    def __init__(self, *, base_url: str) -> None:
        super().__init__(convert_charrefs=True)
        self.base_url = base_url
        self.page_hostname = (urlsplit(base_url).hostname or "").lower()
        self.meta_csp_values: list[str] = []
        self.meta_csp_count = 0
        self.scripts: list[ScriptItemResponse] = []
        self.script_count = 0
        self.inline_script_count = 0
        self.external_script_count = 0
        self.same_host_script_count = 0
        self.cross_host_script_count = 0
        self.parser_blocking_candidate_count = 0
        self.async_count = 0
        self.defer_count = 0
        self.module_count = 0
        self.nomodule_count = 0
        self.integrity_count = 0
        self.crossorigin_count = 0
        self.script_issue_count = 0
        self.script_source_counts: Counter[str] = Counter()
        self.script_host_counts: Counter[str] = Counter()
        self.hints: list[ResourceHintItemResponse] = []
        self.hint_count = 0
        self.hint_rel_counts: Counter[str] = Counter()
        self.cross_host_hint_count = 0
        self.hint_issue_count = 0
        self.hint_issue_counts: Counter[str] = Counter()
        self.hint_key_counts: Counter[tuple[str, str]] = Counter()

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        normalized_tag = tag.lower()
        attr_pairs = [(name.lower(), value) for name, value in attrs]
        values = {name: value for name, value in attr_pairs}
        names = {name for name, _value in attr_pairs}

        if normalized_tag == "meta":
            http_equiv = (values.get("http-equiv") or "").strip().lower()
            content = (values.get("content") or "").strip()
            if http_equiv == "content-security-policy" and content:
                self.meta_csp_count += 1
                if len(self.meta_csp_values) < _MAX_CSP_POLICIES:
                    self.meta_csp_values.append(content)
            return

        if normalized_tag == "script":
            self.script_count += 1
            script_type = (values.get("type") or "").strip().lower()
            parsed = _ParsedScript(
                position=self.script_count,
                src_present="src" in names,
                raw_src=values.get("src"),
                async_attribute="async" in names,
                defer_attribute="defer" in names,
                module=script_type == "module",
                nomodule="nomodule" in names,
                integrity_present="integrity" in names,
                crossorigin_present="crossorigin" in names,
            )
            item = _script_item(
                parsed,
                base_url=self.base_url,
                page_hostname=self.page_hostname,
            )
            self.inline_script_count += item.source_kind == "inline"
            self.external_script_count += item.source_kind == "external"
            self.same_host_script_count += item.same_host is True
            self.cross_host_script_count += item.cross_host_candidate
            self.parser_blocking_candidate_count += item.parser_blocking_candidate
            self.async_count += item.async_attribute
            self.defer_count += item.defer_attribute
            self.module_count += item.module
            self.nomodule_count += item.nomodule
            self.integrity_count += item.integrity_present
            self.crossorigin_count += item.crossorigin_present
            self.script_issue_count += len(item.issues)
            if item.resolved_url:
                self.script_source_counts[item.resolved_url] += 1
            if item.cross_host_candidate and item.hostname:
                self.script_host_counts[item.hostname] += 1
            if len(self.scripts) < _MAX_SCRIPT_ITEMS:
                self.scripts.append(item)
            return

        if normalized_tag != "link":
            return
        rel_tokens = {
            token.lower()
            for token in (values.get("rel") or "").split()
            if token.lower() in _SUPPORTED_HINT_RELS
        }
        for rel_value in sorted(rel_tokens):
            self.hint_count += 1
            parsed = _ParsedHint(
                position=self.hint_count,
                rel=cast(ResourceHintRel, rel_value),
                raw_href=values.get("href"),
                as_value=_clean_optional(values.get("as")),
                type_value=_clean_optional(values.get("type")),
                media=_clean_optional(values.get("media")),
                crossorigin_present="crossorigin" in names,
                fetchpriority=_clean_optional(values.get("fetchpriority")),
            )
            item = _resource_hint_item(
                parsed,
                base_url=self.base_url,
                page_hostname=self.page_hostname,
            )
            self.hint_rel_counts[item.rel] += 1
            self.cross_host_hint_count += item.same_host is False
            self.hint_issue_count += len(item.issues)
            self.hint_issue_counts.update(item.issues)
            if item.resolved_url:
                self.hint_key_counts[(item.rel, item.resolved_url)] += 1
            if len(self.hints) < _MAX_HINT_ITEMS:
                self.hints.append(item)


def get_client_delivery_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=_MAX_HTML_BYTES, max_redirects=5)
    )


ClientDeliveryFetcherDependency = Annotated[
    SafeHttpFetcher, Depends(get_client_delivery_fetcher)
]


@router.post("/v1/tools/csp", response_model=CspAnalyzerResponse)
def analyze_csp(
    payload: PageUrlRequest,
    fetcher: ClientDeliveryFetcherDependency,
) -> CspAnalyzerResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    parser = _parse_document_if_html(
        fetched.body_text, fetched.content_type, base_url=fetched.final_url
    )

    policy_inputs: list[tuple[CspPolicySource, str]] = []
    header_policy = _clean_optional(fetched.headers.get("content-security-policy"))
    report_only_policy = _clean_optional(
        fetched.headers.get("content-security-policy-report-only")
    )
    if header_policy:
        policy_inputs.append(("header", header_policy))
    if report_only_policy:
        policy_inputs.append(("report-only", report_only_policy))
    if parser is not None:
        policy_inputs.extend(("meta", value) for value in parser.meta_csp_values)

    actual_policy_count = (
        int(header_policy is not None)
        + int(report_only_policy is not None)
        + (parser.meta_csp_count if parser is not None else 0)
    )
    truncated = actual_policy_count > _MAX_CSP_POLICIES
    policies = tuple(
        _parse_csp_policy(source, raw)
        for source, raw in policy_inputs[:_MAX_CSP_POLICIES]
    )
    if any(len(raw) > _MAX_CSP_RAW_CHARS for _source, raw in policy_inputs):
        truncated = True
    if any(policy.directive_count > len(policy.directives) for policy in policies):
        truncated = True

    all_findings = _csp_findings(policies)
    finding_count = len(all_findings)
    high_risk_count = sum(finding.severity == "high" for finding in all_findings)
    if finding_count > _MAX_FINDINGS:
        truncated = True
    findings = tuple(all_findings[:_MAX_FINDINGS])
    meta_count = parser.meta_csp_count if parser is not None else 0
    enforced_count = int(header_policy is not None) + meta_count
    report_only_count = int(report_only_policy is not None)
    status_value = _csp_status(
        status_code=fetched.status_code,
        enforced_count=enforced_count,
        report_only_count=report_only_count,
        high_risk_count=high_risk_count,
        finding_count=finding_count,
    )

    return CspAnalyzerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        enforced_policy_count=enforced_count,
        report_only_policy_count=report_only_count,
        meta_policy_count=meta_count,
        directive_count=sum(policy.directive_count for policy in policies),
        finding_count=finding_count,
        high_risk_finding_count=high_risk_count,
        policies=policies,
        findings=findings,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_csp_recommendation(
            status_value,
            enforced_count=enforced_count,
            report_only_count=report_only_count,
            high_risk_count=high_risk_count,
        ),
    )


@router.post(
    "/v1/tools/third-party-scripts",
    response_model=ThirdPartyScriptAnalyzerResponse,
)
def analyze_third_party_scripts(
    payload: PageUrlRequest,
    fetcher: ClientDeliveryFetcherDependency,
) -> ThirdPartyScriptAnalyzerResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    parser = _parse_document_if_html(
        fetched.body_text, fetched.content_type, base_url=fetched.final_url
    )
    items = tuple(parser.scripts) if parser is not None else ()
    source_counts = parser.script_source_counts if parser is not None else Counter()
    duplicate_count = sum(count - 1 for count in source_counts.values() if count > 1)
    host_counter = parser.script_host_counts if parser is not None else Counter()
    host_groups = tuple(
        ScriptHostGroupResponse(
            hostname=hostname,
            count=count,
            classification=_classify_script_hostname(hostname),
        )
        for hostname, count in host_counter.most_common(_MAX_SCRIPT_HOST_GROUPS)
    )

    script_count = parser.script_count if parser is not None else 0
    cross_host_count = parser.cross_host_script_count if parser is not None else 0
    blocking_count = (
        parser.parser_blocking_candidate_count if parser is not None else 0
    )
    issue_count = parser.script_issue_count if parser is not None else 0
    truncated = script_count > len(items) or len(host_counter) > len(host_groups)
    status_value = _document_analyzer_status(
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        warning_count=cross_host_count + blocking_count + duplicate_count + issue_count,
    )

    return ThirdPartyScriptAnalyzerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        script_count=script_count,
        inline_script_count=parser.inline_script_count if parser is not None else 0,
        external_script_count=parser.external_script_count if parser is not None else 0,
        same_host_script_count=parser.same_host_script_count if parser is not None else 0,
        cross_host_script_count=cross_host_count,
        parser_blocking_candidate_count=blocking_count,
        async_count=parser.async_count if parser is not None else 0,
        defer_count=parser.defer_count if parser is not None else 0,
        module_count=parser.module_count if parser is not None else 0,
        nomodule_count=parser.nomodule_count if parser is not None else 0,
        integrity_count=parser.integrity_count if parser is not None else 0,
        crossorigin_count=parser.crossorigin_count if parser is not None else 0,
        duplicate_src_count=duplicate_count,
        issue_count=issue_count,
        scripts=items,
        host_groups=host_groups,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_script_recommendation(
            status_value,
            cross_host_count=cross_host_count,
            blocking_count=blocking_count,
            duplicate_count=duplicate_count,
        ),
    )


@router.post("/v1/tools/resource-hints", response_model=ResourceHintsAnalyzerResponse)
def analyze_resource_hints(
    payload: PageUrlRequest,
    fetcher: ClientDeliveryFetcherDependency,
) -> ResourceHintsAnalyzerResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    parser = _parse_document_if_html(
        fetched.body_text, fetched.content_type, base_url=fetched.final_url
    )
    items = list(parser.hints) if parser is not None else []
    duplicate_keys = parser.hint_key_counts if parser is not None else Counter()
    duplicate_count = sum(count - 1 for count in duplicate_keys.values() if count > 1)
    duplicate_key_set = {key for key, count in duplicate_keys.items() if count > 1}
    if duplicate_key_set:
        items = [
            item.model_copy(
                update={
                    "issues": (*item.issues, "duplicate hint for the same rel and URL")
                }
            )
            if (item.rel, item.resolved_url) in duplicate_key_set
            else item
            for item in items
        ]

    rel_counts = parser.hint_rel_counts if parser is not None else Counter()
    preconnect_count = rel_counts["preconnect"]
    issue_counts = parser.hint_issue_counts if parser is not None else Counter()
    all_findings = _resource_hint_findings(
        duplicate_count=duplicate_count,
        preconnect_count=preconnect_count,
        issue_counts=issue_counts,
    )
    finding_count = len(all_findings)
    findings = tuple(all_findings[:_MAX_FINDINGS])
    hint_count = parser.hint_count if parser is not None else 0
    truncated = hint_count > len(items) or finding_count > len(findings)
    warning_count = (
        finding_count + (parser.hint_issue_count if parser is not None else 0)
    )
    status_value = _document_analyzer_status(
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        warning_count=warning_count,
    )

    return ResourceHintsAnalyzerResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        hint_count=hint_count,
        preconnect_count=preconnect_count,
        dns_prefetch_count=rel_counts["dns-prefetch"],
        preload_count=rel_counts["preload"],
        prefetch_count=rel_counts["prefetch"],
        modulepreload_count=rel_counts["modulepreload"],
        preinit_count=rel_counts["preinit"],
        cross_host_hint_count=(
            parser.cross_host_hint_count if parser is not None else 0
        ),
        duplicate_hint_count=duplicate_count,
        finding_count=finding_count,
        hints=tuple(items),
        findings=findings,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_resource_hint_recommendation(
            status_value,
            hint_count=hint_count,
            finding_count=finding_count,
            preconnect_count=preconnect_count,
        ),
    )


def _fetch_or_raise(fetcher: SafeHttpFetcher, url: str):
    try:
        return fetcher.fetch(url, read_body=True)
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


def _parse_document_if_html(
    body_text: str, content_type: str | None, *, base_url: str
) -> _DocumentSurfaceParser | None:
    if not _is_html_candidate(content_type):
        return None
    parser = _DocumentSurfaceParser(base_url=base_url)
    parser.feed(body_text)
    parser.close()
    return parser


def _is_html_candidate(content_type: str | None) -> bool:
    if not content_type:
        return True
    normalized = content_type.lower()
    return "text/html" in normalized or "application/xhtml+xml" in normalized


def _parse_csp_policy(source: CspPolicySource, raw: str) -> CspPolicyResponse:
    raw_value = raw.strip()[:_MAX_CSP_RAW_CHARS]
    parsed: list[tuple[str, tuple[str, ...]]] = []
    names: list[str] = []
    directive_total = 0
    for segment in raw_value.split(";"):
        tokens = segment.strip().split()
        if not tokens:
            continue
        directive_total += 1
        name = tokens[0].lower()
        names.append(name)
        if len(parsed) < _MAX_CSP_DIRECTIVES:
            parsed.append((name, tuple(tokens[1:])))
    counts = Counter(names)
    return CspPolicyResponse(
        source=source,
        raw=raw_value,
        directive_count=directive_total,
        duplicate_directive_count=sum(count - 1 for count in counts.values() if count > 1),
        directives=tuple(
            CspDirectiveResponse(name=name, values=values) for name, values in parsed
        ),
    )


def _csp_findings(policies: tuple[CspPolicyResponse, ...]) -> list[CspFindingResponse]:
    findings: list[CspFindingResponse] = []
    enforced = [policy for policy in policies if policy.source in {"header", "meta"}]
    report_only = [policy for policy in policies if policy.source == "report-only"]
    if not enforced:
        if report_only:
            findings.append(
                CspFindingResponse(
                    id="report-only-without-enforced-policy",
                    title="Only a report-only CSP was found",
                    severity="medium",
                    source="document",
                    recommendation=(
                        "Keep report-only telemetry during rollout, then publish an enforced "
                        "Content-Security-Policy after validating required sources."
                    ),
                )
            )
        else:
            findings.append(
                CspFindingResponse(
                    id="missing-enforced-policy",
                    title="No enforced Content-Security-Policy was found",
                    severity="high",
                    source="document",
                    recommendation=(
                        "Define a restrictive CSP for the actual application resource model; "
                        "do not copy a generic policy without testing it."
                    ),
                )
            )
        return findings

    for policy_index, policy in enumerate(enforced, start=1):
        directive_map: dict[str, list[str]] = {}
        for directive in policy.directives:
            directive_map.setdefault(directive.name, []).extend(directive.values)

        if policy.duplicate_directive_count:
            findings.append(
                CspFindingResponse(
                    id=f"duplicate-directives-{policy_index}",
                    title="Duplicate CSP directives were found",
                    severity="medium",
                    source=policy.source,
                    value=str(policy.duplicate_directive_count),
                    recommendation=(
                        "Keep each directive once. Browsers ignore later duplicate directives, "
                        "which can make the effective policy differ from reviewer expectations."
                    ),
                )
            )

        if "default-src" not in directive_map:
            findings.append(
                CspFindingResponse(
                    id=f"missing-default-src-{policy_index}",
                    title="default-src is missing",
                    severity="high",
                    source=policy.source,
                    directive="default-src",
                    recommendation=(
                        "Add a restrictive default-src fallback, then override only the resource "
                        "types that need broader sources."
                    ),
                )
            )
        for directive_name, title in (
            ("object-src", "object-src is missing"),
            ("base-uri", "base-uri is missing"),
            ("frame-ancestors", "frame-ancestors is missing"),
        ):
            if directive_name not in directive_map:
                findings.append(
                    CspFindingResponse(
                        id=f"missing-{directive_name}-{policy_index}",
                        title=title,
                        severity="medium",
                        source=policy.source,
                        directive=directive_name,
                        recommendation=_missing_directive_recommendation(directive_name),
                    )
                )

        if policy.source == "meta" and "frame-ancestors" in directive_map:
            findings.append(
                CspFindingResponse(
                    id=f"meta-frame-ancestors-{policy_index}",
                    title="frame-ancestors in a meta CSP is not header-equivalent",
                    severity="medium",
                    source="meta",
                    directive="frame-ancestors",
                    recommendation=(
                        "Send frame-ancestors in the HTTP Content-Security-Policy header. "
                        "Do not rely on a meta policy for framing control."
                    ),
                )
            )

        for directive_name, values in directive_map.items():
            normalized_values = {value.lower() for value in values}
            if "'unsafe-eval'" in normalized_values:
                findings.append(
                    CspFindingResponse(
                        id=f"unsafe-eval-{policy_index}-{directive_name}",
                        title="'unsafe-eval' is allowed",
                        severity="high",
                        source=policy.source,
                        directive=directive_name,
                        value="'unsafe-eval'",
                        recommendation=(
                            "Remove eval-like execution dependencies or isolate them before "
                            "removing 'unsafe-eval' from the enforced policy."
                        ),
                    )
                )
            if "'unsafe-inline'" in normalized_values:
                severity_value: FindingSeverity = (
                    "high" if directive_name in {"script-src", "script-src-elem"} else "medium"
                )
                findings.append(
                    CspFindingResponse(
                        id=f"unsafe-inline-{policy_index}-{directive_name}",
                        title="'unsafe-inline' is allowed",
                        severity=severity_value,
                        source=policy.source,
                        directive=directive_name,
                        value="'unsafe-inline'",
                        recommendation=(
                            "Prefer nonces or hashes for required inline code and test the policy "
                            "before removing the fallback."
                        ),
                    )
                )
            if "*" in normalized_values:
                findings.append(
                    CspFindingResponse(
                        id=f"wildcard-source-{policy_index}-{directive_name}",
                        title="A wildcard CSP source is allowed",
                        severity="high",
                        source=policy.source,
                        directive=directive_name,
                        value="*",
                        recommendation=(
                            "Replace wildcard sources with the smallest explicit origin set that "
                            "the application requires."
                        ),
                    )
                )
    return findings


def _missing_directive_recommendation(directive: str) -> str:
    if directive == "object-src":
        return "Set object-src 'none' unless legacy plugin content is intentionally required."
    if directive == "base-uri":
        return "Restrict base-uri, commonly to 'self' or 'none', after checking base element usage."
    return "Publish frame-ancestors in the HTTP header to define allowed framing origins."


def _csp_status(
    *,
    status_code: int,
    enforced_count: int,
    report_only_count: int,
    high_risk_count: int,
    finding_count: int,
) -> ToolStatus:
    if status_code >= 400 or (enforced_count == 0 and report_only_count == 0):
        return "fail"
    if enforced_count == 0 or high_risk_count > 0:
        return "fail"
    if finding_count > 0:
        return "warning"
    return "pass"


def _csp_recommendation(
    value: ToolStatus,
    *,
    enforced_count: int,
    report_only_count: int,
    high_risk_count: int,
) -> str:
    if enforced_count == 0 and report_only_count == 0:
        return (
            "No enforced or report-only CSP was detected in the response header or static HTML "
            "meta elements. Build and test a policy from the site's actual resource requirements."
        )
    if enforced_count == 0:
        return (
            "A report-only policy is visible, but it does not enforce restrictions. Review reports "
            "and deploy an enforced header when required sources are understood."
        )
    if high_risk_count:
        return (
            f"The static policy review found {high_risk_count} high-risk construction(s). Review "
            "them in context; this analyzer does not execute the page or observe "
            "browser violations."
        )
    if value == "warning":
        return (
            "An enforced CSP exists, but the static review found hardening gaps. Validate changes "
            "with report-only telemetry before tightening production policy."
        )
    return (
        "No selected high-risk CSP constructions were found. This is a bounded syntax and policy "
        "surface review, not proof that XSS or CSP bypasses are impossible."
    )


def _script_item(
    script: _ParsedScript, *, base_url: str, page_hostname: str
) -> ScriptItemResponse:
    if not script.src_present:
        return ScriptItemResponse(
            position=script.position,
            source_kind="inline",
            raw_src=None,
            resolved_url=None,
            hostname=None,
            same_host=None,
            cross_host_candidate=False,
            host_classification=None,
            async_attribute=script.async_attribute,
            defer_attribute=script.defer_attribute,
            module=script.module,
            nomodule=script.nomodule,
            parser_blocking_candidate=not script.module,
            integrity_present=script.integrity_present,
            crossorigin_present=script.crossorigin_present,
            issues=(),
        )

    raw_src = (script.raw_src or "").strip()
    issues: list[str] = []
    resolved_url: str | None = None
    hostname: str | None = None
    same_host: bool | None = None
    classification: ScriptHostClassification | None = None
    if not raw_src:
        issues.append("empty script src")
    else:
        candidate = urljoin(base_url, raw_src)
        parsed = urlsplit(candidate)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            issues.append("script src is not a resolvable http/https URL")
        else:
            resolved_url = candidate[:2_048]
            hostname = parsed.hostname.lower()
            same_host = hostname == page_hostname
            classification = _classify_script_hostname(hostname)

    return ScriptItemResponse(
        position=script.position,
        source_kind="external",
        raw_src=raw_src[:2_048],
        resolved_url=resolved_url,
        hostname=hostname,
        same_host=same_host,
        cross_host_candidate=same_host is False,
        host_classification=classification,
        async_attribute=script.async_attribute,
        defer_attribute=script.defer_attribute,
        module=script.module,
        nomodule=script.nomodule,
        parser_blocking_candidate=(
            not script.module and not script.async_attribute and not script.defer_attribute
        ),
        integrity_present=script.integrity_present,
        crossorigin_present=script.crossorigin_present,
        issues=tuple(issues),
    )


def _classify_script_hostname(hostname: str) -> ScriptHostClassification:
    patterns: tuple[tuple[ScriptHostClassification, tuple[str, ...]], ...] = (
        ("tag-manager-pattern", ("googletagmanager.com", "tagmanager.google.com")),
        (
            "analytics-pattern",
            ("google-analytics.com", "analytics.google.com", "plausible.io", "matomo.cloud"),
        ),
        (
            "advertising-pattern",
            ("doubleclick.net", "googlesyndication.com", "adservice.google.com"),
        ),
        (
            "social-pattern",
            ("connect.facebook.net", "platform.twitter.com", "platform.linkedin.com"),
        ),
        (
            "cdn-pattern",
            ("cdn.jsdelivr.net", "cdnjs.cloudflare.com", "unpkg.com", "ajax.googleapis.com"),
        ),
    )
    for classification, suffixes in patterns:
        if any(hostname == suffix or hostname.endswith(f".{suffix}") for suffix in suffixes):
            return classification
    return "other"


def _script_recommendation(
    value: ToolStatus,
    *,
    cross_host_count: int,
    blocking_count: int,
    duplicate_count: int,
) -> str:
    if value == "fail":
        return "The target did not return a successful HTML response for bounded script analysis."
    if not cross_host_count and not blocking_count and not duplicate_count:
        return (
            "No selected script delivery warnings were found in static HTML. Runtime-injected "
            "scripts, ownership, consent state, and network behavior were not inspected."
        )
    return (
        f"Static HTML contains {cross_host_count} cross-host script candidate(s), "
        f"{blocking_count} parser-blocking candidate(s), and {duplicate_count} duplicate src "
        "occurrence(s). Confirm necessity, loading strategy, and ownership manually."
    )


def _resource_hint_item(
    hint: _ParsedHint, *, base_url: str, page_hostname: str
) -> ResourceHintItemResponse:
    raw_href = (hint.raw_href or "").strip()
    issues: list[str] = []
    resolved_url: str | None = None
    hostname: str | None = None
    same_host: bool | None = None
    if not raw_href:
        issues.append("empty hint href")
    else:
        candidate = urljoin(base_url, raw_href)
        parsed = urlsplit(candidate)
        if parsed.scheme not in {"http", "https"} or not parsed.hostname:
            issues.append("hint href is not a resolvable http/https URL")
        else:
            resolved_url = candidate[:2_048]
            hostname = parsed.hostname.lower()
            same_host = hostname == page_hostname

    if hint.rel == "preload" and not hint.as_value:
        issues.append("preload is missing the as attribute")
    if (
        hint.rel in {"preload", "modulepreload", "preconnect"}
        and same_host is False
        and not hint.crossorigin_present
    ):
        issues.append("cross-host hint has no crossorigin signal")

    return ResourceHintItemResponse(
        position=hint.position,
        rel=hint.rel,
        raw_href=raw_href[:2_048] if raw_href else None,
        resolved_url=resolved_url,
        hostname=hostname,
        same_host=same_host,
        as_value=hint.as_value,
        type_value=hint.type_value,
        media=hint.media,
        crossorigin_present=hint.crossorigin_present,
        fetchpriority=hint.fetchpriority,
        issues=tuple(issues),
    )


def _resource_hint_findings(
    *,
    duplicate_count: int,
    preconnect_count: int,
    issue_counts: Counter[str],
) -> list[ResourceHintFindingResponse]:
    findings: list[ResourceHintFindingResponse] = []
    if duplicate_count:
        findings.append(
            ResourceHintFindingResponse(
                id="duplicate-hints",
                title="Duplicate resource hints were found",
                severity="medium",
                value=str(duplicate_count),
                recommendation=(
                    "Remove duplicate rel/URL hints unless separate attributes intentionally "
                    "represent different fetch modes."
                ),
            )
        )
    if preconnect_count > _MAX_PRECONNECTS:
        findings.append(
            ResourceHintFindingResponse(
                id="many-preconnects",
                title="Many preconnect hints were found",
                severity="medium",
                rel="preconnect",
                value=str(preconnect_count),
                recommendation=(
                    f"Review preconnect usage above {_MAX_PRECONNECTS} origins. Each early "
                    "connection has DNS, socket, and TLS cost even when the origin is not used."
                ),
            )
        )
    missing_as = issue_counts["preload is missing the as attribute"]
    if missing_as:
        findings.append(
            ResourceHintFindingResponse(
                id="preload-missing-as",
                title="Preload hints without as were found",
                severity="medium",
                rel="preload",
                value=str(missing_as),
                recommendation=(
                    "Set the correct as value so the browser can apply destination-specific "
                    "priority, request mode, and cache matching behavior."
                ),
            )
        )
    cross_host_without_crossorigin = issue_counts[
        "cross-host hint has no crossorigin signal"
    ]
    if cross_host_without_crossorigin:
        findings.append(
            ResourceHintFindingResponse(
                id="cross-host-without-crossorigin",
                title="Cross-host hints without a crossorigin signal were found",
                severity="info",
                value=str(cross_host_without_crossorigin),
                recommendation=(
                    "Check the destination fetch mode. Some cross-origin preloads and preconnects "
                    "need a matching crossorigin attribute to be reusable."
                ),
            )
        )
    malformed = (
        issue_counts["empty hint href"]
        + issue_counts["hint href is not a resolvable http/https URL"]
    )
    if malformed:
        findings.append(
            ResourceHintFindingResponse(
                id="malformed-hints",
                title="Hints with empty or unsupported URLs were found",
                severity="medium",
                value=str(malformed),
                recommendation="Remove or correct hints that cannot resolve to an HTTP(S) target.",
            )
        )
    return findings


def _document_analyzer_status(
    *, status_code: int, content_type: str | None, warning_count: int
) -> ToolStatus:
    if status_code >= 400 or not _is_html_candidate(content_type):
        return "fail"
    if warning_count:
        return "warning"
    return "pass"


def _resource_hint_recommendation(
    value: ToolStatus,
    *,
    hint_count: int,
    finding_count: int,
    preconnect_count: int,
) -> str:
    if value == "fail":
        return "The target did not return a successful HTML response for bounded hint analysis."
    if not hint_count:
        return (
            "No supported resource hints were found in static HTML. This is not automatically a "
            "performance defect; hints should only be added for measured, high-confidence needs."
        )
    if finding_count:
        return (
            f"Reviewed {hint_count} hint(s), including {preconnect_count} preconnect(s), and found "
            f"{finding_count} configuration signal(s). Validate changes with browser measurements."
        )
    return (
        f"Reviewed {hint_count} static resource hint(s) without the selected misuse signals. "
        "The analyzer does not prove that each hint is used or improves real performance."
    )


def _clean_optional(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = value.strip()
    return cleaned or None
