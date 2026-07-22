from __future__ import annotations

from collections import Counter, defaultdict
from dataclasses import dataclass, field
from datetime import UTC, datetime
from html.parser import HTMLParser
from typing import Annotated, Literal, cast

from fastapi import APIRouter, Depends, HTTPException, status
from pydantic import BaseModel, ConfigDict, Field

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeFetchError, SafeHttpFetcher
from webdiag_api.security.url_policy import UrlPolicyError

router = APIRouter(tags=["tools"])

ToolStatus = Literal["pass", "warning", "fail"]
FindingSeverity = Literal["info", "medium", "high"]
NameSource = Literal[
    "aria-label",
    "aria-labelledby",
    "label",
    "text",
    "alt",
    "value",
    "default-value",
    "title",
    "none",
]
LandmarkType = Literal[
    "banner",
    "navigation",
    "main",
    "contentinfo",
    "complementary",
    "search",
    "form",
    "region",
]
InteractiveKind = Literal["link", "button", "role-link", "role-button"]

_MAX_HTML_BYTES = 1_000_000
_MAX_NODES = 5_000
_MAX_ITEMS = 150
_MAX_FINDINGS = 100
_MAX_TEXT_CHARS = 500
_VOID_ELEMENTS = frozenset(
    {
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
)
_SKIP_TEXT_ELEMENTS = frozenset({"script", "style", "template", "noscript"})
_LANDMARK_ROLES = frozenset(
    {
        "banner",
        "navigation",
        "main",
        "contentinfo",
        "complementary",
        "search",
        "form",
        "region",
    }
)
_LABELABLE_TAGS = frozenset(
    {"button", "input", "meter", "output", "progress", "select", "textarea"}
)
_GENERIC_NAMES = frozenset(
    {
        "click here",
        "here",
        "more",
        "read more",
        "learn more",
        "details",
        "link",
        "button",
        "далее",
        "подробнее",
        "здесь",
        "ссылка",
        "кнопка",
    }
)


class PageUrlRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")

    url: str = Field(min_length=1, max_length=2_048)


class AccessibilityFindingResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    id: str = Field(min_length=1, max_length=160)
    title: str = Field(min_length=1, max_length=300)
    severity: FindingSeverity
    element: str | None = Field(default=None, max_length=160)
    position: int | None = Field(default=None, ge=1)
    value: str | None = Field(default=None, max_length=500)
    recommendation: str = Field(min_length=1, max_length=800)


class LandmarkItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    tag: str = Field(min_length=1, max_length=40)
    role: str | None = Field(default=None, max_length=80)
    landmark_type: LandmarkType
    id_value: str | None = Field(default=None, max_length=300)
    accessible_name: str | None = Field(default=None, max_length=_MAX_TEXT_CHARS)
    name_source: NameSource
    hidden_signal: bool
    nested_landmark_depth: int = Field(ge=0)
    issues: tuple[str, ...]


class LandmarkStructureResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.landmark_structure_analyzer.v1"] = (
        "webdiag.tool.landmark_structure_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    landmark_count: int = Field(ge=0)
    named_landmark_count: int = Field(ge=0)
    main_count: int = Field(ge=0)
    navigation_count: int = Field(ge=0)
    banner_count: int = Field(ge=0)
    contentinfo_count: int = Field(ge=0)
    complementary_count: int = Field(ge=0)
    search_count: int = Field(ge=0)
    form_landmark_count: int = Field(ge=0)
    region_count: int = Field(ge=0)
    duplicate_role_name_count: int = Field(ge=0)
    finding_count: int = Field(ge=0)
    landmarks: tuple[LandmarkItemResponse, ...]
    findings: tuple[AccessibilityFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_200)


class FormItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    id_value: str | None = Field(default=None, max_length=300)
    accessible_name: str | None = Field(default=None, max_length=_MAX_TEXT_CHARS)
    name_source: NameSource
    control_count: int = Field(ge=0)
    labeled_control_count: int = Field(ge=0)
    unlabeled_control_count: int = Field(ge=0)
    fieldset_count: int = Field(ge=0)
    fieldset_without_legend_count: int = Field(ge=0)
    issues: tuple[str, ...]


class FormControlItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    tag: str = Field(min_length=1, max_length=40)
    input_type: str | None = Field(default=None, max_length=80)
    id_value: str | None = Field(default=None, max_length=300)
    name_attribute: str | None = Field(default=None, max_length=300)
    form_position: int | None = Field(default=None, ge=1)
    accessible_name: str | None = Field(default=None, max_length=_MAX_TEXT_CHARS)
    name_source: NameSource
    required: bool
    disabled: bool
    placeholder_present: bool
    issues: tuple[str, ...]


class FormAccessibilityResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.form_accessibility_analyzer.v1"] = (
        "webdiag.tool.form_accessibility_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    form_count: int = Field(ge=0)
    control_count: int = Field(ge=0)
    labeled_control_count: int = Field(ge=0)
    unlabeled_control_count: int = Field(ge=0)
    placeholder_only_count: int = Field(ge=0)
    button_control_count: int = Field(ge=0)
    fieldset_count: int = Field(ge=0)
    fieldset_without_legend_count: int = Field(ge=0)
    broken_label_reference_count: int = Field(ge=0)
    broken_description_reference_count: int = Field(ge=0)
    ungrouped_choice_set_count: int = Field(ge=0)
    finding_count: int = Field(ge=0)
    forms: tuple[FormItemResponse, ...]
    controls: tuple[FormControlItemResponse, ...]
    findings: tuple[AccessibilityFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_200)


class InteractiveItemResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    position: int = Field(ge=1)
    kind: InteractiveKind
    tag: str = Field(min_length=1, max_length=40)
    role: str | None = Field(default=None, max_length=80)
    href: str | None = Field(default=None, max_length=2_048)
    id_value: str | None = Field(default=None, max_length=300)
    accessible_name: str | None = Field(default=None, max_length=_MAX_TEXT_CHARS)
    name_source: NameSource
    native_element: bool
    hidden_signal: bool
    generic_name: bool
    issues: tuple[str, ...]


class InteractiveAccessibleNameResponse(BaseModel):
    model_config = ConfigDict(extra="forbid")

    contract_version: Literal["webdiag.tool.interactive_accessible_name_analyzer.v1"] = (
        "webdiag.tool.interactive_accessible_name_analyzer.v1"
    )
    generated_at: datetime = Field(default_factory=lambda: datetime.now(UTC))
    requested_url: str = Field(min_length=1, max_length=2_048)
    final_url: str = Field(min_length=1, max_length=2_048)
    status_code: int = Field(ge=100, le=599)
    content_type: str | None = Field(default=None, max_length=300)
    scan_mode: Literal["static_html_bounded"] = "static_html_bounded"
    interactive_count: int = Field(ge=0)
    link_count: int = Field(ge=0)
    button_count: int = Field(ge=0)
    role_link_count: int = Field(ge=0)
    role_button_count: int = Field(ge=0)
    named_count: int = Field(ge=0)
    unnamed_count: int = Field(ge=0)
    generic_name_count: int = Field(ge=0)
    nested_interactive_count: int = Field(ge=0)
    role_without_keyboard_signal_count: int = Field(ge=0)
    finding_count: int = Field(ge=0)
    items: tuple[InteractiveItemResponse, ...]
    findings: tuple[AccessibilityFindingResponse, ...]
    redirect_count: int = Field(ge=0)
    truncated: bool
    status: ToolStatus
    recommendation: str = Field(min_length=1, max_length=1_200)


@dataclass
class _Node:
    index: int
    position: int
    tag: str
    attrs: dict[str, str | None]
    parent: int | None
    children: list[int] = field(default_factory=list)
    text_parts: list[str] = field(default_factory=list)


class _StaticAccessibilityParser(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.nodes: list[_Node] = []
        self.stack: list[int | None] = []
        self.element_count = 0
        self.truncated = False

    def handle_starttag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self._start(tag, attrs, self_closing=False)

    def handle_startendtag(
        self, tag: str, attrs: list[tuple[str, str | None]]
    ) -> None:
        self._start(tag, attrs, self_closing=True)

    def handle_endtag(self, tag: str) -> None:
        normalized = tag.lower()
        for offset in range(len(self.stack) - 1, -1, -1):
            node_index = self.stack[offset]
            if node_index is not None and self.nodes[node_index].tag == normalized:
                del self.stack[offset:]
                return
        if self.stack:
            self.stack.pop()

    def handle_data(self, data: str) -> None:
        if not self.stack or self.stack[-1] is None:
            return
        if data.strip():
            self.nodes[self.stack[-1]].text_parts.append(data)

    def _start(
        self,
        tag: str,
        attrs: list[tuple[str, str | None]],
        *,
        self_closing: bool,
    ) -> None:
        normalized = tag.lower()
        self.element_count += 1
        parent = self.stack[-1] if self.stack else None
        node_index: int | None = None
        if len(self.nodes) < _MAX_NODES:
            node_index = len(self.nodes)
            node = _Node(
                index=node_index,
                position=self.element_count,
                tag=normalized,
                attrs={name.lower(): value for name, value in attrs},
                parent=parent,
            )
            self.nodes.append(node)
            if parent is not None:
                self.nodes[parent].children.append(node_index)
        else:
            self.truncated = True
        if not self_closing and normalized not in _VOID_ELEMENTS:
            self.stack.append(node_index)


@dataclass(frozen=True)
class _NameResult:
    value: str | None
    source: NameSource
    missing_labelledby_ids: tuple[str, ...] = ()


@dataclass(frozen=True)
class _DocumentIndex:
    nodes: tuple[_Node, ...]
    id_nodes: dict[str, tuple[int, ...]]
    explicit_labels: dict[str, tuple[int, ...]]
    duplicate_ids: frozenset[str]
    truncated: bool


@dataclass(frozen=True)
class _AnalysisDocument:
    index: _DocumentIndex
    status_code: int
    content_type: str | None


def get_accessibility_static_fetcher() -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=_MAX_HTML_BYTES, max_redirects=5)
    )


