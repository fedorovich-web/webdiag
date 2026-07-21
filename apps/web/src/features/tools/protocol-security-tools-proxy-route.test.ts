import { afterEach, describe, expect, it, vi } from "vitest";
import type { NextRequest } from "next/server";
import { POST as compressionPost } from "../../../app/api/tools/http-compression/route";
import { POST as corsPost } from "../../../app/api/tools/cors/route";
import { POST as headersPost } from "../../../app/api/tools/http-headers/route";
import { POST as protocolPost } from "../../../app/api/tools/http-protocol/route";
import { POST as sslPost } from "../../../app/api/tools/ssl-certificate/route";
import { POST as tlsPost } from "../../../app/api/tools/tls-configuration/route";

function request(body: unknown): NextRequest {
  return new Request("http://localhost/api/tools/test", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  }) as NextRequest;
}

describe("protocol security proxy routes", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("proxies valid SSL certificate responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.ssl_certificate_checker.v1",
      generated_at: "2026",
      hostname: "example.com",
      port: 443,
      peer_ip: "93.184.216.34",
      issuer_common_name: "Example CA",
      subject: { common_name: "example.com", subject_alt_names: ["example.com"] },
      not_before: "2026-01-01T00:00:00Z",
      not_after: "2026-06-01T00:00:00Z",
      days_until_expiry: 100,
      expired: false,
      hostname_matches: true,
      san_count: 1,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await sslPost(request({ hostname: "example.com" }));
    expect(response.status).toBe(200);
  });

  it("proxies valid TLS configuration responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.tls_configuration_checker.v1",
      generated_at: "2026",
      hostname: "example.com",
      port: 443,
      peer_ip: "93.184.216.34",
      tls_version: "TLSv1.3",
      cipher_suite: "TLS_AES_256_GCM_SHA384",
      key_exchange_bits: 256,
      negotiated_protocol: "h2",
      protocol_status: "pass",
      certificate_hostname_matches: true,
      certificate_days_until_expiry: 100,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await tlsPost(request({ hostname: "example.com" }));
    expect(response.status).toBe(200);
  });

  it("proxies valid HTTP compression responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.http_compression_checker.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      content_type: "text/html",
      content_encoding: "gzip",
      vary: "Accept-Encoding",
      content_length: 512,
      compressed: true,
      compressible_candidate: true,
      vary_accept_encoding: true,
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await compressionPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
  });



  it("proxies valid HTTP headers responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.http_headers_analyzer.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      header_count: 2,
      redirect_count: 0,
      server_header_present: true,
      powered_by_header_present: false,
      cache_control: null,
      content_type: "text/html",
      content_length: null,
      content_encoding: null,
      vary: null,
      headers: [{ name: "server", value: "nginx" }],
      status: "warning",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await headersPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
  });

  it("proxies valid HTTP protocol responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.http_protocol_checker.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scheme: "https",
      tls_version: "TLSv1.3",
      negotiated_protocol: "h2",
      http2_supported: true,
      http3_advertised: true,
      alt_svc: 'h3=":443"',
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await protocolPost(request({ url: "https://example.com/" }));
    expect(response.status).toBe(200);
  });

  it("proxies valid CORS responses", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "webdiag.tool.cors_checker.v1",
      generated_at: "2026",
      requested_url: "https://api.example.com/",
      final_url: "https://api.example.com/",
      tested_origin: "https://example.com",
      status_code: 200,
      allow_origin: "https://example.com",
      allow_methods: "GET",
      allow_headers: null,
      expose_headers: null,
      allow_credentials: false,
      vary_origin: true,
      allows_tested_origin: true,
      wildcard_with_credentials: false,
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await corsPost(request({
      origin: "https://example.com",
      url: "https://api.example.com/",
    }));
    expect(response.status).toBe(200);
  });

  it("rejects invalid upstream payloads", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify({
      contract_version: "wrong",
    }), { status: 200, headers: { "content-type": "application/json" } })));

    const response = await tlsPost(request({ hostname: "example.com" }));
    expect(response.status).toBe(502);
  });
});
