export class RequestBodyError extends Error {
  constructor(readonly status: number, message: string) { super(message); }
}

export async function readBoundedBody(request: Pick<Request, "headers" | "body">, maximum: number): Promise<Uint8Array<ArrayBuffer>> {
  if (Number(request.headers.get("content-length")) > maximum) throw new RequestBodyError(413, "Request body is too large.");
  const reader = request.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let length = 0;
  let expired = false;
  const timer = setTimeout(() => { expired = true; void reader.cancel(); }, 10000);
  try {
    for (;;) {
      const chunk = await reader.read();
      if (expired) throw new RequestBodyError(408, "Request body timed out.");
      if (chunk.done) break;
      length += chunk.value.byteLength;
      if (length > maximum) throw new RequestBodyError(413, "Request body is too large.");
      chunks.push(chunk.value);
    }
    return Buffer.concat(chunks);
  } finally { clearTimeout(timer); await reader.cancel(); }
}
