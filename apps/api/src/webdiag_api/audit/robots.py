from __future__ import annotations

from dataclasses import dataclass
from urllib.parse import urlsplit


@dataclass(frozen=True, slots=True)
class RobotsTxtRule:
    user_agent: str
    directive: str
    value: str


@dataclass(frozen=True, slots=True)
class RobotsTxtSummary:
    robots_url: str
    status_code: int | None
    available: bool
    allows_target: bool | None
    disallow_rules: tuple[RobotsTxtRule, ...]
    sitemap_urls: tuple[str, ...]
    matched_disallow_rule: str | None = None
    fetch_error: str | None = None


def analyze_robots_txt(
    body_text: str,
    *,
    robots_url: str,
    target_url: str,
    status_code: int | None,
    fetch_error: str | None = None,
) -> RobotsTxtSummary:
    available = status_code is not None and 200 <= status_code < 300
    if not available:
        return RobotsTxtSummary(
            robots_url=robots_url,
            status_code=status_code,
            available=False,
            allows_target=None,
            disallow_rules=(),
            sitemap_urls=(),
            fetch_error=fetch_error,
        )

    rules, sitemap_urls = _parse_robots_txt(body_text)
    target_path = _target_path(target_url)
    disallow_rules = tuple(rule for rule in rules if rule.directive == "disallow")
    matched = _most_specific_matching_disallow(disallow_rules, target_path)
    return RobotsTxtSummary(
        robots_url=robots_url,
        status_code=status_code,
        available=True,
        allows_target=matched is None,
        disallow_rules=disallow_rules,
        sitemap_urls=tuple(sitemap_urls),
        matched_disallow_rule=matched.value if matched else None,
    )


def _parse_robots_txt(body_text: str) -> tuple[list[RobotsTxtRule], list[str]]:
    rules: list[RobotsTxtRule] = []
    sitemap_urls: list[str] = []
    current_agents: list[str] = []

    for raw_line in body_text.splitlines():
        line = raw_line.split("#", maxsplit=1)[0].strip()
        if not line or ":" not in line:
            continue
        key, value = line.split(":", maxsplit=1)
        directive = key.strip().lower()
        value = value.strip()
        if directive == "user-agent":
            current_agents = [value.lower()]
            continue
        if directive == "sitemap" and value:
            sitemap_urls.append(value)
            continue
        if directive in {"allow", "disallow"} and current_agents:
            for agent in current_agents:
                rules.append(
                    RobotsTxtRule(
                        user_agent=agent,
                        directive=directive,
                        value=value,
                    )
                )
    return rules, sitemap_urls


def _target_path(target_url: str) -> str:
    parsed = urlsplit(target_url)
    path = parsed.path or "/"
    if parsed.query:
        return f"{path}?{parsed.query}"
    return path


def _most_specific_matching_disallow(
    rules: tuple[RobotsTxtRule, ...],
    target_path: str,
) -> RobotsTxtRule | None:
    matching = [
        rule
        for rule in rules
        if rule.user_agent == "*" and rule.value and target_path.startswith(rule.value)
    ]
    if not matching:
        return None
    return max(matching, key=lambda rule: len(rule.value))
