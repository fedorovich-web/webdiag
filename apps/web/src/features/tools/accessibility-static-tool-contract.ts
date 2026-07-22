export type ToolStatus = "pass" | "warning" | "fail";
export type FindingSeverity = "info" | "medium" | "high";
export type NameSource =
  | "aria-label"
  | "aria-labelledby"
  | "label"
  | "text"
  | "alt"
  | "value"
  | "default-value"
  | "title"
  | "none";
export type LandmarkType =
  | "banner"
  | "navigation"
  | "main"
  | "contentinfo"
  | "complementary"
  | "search"
  | "form"
  | "region";
export type InteractiveKind = "link" | "button" | "role-link" | "role-button";

export interface AccessibilityFinding {
  readonly id: string;
  readonly title: string;
  readonly severity: FindingSeverity;
  readonly element: string | null;
  readonly position: number | null;
  readonly value: string | null;
  readonly recommendation: string;
}

interface BaseResponse {
  readonly generated_at: string;
  readonly requested_url: string;
  readonly final_url: string;
  readonly status_code: number;
  readonly content_type: string | null;
  readonly scan_mode: "static_html_bounded";
  readonly finding_count: number;
  readonly findings: readonly AccessibilityFinding[];
  readonly redirect_count: number;
  readonly truncated: boolean;
  readonly status: ToolStatus;
  readonly recommendation: string;
}

export interface LandmarkItem {
  readonly position: number;
  readonly tag: string;
  readonly role: string | null;
  readonly landmark_type: LandmarkType;
  readonly id_value: string | null;
  readonly accessible_name: string | null;
  readonly name_source: NameSource;
  readonly hidden_signal: boolean;
  readonly nested_landmark_depth: number;
  readonly issues: readonly string[];
}

export interface LandmarkStructureResponse extends BaseResponse {
  readonly contract_version: "webdiag.tool.landmark_structure_analyzer.v1";
  readonly landmark_count: number;
  readonly named_landmark_count: number;
  readonly main_count: number;
  readonly navigation_count: number;
  readonly banner_count: number;
  readonly contentinfo_count: number;
  readonly complementary_count: number;
  readonly search_count: number;
  readonly form_landmark_count: number;
  readonly region_count: number;
  readonly duplicate_role_name_count: number;
  readonly landmarks: readonly LandmarkItem[];
}

export interface FormItem {
  readonly position: number;
  readonly id_value: string | null;
  readonly accessible_name: string | null;
  readonly name_source: NameSource;
  readonly control_count: number;
  readonly labeled_control_count: number;
  readonly unlabeled_control_count: number;
  readonly fieldset_count: number;
  readonly fieldset_without_legend_count: number;
  readonly issues: readonly string[];
}

export interface FormControlItem {
  readonly position: number;
  readonly tag: string;
  readonly input_type: string | null;
  readonly id_value: string | null;
  readonly name_attribute: string | null;
  readonly form_position: number | null;
  readonly accessible_name: string | null;
  readonly name_source: NameSource;
  readonly required: boolean;
  readonly disabled: boolean;
  readonly placeholder_present: boolean;
  readonly issues: readonly string[];
}

export interface FormAccessibilityResponse extends BaseResponse {
  readonly contract_version: "webdiag.tool.form_accessibility_analyzer.v1";
  readonly form_count: number;
  readonly control_count: number;
  readonly labeled_control_count: number;
  readonly unlabeled_control_count: number;
  readonly placeholder_only_count: number;
  readonly button_control_count: number;
  readonly fieldset_count: number;
  readonly fieldset_without_legend_count: number;
  readonly broken_label_reference_count: number;
  readonly broken_description_reference_count: number;
  readonly ungrouped_choice_set_count: number;
  readonly forms: readonly FormItem[];
  readonly controls: readonly FormControlItem[];
}

export interface InteractiveItem {
  readonly position: number;
  readonly kind: InteractiveKind;
  readonly tag: string;
  readonly role: string | null;
  readonly href: string | null;
  readonly id_value: string | null;
  readonly accessible_name: string | null;
  readonly name_source: NameSource;
  readonly native_element: boolean;
  readonly hidden_signal: boolean;
  readonly generic_name: boolean;
  readonly issues: readonly string[];
}

