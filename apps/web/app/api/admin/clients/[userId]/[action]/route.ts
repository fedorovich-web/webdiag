import { NextResponse, type NextRequest } from "next/server";
import { isAccountWriteAllowed } from "../../../../../../src/features/account/account-origin";
import type { ClientModerationAction } from "../../../../../../src/features/admin/admin-contract";
import { ADMIN_HEADERS } from "../../../../../../src/features/admin/admin-routing";
import { moderateAdminClient } from "../../../../../../src/features/admin/admin-upstream";

export const dynamic = "force-dynamic";

const USER_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/u;

function isAction(action: string): action is ClientModerationAction {
  return action === "block" || action === "unblock" || action === "revoke-sessions";
}

function errorResponse(status: number) {
  return NextResponse.json({ error: "admin_write_failed" }, { status, headers: ADMIN_HEADERS });
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string; action: string }> },
) {
  const { userId, action } = await params;
  if (!USER_ID.test(userId) || !isAction(action)) return errorResponse(404);
  if (!request.headers.get("origin") || !isAccountWriteAllowed(request)) return errorResponse(403);
  const upstream = await moderateAdminClient(userId, action, request.headers, request.signal);
  if (!upstream.ok) {
    await upstream.body?.cancel().catch(() => {});
    return errorResponse([401, 403, 404, 409, 422].includes(upstream.status) ? upstream.status : 503);
  }
  try {
    const { id, status, revoked_session_count } = await upstream.json();
    if (id !== userId || (status !== "active" && status !== "blocked")
        || !Number.isSafeInteger(revoked_session_count) || revoked_session_count < 0) {
      return errorResponse(503);
    }
    return NextResponse.json({ id, status, revoked_session_count }, { headers: ADMIN_HEADERS });
  } catch {
    return errorResponse(503);
  }
}
