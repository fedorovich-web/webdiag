import { readBoundedBody } from "./request-body";

// Accommodates 25 redirect rows with two maximum-length URLs per row.
const MAX_TOOL_BODY_BYTES = 300_000;

export async function readToolJsonBody(request: Request): Promise<unknown> {
  try {
    return JSON.parse(new TextDecoder().decode(await readBoundedBody(request, MAX_TOOL_BODY_BYTES))) as unknown;
  } catch {
    // Ordinary tool routes expose one stable validation error for invalid input.
    return null;
  }
}