AccessibilityFetcherDependency = Annotated[
    SafeHttpFetcher, Depends(get_accessibility_static_fetcher)
]


@router.post(
    "/v1/tools/landmark-structure",
    response_model=LandmarkStructureResponse,
)
def analyze_landmark_structure(
    payload: PageUrlRequest,
    fetcher: AccessibilityFetcherDependency,
) -> LandmarkStructureResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    document = _build_document(
        fetched.body_text,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
    )
    landmarks: list[LandmarkItemResponse] = []
    all_landmarks: list[LandmarkItemResponse] = []
    findings: list[AccessibilityFindingResponse] = []

    if document is not None:
        for node in document.index.nodes:
            landmark_type = _landmark_type(node, document.index)
            if landmark_type is None:
                continue
            name = _author_name(node, document.index, allow_title=True)
            issues: list[str] = []
            if name.missing_labelledby_ids:
                issues.append("aria-labelledby references missing ids")
            if _hidden_signal(node):
                issues.append("landmark has a static hidden signal")
            nested_depth = _landmark_ancestor_depth(node, document.index)
            if landmark_type == "main" and _main_has_disallowed_ancestor(node, document.index):
                issues.append("main is nested in a sectioning or landmark ancestor")
            if landmark_type in {"region", "form"} and not name.value:
                issues.append("named landmark role has no accessible name")
            item = LandmarkItemResponse(
                position=node.position,
                tag=node.tag[:40],
                role=_capped(node.attrs.get("role"), 80),
                landmark_type=landmark_type,
                id_value=_capped(node.attrs.get("id"), 300),
                accessible_name=name.value,
                name_source=name.source,
                hidden_signal=_hidden_signal(node),
                nested_landmark_depth=nested_depth,
                issues=tuple(issues),
            )
            all_landmarks.append(item)
            if len(landmarks) < _MAX_ITEMS:
                landmarks.append(item)

        findings.extend(_landmark_findings(all_landmarks, document.index))

    counts = Counter(item.landmark_type for item in all_landmarks)
    role_name_counts = Counter(
        (item.landmark_type, item.accessible_name.casefold())
        for item in all_landmarks
        if item.accessible_name
    )
    duplicate_role_name_count = sum(
        count - 1 for count in role_name_counts.values() if count > 1
    )
    finding_count = len(findings)
    output_findings = tuple(findings[:_MAX_FINDINGS])
    truncated = bool(
        (document is not None and document.index.truncated)
        or len(all_landmarks) > len(landmarks)
        or finding_count > len(output_findings)
    )
    status_value = _analysis_status(
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        findings=findings,
    )

    return LandmarkStructureResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        landmark_count=len(all_landmarks),
        named_landmark_count=sum(item.accessible_name is not None for item in all_landmarks),
        main_count=counts["main"],
        navigation_count=counts["navigation"],
        banner_count=counts["banner"],
        contentinfo_count=counts["contentinfo"],
        complementary_count=counts["complementary"],
        search_count=counts["search"],
        form_landmark_count=counts["form"],
        region_count=counts["region"],
        duplicate_role_name_count=duplicate_role_name_count,
        finding_count=finding_count,
        landmarks=tuple(landmarks),
        findings=output_findings,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_landmark_recommendation(
            status_value,
            landmark_count=len(all_landmarks),
            main_count=counts["main"],
            finding_count=finding_count,
        ),
    )


