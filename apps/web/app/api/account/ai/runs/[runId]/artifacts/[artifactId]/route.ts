import type { NextRequest } from "next/server";
import { proxyAIArtifact } from "../../../../../../../../src/features/account/account-ai-media-proxy";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, context: { params: Promise<{ runId: string; artifactId: string }> }) {
  const { runId, artifactId } = await context.params;
  return proxyAIArtifact(request, runId, artifactId);
}
