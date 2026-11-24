
import { resolveAccountApiBaseUrl, selectAccountSessionCookie } from "../account/account-proxy-contract";
import type { ClientModerationAction } from "./admin-contract";

const sectionParams = {
  access: [],
  overview: ["days"],
  clients: ["page", "days", "segment"],
  payments: ["page", "days", "date_basis", "state", "currency", "kind"],
  usage: ["days"],
} as const;

export type AdminSection = keyof typeof sectionParams;
const ADMIN_SEARCH_HEADER = "x-admin-email-query";

export function isAdminSection(section: string): section is AdminSection {
  return Object.hasOwn(sectionParams, section);
}

function adminSessionCookie(headers: Pick<Headers, "get">) {
  const cookie = selectAccountSessionCookie(headers.get("cookie"));
  return cookie && /^webdiag_session=[A-Za-z0-9_-]{1,256}$/u.test(cookie) ? cookie : null;
}

export async function readAdminUpstream(
  section: AdminSection,
  headers: Pick<Headers, "get">,
  params = new URLSearchParams(),
  signal?: AbortSignal,
): Promise<Response> {
  const cookie = adminSessionCookie(headers);
  if (!cookie) return new Response(null, { status: 401 });
  const query = new URLSearchParams();
  for (const key of sectionParams[section]) {
    const value = params.get(key);
    if (value === null) continue;
    if (!/^[A-Za-z0-9_]{1,16}$/u.test(value)) return new Response(null, { status: 422 });
    query.set(key, value);
  }
  const search = section === "clients" ? headers.get(ADMIN_SEARCH_HEADER) : null;
  if (search && search.length > 3048) return new Response(null, { status: 422 });

  const timeout = AbortSignal.timeout(8_000);
  try {
    const url = new URL("/v1/admin/" + section, resolveAccountApiBaseUrl());
    url.search = query.toString();
    return await fetch(url.toString(), {
      headers: { accept: "application/json", cookie, ...(search ? { [ADMIN_SEARCH_HEADER]: search } : {}) },
      cache: "no-store",
      redirect: "error",
      signal: signal ? AbortSignal.any([signal, timeout]) : timeout,
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}

export async function moderateAdminClient(
  userId: string,
  action: ClientModerationAction,
  headers: Pick<Headers, "get">,
  signal: AbortSignal,
): Promise<Response> {
  const cookie = adminSessionCookie(headers);
  if (!cookie) return new Response(null, { status: 401 });
  try {
    const url = new URL(`/v1/admin/clients/${userId}/${action}`, resolveAccountApiBaseUrl());
    return await fetch(url.toString(), {
      method: "POST",
      headers: { accept: "application/json", cookie, "x-webdiag-admin-action": "1" },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.any([signal, AbortSignal.timeout(12_000)]),
    });
  } catch {
    return new Response(null, { status: 503 });
  }
}
