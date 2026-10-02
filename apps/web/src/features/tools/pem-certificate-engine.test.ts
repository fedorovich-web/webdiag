import { describe, expect, it } from "vitest";
import { inspectPemCertificates } from "./pem-certificate-engine";
describe("PEM certificate engine", () => {
  it("rejects private keys and CSR input", async () => {
    await expect(inspectPemCertificates("-----BEGIN PRIVATE KEY-----\nAA==\n-----END PRIVATE KEY-----")).rejects.toThrow("certificate_private_key_rejected");
    await expect(inspectPemCertificates("-----BEGIN CERTIFICATE REQUEST-----\nAA==\n-----END CERTIFICATE REQUEST-----")).rejects.toThrow("certificate_csr_not_supported");
  });
});
