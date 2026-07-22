from __future__ import annotations

from collections import defaultdict
from concurrent.futures import ThreadPoolExecutor
from datetime import UTC, datetime
from typing import Annotated, Literal
from urllib.parse import urlsplit, urlunsplit

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError, validate_url

router = APIRouter(tags=["tools"])

ToolStatus = Literal["pass", "warning", "fail"]
FindingSeverity = Literal["info", "medium", "high"]
FetchState = Literal["ok", "rejected", "failed", "not_checked"]
_ALLOWED_REDIRECT_STATUSES = frozenset({301, 302, 303, 307, 308})
_MAX_REDIRECT_MAP_ENTRIES = 25
_MAX_FINDINGS = 100
_MAX_CONCURRENT_FETCHES = 5
_UNRESERVED = frozenset(
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~"
)


class RedirectMapEntryRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    source_url: str = Field(min_length=1, max_length=2_048)
    target_url: str = Field(min_length=1, max_length=2_048)
    expected_status_code: int | None = Field(default=None, ge=300, le=399)


class RedirectMapRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    entries: tuple[RedirectMapEntryRequest, ...] = Field(
        min_length=1,
        max_length=_MAX_REDIRECT_MAP_ENTRIES,
    )


class RedirectMapFindingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=120)
    title: str = Field(min_length=1, max_length=240)
    severity: FindingSeverity
    value: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=700)


class RedirectMapEntryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    source_url: str = Field(min_length=1, max_length=2_048)
    target_url: str = Field(min_length=1, max_length=2_048)
    expected_status_code: int | None = Field(default=None, ge=300, le=399)
    normalized_source_url: str | None = Field(default=None, max_length=2_048)
    normalized_target_url: str | None = Field(default=None, max_length=2_048)
    fetch_state: FetchState
    observed_first_status_code: int | None = Field(default=None, ge=100, le=599)
    observed_first_target_url: str | None = Field(default=None, max_length=2_048)
    final_url: str | None = Field(default=None, max_length=2_048)
    redirect_count: int = Field(ge=0)
    target_matches: bool | None
    status_matches: bool | None
    issues: tuple[str, ...]
    status: ToolStatus


class RedirectMapResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.redirect_map_validator.v1"] = (
        "webdiag.tool.redirect_map_validator.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    scan_mode: Literal["explicit_map_bounded_safe_fetch"] = (
        "explicit_map_bounded_safe_fetch"
    )
    entry_count: int = Field(ge=1)
    checked_count: int = Field(ge=0)
    matched_count: int = Field(ge=0)
    mismatch_count: int = Field(ge=0)
    failed_count: int = Field(ge=0)
    duplicate_source_count: int = Field(ge=0)
    conflicting_source_count: int = Field(ge=0)
    self_redirect_count: int = Field(ge=0)
    chain_source_count: int = Field(ge=0)
    cycle_count: int = Field(ge=0)
    issue_count: int = Field(ge=0)
    entries: tuple[RedirectMapEntryResponse, ...]
    findings: tuple[RedirectMapFindingResponse, ...]
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_000)


def get_redirect_map_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(
            timeout_seconds=5.0,
            max_redirects=5,
            max_body_bytes=1_024,
        )
    )


RedirectMapFetcherDependency = Annotated[
    SafeHttpFetcher,
    Depends(get_redirect_map_fetcher),
]


