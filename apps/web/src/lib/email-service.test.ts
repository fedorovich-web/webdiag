import { afterEach, expect, it, vi } from "vitest";
import { sendContactEmailViaNevtan, sendTransactionalEmailViaResend } from "./email-service";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("does not claim contact delivery when SMTP credentials are absent", async () => {
  vi.stubEnv("NEVTAN_SMTP_PASS", ""); vi.stubEnv("SMTP_PASS", "");
  expect((await sendContactEmailViaNevtan({ name: "Test", email: "test@example.com", topic: "Support", message: "Test message" })).success).toBe(false);
});

it("does not claim transactional delivery without a Resend acknowledgement", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-resend-key");
  vi.stubGlobal("fetch", vi.fn(async () => new Response("{}")));
  expect((await sendTransactionalEmailViaResend({ to: "test@example.com", subject: "Test", html: "Test" })).success).toBe(false);
});

it("sends automated mail from no-replay and directs replies to support", async () => {
  vi.stubEnv("RESEND_API_KEY", "test-resend-key");
  vi.stubEnv("EMAIL_FROM", "no-replay@webdiag.ru");
  const fetcher = vi.fn<(url: string, init: RequestInit) => Promise<Response>>(async () => new Response('{"id":"mail-receipt"}'));
  vi.stubGlobal("fetch", fetcher);
  expect((await sendTransactionalEmailViaResend({ to: "buyer@example.com", subject: "WebDiag", html: "Welcome" })).success).toBe(true);
  expect(JSON.parse(String(fetcher.mock.calls[0]![1].body))).toMatchObject({ from: "no-replay@webdiag.ru", reply_to: "support@webdiag.ru" });
  expect(fetcher.mock.calls[0]![1].redirect).toBe("error");
});
