from __future__ import annotations

import re
from dataclasses import dataclass

from webdiag_api.audit.html_parser import TemplateAwareHTMLParser


def robots_has_directive(content: str, directive: str) -> bool:
    tokens = set(re.split(r"[\s,]+", content.casefold().strip()))
    return directive in tokens or (directive in {"noindex", "nofollow"} and "none" in tokens)


def x_robots_has_directive(content: str, directive: str) -> bool:
    return any(
        robots_has_directive(part.rsplit(":", maxsplit=1)[-1], directive)
        for part in content.split(",")
    )


@dataclass(frozen=True, slots=True)
class RobotsDirective:
    user_agent: str
    content: str


@dataclass(frozen=True, slots=True)
class MetaSignal:
    name: str
    content: str


@dataclass(frozen=True, slots=True)
class ScriptBlock:
    script_type: str
    content: str


@dataclass(frozen=True, slots=True)
class ImageSignal:
    has_alt: bool
    has_dimensions: bool


@dataclass(frozen=True, slots=True)
class HtmlMetadata:
    title: str | None
    meta_description: str | None
    canonical_url: str | None
    robots: tuple[RobotsDirective, ...]
    h1: tuple[str, ...]
    open_graph: tuple[MetaSignal, ...] = ()
    twitter_cards: tuple[MetaSignal, ...] = ()
    json_ld_scripts: tuple[ScriptBlock, ...] = ()
    html_lang: str | None = None
    viewport: str | None = None
    heading_levels: tuple[int, ...] = ()
    images: tuple[ImageSignal, ...] = ()
    title_count: int = 0
    description_count: int = 0
    canonical_count: int = 0
    base_href: str | None = None

    @property
    def has_noindex(self) -> bool:
        return any(robots_has_directive(item.content, "noindex") for item in self.robots)

    @property
    def has_nofollow(self) -> bool:
        return any(robots_has_directive(item.content, "nofollow") for item in self.robots)


