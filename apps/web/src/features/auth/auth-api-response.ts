type AuthApiMessagePayload = {
  detail?: unknown;
  message?: unknown;
};

export function readAuthMessage(value: unknown): string | null {
  if (typeof value !== "object" || value === null) return null;

  const payload = value as AuthApiMessagePayload;
  if (typeof payload.message === "string" && payload.message.trim()) {
    return payload.message.trim();
  }
  if (typeof payload.detail === "string" && payload.detail.trim()) {
    return payload.detail.trim();
  }
  return null;
}