@router.post("/v1/tools/redirect-map", response_model=RedirectMapResponse)
def validate_redirect_map(
    payload: RedirectMapRequest,
    fetcher: RedirectMapFetcherDependency,
) -> RedirectMapResponse:
    prepared = [_prepare_entry(item) for item in payload.entries]
    source_targets: dict[str, set[str]] = defaultdict(set)
    source_occurrences: dict[str, int] = defaultdict(int)

    for item in prepared:
        source = item[0]
        target = item[1]
        if source is None:
            continue
        source_occurrences[source] += 1
        if target is not None:
            source_targets[source].add(target)

    duplicate_source_count = sum(
        count - 1 for count in source_occurrences.values() if count > 1
    )
    conflicting_sources = {
        source for source, targets in source_targets.items() if len(targets) > 1
    }
    source_nodes = set(source_targets)
    self_sources = {
        source
        for source, targets in source_targets.items()
        if source in targets
    }
    chain_sources = {
        source
        for source, targets in source_targets.items()
        if any(target in source_nodes and target != source for target in targets)
    }
    cycles = _find_cycles(source_targets)

    work_items: list[
        tuple[
            RedirectMapEntryRequest,
            int,
            str | None,
            str | None,
            list[str],
        ]
    ] = []
    for position, (request, prepared_item) in enumerate(
        zip(payload.entries, prepared, strict=True),
        start=1,
    ):
        normalized_source, normalized_target, static_issues = prepared_item
        issues = list(static_issues)
        if normalized_source in conflicting_sources:
            issues.append("conflicting-source-targets")
        elif (
            normalized_source is not None
            and source_occurrences[normalized_source] > 1
        ):
            issues.append("duplicate-source")
        if normalized_source in self_sources:
            issues.append("self-redirect")
        if normalized_source in chain_sources:
            issues.append("map-chain-source")
        if any(normalized_source in cycle for cycle in cycles):
            issues.append("map-cycle")
        work_items.append(
            (
                request,
                position,
                normalized_source,
                normalized_target,
                issues,
            )
        )

    with ThreadPoolExecutor(
        max_workers=min(_MAX_CONCURRENT_FETCHES, len(work_items))
    ) as executor:
        futures = [
            executor.submit(
                _check_entry,
                request=request,
                position=position,
                normalized_source=normalized_source,
                normalized_target=normalized_target,
                initial_issues=issues,
                fetcher=fetcher,
            )
            for request, position, normalized_source, normalized_target, issues in work_items
        ]
        rows = [future.result() for future in futures]

    findings = _map_findings(
        rows=rows,
        duplicate_source_count=duplicate_source_count,
        conflicting_source_count=len(conflicting_sources),
        self_redirect_count=len(self_sources),
        chain_source_count=len(chain_sources),
        cycle_count=len(cycles),
    )[:_MAX_FINDINGS]

    checked_count = sum(item.fetch_state == "ok" for item in rows)
    matched_count = sum(
        item.fetch_state == "ok"
        and item.target_matches is True
        and item.status_matches is not False
        for item in rows
    )
    mismatch_count = sum(
        item.fetch_state == "ok"
        and (
            item.target_matches is not True
            or item.status_matches is False
        )
        for item in rows
    )
    failed_count = sum(item.fetch_state != "ok" for item in rows)
    issue_count = sum(len(item.issues) for item in rows)
    overall_status = _overall_status(rows, cycles)

    return RedirectMapResponse(
        entry_count=len(rows),
        checked_count=checked_count,
        matched_count=matched_count,
        mismatch_count=mismatch_count,
        failed_count=failed_count,
        duplicate_source_count=duplicate_source_count,
        conflicting_source_count=len(conflicting_sources),
        self_redirect_count=len(self_sources),
        chain_source_count=len(chain_sources),
        cycle_count=len(cycles),
        issue_count=issue_count,
        entries=tuple(rows),
        findings=tuple(findings),
        status=overall_status,
        recommendation=_map_recommendation(overall_status, mismatch_count, failed_count),
    )


def _prepare_entry(
    request: RedirectMapEntryRequest,
) -> tuple[str | None, str | None, tuple[str, ...]]:
    issues: list[str] = []
    normalized_source: str | None = None
    normalized_target: str | None = None

    try:
        normalized_source = _comparison_url(request.source_url)
    except UrlPolicyError:
        issues.append("invalid-source-url")

    try:
        normalized_target = _comparison_url(request.target_url)
    except UrlPolicyError:
        issues.append("invalid-target-url")

    if (
        request.expected_status_code is not None
        and request.expected_status_code not in _ALLOWED_REDIRECT_STATUSES
    ):
        issues.append("unsupported-redirect-status")

    try:
        if urlsplit(request.target_url.strip()).fragment:
            issues.append("target-fragment-not-sent")
    except ValueError:
        pass

    return normalized_source, normalized_target, tuple(issues)