class _MetadataParser(TemplateAwareHTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self._title_depth = 0
        self._h1_depth = 0
        self._json_ld_depth = 0
        self._current_script_type: str | None = None
        self._title_parts: list[str] = []
        self._current_h1_parts: list[str] = []
        self._current_script_parts: list[str] = []
        self.title: str | None = None
        self.meta_description: str | None = None
        self.canonical_url: str | None = None
        self.robots: list[RobotsDirective] = []
        self.h1: list[str] = []
        self.open_graph: list[MetaSignal] = []
        self.twitter_cards: list[MetaSignal] = []
        self.json_ld_scripts: list[ScriptBlock] = []
        self.html_lang: str | None = None
        self.viewport: str | None = None
        self.heading_levels: list[int] = []
        self.images: list[ImageSignal] = []
        self.title_count = 0
        self.description_count = 0
        self.canonical_count = 0
        self.base_href: str | None = None
        self._ignored_depth = 0

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        if name in {"template", "svg"}:
            self._ignored_depth += 1
            return
        if self._ignored_depth:
            return
        values = {key.lower(): (value or "").strip() for key, value in attrs}
        if name == "base" and self.base_href is None and "href" in values:
            self.base_href = values["href"]
        if name == "html":
            self.html_lang = values.get("lang") or None
        if name in {"h1", "h2", "h3", "h4", "h5", "h6"}:
            self.heading_levels.append(int(name[1]))
        if name == "img":
            self.images.append(
                ImageSignal(
                    has_alt="alt" in values,
                    has_dimensions=all(
                        values.get(key, "").isascii()
                        and values.get(key, "").isdigit()
                        and bool(values[key].lstrip("0"))
                        for key in ("width", "height")
                    ),
                )
            )
        if name == "title":
            self.title_count += 1
            self._title_depth += 1
            return
        if name == "h1":
            self._h1_depth += 1
            self._current_h1_parts = []
            return
        if name == "meta":
            self._handle_meta(values)
            return
        if name == "link":
            self._handle_link(values)
            return
        if name == "script":
            script_type = values.get("type", "").lower()
            if "application/ld+json" in script_type:
                self._json_ld_depth += 1
                self._current_script_type = script_type
                self._current_script_parts = []

    def handle_endtag(self, tag: str) -> None:
        name = tag.lower()
        if name in {"template", "svg"}:
            self._ignored_depth = max(0, self._ignored_depth - 1)
            return
        if self._ignored_depth:
            return
        if name == "title" and self._title_depth > 0:
            self._title_depth -= 1
            if self._title_depth == 0 and self.title is None:
                title = _collapse_whitespace("".join(self._title_parts))
                self.title = title or None
            return
        if name == "h1" and self._h1_depth > 0:
            self._h1_depth -= 1
            if self._h1_depth == 0:
                text = _collapse_whitespace("".join(self._current_h1_parts))
                if text:
                    self.h1.append(text)
                self._current_h1_parts = []
            return
        if name == "script" and self._json_ld_depth > 0:
            self._json_ld_depth -= 1
            if self._json_ld_depth == 0 and self._current_script_type is not None:
                content = "".join(self._current_script_parts).strip()
                if content:
                    self.json_ld_scripts.append(
                        ScriptBlock(
                            script_type=self._current_script_type,
                            content=content,
                        )
                    )
                self._current_script_type = None
                self._current_script_parts = []

    def handle_data(self, data: str) -> None:
        if self._ignored_depth:
            return
        if self._title_depth > 0:
            self._title_parts.append(data)
        if self._h1_depth > 0:
            self._current_h1_parts.append(data)
        if self._json_ld_depth > 0:
            self._current_script_parts.append(data)

    def _handle_meta(self, values: dict[str, str]) -> None:
        meta_name = values.get("name", "").lower()
        meta_property = values.get("property", "").lower()
        content = values.get("content", "")
        if meta_name == "description":
            self.description_count += 1
        if meta_name == "viewport" and self.viewport is None:
            self.viewport = content or None
        if meta_name == "description" and content and self.meta_description is None:
            self.meta_description = _collapse_whitespace(content)
        if meta_name in {"robots", "googlebot", "yandex"} and content:
            self.robots.append(RobotsDirective(user_agent=meta_name, content=content))
        if meta_property.startswith("og:") and content:
            self.open_graph.append(
                MetaSignal(name=meta_property, content=_collapse_whitespace(content))
            )
        if meta_name.startswith("twitter:") and content:
            self.twitter_cards.append(
                MetaSignal(name=meta_name, content=_collapse_whitespace(content))
            )

    def _handle_link(self, values: dict[str, str]) -> None:
        rel = {part.lower() for part in values.get("rel", "").split()}
        href = values.get("href", "")
        if "canonical" in rel:
            self.canonical_count += 1
        if "canonical" in rel and href and self.canonical_url is None:
            self.canonical_url = href


def _collapse_whitespace(value: str) -> str:
    return " ".join(value.split())


def parse_html_metadata(html: str) -> HtmlMetadata:
    parser = _MetadataParser()
    parser.feed(html)
    parser.close()
    return HtmlMetadata(
        title=parser.title,
        meta_description=parser.meta_description,
        canonical_url=parser.canonical_url,
        robots=tuple(parser.robots),
        h1=tuple(parser.h1),
        open_graph=tuple(parser.open_graph),
        twitter_cards=tuple(parser.twitter_cards),
        json_ld_scripts=tuple(parser.json_ld_scripts),
        html_lang=parser.html_lang,
        viewport=parser.viewport,
        heading_levels=tuple(parser.heading_levels),
        images=tuple(parser.images),
        title_count=parser.title_count,
        description_count=parser.description_count,
        canonical_count=parser.canonical_count,
        base_href=parser.base_href,
    )
