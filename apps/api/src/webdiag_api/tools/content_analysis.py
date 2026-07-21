from __future__ import annotations

import re
from collections import Counter
from dataclasses import dataclass
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
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

_WORD_RE = re.compile(r"[\w\u0400-\u04ff]+(?:[-’'][\w\u0400-\u04ff]+)?", re.UNICODE)
_SENTENCE_RE = re.compile(r"[^.!?。！？]+[.!?。！？]?")
_RU_STOPWORDS = {
    "и",
    "в",
    "во",
    "не",
    "на",
    "с",
    "со",
    "для",
    "по",
    "из",
    "от",
    "до",
    "как",
    "что",
    "это",
    "или",
    "а",
    "но",
    "за",
    "при",
    "же",
    "бы",
    "мы",
    "вы",
    "он",
    "она",
    "они",
    "оно",
    "его",
    "ее",
    "их",
    "ваш",
    "ваша",
    "ваши",
    "наш",
    "наша",
    "наши",
}
_EN_STOPWORDS = {
    "a",
    "an",
    "and",
    "are",
    "as",
    "at",
    "be",
    "by",
    "for",
    "from",
    "in",
    "is",
    "it",
    "of",
    "on",
    "or",
    "that",
    "the",
    "this",
    "to",
    "with",
    "you",
    "your",
    "we",
    "our",
}
_STOPWORDS = _RU_STOPWORDS | _EN_STOPWORDS


class ContentAnalysisRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class HeadingItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    index: int = Field(ge=1)
    level: int = Field(ge=1, le=6)
    text: str = Field(max_length=500)
    empty: bool
    skipped_from_previous: bool


class HeadingCheckResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=80)
    status: Literal["pass", "warning", "fail"]
    severity: Literal["info", "medium", "high"]
    message: str = Field(min_length=1, max_length=500)
    recommendation: str = Field(min_length=1, max_length=600)


class HeadingStructureResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.heading_structure.v1"] = (
        "webdiag.tool.heading_structure.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    total_headings: int = Field(ge=0)
    h1_count: int = Field(ge=0)
    skipped_level_count: int = Field(ge=0)
    empty_heading_count: int = Field(ge=0)
    outline: tuple[HeadingItemResponse, ...]
    checks: tuple[HeadingCheckResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class TermFrequencyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    term: str = Field(min_length=1, max_length=160)
    count: int = Field(ge=1)
    density_percent: float = Field(ge=0)


class KeywordFrequencyResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.keyword_frequency.v1"] = (
        "webdiag.tool.keyword_frequency.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    total_words: int = Field(ge=0)
    unique_terms: int = Field(ge=0)
    top_words: tuple[TermFrequencyResponse, ...]
    top_bigrams: tuple[TermFrequencyResponse, ...]
    top_trigrams: tuple[TermFrequencyResponse, ...]
    overused_terms: tuple[TermFrequencyResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


class ReadabilityMetricResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=120)
    value: float = Field(ge=0)
    unit: str = Field(min_length=1, max_length=80)


class ReadabilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.readability.v1"] = (
        "webdiag.tool.readability.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    formula_scope: Literal["multilingual_heuristic"] = "multilingual_heuristic"
    word_count: int = Field(ge=0)
    sentence_count: int = Field(ge=0)
    paragraph_count: int = Field(ge=0)
    long_sentence_count: int = Field(ge=0)
    estimated_reading_time_minutes: int = Field(ge=1)
    readability_score: int = Field(ge=0, le=100)
    metrics: tuple[ReadabilityMetricResponse, ...]
    recommendation: str = Field(min_length=1, max_length=800)


@dataclass(frozen=True, slots=True)
class ParsedHeading:
    level: int
    text: str
    empty: bool


@dataclass(frozen=True, slots=True)
class ParsedContent:
    headings: tuple[ParsedHeading, ...]
    text: str
    paragraphs: tuple[str, ...]


class _ContentParser(HTMLParser):
    _SKIP_TAGS = {"script", "style", "noscript", "svg", "canvas", "template"}
    _BLOCK_TAGS = {
        "p",
        "li",
        "section",
        "article",
        "main",
        "div",
        "td",
        "th",
        "blockquote",
    }

    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._skip_depth = 0
        self._heading_level: int | None = None
        self._heading_parts: list[str] = []
        self._paragraph_depth = 0
        self._paragraph_parts: list[str] = []
        self._text_parts: list[str] = []
        self.headings: list[ParsedHeading] = []
        self.paragraphs: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        del attrs
        name = tag.lower()
        if name in self._SKIP_TAGS:
            self._skip_depth += 1
            return
        if self._skip_depth > 0:
            return
        if name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self._heading_level = int(name[1])
            self._heading_parts = []
        if name in self._BLOCK_TAGS:
            self._paragraph_depth += 1
            if self._paragraph_depth == 1:
                self._paragraph_parts = []

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if name in self._SKIP_TAGS and self._skip_depth > 0:
            self._skip_depth -= 1
            return
        if self._skip_depth > 0:
            return
        if name in {"h1", "h2", "h3", "h4", "h5", "h6"} and self._heading_level:
            text = _collapse_whitespace("".join(self._heading_parts))
            self.headings.append(
                ParsedHeading(
                    level=self._heading_level,
                    text=text[:500],
                    empty=not bool(text),
                )
            )
            self._heading_level = None
            self._heading_parts = []
        if name in self._BLOCK_TAGS and self._paragraph_depth > 0:
            self._paragraph_depth -= 1
            if self._paragraph_depth == 0:
                paragraph = _collapse_whitespace("".join(self._paragraph_parts))
                if paragraph:
                    self.paragraphs.append(paragraph)
                self._paragraph_parts = []

    def handle_data(self, data: str) -> None:
        if self._skip_depth > 0:
            return
        if self._heading_level:
            self._heading_parts.append(data)
        if self._paragraph_depth > 0:
            self._paragraph_parts.append(data)
        self._text_parts.append(data)

    def parsed(self) -> ParsedContent:
        return ParsedContent(
            headings=tuple(self.headings),
            text=_collapse_whitespace(" ".join(self._text_parts)),
            paragraphs=tuple(self.paragraphs),
        )


def get_content_analysis_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(config=SafeFetchConfig(max_body_bytes=1_000_000))


ContentAnalysisFetcherDependency = Annotated[
    SafeHttpFetcher,
    Depends(get_content_analysis_fetcher),
]


@router.post("/v1/tools/heading-structure", response_model=HeadingStructureResponse)
def inspect_heading_structure(
    payload: ContentAnalysisRequest,
    fetcher: ContentAnalysisFetcherDependency,
) -> HeadingStructureResponse:
    fetched, parsed = _fetch_content(payload.url, fetcher)
    outline = _heading_outline(parsed.headings)
    checks = tuple(_heading_checks(outline))
    return HeadingStructureResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        total_headings=len(outline),
        h1_count=sum(item.level == 1 for item in outline),
        skipped_level_count=sum(item.skipped_from_previous for item in outline),
        empty_heading_count=sum(item.empty for item in outline),
        outline=tuple(outline[:80]),
        checks=checks,
        recommendation=_heading_recommendation(checks),
    )


