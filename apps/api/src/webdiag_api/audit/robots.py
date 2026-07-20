from __future__ import annotations

import re
from dataclasses import dataclass
from urllib.parse import urljoin, urlsplit

DEFAULT_ROBOTS_USER_AGENT = "webdiagbot"


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
    matched_allow_rule: str | None = None


@dataclass(frozen=True, slots=True)
class _RobotsTxtGroup:
    user_agents: tuple[str, ...]
    rules: tuple[RobotsTxtRule, ...]


def analyze_robots_txt(
    body_text: str,
    *,
    robots_url: str,
    target_url: str,
    status_code: int | None,
    fetch_error: str | None = None,
    user_agent: str = DEFAULT_ROBOTS_USER_AGENT,
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

    groups, sitemap_urls = _parse_robots_txt(body_text)
    target_path = _target_path(target_url)
    applicable_rules = _select_applicable_rules(groups, user_agent=user_agent)
    matched = _most_specific_matching_rule(applicable_rules, target_path)
    disallow_rules = tuple(
        rule for group in groups for rule in group.rules if rule.directive == "disallow"
    )
    normalized_sitemaps = tuple(
        dict.fromkeys(urljoin(robots_url, sitemap_url) for sitemap_url in sitemap_urls)
    )
    allows_target = None if matched is None else matched.directive != "disallow"
    if matched is None:
        allows_target = True

    return RobotsTxtSummary(
        robots_url=robots_url,
        status_code=status_code,
        available=True,
        allows_target=allows_target,
        disallow_rules=disallow_rules,
        sitemap_urls=normalized_sitemaps,
        matched_disallow_rule=(
            matched.value if matched and matched.directive == "disallow" else None
        ),
        matched_allow_rule=matched.value if matched and matched.directive == "allow" else None,
    )


def _parse_robots_txt(body_text: str) -> tuple[list[_RobotsTxtGroup], list[str]]:
    groups: list[_RobotsTxtGroup] = []
    sitemap_urls: list[str] = []
    current_agents: list[str] = []
    current_directives: list[tuple[str, str]] = []

    def flush_group() -> None:
        nonlocal current_agents, current_directives
        if current_agents:
            rules = tuple(
                RobotsTxtRule(user_agent=agent, directive=directive, value=value)
                for agent in current_agents
                for directive, value in current_directives
            )
            groups.append(_RobotsTxtGroup(user_agents=tuple(current_agents), rules=rules))
        current_agents = []
        current_directives = []

    for raw_line in body_text.splitlines():
        stripped_line = raw_line.split("#", maxsplit=1)[0].strip()
        if not stripped_line:
            if current_agents and current_directives:
                flush_group()
            continue
        if ":" not in stripped_line:
            continue

        key, raw_value = stripped_line.split(":", maxsplit=1)
        directive = key.strip().lower()
        value = raw_value.strip()

        if directive == "user-agent":
            if current_agents and current_directives:
                flush_group()
            if value:
                current_agents.append(value.lower())
            continue
        if directive == "sitemap" and value:
            sitemap_urls.append(value)
            continue
        if directive in {"allow", "disallow"} and current_agents:
            current_directives.append((directive, value))

    flush_group()
    return groups, sitemap_urls


def _target_path(target_url: str) -> str:
    parsed = urlsplit(target_url)
    path = parsed.path or "/"
    if parsed.query:
        return f"{path}?{parsed.query}"
    return path


def _select_applicable_rules(
    groups: list[_RobotsTxtGroup],
    *,
    user_agent: str,
) -> tuple[RobotsTxtRule, ...]:
    normalized_user_agent = user_agent.strip().lower()
    matched: list[tuple[int, _RobotsTxtGroup]] = []

    for group in groups:
        specificity = max(
            (
                _user_agent_match_specificity(agent, normalized_user_agent)
                for agent in group.user_agents
            ),
            default=-1,
        )
        if specificity >= 0:
            matched.append((specificity, group))

    if not matched:
        return ()

    best_specificity = max(specificity for specificity, _group in matched)
    return tuple(
        rule
        for specificity, group in matched
        if specificity == best_specificity
        for rule in group.rules
    )


def _user_agent_match_specificity(rule_user_agent: str, crawler_user_agent: str) -> int:
    agent = rule_user_agent.strip().lower()
    if not agent:
        return -1
    if agent == "*":
        return 0
    return len(agent) if agent in crawler_user_agent else -1


def _most_specific_matching_rule(
    rules: tuple[RobotsTxtRule, ...],
    target_path: str,
) -> RobotsTxtRule | None:
    matching = [
        rule for rule in rules if rule.value and _robots_rule_matches(rule.value, target_path)
    ]
    if not matching:
        return None
    return max(
        matching,
        key=lambda rule: (_robots_rule_specificity(rule.value), rule.directive == "allow"),
    )


def _robots_rule_matches(pattern: str, target_path: str) -> bool:
    anchored = pattern.endswith("$")
    normalized_pattern = pattern[:-1] if anchored else pattern
    escaped = re.escape(normalized_pattern).replace(r"\*", ".*")
    expression = f"^{escaped}{'$' if anchored else ''}"
    return re.search(expression, target_path) is not None


def _robots_rule_specificity(pattern: str) -> int:
    return len(pattern.rstrip("$").replace("*", ""))
