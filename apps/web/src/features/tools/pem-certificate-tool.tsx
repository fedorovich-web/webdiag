"use client";
import { useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import { inspectPemCertificates, type CertificateInspectionResult } from "./pem-certificate-engine";

const messages = {
  ru: { title: "PEM-сертификаты", input: "Вставьте один или несколько PEM-сертификатов", run: "Проверить сертификаты", result: "Результат", subject: "Subject", issuer: "Issuer", valid: "Действителен", expired: "Истёк", future: "Ещё не действует", serial: "Серийный номер", validity: "Срок действия", san: "SAN", key: "Открытый ключ", signature: "Подпись", fingerprint: "SHA-256 fingerprint", ca: "Центр сертификации", chain: "Порядок цепочки", complete: "Цепочка полная", incomplete: "Цепочка неполная", yes: "Да", no: "Нет", error: "Не удалось разобрать сертификат. Проверьте PEM и убедитесь, что не вставлен закрытый ключ или CSR." },
  en: { title: "PEM certificates", input: "Paste one or more PEM certificates", run: "Inspect certificates", result: "Result", subject: "Subject", issuer: "Issuer", valid: "Valid", expired: "Expired", future: "Not yet valid", serial: "Serial number", validity: "Validity", san: "SAN", key: "Public key", signature: "Signature", fingerprint: "SHA-256 fingerprint", ca: "Certificate authority", chain: "Chain order", complete: "Chain complete", incomplete: "Chain incomplete", yes: "Yes", no: "No", error: "The certificate could not be parsed. Check the PEM and make sure it is not a private key or CSR." },
} as const;

export function PemCertificateViewerTool({ locale }: { locale: Locale }) {
  const t = messages[locale]; const [input, setInput] = useState(""); const [result, setResult] = useState<CertificateInspectionResult | null>(null); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  async function run() { setBusy(true); setError(""); setResult(null); try { setResult(await inspectPemCertificates(input)); } catch { setError(t.error); } finally { setBusy(false); } }
  return <div className="tool-grid pem-certificate-tool">
    <section className="tool-panel"><h2>{t.title}</h2><label className="field"><span>{t.input}</span><textarea className="code-input" rows={15} value={input} onChange={e => setInput(e.target.value)} spellCheck={false} autoComplete="off" /></label><button className="button" type="button" onClick={run} disabled={busy || !input.trim()} aria-busy={busy}>{t.run}</button>{error && <p className="form-error" role="alert">{error}</p>}</section>
    <section className="tool-panel"><h2>{t.result}</h2>{!result ? <p className="muted">—</p> : <div className="certificate-results" role="status">
      <p><strong>{t.chain}:</strong> {result.chainOrder.map(i => i + 1).join(" → ")} · {result.chainComplete ? t.complete : t.incomplete}</p>
      {result.certificates.map(cert => <article className="certificate-card" key={cert.sha256Fingerprint}>
        <header><h3>#{cert.index + 1} · {cert.subject || "—"}</h3><span className={`certificate-state is-${cert.validityState}`}>{cert.validityState === "valid" ? t.valid : cert.validityState === "expired" ? t.expired : t.future}</span></header>
        <dl><dt>{t.subject}</dt><dd>{cert.subject || "—"}</dd><dt>{t.issuer}</dt><dd>{cert.issuer || "—"}</dd><dt>{t.serial}</dt><dd><code>{cert.serialNumber}</code></dd><dt>{t.validity}</dt><dd>{cert.notBefore} → {cert.notAfter} ({cert.daysRemaining})</dd><dt>{t.san}</dt><dd>{cert.subjectAltNames.join(", ") || "—"}</dd><dt>{t.key}</dt><dd>{cert.publicKeyAlgorithm}</dd><dt>{t.signature}</dt><dd>{cert.signatureAlgorithm}</dd><dt>{t.ca}</dt><dd>{cert.isCertificateAuthority === null ? "—" : cert.isCertificateAuthority ? t.yes : t.no}</dd><dt>{t.fingerprint}</dt><dd className="certificate-fingerprint"><code>{cert.sha256Fingerprint}</code><CopyButton value={cert.sha256Fingerprint} locale={locale} /></dd></dl>
      </article>)}
    </div>}</section>
  </div>;
}
