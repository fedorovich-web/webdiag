from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser


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
class HtmlMetadata:
    title: str | None
    meta_description: str | None
    canonical_url: str | None
    robots: tuple[RobotsDirective, ...]
    h1: tuple[str, ...]
    open_graph: tuple[MetaSignal, ...] = ()
    twitter_cards: tuple[MetaSignal, ...] = ()
    json_ld_scripts: tuple[ScriptBlock, ...] = ()

    @property
    def has_noindex(self) -> bool:
        return any("noindex" in directive.content.lower() for directive in self.robots)

    @property
    def has_nofollow(self) -> bool:
        return any("nofollow" in directive.content.lower() for directive in self.robots)


class _MetadataParser(HTMLParser):
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

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        name = tag.lower()
        values = {key.lower(): (value or "").strip() for key, value in attrs}
        if name == "title":
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
    )
