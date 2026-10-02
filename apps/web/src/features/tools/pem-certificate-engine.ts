export const MAX_PEM_INPUT_CHARS = 1_000_000;
export const MAX_CERTIFICATES = 20;
export const MAX_DER_BYTES = 256_000;

export type CertificateValidityState = "valid" | "expired" | "not_yet_valid";

export interface ParsedCertificate {
  readonly index: number;
  readonly subject: string;
  readonly issuer: string;
  readonly serialNumber: string;
  readonly notBefore: string;
  readonly notAfter: string;
  readonly validityState: CertificateValidityState;
  readonly daysRemaining: number;
  readonly subjectAltNames: readonly string[];
  readonly publicKeyAlgorithm: string;
  readonly signatureAlgorithm: string;
  readonly sha256Fingerprint: string;
  readonly isCertificateAuthority: boolean | null;
  readonly pem: string;
}

export interface CertificateInspectionResult {
  readonly contractVersion: "webdiag.tool.pem_certificate_viewer.v1";
  readonly certificates: readonly ParsedCertificate[];
  readonly chainOrder: readonly number[];
  readonly chainComplete: boolean;
  readonly warnings: readonly string[];
}

type Node = { tag: number; cls: number; constructed: boolean; start: number; end: number; valueStart: number; children: Node[] };

const OID_NAMES: Record<string, string> = {
  "2.5.4.3": "CN", "2.5.4.6": "C", "2.5.4.7": "L", "2.5.4.8": "ST", "2.5.4.10": "O", "2.5.4.11": "OU",
  "1.2.840.113549.1.1.1": "RSA", "1.2.840.113549.1.1.5": "sha1WithRSAEncryption",
  "1.2.840.113549.1.1.11": "sha256WithRSAEncryption", "1.2.840.113549.1.1.12": "sha384WithRSAEncryption",
  "1.2.840.113549.1.1.13": "sha512WithRSAEncryption", "1.2.840.10045.2.1": "EC",
  "1.2.840.10045.4.3.2": "ecdsa-with-SHA256", "1.2.840.10045.4.3.3": "ecdsa-with-SHA384",
  "1.2.840.10045.4.3.4": "ecdsa-with-SHA512", "1.3.101.112": "Ed25519", "1.3.101.113": "Ed448",
};

function readLength(bytes: Uint8Array, offset: number): [number, number] {
  const first = bytes[offset];
  if (first === undefined) throw new Error("certificate_der_truncated");
  if ((first & 0x80) === 0) return [first, offset + 1];
  const count = first & 0x7f;
  if (count === 0 || count > 4 || offset + count >= bytes.length) throw new Error("certificate_der_length_invalid");
  let length = 0;
  for (let i = 0; i < count; i++) {
    const byte = bytes[offset + 1 + i];
    if (byte === undefined) throw new Error("certificate_der_length_invalid");
    length = length * 256 + byte;
  }
  return [length, offset + 1 + count];
}

function parseNode(bytes: Uint8Array, offset: number, depth = 0): [Node, number] {
  if (depth > 32 || offset >= bytes.length) throw new Error("certificate_der_structure_invalid");
  const tagByte = bytes[offset];
  if (tagByte === undefined || (tagByte & 0x1f) === 0x1f) throw new Error("certificate_der_tag_unsupported");
  const [length, valueStart] = readLength(bytes, offset + 1);
  const end = valueStart + length;
  if (end > bytes.length) throw new Error("certificate_der_truncated");
  const node: Node = { tag: tagByte & 0x1f, cls: tagByte >> 6, constructed: (tagByte & 0x20) !== 0, start: offset, end, valueStart, children: [] };
  if (node.constructed) {
    let cursor = valueStart;
    while (cursor < end) { const [child, next] = parseNode(bytes, cursor, depth + 1); node.children.push(child); cursor = next; }
    if (cursor !== end) throw new Error("certificate_der_structure_invalid");
  }
  return [node, end];
}

function decodeOid(bytes: Uint8Array, node: Node): string {
  const data = bytes.subarray(node.valueStart, node.end);
  const first = data[0];
  if (first === undefined) return "";
  const parts = [Math.floor(first / 40), first % 40];
  let value = 0;
  for (const byte of data.subarray(1)) { value = value * 128 + (byte & 0x7f); if ((byte & 0x80) === 0) { parts.push(value); value = 0; } }
  return parts.join(".");
}