export interface InteractiveAccessibleNameResponse extends BaseResponse {
  readonly contract_version: "webdiag.tool.interactive_accessible_name_analyzer.v1";
  readonly interactive_count: number;
  readonly link_count: number;
  readonly button_count: number;
  readonly role_link_count: number;
  readonly role_button_count: number;
  readonly named_count: number;
  readonly unnamed_count: number;
  readonly generic_name_count: number;
  readonly nested_interactive_count: number;
  readonly role_without_keyboard_signal_count: number;
  readonly items: readonly InteractiveItem[];
}

export type AccessibilityStaticResponse =
  | LandmarkStructureResponse
  | FormAccessibilityResponse
  | InteractiveAccessibleNameResponse;

function isRecord(value: unknown): value is Record<string, unknown> {
  return !!value && typeof value === "object" && !Array.isArray(value);
}

function isStringArray(value: unknown): value is readonly string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNullableString(value: unknown): value is string | null {
  return typeof value === "string" || value === null;
}

function isNullablePositiveInteger(value: unknown): value is number | null {
  return value === null || isPositiveInteger(value);
}

function isNonNegativeInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 0;
}

function isPositiveInteger(value: unknown): value is number {
  return typeof value === "number" && Number.isInteger(value) && value >= 1;
}

function isHttpStatus(value: unknown): value is number {
  return isPositiveInteger(value) && value >= 100 && value <= 599;
}

function isStatus(value: unknown): value is ToolStatus {
  return value === "pass" || value === "warning" || value === "fail";
}

function isSeverity(value: unknown): value is FindingSeverity {
  return value === "info" || value === "medium" || value === "high";
}

function isNameSource(value: unknown): value is NameSource {
  return (
    value === "aria-label" ||
    value === "aria-labelledby" ||
    value === "label" ||
    value === "text" ||
    value === "alt" ||
    value === "value" ||
    value === "default-value" ||
    value === "title" ||
    value === "none"
  );
}

function isLandmarkType(value: unknown): value is LandmarkType {
  return (
    value === "banner" ||
    value === "navigation" ||
    value === "main" ||
    value === "contentinfo" ||
    value === "complementary" ||
    value === "search" ||
    value === "form" ||
    value === "region"
  );
}

function isInteractiveKind(value: unknown): value is InteractiveKind {
  return value === "link" || value === "button" || value === "role-link" || value === "role-button";
}

function isFinding(value: unknown): value is AccessibilityFinding {
  return (
    isRecord(value) &&
    typeof value.id === "string" &&
    typeof value.title === "string" &&
    isSeverity(value.severity) &&
    isNullableString(value.element) &&
    isNullablePositiveInteger(value.position) &&
    isNullableString(value.value) &&
    typeof value.recommendation === "string"
  );
}

function hasBaseFields(payload: Record<string, unknown>): boolean {
  return (
    typeof payload.generated_at === "string" &&
    typeof payload.requested_url === "string" &&
    typeof payload.final_url === "string" &&
    isHttpStatus(payload.status_code) &&
    isNullableString(payload.content_type) &&
    payload.scan_mode === "static_html_bounded" &&
    isNonNegativeInteger(payload.finding_count) &&
    Array.isArray(payload.findings) &&
    payload.findings.every(isFinding) &&
    isNonNegativeInteger(payload.redirect_count) &&
    typeof payload.truncated === "boolean" &&
    isStatus(payload.status) &&
    typeof payload.recommendation === "string"
  );
}

function isLandmarkItem(value: unknown): value is LandmarkItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.tag === "string" &&
    isNullableString(value.role) &&
    isLandmarkType(value.landmark_type) &&
    isNullableString(value.id_value) &&
    isNullableString(value.accessible_name) &&
    isNameSource(value.name_source) &&
    typeof value.hidden_signal === "boolean" &&
    isNonNegativeInteger(value.nested_landmark_depth) &&
    isStringArray(value.issues)
  );
}

