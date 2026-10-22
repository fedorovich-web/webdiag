import { afterEach, expect, it, vi } from "vitest";
import { createServer, type Socket } from "node:net";
import { sendContactEmailViaNevtan, sendTransactionalEmailViaResend } from "./email-service";

afterEach(() => { vi.unstubAllEnvs(); vi.unstubAllGlobals(); });

it("does not claim contact delivery when SMTP credentials are absent", async () => {
  vi.stubEnv("NEVTAN_SMTP_PASS", ""); vi.stubEnv("SMTP_PASS", "");
  expect((await sendContactEmailViaNevtan({ name: "Test", email: "test@example.com", topic: "Support", message: "Test message" })).success).toBe(false);
});

it("rejects SMTP without STARTTLS before transmitting credentials", async () => {
  const commands: string[] = [];
  const sockets = new Set<Socket>();
  const server = createServer((socket) => {
    sockets.add(socket);
    socket.on("close", () => sockets.delete(socket));
    socket.write("220 test SMTP\r\n");
    let pending = "";
    socket.on("data", (chunk) => {
      pending += chunk.toString();
      let end;
      while ((end = pending.indexOf("\r\n")) !== -1) {
        const command = pending.slice(0, end);
        pending = pending.slice(end + 2);
        const verb = (command.split(" ", 1)[0] ?? "").toUpperCase();
        commands.push(verb);
        if (verb === "EHLO") socket.write("250-test SMTP\r\n250 AUTH PLAIN\r\n");
        else if (verb === "STARTTLS") socket.write("454 TLS unavailable\r\n");
        else socket.end("535 Authentication refused\r\n");
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  try {
    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Missing test SMTP address");
    vi.stubEnv("NEVTAN_SMTP_HOST", "127.0.0.1");
    vi.stubEnv("NEVTAN_SMTP_PORT", String(address.port));
    vi.stubEnv("NEVTAN_SMTP_SECURE", "false");
    vi.stubEnv("NEVTAN_SMTP_USER", "support@example.com");
    vi.stubEnv("NEVTAN_SMTP_PASS", "test-password");
    const result = await sendContactEmailViaNevtan({
      name: "Test", email: "test@example.com", topic: "Support", message: "Test message",
    });
    expect(result.success).toBe(false);
    expect(commands).toContain("STARTTLS");
    expect(commands).not.toContain("AUTH");
  } finally {
    for (const socket of sockets) socket.destroy();
    await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
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