function decodeText(bytes: Uint8Array, node: Node): string {
  const data = bytes.subarray(node.valueStart, node.end);
  if (node.tag === 30) { // BMPString
    let result = "";
    for (let i = 0; i + 1 < data.length; i += 2) {
      const high = data[i]; const low = data[i + 1];
      if (high === undefined || low === undefined) break;
      result += String.fromCharCode(high * 256 + low);
    }
    return result;
  }
  return new TextDecoder(node.tag === 22 ? "ascii" : "utf-8", { fatal: false }).decode(data);
}

function parseName(bytes: Uint8Array, node: Node): string {
  const values: string[] = [];
  for (const set of node.children) for (const seq of set.children) {
    const oid = seq.children[0]; const value = seq.children[1];
    if (!oid || !value) continue;
    const id = decodeOid(bytes, oid); values.push(`${OID_NAMES[id] ?? id}=${decodeText(bytes, value).replace(/[\r\n]/g, " ")}`);
  }
  return values.join(", ");
}

function parseTime(bytes: Uint8Array, node: Node): Date {
  const text = decodeText(bytes, node);
  const match = node.tag === 23
    ? /^(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?Z$/.exec(text)
    : /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})Z$/.exec(text);
  if (!match) throw new Error("certificate_time_invalid");
  const year = node.tag === 23 ? (Number(match[1]) >= 50 ? 1900 : 2000) + Number(match[1]) : Number(match[1]);
  const shift = node.tag === 23 ? 0 : 1;
  return new Date(Date.UTC(year, Number(match[2 + shift]) - 1, Number(match[3 + shift]), Number(match[4 + shift]), Number(match[5 + shift]), Number(match[6 + shift] ?? 0)));
}

function hex(bytes: Uint8Array): string { return Array.from(bytes, b => b.toString(16).padStart(2, "0").toUpperCase()).join(""); }
function formatFingerprint(bytes: Uint8Array): string { return hex(bytes).match(/.{1,2}/g)?.join(":") ?? ""; }

function algorithmName(bytes: Uint8Array, node: Node | undefined): string {
  const oid = node?.children[0]; if (!oid) return "Unknown";
  const value = decodeOid(bytes, oid); return OID_NAMES[value] ?? value;
}

function parseExtensions(bytes: Uint8Array, extensionWrapper: Node | undefined): { sans: string[]; ca: boolean | null } {
  const result = { sans: [] as string[], ca: null as boolean | null };
  const sequence = extensionWrapper?.children[0];
  if (!sequence) return result;
  for (const extension of sequence.children) {
    const oidNode = extension.children[0]; const valueNode = extension.children.at(-1);
    if (!oidNode || !valueNode || valueNode.tag !== 4) continue;
    const oid = decodeOid(bytes, oidNode); const payload = bytes.subarray(valueNode.valueStart, valueNode.end);
    try {
      const [inner] = parseNode(payload, 0);
      if (oid === "2.5.29.17") {
        for (const name of inner.children) {
          const data = payload.subarray(name.valueStart, name.end);
          if (name.cls === 2 && name.tag === 2) result.sans.push(`DNS:${new TextDecoder("ascii").decode(data)}`);
          else if (name.cls === 2 && name.tag === 7) result.sans.push(`IP:${Array.from(data).join(".")}`);
        }
      } else if (oid === "2.5.29.19") {
        const boolNode = inner.children.find(child => child.tag === 1);
        const boolValue = boolNode ? payload[boolNode.valueStart] : undefined;
        result.ca = boolValue === undefined ? false : boolValue !== 0;
      }
    } catch { /* bounded extension parse: ignore malformed optional extension */ }
  }
  return result;
}

function pemBlocks(input: string): { pem: string; der: Uint8Array }[] {
  if (input.length === 0 || input.length > MAX_PEM_INPUT_CHARS) throw new Error("certificate_input_size_invalid");
  if (/-----BEGIN (?:RSA |EC |ENCRYPTED )?PRIVATE KEY-----/.test(input)) throw new Error("certificate_private_key_rejected");
  if (/-----BEGIN CERTIFICATE REQUEST-----/.test(input)) throw new Error("certificate_csr_not_supported");
  const matches = [...input.matchAll(/-----BEGIN CERTIFICATE-----\s*([A-Za-z0-9+/=\s]+?)\s*-----END CERTIFICATE-----/g)];
  if (matches.length === 0 || matches.length > MAX_CERTIFICATES) throw new Error("certificate_pem_count_invalid");
  return matches.map(match => {
    const encoded = match[1];
    if (encoded === undefined) throw new Error("certificate_pem_base64_invalid");
    const compact = encoded.replace(/\s/g, "");
    if (!/^[A-Za-z0-9+/]+={0,2}$/.test(compact)) throw new Error("certificate_pem_base64_invalid");
    const binary = atob(compact); if (binary.length === 0 || binary.length > MAX_DER_BYTES) throw new Error("certificate_der_size_invalid");
    const der = Uint8Array.from(binary, char => char.charCodeAt(0));
    return { pem: match[0].trim(), der };
  });
}