@router.post("/v1/tools/keyword-density", response_model=KeywordFrequencyResponse)
def inspect_keyword_frequency(
    payload: ContentAnalysisRequest,
    fetcher: ContentAnalysisFetcherDependency,
) -> KeywordFrequencyResponse:
    fetched, parsed = _fetch_content(payload.url, fetcher)
    words = _content_words(parsed.text)
    meaningful_words = [word for word in words if word not in _STOPWORDS and len(word) > 2]
    top_words = _top_terms(meaningful_words, denominator=max(len(words), 1), limit=15)
    top_bigrams = _top_terms(_ngrams(meaningful_words, 2), denominator=max(len(words), 1), limit=10)
    top_trigrams = _top_terms(
        _ngrams(meaningful_words, 3),
        denominator=max(len(words), 1),
        limit=10,
    )
    overused = tuple(term for term in top_words if term.density_percent >= 7.0)
    return KeywordFrequencyResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        total_words=len(words),
        unique_terms=len(set(meaningful_words)),
        top_words=top_words,
        top_bigrams=top_bigrams,
        top_trigrams=top_trigrams,
        overused_terms=overused,
        recommendation=_keyword_recommendation(len(words), overused),
    )


@router.post("/v1/tools/readability", response_model=ReadabilityResponse)
def inspect_readability(
    payload: ContentAnalysisRequest,
    fetcher: ContentAnalysisFetcherDependency,
) -> ReadabilityResponse:
    fetched, parsed = _fetch_content(payload.url, fetcher)
    words = _content_words(parsed.text)
    sentences = _sentences(parsed.text)
    sentence_count = max(len(sentences), 1)
    word_count = len(words)
    avg_sentence_words = word_count / sentence_count if sentence_count else 0
    avg_word_length = sum(len(word) for word in words) / word_count if word_count else 0
    long_sentence_count = sum(len(_content_words(sentence)) > 28 for sentence in sentences)
    score = _readability_score(avg_sentence_words, avg_word_length, long_sentence_count)
    return ReadabilityResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        word_count=word_count,
        sentence_count=len(sentences),
        paragraph_count=len(parsed.paragraphs),
        long_sentence_count=long_sentence_count,
        estimated_reading_time_minutes=max(1, round(word_count / 220)),
        readability_score=score,
        metrics=(
            ReadabilityMetricResponse(
                name="Average sentence length",
                value=round(avg_sentence_words, 1),
                unit="words",
            ),
            ReadabilityMetricResponse(
                name="Average word length",
                value=round(avg_word_length, 1),
                unit="characters",
            ),
            ReadabilityMetricResponse(
                name="Long sentences",
                value=float(long_sentence_count),
                unit="sentences",
            ),
        ),
        recommendation=_readability_recommendation(word_count, score, long_sentence_count),
    )


