import { describe, expect, it } from "vitest";
import {
  cookiePolicyResultText,
  corsResultText,
  httpCompressionResultText,
  httpHeadersResultText,
  httpProtocolResultText,
  mixedContentResultText,
  serverTimingResultText,
  sslCertificateResultText,
  tlsConfigurationResultText,
} from "./protocol-security-tools";

describe("protocol security tool result text", () => {
  it("formats copyable SSL, TLS, and compression summaries", () => {
    expect(sslCertificateResultText({
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
    })).toContain("Expires in: 100 days");

    expect(tlsConfigurationResultText({
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
    })).toContain("TLS version: TLSv1.3");

    expect(httpCompressionResultText({
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
    })).toContain("Compressed: yes");

    expect(httpHeadersResultText({
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
      headers: [],
      status: "warning",
      recommendation: "OK",
    })).toContain("Headers: 2");

    expect(httpProtocolResultText({
      contract_version: "webdiag.tool.http_protocol_checker.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      scheme: "https",
      tls_version: "TLSv1.3",
      negotiated_protocol: "h2",
      http2_supported: true,
      http3_advertised: false,
      alt_svc: null,
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    })).toContain("ALPN: h2");

    expect(corsResultText({
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
    })).toContain("Origin: https://example.com");


    expect(serverTimingResultText({
      contract_version: "webdiag.tool.server_timing_analyzer.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      raw_header: "app;dur=42",
      server_timing_present: true,
      metric_count: 1,
      metrics: [{ name: "app", duration_ms: 42, description: null }],
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    })).toContain("Metrics: 1");

    expect(cookiePolicyResultText({
      contract_version: "webdiag.tool.cookie_policy_checker.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      set_cookie_count: 1,
      secure_count: 1,
      http_only_count: 1,
      same_site_count: 1,
      issue_count: 0,
      cookies: [],
      redirect_count: 0,
      status: "pass",
      recommendation: "OK",
    })).toContain("Set-Cookie: 1");

    expect(mixedContentResultText({
      contract_version: "webdiag.tool.mixed_content_checker.v1",
      generated_at: "2026",
      requested_url: "https://example.com/",
      final_url: "https://example.com/",
      status_code: 200,
      page_scheme: "https",
      candidate_count: 1,
      mixed_content_count: 1,
      active_mixed_content_count: 1,
      passive_mixed_content_count: 0,
      sample_items: [],
      redirect_count: 0,
      status: "fail",
      recommendation: "OK",
    })).toContain("Active: 1");
  });
});