async function parseCertificate(block: { pem: string; der: Uint8Array }, index: number, now: Date): Promise<ParsedCertificate> {
  const [root, consumed] = parseNode(block.der, 0);
  if (consumed !== block.der.length || root.tag !== 16 || root.children.length < 3) throw new Error("certificate_structure_invalid");
  const tbs = root.children[0]; if (!tbs || tbs.tag !== 16) throw new Error("certificate_structure_invalid");
  let cursor = tbs.children[0]?.cls === 2 && tbs.children[0]?.tag === 0 ? 1 : 0;
  const serial = tbs.children[cursor++]; cursor++; // tbs signature
  const issuer = tbs.children[cursor++]; const validity = tbs.children[cursor++]; const subject = tbs.children[cursor++]; const spki = tbs.children[cursor++];
  if (!serial || !issuer || !validity || !subject || !spki) throw new Error("certificate_structure_invalid");
  const notBeforeNode = validity.children[0]; const notAfterNode = validity.children[1];
  if (!notBeforeNode || !notAfterNode) throw new Error("certificate_structure_invalid");
  const notBefore = parseTime(block.der, notBeforeNode); const notAfter = parseTime(block.der, notAfterNode);
  const extensionWrapper = tbs.children.find(child => child.cls === 2 && child.tag === 3);
  const extensions = parseExtensions(block.der, extensionWrapper);
  const digestInput = new Uint8Array(new ArrayBuffer(block.der.byteLength));
  digestInput.set(block.der);
  const digest = new Uint8Array(await crypto.subtle.digest("SHA-256", digestInput));
  const state: CertificateValidityState = now < notBefore ? "not_yet_valid" : now > notAfter ? "expired" : "valid";
  return {
    index, subject: parseName(block.der, subject), issuer: parseName(block.der, issuer),
    serialNumber: hex(block.der.subarray(serial.valueStart, serial.end)).replace(/^00/, "") || "00",
    notBefore: notBefore.toISOString(), notAfter: notAfter.toISOString(), validityState: state,
    daysRemaining: Math.floor((notAfter.getTime() - now.getTime()) / 86_400_000), subjectAltNames: extensions.sans,
    publicKeyAlgorithm: algorithmName(block.der, spki.children[0]), signatureAlgorithm: algorithmName(block.der, root.children[1]),
    sha256Fingerprint: formatFingerprint(digest), isCertificateAuthority: extensions.ca, pem: block.pem,
  };
}

function orderChain(certificates: readonly ParsedCertificate[]): { order: number[]; complete: boolean } {
  if (certificates.length <= 1) return { order: certificates.map(c => c.index), complete: true };
  const issuerSubjects = new Set(certificates.map(c => c.issuer));
  let current: ParsedCertificate | undefined = certificates.find(c => !issuerSubjects.has(c.subject) || c.subject === c.issuer) ?? certificates[0];
  // Prefer leaf: subject is not issuer of another certificate.
  current = certificates.find(c => !certificates.some(other => other.index !== c.index && other.issuer === c.subject)) ?? current;
  const order: number[] = []; const used = new Set<number>();
  while (current && !used.has(current.index)) {
    order.push(current.index); used.add(current.index);
    if (current.subject === current.issuer) break;
    const issuer = current.issuer;
    current = certificates.find(c => !used.has(c.index) && c.subject === issuer);
  }
  const lastIndex = order.at(-1);
  const last = lastIndex === undefined ? undefined : certificates.find(c => c.index === lastIndex);
  return { order, complete: used.size === certificates.length && last !== undefined && last.subject === last.issuer };
}

export async function inspectPemCertificates(input: string, now = new Date()): Promise<CertificateInspectionResult> {
  const certificates = await Promise.all(pemBlocks(input).map((block, index) => parseCertificate(block, index, now)));
  const chain = orderChain(certificates);
  const warnings: string[] = [];
  if (!chain.complete && certificates.length > 1) warnings.push("certificate_chain_incomplete");
  if (certificates.some(c => c.validityState === "expired")) warnings.push("certificate_expired");
  if (certificates.some(c => c.validityState === "not_yet_valid")) warnings.push("certificate_not_yet_valid");
  return { contractVersion: "webdiag.tool.pem_certificate_viewer.v1", certificates, chainOrder: chain.order, chainComplete: chain.complete, warnings };
}