def _fetch_content(
    raw_url: str,
    fetcher: SafeHttpFetcher,
) -> tuple[SafeFetchResult, ParsedContent]:
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
    if fetched.content_type and "html" not in fetched.content_type.lower():
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail={
                "code": "tool_non_html_response",
                "message": "Target URL did not return HTML.",
            },
        )
    parser = _ContentParser()
    parser.feed(fetched.body_text)
    parser.close()
    return fetched, parser.parsed()


def _heading_outline(headings: tuple[ParsedHeading, ...]) -> list[HeadingItemResponse]:
    outline: list[HeadingItemResponse] = []
    previous_level: int | None = None
    for index, heading in enumerate(headings, start=1):
        skipped = previous_level is not None and heading.level > previous_level + 1
        outline.append(
            HeadingItemResponse(
                index=index,
                level=heading.level,
                text=heading.text,
                empty=heading.empty,
                skipped_from_previous=skipped,
            )
        )
        previous_level = heading.level
    return outline


def _heading_checks(outline: list[HeadingItemResponse]) -> list[HeadingCheckResponse]:
    h1_count = sum(item.level == 1 for item in outline)
    skipped = sum(item.skipped_from_previous for item in outline)
    empty = sum(item.empty for item in outline)
    checks = [
        HeadingCheckResponse(
            id="h1-summary",
            status="pass" if h1_count == 1 else "fail",
            severity="high" if h1_count == 0 else "medium",
            message=f"Detected {h1_count} H1 headings.",
            recommendation="Keep one clear H1 that names the primary page topic.",
        ),
        HeadingCheckResponse(
            id="outline-order",
            status="pass" if skipped == 0 else "warning",
            severity="medium",
            message=f"Detected {skipped} skipped heading-level transitions.",
            recommendation="Avoid jumping from H1 to H3/H4 when the content hierarchy changes.",
        ),
        HeadingCheckResponse(
            id="empty-headings",
            status="pass" if empty == 0 else "warning",
            severity="medium",
            message=f"Detected {empty} empty headings.",
            recommendation="Remove empty heading tags or replace them with visible section labels.",
        ),
    ]
    if not outline:
        checks.append(
            HeadingCheckResponse(
                id="heading-coverage",
                status="fail",
                severity="high",
                message="No heading tags were found in the static HTML.",
                recommendation=(
                    "Add a semantic heading outline for users, crawlers, "
                    "and assistive tech."
                ),
            )
        )
    return checks


def _heading_recommendation(checks: tuple[HeadingCheckResponse, ...]) -> str:
    if any(check.status == "fail" for check in checks):
        return "Fix failed heading checks before tuning smaller on-page SEO details."
    if any(check.status == "warning" for check in checks):
        return "Heading structure is usable but has hierarchy issues worth cleaning up."
    return "Heading structure looks controlled in the bounded static HTML scan."


def _content_words(text: str) -> list[str]:
    return [match.group(0).lower() for match in _WORD_RE.finditer(text)]


def _sentences(text: str) -> list[str]:
    return [item.strip() for item in _SENTENCE_RE.findall(text) if _content_words(item)]


def _ngrams(words: list[str], size: int) -> list[str]:
    if len(words) < size:
        return []
    return [" ".join(words[index : index + size]) for index in range(len(words) - size + 1)]


def _top_terms(
    terms: list[str],
    *,
    denominator: int,
    limit: int,
) -> tuple[TermFrequencyResponse, ...]:
    counter = Counter(terms)
    return tuple(
        TermFrequencyResponse(
            term=term,
            count=count,
            density_percent=round(count / denominator * 100, 2),
        )
        for term, count in counter.most_common(limit)
    )


def _keyword_recommendation(
    word_count: int,
    overused: tuple[TermFrequencyResponse, ...],
) -> str:
    if word_count < 120:
        return (
            "The visible text is thin for frequency analysis; "
            "review the page content depth first."
        )
    if overused:
        return "Review repeated terms for keyword stuffing risk and improve semantic variety."
    return "Keyword and phrase distribution looks balanced for a static text scan."


def _readability_score(
    avg_sentence_words: float,
    avg_word_length: float,
    long_sentence_count: int,
) -> int:
    score = 100
    score -= max(0, avg_sentence_words - 16) * 2.1
    score -= max(0, avg_word_length - 6) * 6
    score -= min(long_sentence_count, 10) * 3
    return max(0, min(100, round(score)))


def _readability_recommendation(
    word_count: int,
    score: int,
    long_sentence_count: int,
) -> str:
    if word_count < 120:
        return "The page has limited visible text; readability is less reliable for thin pages."
    if score < 60:
        return "Simplify long sentences, split dense paragraphs, and make key points scannable."
    if long_sentence_count:
        return "Readability is acceptable, but long sentences should be shortened for scanning."
    return "Readability looks controlled for the static visible text scan."


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split())
