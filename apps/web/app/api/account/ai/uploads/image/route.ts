import type { NextRequest } from "next/server";
import { proxyAIImageUpload } from "../../../../../../src/features/account/account-ai-media-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export function POST(request: NextRequest) { return proxyAIImageUpload(request); }