def _check_entry(
    *,
    request: RedirectMapEntryRequest,
    position: int,
    normalized_source: str | None,
    normalized_target: str | None,
    initial_issues: list[str],
    fetcher: SafeHttpFetcher,
) -> RedirectMapEntryResponse:
    issues = list(initial_issues)
    if normalized_source is None:
        return RedirectMapEntryResponse(
            position=position,
            source_url=request.source_url,
            target_url=request.target_url,
            expected_status_code=request.expected_status_code,
            normalized_source_url=None,
            normalized_target_url=normalized_target,
            fetch_state="not_checked",
            observed_first_status_code=None,
            observed_first_target_url=None,
            final_url=None,
            redirect_count=0,
            target_matches=None,
            status_matches=None,
            issues=tuple(_dedupe(issues)),
            status="fail",
        )

    try:
        fetched = fetcher.fetch(request.source_url, read_body=False)
    except UrlPolicyError:
        issues.append("source-url-rejected")
        return _failed_row(
            request=request,
            position=position,
            normalized_source=normalized_source,
            normalized_target=normalized_target,
            fetch_state="rejected",
            issues=issues,
        )
    except SafeFetchError:
        issues.append("source-fetch-failed")
        return _failed_row(
            request=request,
            position=position,
            normalized_source=normalized_source,
            normalized_target=normalized_target,
            fetch_state="failed",
            issues=issues,
        )

    first_hop = fetched.redirect_chain[0] if fetched.redirect_chain else None
    observed_target = first_hop.target_url if first_hop else None
    observed_status = first_hop.status_code if first_hop else fetched.status_code

    if first_hop is None:
        issues.append("source-did-not-redirect")
        target_matches: bool | None = False
    elif normalized_target is None:
        target_matches = None
    else:
        target_matches = _comparison_url(first_hop.target_url) == normalized_target
        if not target_matches:
            issues.append("first-target-mismatch")

    if request.expected_status_code is None:
        status_matches: bool | None = None
    else:
        status_matches = observed_status == request.expected_status_code
        if not status_matches:
            issues.append("status-code-mismatch")

    if len(fetched.redirect_chain) > 1:
        issues.append("observed-redirect-chain")

    hard_failures = {
        "invalid-target-url",
        "unsupported-redirect-status",
        "self-redirect",
        "map-cycle",
        "source-did-not-redirect",
        "first-target-mismatch",
        "status-code-mismatch",
        "conflicting-source-targets",
    }
    row_status: ToolStatus
    if any(issue in hard_failures for issue in issues):
        row_status = "fail"
    elif issues:
        row_status = "warning"
    else:
        row_status = "pass"

    return RedirectMapEntryResponse(
        position=position,
        source_url=request.source_url,
        target_url=request.target_url,
        expected_status_code=request.expected_status_code,
        normalized_source_url=normalized_source,
        normalized_target_url=normalized_target,
        fetch_state="ok",
        observed_first_status_code=observed_status,
        observed_first_target_url=observed_target,
        final_url=fetched.final_url,
        redirect_count=len(fetched.redirect_chain),
        target_matches=target_matches,
        status_matches=status_matches,
        issues=tuple(_dedupe(issues)),
        status=row_status,
    )


def _failed_row(
    *,
    request: RedirectMapEntryRequest,
    position: int,
    normalized_source: str | None,
    normalized_target: str | None,
    fetch_state: Literal["rejected", "failed"],
    issues: list[str],
) -> RedirectMapEntryResponse:
    return RedirectMapEntryResponse(
        position=position,
        source_url=request.source_url,
        target_url=request.target_url,
        expected_status_code=request.expected_status_code,
        normalized_source_url=normalized_source,
        normalized_target_url=normalized_target,
        fetch_state=fetch_state,
        observed_first_status_code=None,
        observed_first_target_url=None,
        final_url=None,
        redirect_count=0,
        target_matches=None,
        status_matches=None,
        issues=tuple(_dedupe(issues)),
        status="fail",
    )


def _comparison_url(raw_url: str) -> str:
    validated = validate_url(raw_url)
    parsed = urlsplit(validated.normalized)
    hostname = (parsed.hostname or "").encode("idna").decode("ascii").lower()
    port = parsed.port
    default_port = 443 if parsed.scheme == "https" else 80
    authority = hostname if port in {None, default_port} else f"{hostname}:{port}"
    path = _normalize_percent_encoding(parsed.path or "/")
    query = _normalize_percent_encoding(parsed.query)
    return urlunsplit((parsed.scheme.lower(), authority, path, query, ""))


def _normalize_percent_encoding(value: str) -> str:
    output: list[str] = []
    index = 0
    while index < len(value):
        if index + 2 < len(value) and value[index] == "%":
            raw_hex = value[index + 1 : index + 3]
            try:
                decoded = chr(int(raw_hex, 16))
            except ValueError:
                output.append(value[index])
                index += 1
                continue
            if decoded in _UNRESERVED:
                output.append(decoded)
            else:
                output.append(f"%{raw_hex.upper()}")
            index += 3
            continue
        output.append(value[index])
        index += 1
    return "".join(output)


