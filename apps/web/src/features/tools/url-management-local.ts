export type LocalToolStatus = "pass" | "warning";
export type UrlChangeKind = "normalized" | "review" | "information";
export type QueryParameterCategory =
  | "tracking"
  | "pagination"
  | "sorting"
  | "filtering"
  | "search"
  | "session"
  | "other";

export interface UrlNormalizationChange {
  readonly id: string;
  readonly kind: UrlChangeKind;
  readonly message: string;
}

export interface UrlNormalizationResult {
  readonly input_url: string;
  readonly normalized_url: string;
  readonly request_url: string;
  readonly scheme: "http" | "https";
  readonly hostname: string;
  readonly port: string | null;
  readonly pathname: string;
  readonly query: string;
  readonly fragment: string;
  readonly change_count: number;
  readonly review_signal_count: number;
  readonly changes: readonly UrlNormalizationChange[];
  readonly status: LocalToolStatus;
  readonly recommendation: string;
}

export interface QueryParameterItem {
  readonly position: number;
  readonly raw_name: string;
  readonly raw_value: string;
  readonly name: string;
  readonly value: string;
  readonly category: QueryParameterCategory;
  readonly duplicate_name: boolean;
  readonly blank_name: boolean;
  readonly blank_value: boolean;
  readonly sensitive_name: boolean;
}

export interface QueryParameterResult {
  readonly input_url: string;
  readonly base_url: string;
  readonly pair_count: number;
  readonly unique_name_count: number;
  readonly duplicate_name_count: number;
  readonly blank_name_count: number;
  readonly blank_value_count: number;
  readonly tracking_parameter_count: number;
  readonly pagination_parameter_count: number;
  readonly sorting_parameter_count: number;
  readonly filtering_parameter_count: number;
  readonly search_parameter_count: number;
  readonly session_parameter_count: number;
  readonly sensitive_name_count: number;
  readonly case_variant_group_count: number;
  readonly tracking_removed_candidate: string | null;
  readonly parameters: readonly QueryParameterItem[];
  readonly findings: readonly string[];
  readonly status: LocalToolStatus;
  readonly recommendation: string;
}

const UNRESERVED = /^[A-Za-z0-9\-._~]$/;
const TRACKING_EXACT = new Set([
  "gclid",
  "dclid",
  "fbclid",
  "msclkid",
  "yclid",
  "_ga",
  "_gl",
  "mc_cid",
  "mc_eid",
]);
const PAGINATION_NAMES = new Set(["page", "p", "paged", "offset", "start", "cursor"]);
const SORTING_NAMES = new Set(["sort", "order", "orderby", "sort_by", "sortby"]);
const SEARCH_NAMES = new Set(["q", "query", "search", "keyword", "keywords", "s"]);
const SESSION_NAMES = new Set([
  "session",
  "sessionid",
  "sid",
  "phpsessid",
  "jsessionid",
]);
const SENSITIVE_NAMES = new Set([
  "token",
  "access_token",
  "auth",
  "authorization",
  "password",
  "passwd",
  "secret",
  "api_key",
  "apikey",
  "email",
  "session",
  "sessionid",
  "sid",
]);

function parseHttpUrl(raw: string): { input: string; url: URL } {
  const input = raw.trim();
  if (!input) throw new Error("URL is required.");
  let url: URL;
  try {
    url = new URL(input);
  } catch {
    throw new Error("Enter a valid absolute URL.");
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are supported.");
  }
  if (url.username || url.password) {
    throw new Error("Credentials in URLs are not supported.");
  }
  return { input, url };
}

function normalizePercentEncoding(value: string): string {
  return value.replace(/%[0-9a-fA-F]{2}/g, (encoded) => {
    const decoded = String.fromCharCode(Number.parseInt(encoded.slice(1), 16));
    return UNRESERVED.test(decoded) ? decoded : encoded.toUpperCase();
  });
}

function authority(url: URL): string {
  return url.port ? `${url.hostname}:${url.port}` : url.hostname;
}

