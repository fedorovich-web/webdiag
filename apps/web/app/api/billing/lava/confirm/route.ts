import { NextRequest } from "next/server";
import { proxyBilling } from "../../../../../src/features/account/billing-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = (request: NextRequest) => proxyBilling(request, "confirm");
