from __future__ import annotations

from dataclasses import dataclass
from html.parser import HTMLParser


@dataclass(frozen=True, slots=True)
class RobotsDirective:
    user_agent: str
    content: str


@dataclass(frozen=True, slots=True)
class HtmlMetadata:
    title: str | None
    meta_description: str | None
    canonical_url: str | None
    robots: tuple[RobotsDirective, ...]
    h1: tuple[str, ...]

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
        self._title_parts: list[str] = []
        self._current_h1_parts: list[str] = []
        self.title: str | None = None
        self.meta_description: str | None = None
        self.canonical_url: str | None = None
        self.robots: list[RobotsDirective] = []
        self.h1: list[str] = []

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
            meta_name = values.get("name", "").lower()
            content = values.get("content", "")
            if meta_name == "description" and content and self.meta_description is None:
                self.meta_description = _collapse_whitespace(content)
            if meta_name in {"robots", "googlebot", "yandex"} and content:
                self.robots.append(RobotsDirective(user_agent=meta_name, content=content))
            return
        if name == "link":
            rel = {part.lower() for part in values.get("rel", "").split()}
            href = values.get("href", "")
            if "canonical" in rel and href and self.canonical_url is None:
                self.canonical_url = href

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

    def handle_data(self, data: str) -> None:
        if self._title_depth > 0:
            self._title_parts.append(data)
        if self._h1_depth > 0:
            self._current_h1_parts.append(data)


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
    )
