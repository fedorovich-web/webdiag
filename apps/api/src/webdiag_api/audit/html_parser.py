from html.parser import HTMLParser


class TemplateAwareHTMLParser(HTMLParser):
    def handle_startendtag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        if tag.lower() == "template":
            self.handle_starttag(tag, attrs)
        else:
            super().handle_startendtag(tag, attrs)