@router.post(
    "/v1/tools/form-accessibility",
    response_model=FormAccessibilityResponse,
)
def analyze_form_accessibility(
    payload: PageUrlRequest,
    fetcher: AccessibilityFetcherDependency,
) -> FormAccessibilityResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    document = _build_document(
        fetched.body_text,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
    )
    forms: list[FormItemResponse] = []
    controls: list[FormControlItemResponse] = []
    all_forms: list[FormItemResponse] = []
    all_controls: list[FormControlItemResponse] = []
    findings: list[AccessibilityFindingResponse] = []
    broken_label_references = 0
    broken_description_references = 0
    ungrouped_choice_sets = 0

    if document is not None:
        index = document.index
        form_nodes = [node for node in index.nodes if node.tag == "form"]
        control_nodes = [node for node in index.nodes if _is_form_control(node)]
        control_items_by_node: dict[int, FormControlItemResponse] = {}

        for node in control_nodes:
            item, description_missing = _form_control_item(node, index)
            all_controls.append(item)
            control_items_by_node[node.index] = item
            broken_description_references += description_missing
            if len(controls) < _MAX_ITEMS:
                controls.append(item)

        for node in form_nodes:
            descendant_controls = [
                item
                for control_node_index, item in control_items_by_node.items()
                if _is_descendant(control_node_index, node.index, index)
            ]
            fieldsets = [
                candidate
                for candidate in index.nodes
                if candidate.tag == "fieldset"
                and _is_descendant(candidate.index, node.index, index)
            ]
            missing_legends = sum(not _fieldset_has_legend(item, index) for item in fieldsets)
            name = _author_name(node, index, allow_title=True)
            issues: list[str] = []
            if name.missing_labelledby_ids:
                issues.append("aria-labelledby references missing ids")
            if len(form_nodes) > 1 and not name.value:
                issues.append("multiple forms need distinguishable names in many interfaces")
            if missing_legends:
                issues.append("fieldset without a legend")
            form_item = FormItemResponse(
                position=node.position,
                id_value=_capped(node.attrs.get("id"), 300),
                accessible_name=name.value,
                name_source=name.source,
                control_count=len(descendant_controls),
                labeled_control_count=sum(
                    control.accessible_name is not None for control in descendant_controls
                ),
                unlabeled_control_count=sum(
                    control.accessible_name is None for control in descendant_controls
                ),
                fieldset_count=len(fieldsets),
                fieldset_without_legend_count=missing_legends,
                issues=tuple(issues),
            )
            all_forms.append(form_item)
            if len(forms) < _MAX_ITEMS:
                forms.append(form_item)

        for label in (node for node in index.nodes if node.tag == "label"):
            target = _clean(label.attrs.get("for"))
            if not target:
                continue
            target_nodes = index.id_nodes.get(target, ())
            if not target_nodes or not any(
                index.nodes[node_index].tag in _LABELABLE_TAGS for node_index in target_nodes
            ):
                broken_label_references += 1

        ungrouped_choice_sets = _count_ungrouped_choice_sets(control_nodes, index)
        findings.extend(
            _form_findings(
                all_forms,
                all_controls,
                broken_label_references=broken_label_references,
                broken_description_references=broken_description_references,
                ungrouped_choice_sets=ungrouped_choice_sets,
                index=index,
            )
        )

    fieldset_nodes = (
        [node for node in document.index.nodes if node.tag == "fieldset"]
        if document is not None
        else []
    )
    fieldset_without_legend_count = (
        sum(not _fieldset_has_legend(node, document.index) for node in fieldset_nodes)
        if document is not None
        else 0
    )
    finding_count = len(findings)
    output_findings = tuple(findings[:_MAX_FINDINGS])
    truncated = bool(
        (document is not None and document.index.truncated)
        or len(all_forms) > len(forms)
        or len(all_controls) > len(controls)
        or finding_count > len(output_findings)
    )
    status_value = _analysis_status(
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        findings=findings,
    )

    return FormAccessibilityResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        form_count=len(all_forms),
        control_count=len(all_controls),
        labeled_control_count=sum(item.accessible_name is not None for item in all_controls),
        unlabeled_control_count=sum(item.accessible_name is None for item in all_controls),
        placeholder_only_count=sum(
            "placeholder-only label" in item.issues for item in all_controls
        ),
        button_control_count=sum(_control_is_button(item) for item in all_controls),
        fieldset_count=len(fieldset_nodes),
        fieldset_without_legend_count=fieldset_without_legend_count,
        broken_label_reference_count=broken_label_references,
        broken_description_reference_count=broken_description_references,
        ungrouped_choice_set_count=ungrouped_choice_sets,
        finding_count=finding_count,
        forms=tuple(forms),
        controls=tuple(controls),
        findings=output_findings,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_form_recommendation(
            status_value,
            control_count=len(all_controls),
            unlabeled_count=sum(item.accessible_name is None for item in all_controls),
            finding_count=finding_count,
        ),
    )


