import { describe, expect, it } from "vitest";
import {
  isHttpCompressionResponse,
  isSslCertificateResponse,
  isTlsConfigurationResponse,
  parseHostnameInput,
  parseHttpsUrlInput,
} from "./protocol-security-tool-contract";

describe("protocol security tool contracts", () => {
  it("validates SSL, TLS, and compression responses", () => {
    expect(isSslCertificateResponse({
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
    })).toBe(true);

    expect(isTlsConfigurationResponse({
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
    })).toBe(true);

    expect(isHttpCompressionResponse({
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
    })).toBe(true);
  });

  it("parses only safe host and URL input shapes", () => {
    expect(parseHostnameInput("Example.COM.")).toBe("example.com");
    expect(parseHostnameInput("https://example.com/")).toBeNull();
    expect(parseHostnameInput("127.0.0.1")).toBeNull();
    expect(parseHostnameInput("example")).toBeNull();
    expect(parseHttpsUrlInput("https://example.com/path")).toBe("https://example.com/path");
    expect(parseHttpsUrlInput("ftp://example.com/file")).toBeNull();
    expect(parseHttpsUrlInput("https://user@example.com/")).toBeNull();
  });
});