export function isLandmarkStructureResponse(payload: unknown): payload is LandmarkStructureResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.landmark_structure_analyzer.v1" &&
    hasBaseFields(payload) &&
    isNonNegativeInteger(payload.landmark_count) &&
    isNonNegativeInteger(payload.named_landmark_count) &&
    isNonNegativeInteger(payload.main_count) &&
    isNonNegativeInteger(payload.navigation_count) &&
    isNonNegativeInteger(payload.banner_count) &&
    isNonNegativeInteger(payload.contentinfo_count) &&
    isNonNegativeInteger(payload.complementary_count) &&
    isNonNegativeInteger(payload.search_count) &&
    isNonNegativeInteger(payload.form_landmark_count) &&
    isNonNegativeInteger(payload.region_count) &&
    isNonNegativeInteger(payload.duplicate_role_name_count) &&
    Array.isArray(payload.landmarks) &&
    payload.landmarks.every(isLandmarkItem)
  );
}

function isFormItem(value: unknown): value is FormItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    isNullableString(value.id_value) &&
    isNullableString(value.accessible_name) &&
    isNameSource(value.name_source) &&
    isNonNegativeInteger(value.control_count) &&
    isNonNegativeInteger(value.labeled_control_count) &&
    isNonNegativeInteger(value.unlabeled_control_count) &&
    isNonNegativeInteger(value.fieldset_count) &&
    isNonNegativeInteger(value.fieldset_without_legend_count) &&
    isStringArray(value.issues)
  );
}

function isFormControlItem(value: unknown): value is FormControlItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    typeof value.tag === "string" &&
    isNullableString(value.input_type) &&
    isNullableString(value.id_value) &&
    isNullableString(value.name_attribute) &&
    isNullablePositiveInteger(value.form_position) &&
    isNullableString(value.accessible_name) &&
    isNameSource(value.name_source) &&
    typeof value.required === "boolean" &&
    typeof value.disabled === "boolean" &&
    typeof value.placeholder_present === "boolean" &&
    isStringArray(value.issues)
  );
}

export function isFormAccessibilityResponse(payload: unknown): payload is FormAccessibilityResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.form_accessibility_analyzer.v1" &&
    hasBaseFields(payload) &&
    isNonNegativeInteger(payload.form_count) &&
    isNonNegativeInteger(payload.control_count) &&
    isNonNegativeInteger(payload.labeled_control_count) &&
    isNonNegativeInteger(payload.unlabeled_control_count) &&
    isNonNegativeInteger(payload.placeholder_only_count) &&
    isNonNegativeInteger(payload.button_control_count) &&
    isNonNegativeInteger(payload.fieldset_count) &&
    isNonNegativeInteger(payload.fieldset_without_legend_count) &&
    isNonNegativeInteger(payload.broken_label_reference_count) &&
    isNonNegativeInteger(payload.broken_description_reference_count) &&
    isNonNegativeInteger(payload.ungrouped_choice_set_count) &&
    Array.isArray(payload.forms) &&
    payload.forms.every(isFormItem) &&
    Array.isArray(payload.controls) &&
    payload.controls.every(isFormControlItem)
  );
}

function isInteractiveItem(value: unknown): value is InteractiveItem {
  return (
    isRecord(value) &&
    isPositiveInteger(value.position) &&
    isInteractiveKind(value.kind) &&
    typeof value.tag === "string" &&
    isNullableString(value.role) &&
    isNullableString(value.href) &&
    isNullableString(value.id_value) &&
    isNullableString(value.accessible_name) &&
    isNameSource(value.name_source) &&
    typeof value.native_element === "boolean" &&
    typeof value.hidden_signal === "boolean" &&
    typeof value.generic_name === "boolean" &&
    isStringArray(value.issues)
  );
}

export function isInteractiveAccessibleNameResponse(
  payload: unknown,
): payload is InteractiveAccessibleNameResponse {
  return (
    isRecord(payload) &&
    payload.contract_version === "webdiag.tool.interactive_accessible_name_analyzer.v1" &&
    hasBaseFields(payload) &&
    isNonNegativeInteger(payload.interactive_count) &&
    isNonNegativeInteger(payload.link_count) &&
    isNonNegativeInteger(payload.button_count) &&
    isNonNegativeInteger(payload.role_link_count) &&
    isNonNegativeInteger(payload.role_button_count) &&
    isNonNegativeInteger(payload.named_count) &&
    isNonNegativeInteger(payload.unnamed_count) &&
    isNonNegativeInteger(payload.generic_name_count) &&
    isNonNegativeInteger(payload.nested_interactive_count) &&
    isNonNegativeInteger(payload.role_without_keyboard_signal_count) &&
    Array.isArray(payload.items) &&
    payload.items.every(isInteractiveItem)
  );
}