@router.post(
    "/v1/tools/interactive-accessible-names",
    response_model=InteractiveAccessibleNameResponse,
)
def analyze_interactive_accessible_names(
    payload: PageUrlRequest,
    fetcher: AccessibilityFetcherDependency,
) -> InteractiveAccessibleNameResponse:
    fetched = _fetch_or_raise(fetcher, payload.url)
    document = _build_document(
        fetched.body_text,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
    )
    items: list[InteractiveItemResponse] = []
    all_items: list[InteractiveItemResponse] = []
    findings: list[AccessibilityFindingResponse] = []

    if document is not None:
        for node in document.index.nodes:
            kind = _interactive_kind(node)
            if kind is None:
                continue
            item = _interactive_item(node, kind, document.index)
            all_items.append(item)
            if len(items) < _MAX_ITEMS:
                items.append(item)
        findings.extend(_interactive_findings(all_items))

    counts = Counter(item.kind for item in all_items)
    finding_count = len(findings)
    output_findings = tuple(findings[:_MAX_FINDINGS])
    truncated = bool(
        (document is not None and document.index.truncated)
        or len(all_items) > len(items)
        or finding_count > len(output_findings)
    )
    status_value = _analysis_status(
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        findings=findings,
    )

    return InteractiveAccessibleNameResponse(
        requested_url=fetched.requested_url,
        final_url=fetched.final_url,
        status_code=fetched.status_code,
        content_type=fetched.content_type,
        interactive_count=len(all_items),
        link_count=counts["link"],
        button_count=counts["button"],
        role_link_count=counts["role-link"],
        role_button_count=counts["role-button"],
        named_count=sum(item.accessible_name is not None for item in all_items),
        unnamed_count=sum(item.accessible_name is None for item in all_items),
        generic_name_count=sum(item.generic_name for item in all_items),
        nested_interactive_count=sum(
            "nested interactive element" in item.issues for item in all_items
        ),
        role_without_keyboard_signal_count=sum(
            "non-native role has no tabindex=0 signal" in item.issues for item in all_items
        ),
        finding_count=finding_count,
        items=tuple(items),
        findings=output_findings,
        redirect_count=len(fetched.redirect_chain),
        truncated=truncated,
        status=status_value,
        recommendation=_interactive_recommendation(
            status_value,
            interactive_count=len(all_items),
            unnamed_count=sum(item.accessible_name is None for item in all_items),
            generic_count=sum(item.generic_name for item in all_items),
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


def _build_document(
    body_text: str,
    *,
    status_code: int,
    content_type: str | None,
) -> _AnalysisDocument | None:
    if not _is_html_candidate(content_type):
        return None
    parser = _StaticAccessibilityParser()
    parser.feed(body_text)
    parser.close()
    id_nodes: dict[str, list[int]] = defaultdict(list)
    explicit_labels: dict[str, list[int]] = defaultdict(list)
    for node in parser.nodes:
        id_value = _clean(node.attrs.get("id"))
        if id_value:
            id_nodes[id_value].append(node.index)
        if node.tag == "label":
            target = _clean(node.attrs.get("for"))
            if target:
                explicit_labels[target].append(node.index)
    index = _DocumentIndex(
        nodes=tuple(parser.nodes),
        id_nodes={key: tuple(value) for key, value in id_nodes.items()},
        explicit_labels={key: tuple(value) for key, value in explicit_labels.items()},
        duplicate_ids=frozenset(key for key, values in id_nodes.items() if len(values) > 1),
        truncated=parser.truncated,
    )
    return _AnalysisDocument(index=index, status_code=status_code, content_type=content_type)


def _is_html_candidate(content_type: str | None) -> bool:
    if not content_type:
        return True
    normalized = content_type.lower()
    return "text/html" in normalized or "application/xhtml+xml" in normalized


def _clean(value: str | None) -> str | None:
    if value is None:
        return None
    cleaned = " ".join(value.split())
    return cleaned or None


def _capped(value: str | None, limit: int) -> str | None:
    cleaned = _clean(value)
    return cleaned[:limit] if cleaned else None


def _hidden_signal(node: _Node) -> bool:
    return "hidden" in node.attrs or (_clean(node.attrs.get("aria-hidden")) or "").lower() == "true"


def _node_text(node_index: int, index: _DocumentIndex) -> str | None:
    output: list[str] = []
    remaining = _MAX_TEXT_CHARS

    def walk(current_index: int) -> None:
        nonlocal remaining
        if remaining <= 0:
            return
        node = index.nodes[current_index]
        if node.tag in _SKIP_TEXT_ELEMENTS or _hidden_signal(node):
            return
        if node.tag in {"img", "area"}:
            alt = _clean(node.attrs.get("alt"))
            if alt:
                output.append(alt[:remaining])
                remaining -= len(alt[:remaining])
        for part in node.text_parts:
            cleaned = _clean(part)
            if cleaned and remaining > 0:
                segment = cleaned[:remaining]
                output.append(segment)
                remaining -= len(segment)
        for child in node.children:
            walk(child)

    walk(node_index)
    return _clean(" ".join(output))


def _labelledby_name(node: _Node, index: _DocumentIndex) -> _NameResult | None:
    raw = _clean(node.attrs.get("aria-labelledby"))
    if not raw:
        return None
    values: list[str] = []
    missing: list[str] = []
    for reference in raw.split():
        targets = index.id_nodes.get(reference)
        if not targets:
            missing.append(reference)
            continue
        for target in targets[:1]:
            value = _node_text(target, index)
            if value:
                values.append(value)
    return _NameResult(_clean(" ".join(values)), "aria-labelledby", tuple(missing))


def _author_name(
    node: _Node,
    index: _DocumentIndex,
    *,
    allow_title: bool,
) -> _NameResult:
    aria_label = _clean(node.attrs.get("aria-label"))
    if aria_label:
        return _NameResult(aria_label[:_MAX_TEXT_CHARS], "aria-label")
    labelledby = _labelledby_name(node, index)
    if labelledby is not None:
        return labelledby
    if allow_title:
        title = _clean(node.attrs.get("title"))
        if title:
            return _NameResult(title[:_MAX_TEXT_CHARS], "title")
    return _NameResult(None, "none")


def _ancestor_indices(node: _Node, index: _DocumentIndex):
    current = node.parent
    while current is not None:
        yield current
        current = index.nodes[current].parent


def _is_descendant(node_index: int, ancestor_index: int, index: _DocumentIndex) -> bool:
    current = index.nodes[node_index].parent
    while current is not None:
        if current == ancestor_index:
            return True
        current = index.nodes[current].parent
    return False


def _implicit_landmark_type(node: _Node, index: _DocumentIndex) -> LandmarkType | None:
    if node.tag == "nav":
        return "navigation"
    if node.tag == "main":
        return "main"
    if node.tag == "aside":
        return "complementary"
    if node.tag == "search":
        return "search"
    if node.tag in {"header", "footer"}:
        disallowed = {"article", "aside", "main", "nav", "section"}
        if any(index.nodes[parent].tag in disallowed for parent in _ancestor_indices(node, index)):
            return None
        return "banner" if node.tag == "header" else "contentinfo"
    if node.tag in {"form", "section"}:
        name = _author_name(node, index, allow_title=True)
        if name.value:
            return "form" if node.tag == "form" else "region"
    return None


def _landmark_type(node: _Node, index: _DocumentIndex) -> LandmarkType | None:
    role = (_clean(node.attrs.get("role")) or "").lower().split()[0:1]
    explicit = role[0] if role else ""
    if explicit in {"none", "presentation"}:
        return None
    if explicit in _LANDMARK_ROLES:
        return cast(LandmarkType, explicit)
    return _implicit_landmark_type(node, index)


def _landmark_ancestor_depth(node: _Node, index: _DocumentIndex) -> int:
    return sum(
        _landmark_type(index.nodes[parent], index) is not None
        for parent in _ancestor_indices(node, index)
    )


def _main_has_disallowed_ancestor(node: _Node, index: _DocumentIndex) -> bool:
    disallowed = {"article", "aside", "footer", "header", "nav", "section"}
    return any(index.nodes[parent].tag in disallowed for parent in _ancestor_indices(node, index))


def _landmark_findings(
    landmarks: list[LandmarkItemResponse],
    index: _DocumentIndex,
) -> list[AccessibilityFindingResponse]:
    findings: list[AccessibilityFindingResponse] = []
    counts = Counter(item.landmark_type for item in landmarks)
    if counts["main"] == 0:
        findings.append(
            AccessibilityFindingResponse(
                id="missing-main-landmark",
                title="No main landmark candidate was found",
                severity="high",
                element="main",
                recommendation=(
                    "Provide one primary main landmark for the page content. Confirm the final "
                    "accessibility tree in a browser because static markup can be altered "
                    "at runtime."
                ),
            )
        )
    elif counts["main"] > 1:
        findings.append(
            AccessibilityFindingResponse(
                id="multiple-main-landmarks",
                title="Multiple main landmark candidates were found",
                severity="high",
                element="main",
                value=str(counts["main"]),
                recommendation="Keep one active primary main landmark in the rendered page state.",
            )
        )
    for landmark_type in ("banner", "contentinfo"):
        if counts[landmark_type] > 1:
            findings.append(
                AccessibilityFindingResponse(
                    id=f"multiple-{landmark_type}-landmarks",
                    title=f"Multiple {landmark_type} landmark candidates were found",
                    severity="medium",
                    element=landmark_type,
                    value=str(counts[landmark_type]),
                    recommendation=(
                        "Review document nesting and roles. Header/footer elements inside "
                        "sectioning "
                        "content may not map to page-level landmarks in the browser "
                        "accessibility tree."
                    ),
                )
            )
    for landmark_type in ("navigation", "complementary", "search", "form", "region"):
        typed = [item for item in landmarks if item.landmark_type == landmark_type]
        if len(typed) > 1:
            unnamed = [item for item in typed if not item.accessible_name]
            if unnamed:
                findings.append(
                    AccessibilityFindingResponse(
                        id=f"unnamed-multiple-{landmark_type}",
                        title=(
                            f"Multiple {landmark_type} landmarks are not all "
                            "distinguishably named"
                        ),
                        severity="medium",
                        element=landmark_type,
                        value=str(len(unnamed)),
                        recommendation=(
                            "Add concise aria-label or aria-labelledby names when multiple "
                            "landmarks "
                            "of the same type need to be distinguished."
                        ),
                    )
                )
    role_name_counts = Counter(
        (item.landmark_type, item.accessible_name.casefold())
        for item in landmarks
        if item.accessible_name
    )
    duplicates = sum(count - 1 for count in role_name_counts.values() if count > 1)
    if duplicates:
        findings.append(
            AccessibilityFindingResponse(
                id="duplicate-landmark-role-names",
                title="Duplicate landmark type/name combinations were found",
                severity="medium",
                value=str(duplicates),
                recommendation="Use names that distinguish same-type landmarks by purpose.",
            )
        )
    hidden_count = sum(item.hidden_signal for item in landmarks)
    if hidden_count:
        findings.append(
            AccessibilityFindingResponse(
                id="hidden-landmark-signals",
                title="Landmark candidates with static hidden signals were found",
                severity="info",
                value=str(hidden_count),
                recommendation=(
                    "Confirm whether these landmarks are inactive states or accidental "
                    "hidden/aria-hidden "
                    "content. Static HTML cannot determine final visibility."
                ),
            )
        )
    nested_main = [
        item
        for item in landmarks
        if item.landmark_type == "main"
        and "main is nested in a sectioning or landmark ancestor" in item.issues
    ]
    if nested_main:
        findings.append(
            AccessibilityFindingResponse(
                id="nested-main-landmark",
                title="A main landmark is nested in a disallowed structural ancestor",
                severity="high",
                element="main",
                position=nested_main[0].position,
                recommendation=(
                    "Move the primary main landmark outside article, aside, header, footer, "
                    "nav, and section ancestors."
                ),
            )
        )
    missing_refs = sum(
        "aria-labelledby references missing ids" in item.issues for item in landmarks
    )
    if missing_refs:
        findings.append(
            AccessibilityFindingResponse(
                id="landmark-broken-labelledby",
                title="Landmark aria-labelledby references could not be resolved",
                severity="high",
                value=str(missing_refs),
                recommendation=(
                    "Point aria-labelledby to unique existing elements with meaningful text."
                ),
            )
        )
    if index.duplicate_ids:
        findings.append(
            AccessibilityFindingResponse(
                id="duplicate-document-ids",
                title="Duplicate document IDs can make landmark references ambiguous",
                severity="medium",
                value=str(len(index.duplicate_ids)),
                recommendation=(
                    "Use unique id values before relying on aria-labelledby relationships."
                ),
            )
        )
    return findings


def _is_form_control(node: _Node) -> bool:
    if node.tag not in {"input", "select", "textarea", "button"}:
        return False
    return not (
        node.tag == "input"
        and (_clean(node.attrs.get("type")) or "text").lower() == "hidden"
    )


def _nearest_ancestor(node: _Node, tag: str, index: _DocumentIndex) -> _Node | None:
    for parent in _ancestor_indices(node, index):
        candidate = index.nodes[parent]
        if candidate.tag == tag:
            return candidate
    return None


def _control_name(node: _Node, index: _DocumentIndex) -> _NameResult:
    aria = _author_name(node, index, allow_title=False)
    if aria.value or aria.source == "aria-labelledby":
        return aria
    id_value = _clean(node.attrs.get("id"))
    if id_value:
        explicit = index.explicit_labels.get(id_value, ())
        label_values = [_node_text(label_index, index) for label_index in explicit]
        label_name = _clean(" ".join(value for value in label_values if value))
        if label_name:
            return _NameResult(label_name[:_MAX_TEXT_CHARS], "label")
    implicit_label = _nearest_ancestor(node, "label", index)
    if implicit_label is not None:
        label_name = _node_text(implicit_label.index, index)
        if label_name:
            return _NameResult(label_name[:_MAX_TEXT_CHARS], "label")
    if node.tag == "button":
        text = _node_text(node.index, index)
        if text:
            return _NameResult(text[:_MAX_TEXT_CHARS], "text")
    if node.tag == "input":
        input_type = (_clean(node.attrs.get("type")) or "text").lower()
        if input_type == "image":
            alt = _clean(node.attrs.get("alt"))
            if alt:
                return _NameResult(alt[:_MAX_TEXT_CHARS], "alt")
        if input_type in {"button", "submit", "reset"}:
            value = _clean(node.attrs.get("value"))
            if value:
                return _NameResult(value[:_MAX_TEXT_CHARS], "value")
            if input_type in {"submit", "reset"}:
                return _NameResult(input_type.title(), "default-value")
    title = _clean(node.attrs.get("title"))
    if title:
        return _NameResult(title[:_MAX_TEXT_CHARS], "title")
    return _NameResult(None, "none", aria.missing_labelledby_ids)


def _form_control_item(
    node: _Node,
    index: _DocumentIndex,
) -> tuple[FormControlItemResponse, int]:
    name = _control_name(node, index)
    issues: list[str] = []
    placeholder = _clean(node.attrs.get("placeholder"))
    if name.missing_labelledby_ids:
        issues.append("aria-labelledby references missing ids")
    if not name.value:
        issues.append("control has no static accessible name")
        if placeholder:
            issues.append("placeholder-only label")
    if name.source == "title":
        issues.append("title-only accessible name")
    id_value = _clean(node.attrs.get("id"))
    if id_value and id_value in index.duplicate_ids:
        issues.append("control id is duplicated")
    describedby = (_clean(node.attrs.get("aria-describedby")) or "").split()
    missing_descriptions = sum(reference not in index.id_nodes for reference in describedby)
    if missing_descriptions:
        issues.append("aria-describedby references missing ids")
    form = _nearest_ancestor(node, "form", index)
    input_type = (
        (_clean(node.attrs.get("type")) or "text").lower()
        if node.tag == "input"
        else None
    )
    return (
        FormControlItemResponse(
            position=node.position,
            tag=node.tag[:40],
            input_type=input_type[:80] if input_type else None,
            id_value=id_value[:300] if id_value else None,
            name_attribute=_capped(node.attrs.get("name"), 300),
            form_position=form.position if form is not None else None,
            accessible_name=name.value,
            name_source=name.source,
            required="required" in node.attrs
            or (_clean(node.attrs.get("aria-required")) or "").lower() == "true",
            disabled="disabled" in node.attrs
            or (_clean(node.attrs.get("aria-disabled")) or "").lower() == "true",
            placeholder_present=placeholder is not None,
            issues=tuple(issues),
        ),
        missing_descriptions,
    )


def _fieldset_has_legend(node: _Node, index: _DocumentIndex) -> bool:
    for child_index in node.children:
        child = index.nodes[child_index]
        if child.tag == "legend":
            return _node_text(child.index, index) is not None
    return False


def _nearest_fieldset(node: _Node, index: _DocumentIndex) -> _Node | None:
    return _nearest_ancestor(node, "fieldset", index)


def _count_ungrouped_choice_sets(
    control_nodes: list[_Node],
    index: _DocumentIndex,
) -> int:
    groups: dict[tuple[int | None, str, str], list[_Node]] = defaultdict(list)
    for node in control_nodes:
        if node.tag != "input":
            continue
        input_type = (_clean(node.attrs.get("type")) or "text").lower()
        name = _clean(node.attrs.get("name"))
        if input_type not in {"radio", "checkbox"} or not name:
            continue
        form = _nearest_ancestor(node, "form", index)
        groups[(form.index if form else None, input_type, name)].append(node)
    count = 0
    for nodes in groups.values():
        if len(nodes) < 2:
            continue
        fieldsets = {
            fieldset.index if (fieldset := _nearest_fieldset(node, index)) else None
            for node in nodes
        }
        if len(fieldsets) != 1 or None in fieldsets:
            count += 1
            continue
        fieldset = index.nodes[next(iter(fieldsets))]  # type: ignore[arg-type]
        if not _fieldset_has_legend(fieldset, index):
            count += 1
    return count


def _form_findings(
    forms: list[FormItemResponse],
    controls: list[FormControlItemResponse],
    *,
    broken_label_references: int,
    broken_description_references: int,
    ungrouped_choice_sets: int,
    index: _DocumentIndex,
) -> list[AccessibilityFindingResponse]:
    findings: list[AccessibilityFindingResponse] = []
    unlabeled = [item for item in controls if item.accessible_name is None]
    if unlabeled:
        findings.append(
            AccessibilityFindingResponse(
                id="unlabeled-form-controls",
                title="Form controls without a static accessible name were found",
                severity="high",
                value=str(len(unlabeled)),
                position=unlabeled[0].position,
                recommendation=(
                    "Associate visible labels with controls or provide an appropriate accessible "
                    "name. Placeholder text alone is not a label."
                ),
            )
        )
    placeholder_only = [item for item in controls if "placeholder-only label" in item.issues]
    if placeholder_only:
        findings.append(
            AccessibilityFindingResponse(
                id="placeholder-only-controls",
                title="Controls appear to rely on placeholder text",
                severity="medium",
                value=str(len(placeholder_only)),
                recommendation=(
                    "Keep persistent visible labels; use placeholder only for optional "
                    "examples or format hints."
                ),
            )
        )
    title_only = [item for item in controls if item.name_source == "title"]
    if title_only:
        findings.append(
            AccessibilityFindingResponse(
                id="title-only-control-names",
                title="Controls with title-only names were found",
                severity="medium",
                value=str(len(title_only)),
                recommendation=(
                    "Prefer a visible label or robust aria-label/aria-labelledby relationship "
                    "over title alone."
                ),
            )
        )
    fieldsets_missing = sum(form.fieldset_without_legend_count for form in forms)
    standalone_fieldsets_missing = sum(
        node.tag == "fieldset"
        and _nearest_ancestor(node, "form", index) is None
        and not _fieldset_has_legend(node, index)
        for node in index.nodes
    )
    total_missing_legends = fieldsets_missing + standalone_fieldsets_missing
    if total_missing_legends:
        findings.append(
            AccessibilityFindingResponse(
                id="fieldset-without-legend",
                title="Fieldsets without a meaningful legend were found",
                severity="medium",
                value=str(total_missing_legends),
                recommendation="Add a concise legend that describes the grouped controls.",
            )
        )
    if broken_label_references:
        findings.append(
            AccessibilityFindingResponse(
                id="broken-label-for-references",
                title="Label for attributes do not resolve to labelable controls",
                severity="high",
                value=str(broken_label_references),
                recommendation="Point each label for value to one unique labelable control id.",
            )
        )
    if broken_description_references:
        findings.append(
            AccessibilityFindingResponse(
                id="broken-describedby-references",
                title="aria-describedby references could not be resolved",
                severity="medium",
                value=str(broken_description_references),
                recommendation=(
                    "Point aria-describedby to existing unique elements containing useful "
                    "help or error text."
                ),
            )
        )
    if ungrouped_choice_sets:
        findings.append(
            AccessibilityFindingResponse(
                id="ungrouped-choice-sets",
                title="Radio or checkbox sets lack a shared fieldset and legend signal",
                severity="medium",
                value=str(ungrouped_choice_sets),
                recommendation=(
                    "Group related choices in a fieldset with a meaningful legend when they "
                    "form one question."
                ),
            )
        )
    unnamed_forms = [form for form in forms if form.accessible_name is None]
    if len(forms) > 1 and unnamed_forms:
        findings.append(
            AccessibilityFindingResponse(
                id="multiple-unnamed-forms",
                title="Multiple forms are not all distinguishably named",
                severity="info",
                value=str(len(unnamed_forms)),
                recommendation=(
                    "Name forms that need to be distinguished as landmarks, using aria-label "
                    "or aria-labelledby."
                ),
            )
        )
    duplicate_control_ids = sum("control id is duplicated" in item.issues for item in controls)
    if duplicate_control_ids:
        findings.append(
            AccessibilityFindingResponse(
                id="duplicate-control-ids",
                title="Form controls with duplicate IDs were found",
                severity="high",
                value=str(duplicate_control_ids),
                recommendation=(
                    "Use unique control ids so labels and ARIA references resolve "
                    "deterministically."
                ),
            )
        )
    broken_labelledby = sum(
        "aria-labelledby references missing ids" in item.issues for item in controls
    )
    if broken_labelledby:
        findings.append(
            AccessibilityFindingResponse(
                id="control-broken-labelledby",
                title="Control aria-labelledby references could not be resolved",
                severity="high",
                value=str(broken_labelledby),
                recommendation=(
                    "Point aria-labelledby to existing unique elements with meaningful text."
                ),
            )
        )
    return findings


def _control_is_button(item: FormControlItemResponse) -> bool:
    return item.tag == "button" or (
        item.tag == "input" and item.input_type in {"button", "submit", "reset", "image"}
    )


def _interactive_kind(node: _Node) -> InteractiveKind | None:
    role = (_clean(node.attrs.get("role")) or "").lower().split()[0:1]
    explicit = role[0] if role else ""
    native_link = node.tag in {"a", "area"} and _clean(node.attrs.get("href")) is not None
    native_button = node.tag == "button" or (
        node.tag == "input"
        and (_clean(node.attrs.get("type")) or "text").lower()
        in {"button", "submit", "reset", "image"}
    )
    if explicit == "link":
        return "link" if native_link else "role-link"
    if explicit == "button":
        return "button" if native_button else "role-button"
    if native_link:
        return "link"
    if native_button:
        return "button"
    return None


def _interactive_name(node: _Node, index: _DocumentIndex) -> _NameResult:
    aria = _author_name(node, index, allow_title=False)
    if aria.value or aria.source == "aria-labelledby":
        return aria
    role = (_clean(node.attrs.get("role")) or "").lower().split()[0:1]
    explicit_role = role[0] if role else ""
    if node.tag in {"a", "button"} or explicit_role in {"link", "button"}:
        text = _node_text(node.index, index)
        if text:
            return _NameResult(text[:_MAX_TEXT_CHARS], "text")
    if node.tag == "area":
        alt = _clean(node.attrs.get("alt"))
        if alt:
            return _NameResult(alt[:_MAX_TEXT_CHARS], "alt")
    if node.tag == "input":
        input_type = (_clean(node.attrs.get("type")) or "text").lower()
        if input_type == "image":
            alt = _clean(node.attrs.get("alt"))
            if alt:
                return _NameResult(alt[:_MAX_TEXT_CHARS], "alt")
        value = _clean(node.attrs.get("value"))
        if value:
            return _NameResult(value[:_MAX_TEXT_CHARS], "value")
        if input_type in {"submit", "reset"}:
            return _NameResult(input_type.title(), "default-value")
    title = _clean(node.attrs.get("title"))
    if title:
        return _NameResult(title[:_MAX_TEXT_CHARS], "title")
    return _NameResult(None, "none", aria.missing_labelledby_ids)


def _interactive_item(
    node: _Node,
    kind: InteractiveKind,
    index: _DocumentIndex,
) -> InteractiveItemResponse:
    name = _interactive_name(node, index)
    issues: list[str] = []
    if not name.value:
        issues.append("interactive element has no static accessible name")
    if name.source == "title":
        issues.append("title-only accessible name")
    if name.missing_labelledby_ids:
        issues.append("aria-labelledby references missing ids")
    if any(
        _interactive_kind(index.nodes[parent]) is not None
        for parent in _ancestor_indices(node, index)
    ):
        issues.append("nested interactive element")
    native = kind in {"link", "button"}
    if not native and _clean(node.attrs.get("tabindex")) != "0":
        issues.append("non-native role has no tabindex=0 signal")
    href = _clean(node.attrs.get("href"))
    if kind in {"link", "role-link"} and href:
        lowered = href.lower()
        if lowered.startswith("javascript:"):
            issues.append("javascript URL link target")
        elif href in {"#", ""}:
            issues.append("empty or fragment-only link target")
    id_value = _clean(node.attrs.get("id"))
    if id_value and id_value in index.duplicate_ids:
        issues.append("interactive element id is duplicated")
    generic = bool(name.value and name.value.casefold().strip(" .:;!?") in _GENERIC_NAMES)
    if generic:
        issues.append("generic accessible name in isolation")
    return InteractiveItemResponse(
        position=node.position,
        kind=kind,
        tag=node.tag[:40],
        role=_capped(node.attrs.get("role"), 80),
        href=href[:2_048] if href else None,
        id_value=id_value[:300] if id_value else None,
        accessible_name=name.value,
        name_source=name.source,
        native_element=native,
        hidden_signal=_hidden_signal(node),
        generic_name=generic,
        issues=tuple(issues),
    )


def _interactive_findings(
    items: list[InteractiveItemResponse],
) -> list[AccessibilityFindingResponse]:
    findings: list[AccessibilityFindingResponse] = []
    unnamed = [item for item in items if item.accessible_name is None]
    if unnamed:
        findings.append(
            AccessibilityFindingResponse(
                id="unnamed-interactive-elements",
                title="Links or buttons without a static accessible name were found",
                severity="high",
                value=str(len(unnamed)),
                position=unnamed[0].position,
                recommendation=(
                    "Provide a concise accessible name from visible text, alt text, "
                    "aria-label, or aria-labelledby."
                ),
            )
        )
    generic = [item for item in items if item.generic_name]
    if generic:
        findings.append(
            AccessibilityFindingResponse(
                id="generic-interactive-names",
                title="Generic link or button names were found",
                severity="medium",
                value=str(len(generic)),
                recommendation=(
                    "Use names that describe the destination or action without relying "
                    "entirely on nearby context."
                ),
            )
        )
    nested = [item for item in items if "nested interactive element" in item.issues]
    if nested:
        findings.append(
            AccessibilityFindingResponse(
                id="nested-interactive-elements",
                title="Nested interactive elements were found",
                severity="high",
                value=str(len(nested)),
                position=nested[0].position,
                recommendation=(
                    "Do not nest links, buttons, or equivalent interactive roles inside "
                    "each other."
                ),
            )
        )
    role_without_keyboard = [
        item for item in items if "non-native role has no tabindex=0 signal" in item.issues
    ]
    if role_without_keyboard:
        findings.append(
            AccessibilityFindingResponse(
                id="role-without-keyboard-signal",
                title="Non-native link/button roles lack a tabindex=0 signal",
                severity="medium",
                value=str(len(role_without_keyboard)),
                recommendation=(
                    "Prefer native a/button elements. If a custom role is unavoidable, implement "
                    "focus and keyboard activation, then verify it in a browser."
                ),
            )
        )
    title_only = [item for item in items if item.name_source == "title"]
    if title_only:
        findings.append(
            AccessibilityFindingResponse(
                id="title-only-interactive-names",
                title="Interactive elements with title-only names were found",
                severity="medium",
                value=str(len(title_only)),
                recommendation="Prefer visible text or explicit ARIA naming over title alone.",
            )
        )
    broken_refs = [
        item for item in items if "aria-labelledby references missing ids" in item.issues
    ]
    if broken_refs:
        findings.append(
            AccessibilityFindingResponse(
                id="interactive-broken-labelledby",
                title="Interactive aria-labelledby references could not be resolved",
                severity="high",
                value=str(len(broken_refs)),
                recommendation=(
                    "Point aria-labelledby to existing unique elements with meaningful text."
                ),
            )
        )
    duplicate_ids = [
        item for item in items if "interactive element id is duplicated" in item.issues
    ]
    if duplicate_ids:
        findings.append(
            AccessibilityFindingResponse(
                id="duplicate-interactive-ids",
                title="Interactive elements with duplicate IDs were found",
                severity="high",
                value=str(len(duplicate_ids)),
                recommendation=(
                    "Use unique IDs so labels, descriptions, and scripted references are "
                    "deterministic."
                ),
            )
        )
    javascript_targets = [item for item in items if "javascript URL link target" in item.issues]
    if javascript_targets:
        findings.append(
            AccessibilityFindingResponse(
                id="javascript-link-targets",
                title="Links with javascript: targets were found",
                severity="medium",
                value=str(len(javascript_targets)),
                recommendation=(
                    "Use native buttons for actions and normal HTTP(S) links for navigation."
                ),
            )
        )
    empty_targets = [
        item for item in items if "empty or fragment-only link target" in item.issues
    ]
    if empty_targets:
        findings.append(
            AccessibilityFindingResponse(
                id="empty-link-targets",
                title="Empty or fragment-only link targets were found",
                severity="info",
                value=str(len(empty_targets)),
                recommendation=(
                    "Confirm these elements have a real navigation target or use a button "
                    "for actions."
                ),
            )
        )
    hrefs_by_name: dict[str, set[str]] = defaultdict(set)
    for item in items:
        if item.accessible_name and item.href:
            hrefs_by_name[item.accessible_name.casefold()].add(item.href)
    ambiguous_names = sum(len(hrefs) > 1 for hrefs in hrefs_by_name.values())
    if ambiguous_names:
        findings.append(
            AccessibilityFindingResponse(
                id="same-name-different-targets",
                title="Same accessible names point to different targets",
                severity="info",
                value=str(ambiguous_names),
                recommendation=(
                    "Review whether additional context makes each destination clear to "
                    "assistive technology users."
                ),
            )
        )
    return findings


def _analysis_status(
    *,
    status_code: int,
    content_type: str | None,
    findings: list[AccessibilityFindingResponse],
) -> ToolStatus:
    if status_code >= 400 or not _is_html_candidate(content_type):
        return "fail"
    if any(finding.severity == "high" for finding in findings):
        return "fail"
    if findings:
        return "warning"
    return "pass"


def _landmark_recommendation(
    value: ToolStatus,
    *,
    landmark_count: int,
    main_count: int,
    finding_count: int,
) -> str:
    if value == "fail" and landmark_count == 0:
        return (
            "No usable static landmark structure was found. Add semantic landmarks and "
            "verify the rendered accessibility tree."
        )
    if finding_count:
        return (
            f"Static HTML contains {landmark_count} landmark candidate(s), {main_count} main "
            f"candidate(s), and {finding_count} review finding(s). Resolve structural and naming "
            "issues, then verify the rendered accessibility tree with browser tooling."
        )
    return (
        f"Reviewed {landmark_count} static landmark candidate(s) without the selected findings. "
        "This is not a WCAG conformance result and does not inspect runtime DOM changes."
    )


def _form_recommendation(
    value: ToolStatus,
    *,
    control_count: int,
    unlabeled_count: int,
    finding_count: int,
) -> str:
    if value == "fail" and control_count == 0:
        return "The target did not return a successful HTML document for bounded form analysis."
    if finding_count:
        return (
            f"Reviewed {control_count} static control(s); {unlabeled_count} lack a resolved static "
            f"name and {finding_count} grouped finding(s) need review. Test focus, errors, "
            "instructions, "
            "and dynamic states in a browser."
        )
    return (
        f"Reviewed {control_count} static form control(s) without the selected labeling "
        "and grouping "
        "findings. Keyboard behavior, validation flow, CSS visibility, and runtime "
        "changes were not tested."
    )


def _interactive_recommendation(
    value: ToolStatus,
    *,
    interactive_count: int,
    unnamed_count: int,
    generic_count: int,
) -> str:
    if value == "fail" and interactive_count == 0:
        return (
            "The target did not return a successful HTML document for bounded link/button "
            "name analysis."
        )
    if unnamed_count or generic_count:
        return (
            f"Reviewed {interactive_count} static link/button candidate(s): "
            f"{unnamed_count} unnamed "
            f"and {generic_count} generic-name candidate(s). Fix names and verify keyboard "
            "behavior and "
            "the computed accessibility tree in a browser."
        )
    return (
        f"Reviewed {interactive_count} static link/button candidate(s) without the selected name "
        "findings. This does not execute scripts or prove keyboard operability or WCAG conformance."
    )
