import { resolveAccountApiBaseUrl } from "./account-proxy-contract";

export async function accountSessionStatus(session: string | null): Promise<204 | 401 | 503> {
  if (!session) return 401;
  try {
    const response = await fetch(resolveAccountApiBaseUrl() + "/v1/account/me", {
      headers: { accept: "application/json", cookie: session },
      cache: "no-store",
      redirect: "error",
      signal: AbortSignal.timeout(2_000),
    });
    await response.body?.cancel().catch(() => {});
    return response.status === 200 ? 204 : response.status === 401 ? 401 : 503;
  } catch {
    return 503;
  }
}
