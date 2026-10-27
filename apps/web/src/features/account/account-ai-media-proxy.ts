import type { NextRequest } from "next/server";
import { readBoundedBody, RequestBodyError } from "../../lib/request-body";
import {
  AccountProxyConfigurationError,
  resolveAccountApiBaseUrl,
  resolveRequestSessionCookie,
} from "./account-proxy-contract";
import { canonicalAIResourceId } from "./account-ai-restored-contract";
import { isAccountWriteAllowed } from "./account-origin";

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;
const MAX_JSON_BYTES = 16_384;
const IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp"];
function error(code: string, message: string, status: number): Response {
  return Response.json(
    { detail: { code, message } },
    { status, headers: { "cache-control": "no-store" } },
  );
}

async function boundedBytes(body: ReadableStream<Uint8Array> | null, signal: AbortSignal): Promise<Uint8Array | null> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  let abortRead: () => void = () => {};
  const aborted = new Promise<never>((_resolve, reject) => {
    abortRead = () => {
      const reason = new DOMException("Private image request timed out.", "AbortError");
      void reader.cancel(reason).catch(() => {});
      reject(reason);
    };
    signal.addEventListener("abort", abortRead, { once: true });
    if (signal.aborted) abortRead();
  });
  try {
    while (true) {
      const { done, value } = await Promise.race([reader.read(), aborted]);
      if (signal.aborted) throw new DOMException("Private image request timed out.", "AbortError");
      if (done) break;
      size += value.byteLength;
      if (size > MAX_IMAGE_BYTES) {
        void reader.cancel().catch(() => {});
        return null;
      }
      chunks.push(value);
    }
  } finally {
    signal.removeEventListener("abort", abortRead);
    reader.releaseLock();
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  return bytes;
}
async function forward(request: NextRequest, path: string, upload: boolean): Promise<Response> {
  if (request.nextUrl.search) {
    return error("account_invalid_request", "Invalid image query.", 400);
  }
  if (upload && !isAccountWriteAllowed(request)) {
    return error("account_cross_origin", "Cross-origin account writes are not allowed.", 403);
  }
  const cookie = resolveRequestSessionCookie(request);
  if (!cookie) {
    return error("account_auth_required", "Sign in to access private images.", 401);
  }
  const mediaType = request.headers.get("content-type")?.split(";")[0];
  if (upload && (mediaType === undefined || !IMAGE_TYPES.includes(mediaType))) {
    return error("ai_invalid_image", "Use PNG, JPEG or WebP.", 415);
  }
  if (upload && Number(request.headers.get("content-length")) > MAX_IMAGE_BYTES) {
    return error("ai_image_too_large", "Image exceeds 4 MiB.", 413);
  }
  let base: string;
  try {
    base = resolveAccountApiBaseUrl();
  } catch (caught) {
    if (!(caught instanceof AccountProxyConfigurationError)) throw caught;
    return error("account_api_misconfigured", "Account API is not configured.", 500);
  }
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  try {
    const body = upload ? await boundedBytes(request.body, controller.signal) : undefined;
    if (body === null) {
      return error("ai_image_too_large", "Image exceeds 4 MiB.", 413);
    }
    const headers: Record<string, string> = {
      cookie,
      accept: upload ? "application/json" : IMAGE_TYPES.join(","),
    };
    if (upload && mediaType !== undefined) headers["content-type"] = mediaType;
    const upstream = await fetch(`${base}${path}`, {
      method: upload ? "POST" : "GET",
      headers,
      body: body as BodyInit | undefined,
      cache: "no-store",
      redirect: "error",
      signal: controller.signal,
    });
    if (upload || !upstream.ok) {
      const bytes = await readBoundedBody(upstream, MAX_JSON_BYTES);
      let payload: unknown = null;
      try { payload = JSON.parse(new TextDecoder().decode(bytes)); } catch { /* Preserve the invalid-JSON response contract. */ }
      return Response.json(payload, {
        status: upstream.status,
        headers: { "cache-control": "no-store" },
      });
    }
    const type = upstream.headers.get("content-type")?.split(";")[0];
    if (type === undefined || !IMAGE_TYPES.includes(type)) {
      return error("account_api_invalid_response", "Invalid private image response.", 502);
    }
    const bytes = await boundedBytes(upstream.body, controller.signal);
    if (!bytes?.byteLength) {
      return error("account_api_invalid_response", "Invalid private image response.", 502);
    }
    const extension = type === "image/jpeg" ? "jpg" : type === "image/webp" ? "webp" : "png";
    return new Response(bytes as BodyInit, {
      headers: {
        "content-type": type,
        "cache-control": "private, no-store",
        "x-content-type-options": "nosniff",
        "content-disposition": `attachment; filename="webdiag-image.${extension}"`,
      },
    });
  } catch (caught) {
    if (caught instanceof RequestBodyError && caught.status === 413) {
      return error("account_api_invalid_response", "Invalid private image response.", 502);
    }
    const timedOut = controller.signal.aborted || (caught instanceof Error && caught.name === "AbortError")
      || (caught instanceof RequestBodyError && caught.status === 408);
    return error(
      timedOut ? "account_api_timeout" : "account_api_unavailable",
      timedOut ? "Private image request timed out." : "Private image request failed.",
      timedOut ? 408 : 502,
    );
  } finally {
    clearTimeout(timer);
  }
}
export async function proxyAIImageUpload(request: NextRequest): Promise<Response> {
  return forward(request, "/v1/account/ai/uploads/image", true);
}
export async function proxyAIArtifact(request: NextRequest, runId: string, artifactId: string): Promise<Response> {
  if (!canonicalAIResourceId(runId) || !canonicalAIResourceId(artifactId)) {
    return error("account_invalid_request", "Invalid private image ID.", 400);
  }
  return forward(request, `/v1/account/ai/runs/${runId}/artifacts/${artifactId}`, false);
}
