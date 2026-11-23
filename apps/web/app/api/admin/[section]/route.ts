
import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_HEADERS } from "../../../../src/features/admin/admin-routing";
import { isAdminSection, readAdminUpstream } from "../../../../src/features/admin/admin-upstream";

export const dynamic = "force-dynamic";

function errorResponse(status: number) {
  return NextResponse.json({ error: "admin_read_failed" }, { status, headers: ADMIN_HEADERS });
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ section: string }> }) {
  const { section } = await params;
  if (!isAdminSection(section)) return errorResponse(404);

  const upstream = await readAdminUpstream(section, request.headers, request.nextUrl.searchParams, request.signal);
  if (!upstream.ok) {
    await upstream.body?.cancel().catch(() => {});
    return errorResponse([401, 403, 422].includes(upstream.status) ? upstream.status : 503);
  }
  try {
    return NextResponse.json(await upstream.json(), { headers: ADMIN_HEADERS });
  } catch {
    return errorResponse(503);
  }
}