def _find_cycles(graph: dict[str, set[str]]) -> tuple[tuple[str, ...], ...]:
    nodes = set(graph)
    next_index = 0
    indices: dict[str, int] = {}
    lowlinks: dict[str, int] = {}
    stack: list[str] = []
    on_stack: set[str] = set()
    cycles: list[tuple[str, ...]] = []

    def visit(node: str) -> None:
        nonlocal next_index
        indices[node] = next_index
        lowlinks[node] = next_index
        next_index += 1
        stack.append(node)
        on_stack.add(node)

        for target in sorted(graph.get(node, ())):
            if target not in nodes:
                continue
            if target not in indices:
                visit(target)
                lowlinks[node] = min(lowlinks[node], lowlinks[target])
            elif target in on_stack:
                lowlinks[node] = min(lowlinks[node], indices[target])

        if lowlinks[node] != indices[node]:
            return

        component: list[str] = []
        while stack:
            member = stack.pop()
            on_stack.remove(member)
            component.append(member)
            if member == node:
                break

        cyclic = len(component) > 1 or (
            len(component) == 1 and component[0] in graph.get(component[0], set())
        )
        if cyclic:
            cycles.append(tuple(sorted(component)))

    for node in sorted(nodes):
        if node not in indices:
            visit(node)

    return tuple(sorted(cycles))


def _map_findings(
    *,
    rows: list[RedirectMapEntryResponse],
    duplicate_source_count: int,
    conflicting_source_count: int,
    self_redirect_count: int,
    chain_source_count: int,
    cycle_count: int,
) -> list[RedirectMapFindingResponse]:
    findings: list[RedirectMapFindingResponse] = []
    mismatch_count = sum(
        row.fetch_state == "ok"
        and (row.target_matches is not True or row.status_matches is False)
        for row in rows
    )
    failed_count = sum(row.fetch_state != "ok" for row in rows)

    if conflicting_source_count:
        findings.append(
            RedirectMapFindingResponse(
                id="conflicting-source-targets",
                title="Some source URLs map to more than one target",
                severity="high",
                value=str(conflicting_source_count),
                recommendation=(
                    "Choose one deterministic target for each source URL before deployment."
                ),
            )
        )
    if cycle_count:
        findings.append(
            RedirectMapFindingResponse(
                id="redirect-map-cycles",
                title="The supplied redirect map contains cycles",
                severity="high",
                value=str(cycle_count),
                recommendation=(
                    "Break every cycle so each source reaches a terminal destination."
                ),
            )
        )
    if self_redirect_count:
        findings.append(
            RedirectMapFindingResponse(
                id="self-redirects",
                title="Some sources redirect to themselves",
                severity="high",
                value=str(self_redirect_count),
                recommendation="Remove self-redirect rules.",
            )
        )
    if mismatch_count:
        findings.append(
            RedirectMapFindingResponse(
                id="observed-map-mismatches",
                title="Observed redirects do not match the supplied map",
                severity="high",
                value=str(mismatch_count),
                recommendation=(
                    "Review the first redirect target and status for every mismatched row."
                ),
            )
        )
    if failed_count:
        findings.append(
            RedirectMapFindingResponse(
                id="unverified-map-sources",
                title="Some source URLs could not be verified",
                severity="high",
                value=str(failed_count),
                recommendation=(
                    "Resolve rejected, unreachable, or invalid sources before relying on the map."
                ),
            )
        )
    if chain_source_count:
        findings.append(
            RedirectMapFindingResponse(
                id="map-chains",
                title="Some map targets are also redirect sources",
                severity="medium",
                value=str(chain_source_count),
                recommendation=(
                    "Point sources directly to terminal destinations when the migration "
                    "plan allows it."
                ),
            )
        )
    if duplicate_source_count:
        findings.append(
            RedirectMapFindingResponse(
                id="duplicate-source-rows",
                title="The supplied map repeats source URLs",
                severity="medium",
                value=str(duplicate_source_count),
                recommendation=(
                    "Deduplicate rows so deployment order cannot change the effective rule."
                ),
            )
        )
    return findings


def _overall_status(
    rows: list[RedirectMapEntryResponse],
    cycles: tuple[tuple[str, ...], ...],
) -> ToolStatus:
    if cycles or any(row.status == "fail" for row in rows):
        return "fail"
    if any(row.status == "warning" for row in rows):
        return "warning"
    return "pass"


def _map_recommendation(
    overall_status: ToolStatus,
    mismatch_count: int,
    failed_count: int,
) -> str:
    if overall_status == "pass":
        return (
            "Every checked source produced the expected first redirect target and optional "
            "status. Keep the map under version control and re-run it after deployment changes."
        )
    if overall_status == "fail":
        return (
            f"Resolve {mismatch_count} observed mismatch(es) and {failed_count} unverified "
            "row(s), then rerun the explicit map. The validator does not crawl for missing rules."
        )
    return (
        "The checked rows match, but duplicate rows, chains, fragments, or other review "
        "signals remain. Confirm the intended migration semantics before deployment."
    )


def _dedupe(values: list[str]) -> list[str]:
    return list(dict.fromkeys(values))
