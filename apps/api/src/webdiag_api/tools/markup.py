from __future__ import annotations

from collections import Counter
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import (
    SafeFetchConfig,
    SafeFetchError,
    SafeFetchResult,
    SafeHttpFetcher,
)
from webdiag_api.audit.html_metadata import HtmlMetadata, parse_html_metadata
from webdiag_api.audit.structured_data import analyze_json_ld_scripts
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])


class MarkupPageRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class StructuredDataBlockResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    index: int = Field(ge=1)
    valid: bool
    types: tuple[str, ...]
    node_count: int = Field(ge=0)
    error: str | None = Field(default=None, max_length=500)


class StructuredDataTypeSummaryResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    type: str = Field(min_length=1, max_length=160)
    count: int = Field(ge=1)


class StructuredDataValidatorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.structured_data.v1"] = (
        "webdiag.tool.structured_data.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    json_ld_count: int = Field(ge=0)
    valid_json_ld_count: int = Field(ge=0)
    invalid_json_ld_count: int = Field(ge=0)
    detected_types: tuple[StructuredDataTypeSummaryResponse, ...]
    blocks: tuple[StructuredDataBlockResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class HtmlMarkupCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    title: str = Field(min_length=1, max_length=180)
    status: Literal["pass", "warning", "fail"]
    severity: Literal["info", "medium", "high"]
    message: str = Field(min_length=1, max_length=500)
    recommendation: str = Field(min_length=1, max_length=600)


class HtmlMarkupValidatorResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.html_markup.v1"] = (
        "webdiag.tool.html_markup.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = None
    doctype_present: bool
    html_tag_present: bool
    head_tag_present: bool
    body_tag_present: bool
    html_lang: str | None = Field(default=None, max_length=80)
    title: str | None = Field(default=None, max_length=1_000)
    viewport_present: bool
    duplicate_id_count: int = Field(ge=0)
    unexpected_end_tag_count: int = Field(ge=0)
    unclosed_tag_count: int = Field(ge=0)
    checks: tuple[HtmlMarkupCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class _HtmlMarkupParser(HTMLParser):
    _VOID_TAGS = {
        "area",
        "base",
        "br",
        "col",
        "embed",
        "hr",
        "img",
        "input",
        "link",
        "meta",
        "param",
        "source",
        "track",
        "wbr",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.doctype_present = False
        self.html_tag_present = False
        self.head_tag_present = False
        self.body_tag_present = False
        self.html_lang: str | None = None
        self.viewport_present = False
        self.ids: list[str] = []
        self.unexpected_end_tags: list[str] = []
        self.open_tags: list[str] = []

    def handle_decl(self, decl: str) -> None:
        if decl.strip().lower().startswith("doctype"):
            self.doctype_present = True

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        values = {key.lower(): (value or "").strip() for key, value in attrs}
        if name == "html":
            self.html_tag_present = True
            self.html_lang = values.get("lang") or self.html_lang
        elif name == "head":
            self.head_tag_present = True
        elif name == "body":
            self.body_tag_present = True
        elif name == "meta" and values.get("name", "").lower() == "viewport":
            self.viewport_present = bool(values.get("content"))

        element_id = values.get("id")
        if element_id:
            self.ids.append(element_id)

        if name not in self._VOID_TAGS:
            self.open_tags.append(name)

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if name in self._VOID_TAGS:
            return
        if name not in self.open_tags:
            self.unexpected_end_tags.append(name)
            return
        while self.open_tags:
            current = self.open_tags.pop()
            if current == name:
                return


def get_markup_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


MarkupFetcherDependency = Annotated[SafeHttpFetcher, Depends(get_markup_fetcher)]


@router.post("/v1/tools/structured-data", response_model=StructuredDataValidatorResponse)
def inspect_structured_data(
    payload: MarkupPageRequest,
    fetcher: MarkupFetcherDependency,
) -> StructuredDataValidatorResponse:
    fetched, metadata = _fetch_markup(payload.url, fetcher)
    report = analyze_json_ld_scripts(metadata.json_ld_scripts)
    type_counts = Counter(type_name for block in report.blocks for type_name in block.types)
    detected_types = tuple(
        StructuredDataTypeSummaryResponse(type=type_name, count=count)
        for type_name, count in sorted(type_counts.items())
    )
    blocks = tuple(
        StructuredDataBlockResponse(
            index=block.index,
            valid=block.valid,
            types=block.types,
            node_count=block.node_count,
            error=block.error,
        )
        for block in report.blocks
    )
    return StructuredDataValidatorResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        json_ld_count=report.block_count,
        valid_json_ld_count=report.valid_count,
        invalid_json_ld_count=report.invalid_count,
        detected_types=detected_types,
        blocks=blocks,
        recommendation=_structured_data_recommendation(report.block_count, report.invalid_count),
    )


@router.post("/v1/tools/html-validator", response_model=HtmlMarkupValidatorResponse)
def inspect_html_markup(
    payload: MarkupPageRequest,
    fetcher: MarkupFetcherDependency,
) -> HtmlMarkupValidatorResponse:
    fetched, metadata = _fetch_markup(payload.url, fetcher)
    parser = _HtmlMarkupParser()
    parser.feed(fetched.body_text)
    parser.close()
    duplicate_ids = [item for item, count in Counter(parser.ids).items() if count > 1]
    checks = tuple(_html_markup_checks(parser, metadata.title, duplicate_ids, fetched.status_code))
    return HtmlMarkupValidatorResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        doctype_present=parser.doctype_present,
        html_tag_present=parser.html_tag_present,
        head_tag_present=parser.head_tag_present,
        body_tag_present=parser.body_tag_present,
        html_lang=parser.html_lang,
        title=metadata.title,
        viewport_present=parser.viewport_present,
        duplicate_id_count=len(duplicate_ids),
        unexpected_end_tag_count=len(parser.unexpected_end_tags),
        unclosed_tag_count=len(parser.open_tags),
        checks=checks,
        recommendation=_html_markup_recommendation(checks),
    )


def _fetch_markup(
    raw_url: str,
    fetcher: SafeHttpFetcher,
) -> tuple[SafeFetchResult, HtmlMetadata]:
    try:
        fetched = fetcher.fetch(raw_url)
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
    return fetched, parse_html_metadata(fetched.body_text)


def _structured_data_recommendation(block_count: int, invalid_count: int) -> str:
    if block_count == 0:
        return (
            "No JSON-LD structured data blocks were found. Add Schema.org markup only "
            "where it describes visible page content and can be maintained reliably."
        )
    if invalid_count > 0:
        return (
            "Fix invalid JSON-LD blocks before relying on rich result eligibility. "
            "One malformed script can make important structured data unusable."
        )
    return (
        "JSON-LD blocks are syntactically valid. Review the detected Schema.org "
        "types against the visible content and Google's rich result requirements."
    )


def _check(
    check_id: str,
    title: str,
    passed: bool,
    message: str,
    fail_recommendation: str,
    *,
    severity: Literal["info", "medium", "high"] = "medium",
) -> HtmlMarkupCheckResponse:
    return HtmlMarkupCheckResponse(
        id=check_id,
        title=title,
        status="pass" if passed else "fail",
        severity="info" if passed else severity,
        message=message,
        recommendation="No action required." if passed else fail_recommendation,
    )


def _html_markup_checks(
    parser: _HtmlMarkupParser,
    title: str | None,
    duplicate_ids: list[str],
    status_code: int,
) -> list[HtmlMarkupCheckResponse]:
    checks = [
        _check(
            "http-status",
            "HTTP response",
            status_code < 400,
            f"HTTP {status_code}",
            "Fix the HTTP response before validating markup quality.",
            severity="high",
        ),
        _check(
            "doctype",
            "Document type",
            parser.doctype_present,
            "HTML doctype is present." if parser.doctype_present else "HTML doctype is missing.",
            "Add <!doctype html> at the top of the document.",
        ),
        _check(
            "document-structure",
            "Document structure",
            parser.html_tag_present and parser.head_tag_present and parser.body_tag_present,
            "html/head/body tags are present."
            if parser.html_tag_present and parser.head_tag_present and parser.body_tag_present
            else "One or more html/head/body tags are missing.",
            (
                "Keep explicit html, head, and body tags so crawlers and validators "
                "see a stable document structure."
            ),
        ),
        _check(
            "html-lang",
            "HTML language",
            bool(parser.html_lang),
            f"lang={parser.html_lang}" if parser.html_lang else "html lang attribute is missing.",
            (
                "Add a valid lang attribute to the html element, for example "
                "lang=\"ru\" or lang=\"en\"."
            ),
        ),
        _check(
            "title",
            "Title element",
            bool(title),
            "A title element is present." if title else "The title element is missing or empty.",
            "Add a descriptive title element in the head section.",
        ),
        _check(
            "viewport",
            "Mobile viewport",
            parser.viewport_present,
            (
                "Viewport meta tag is present."
                if parser.viewport_present
                else "Viewport meta tag is missing."
            ),
            "Add a viewport meta tag for responsive rendering on mobile devices.",
        ),
        _check(
            "duplicate-ids",
            "Duplicate IDs",
            len(duplicate_ids) == 0,
            "No duplicate id attributes were found."
            if not duplicate_ids
            else "Duplicate IDs: " + ", ".join(duplicate_ids[:8]),
            (
                "Make id attributes unique so anchors, labels, ARIA references, "
                "and scripts target the intended element."
            ),
        ),
        _check(
            "unexpected-end-tags",
            "Unexpected closing tags",
            len(parser.unexpected_end_tags) == 0,
            "No unexpected closing tags were found."
            if not parser.unexpected_end_tags
            else "Unexpected closing tags: " + ", ".join(parser.unexpected_end_tags[:8]),
            "Fix unmatched closing tags in the HTML source.",
        ),
    ]
    if parser.open_tags:
        checks.append(
            HtmlMarkupCheckResponse(
                id="unclosed-tags",
                title="Unclosed tags",
                status="warning",
                severity="medium",
                message="Open tags left after parsing: " + ", ".join(parser.open_tags[-8:]),
                recommendation=(
                    "Review the HTML template for unclosed non-void tags. Browsers may "
                    "repair markup differently than validators and crawlers."
                ),
            )
        )
    else:
        checks.append(
            HtmlMarkupCheckResponse(
                id="unclosed-tags",
                title="Unclosed tags",
                status="pass",
                severity="info",
                message="No unclosed non-void tags were left after parsing.",
                recommendation="No action required.",
            )
        )
    return checks


def _html_markup_recommendation(checks: tuple[HtmlMarkupCheckResponse, ...]) -> str:
    failing = [check for check in checks if check.status == "fail"]
    warnings = [check for check in checks if check.status == "warning"]
    if failing:
        return (
            "Fix high-impact HTML structure problems first: document skeleton, lang, "
            "title, viewport, duplicate IDs, and unmatched tags."
        )
    if warnings:
        return (
            "HTML structure has no blocking failures, but warnings remain. Review the "
            "template before relying on this as production-clean markup."
        )
    return (
        "Basic HTML structure checks passed. This is a deterministic WebDiag markup "
        "inspection, not a full W3C conformance validation."
    )