function rawAuthority(input: string): string | null {
  const match = input.match(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/([^/?#]*)/);
  return match?.[1] ?? null;
}

function rawPath(input: string): string {
  const match = input.match(/^[A-Za-z][A-Za-z0-9+.-]*:\/\/[^/?#]*([^?#]*)/);
  return match?.[1] ?? "";
}

export function analyzeUrlNormalization(raw: string): UrlNormalizationResult {
  const original = raw;
  const { input, url } = parseHttpUrl(raw);
  const changes: UrlNormalizationChange[] = [];
  const originalAuthority = rawAuthority(input);
  const originalPath = rawPath(input);
  const normalizedPath = normalizePercentEncoding(url.pathname || "/");
  const normalizedSearch = normalizePercentEncoding(url.search);
  const normalizedHash = normalizePercentEncoding(url.hash);
  const normalizedUrl = `${url.protocol}//${authority(url)}${normalizedPath}${normalizedSearch}${normalizedHash}`;
  const requestUrl = `${url.protocol}//${authority(url)}${normalizedPath}${normalizedSearch}`;

  if (original !== input) {
    changes.push({
      id: "trimmed-whitespace",
      kind: "normalized",
      message: "Leading or trailing whitespace was removed.",
    });
  }
  const rawScheme = input.slice(0, input.indexOf(":"));
  if (rawScheme !== rawScheme.toLowerCase()) {
    changes.push({
      id: "scheme-case",
      kind: "normalized",
      message: "The URL scheme was lowercased.",
    });
  }
  const rawHost = originalAuthority?.replace(/:\d+$/, "") ?? "";
  if (rawHost && rawHost !== rawHost.toLowerCase()) {
    changes.push({
      id: "hostname-case",
      kind: "normalized",
      message: "The hostname was lowercased.",
    });
  }
  if (
    originalAuthority
    && ((url.protocol === "http:" && /:80$/.test(originalAuthority))
      || (url.protocol === "https:" && /:443$/.test(originalAuthority)))
  ) {
    changes.push({
      id: "default-port",
      kind: "normalized",
      message: "The explicit default port was removed.",
    });
  }
  if (/[^\x00-\x7F]/.test(rawHost)) {
    changes.push({
      id: "idn-ascii",
      kind: "normalized",
      message: "The internationalized hostname was serialized as ASCII IDNA.",
    });
  }
  if (/\/(?:\.|\.\.)(?:\/|$)/.test(originalPath)) {
    changes.push({
      id: "dot-segments",
      kind: "normalized",
      message: "Path dot segments were resolved.",
    });
  }
  if (!originalPath) {
    changes.push({
      id: "empty-path",
      kind: "normalized",
      message: "An empty HTTP path was represented as '/'.",
    });
  }
  if (
    normalizedPath !== url.pathname
    || normalizedSearch !== url.search
    || normalizedHash !== url.hash
  ) {
    changes.push({
      id: "percent-encoding",
      kind: "normalized",
      message: "Percent-encoding was normalized without decoding reserved characters.",
    });
  }
  if (url.hash) {
    changes.push({
      id: "fragment-not-requested",
      kind: "information",
      message: "The fragment remains in the display URL but is not sent in the HTTP request.",
    });
  }
  if (/\/\//.test(normalizedPath)) {
    changes.push({
      id: "duplicate-path-slashes",
      kind: "review",
      message: "Repeated path slashes were preserved because collapsing them can change routing.",
    });
  }
  if (normalizedPath !== "/" && normalizedPath.endsWith("/")) {
    changes.push({
      id: "trailing-slash",
      kind: "review",
      message: "The trailing slash was preserved because slash semantics depend on the server.",
    });
  }
  if (url.search) {
    changes.push({
      id: "query-order",
      kind: "information",
      message: "Query parameter order was preserved; the analyzer does not assume order is irrelevant.",
    });
  }

  const reviewSignalCount = changes.filter((item) => item.kind === "review").length;
  return {
    input_url: input,
    normalized_url: normalizedUrl,
    request_url: requestUrl,
    scheme: url.protocol === "https:" ? "https" : "http",
    hostname: url.hostname,
    port: url.port || null,
    pathname: normalizedPath,
    query: normalizedSearch.startsWith("?") ? normalizedSearch.slice(1) : normalizedSearch,
    fragment: normalizedHash.startsWith("#") ? normalizedHash.slice(1) : normalizedHash,
    change_count: changes.filter((item) => item.kind === "normalized").length,
    review_signal_count: reviewSignalCount,
    changes,
    status: reviewSignalCount ? "warning" : "pass",
    recommendation: reviewSignalCount
      ? "Use the deterministic normalized form as a comparison aid, but verify duplicate-slash and trailing-slash behavior against the application router."
      : "The deterministic syntax is normalized. This result does not claim which URL should be the SEO canonical URL.",
  };
}

function decodeQueryComponent(value: string): string {
  try {
    return decodeURIComponent(value.replace(/\+/g, " "));
  } catch {
    return value.replace(/\+/g, " ");
  }
}

function categoryFor(name: string): QueryParameterCategory {
  const normalized = name.toLowerCase();
  if (normalized.startsWith("utm_") || TRACKING_EXACT.has(normalized)) return "tracking";
  if (PAGINATION_NAMES.has(normalized)) return "pagination";
  if (SORTING_NAMES.has(normalized)) return "sorting";
  if (SEARCH_NAMES.has(normalized)) return "search";
  if (SESSION_NAMES.has(normalized)) return "session";
  if (
    normalized.startsWith("filter")
    || normalized.startsWith("facet")
    || normalized.startsWith("attribute")
    || normalized === "category"
    || normalized === "brand"
    || normalized === "price"
  ) return "filtering";
  return "other";
}

export function analyzeQueryParameters(raw: string): QueryParameterResult {
  const { input, url } = parseHttpUrl(raw);
  const rawQuery = url.search.startsWith("?") ? url.search.slice(1) : url.search;
  const rawPairs = rawQuery ? rawQuery.split("&") : [];
  if (rawPairs.length > 200) {
    throw new Error("A maximum of 200 query parameter pairs is supported.");
  }

  const decodedPairs = rawPairs.map((rawPair, index) => {
    const separator = rawPair.indexOf("=");
    const rawName = separator >= 0 ? rawPair.slice(0, separator) : rawPair;
    const rawValue = separator >= 0 ? rawPair.slice(separator + 1) : "";
    const name = decodeQueryComponent(rawName);
    const value = decodeQueryComponent(rawValue);
    return {
      position: index + 1,
      raw_pair: rawPair,
      raw_name: rawName,
      raw_value: rawValue,
      name,
      value,
      category: categoryFor(name),
    };
  });
  const nameCounts = new Map<string, number>();
  const caseGroups = new Map<string, Set<string>>();
  for (const pair of decodedPairs) {
    nameCounts.set(pair.name, (nameCounts.get(pair.name) ?? 0) + 1);
    const key = pair.name.toLowerCase();
    const variants = caseGroups.get(key) ?? new Set<string>();
    variants.add(pair.name);
    caseGroups.set(key, variants);
  }

  const parameters: QueryParameterItem[] = decodedPairs.map((pair) => ({
    position: pair.position,
    raw_name: pair.raw_name,
    raw_value: pair.raw_value,
    name: pair.name,
    value: pair.value,
    category: pair.category,
    duplicate_name: (nameCounts.get(pair.name) ?? 0) > 1,
    blank_name: pair.name.length === 0,
    blank_value: pair.value.length === 0,
    sensitive_name: SENSITIVE_NAMES.has(pair.name.toLowerCase()),
  }));

  const countCategory = (category: QueryParameterCategory) => (
    parameters.filter((item) => item.category === category).length
  );
  const duplicateNameCount = [...nameCounts.values()].reduce(
    (total, count) => total + Math.max(0, count - 1),
    0,
  );
  const blankNameCount = parameters.filter((item) => item.blank_name).length;
  const blankValueCount = parameters.filter((item) => item.blank_value).length;
  const sensitiveNameCount = parameters.filter((item) => item.sensitive_name).length;
  const caseVariantGroupCount = [...caseGroups.values()].filter(
    (variants) => variants.size > 1,
  ).length;
  const trackingParameterCount = countCategory("tracking");
  const findings: string[] = [];
  if (duplicateNameCount) findings.push("Repeated parameter names are present; confirm whether the backend treats them as a list, first value, or last value.");
  if (blankNameCount) findings.push("At least one query pair has an empty parameter name.");
  if (blankValueCount) findings.push("At least one query parameter has an empty value.");
  if (caseVariantGroupCount) findings.push("Parameter names differ only by case; backend handling may be case-sensitive.");
  if (sensitiveNameCount) findings.push("Sensitive-looking parameter names are present; review logs, analytics, referrers, and sharing behavior.");
  if (parameters.length > 15) findings.push("The URL has many query pairs; review crawl space and cache-key behavior.");
  if (countCategory("pagination")) findings.push("Pagination-like parameters were detected by name only; the analyzer does not infer indexation intent.");
  if (trackingParameterCount) findings.push("Known tracking-name patterns were detected. A removal candidate is shown without changing the source URL.");

  const keptRawPairs = decodedPairs
    .filter((pair) => pair.category !== "tracking")
    .map((pair) => pair.raw_pair);
  const baseUrl = `${url.protocol}//${authority(url)}${url.pathname || "/"}`;
  const trackingRemovedCandidate = trackingParameterCount
    ? `${baseUrl}${keptRawPairs.length ? `?${keptRawPairs.join("&")}` : ""}`
    : null;
  const warning = duplicateNameCount > 0
    || blankNameCount > 0
    || blankValueCount > 0
    || sensitiveNameCount > 0
    || caseVariantGroupCount > 0
    || parameters.length > 15;

  return {
    input_url: input,
    base_url: baseUrl,
    pair_count: parameters.length,
    unique_name_count: nameCounts.size,
    duplicate_name_count: duplicateNameCount,
    blank_name_count: blankNameCount,
    blank_value_count: blankValueCount,
    tracking_parameter_count: trackingParameterCount,
    pagination_parameter_count: countCategory("pagination"),
    sorting_parameter_count: countCategory("sorting"),
    filtering_parameter_count: countCategory("filtering"),
    search_parameter_count: countCategory("search"),
    session_parameter_count: countCategory("session"),
    sensitive_name_count: sensitiveNameCount,
    case_variant_group_count: caseVariantGroupCount,
    tracking_removed_candidate: trackingRemovedCandidate,
    parameters,
    findings,
    status: warning ? "warning" : "pass",
    recommendation: warning
      ? "Confirm server semantics, cache keys, log exposure, duplicate handling, and crawl controls before rewriting or removing parameters."
      : "The query structure has no high-confidence syntax warning. Tracking and pagination classifications remain transparent name-based heuristics.",
  };
}
