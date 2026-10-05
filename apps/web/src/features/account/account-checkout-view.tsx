"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, CreditCard, QrCode, ShieldCheck, Sparkles, ArrowLeft, AlertCircle, Info, Lock } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

interface PackageDetails {
  title: string;
  credits: number;
  priceRub: number;
  desc: string;
}

const FALLBACK_PACK: PackageDetails = {
  title: "50 AI-кредитов WebDiag",
  credits: 50,
  priceRub: 390,
  desc: "Для быстрого аудита и исправления 1 сайта. Бессрочный баланс.",
};

const PACKS: Record<string, PackageDetails> = {
  "pack-50": FALLBACK_PACK,
  "credit-pack-50": FALLBACK_PACK,
  "pack-150": {
    title: "150 AI-кредитов WebDiag",
    credits: 150,
    priceRub: 890,
    desc: "Оптимальный пакет для доработки 3–5 проектов. Бессрочный баланс.",
  },
  "credit-pack-150": {
    title: "150 AI-кредитов WebDiag",
    credits: 150,
    priceRub: 890,
    desc: "Оптимальный пакет для доработки 3–5 проектов. Бессрочный баланс.",
  },
  "pack-500": {
    title: "500 AI-кредитов WebDiag",
    credits: 500,
    priceRub: 1990,
    desc: "Для агентств и вебмастеров. Максимальная выгода, бессрочный баланс.",
  },
  "credit-pack-500": {
    title: "500 AI-кредитов WebDiag",
    credits: 500,
    priceRub: 1990,
    desc: "Для агентств и вебмастеров. Максимальная выгода, бессрочный баланс.",
  },
  "plan-pro": {
    title: "Тариф Pro (150 AI-кредитов)",
    credits: 150,
    priceRub: 990,
    desc: "Ежемесячный тариф Pro: расширенный мониторинг и 150 кредитов.",
  },
  "plan-team": {
    title: "Тариф Team (500 AI-кредитов)",
    credits: 500,
    priceRub: 2990,
    desc: "Ежемесячный тариф Team: совместная работа и 500 кредитов.",
  },
};

interface AccountCheckoutViewProps {
  readonly locale: Locale;
  readonly initialPackId?: string;
  readonly initialInvoiceId?: string;
}

export function AccountCheckoutView({
  locale,
  initialPackId = "pack-50",
  initialInvoiceId = "",
}: AccountCheckoutViewProps) {
  const ru = locale === "ru";

  const [packId, setPackId] = useState(initialPackId);
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [method, setMethod] = useState<"card" | "sbp">("card");
  const [isLive, setIsLive] = useState(false);

  // Card form state
  const [cardNumber, setCardNumber] = useState("4276 3800 1234 5678");
  const [cardExpiry, setCardExpiry] = useState("12/28");
  const [cardCvc, setCardCvc] = useState("777");
  const [cardHolder, setCardHolder] = useState("WEBDIAG USER");

  // Flow states
  const [submitting, setSubmitting] = useState(false);
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [error, setError] = useState("");
  const [showDokployGuide, setShowDokployGuide] = useState(false);

  const pack: PackageDetails = PACKS[packId] ?? FALLBACK_PACK;

  useEffect(() => {
    let active = true;
    fetch("/api/billing/lava/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setIsLive(Boolean(data.is_live));
        }
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, []);

  async function handleLivePayment() {
    setSubmitting(true);
    setError("");
    try {
      const resp = await fetch("/api/billing/lava/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack_id: packId }),
      });
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
          data?.detail?.message ||
            (ru ? "Не удалось выставить счёт на оплату." : "Failed to create payment invoice.")
        );
      }
      const data = await resp.json();
      if (data.payment_url) {
        window.location.assign(data.payment_url);
      } else {
        throw new Error(ru ? "Ссылка на оплату не получена." : "Payment URL not returned.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (ru ? "Ошибка связи со шлюзом." : "Gateway error."));
      setSubmitting(false);
    }
  }

  async function handleConfirmSandboxPayment() {
    setSubmitting(true);
    setError("");

    // Simulate realistic 3D-Secure bank network latency
    await new Promise((r) => setTimeout(r, 900));

    const effectiveInvoiceId = invoiceId || `inv-${Date.now().toString(36)}`;

    try {
      const resp = await fetch("/api/billing/lava/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          pack_id: packId,
          invoice_id: effectiveInvoiceId,
          payment_method: method,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
          data?.detail?.message ||
            (ru ? "Не удалось подтвердить оплату." : "Failed to confirm payment.")
        );
      }

      setInvoiceId(effectiveInvoiceId);
      setPaidSuccess(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (ru ? "Ошибка при обработке платежа." : "Payment processing error."));
    } finally {
      setSubmitting(false);
    }
  }

  const aiWorkspaceUrl = ru ? "/account/ai" : "/en/account/ai";
  const settingsUrl = ru ? "/account/settings#billing" : "/en/account/settings#billing";

  return (
    <div style={{ maxWidth: 880, margin: "0 auto", padding: "24px 16px" }}>
      {/* Top back navigation */}
      <div style={{ marginBottom: 20 }}>
        <Link
          href={settingsUrl}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            fontSize: 14,
            fontWeight: 500,
            color: "var(--wd-ms, #64748b)",
            textDecoration: "none",
          }}
        >
          <ArrowLeft size={16} />
          {ru ? "Вернуться в кабинет" : "Back to cabinet"}
        </Link>
      </div>

      {paidSuccess ? (
        /* SUCCESS RECEIPT STATE */
        <div
          style={{
            background: "var(--wd-s, #fff)",
            border: "1px solid rgba(16, 185, 129, 0.3)",
            borderRadius: 16,
            padding: 36,
            textAlign: "center",
            boxShadow: "0 10px 25px -5px rgba(0, 0, 0, 0.05)",
          }}
        >
          <div
            style={{
              width: 64,
              height: 64,
              background: "rgba(16, 185, 129, 0.1)",
              color: "#10b981",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}
          >
            <CheckCircle2 size={36} />
          </div>

          <h1 style={{ fontSize: 24, fontWeight: 700, margin: "0 0 8px", color: "var(--wd-f, #0f172a)" }}>
            {ru ? "Оплата успешно завершена!" : "Payment successful!"}
          </h1>
          <p style={{ fontSize: 15, color: "var(--wd-ms, #64748b)", margin: "0 0 24px" }}>
            {ru
              ? `AI-кредиты в количестве ${pack.credits} шт. зачислены на ваш баланс и готовы к работе.`
              : `${pack.credits} AI credits have been added to your balance and are ready to use.`}
          </p>

          <div
            style={{
              background: "var(--wd-s, #f8fafc)",
              border: "1px solid var(--wd-l, #e2e8f0)",
              borderRadius: 12,
              padding: 20,
              maxWidth: 440,
              margin: "0 auto 28px",
              textAlign: "left",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Пакет:" : "Package:"}</span>
              <strong style={{ color: "var(--wd-f, #0f172a)" }}>{pack.title}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Сумма заказа:" : "Amount paid:"}</span>
              <strong style={{ color: "var(--wd-f, #0f172a)" }}>{pack.priceRub} ₽</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Зачислено:" : "Credits added:"}</span>
              <strong style={{ color: "#10b981", display: "flex", alignItems: "center", gap: 4 }}>
                <Sparkles size={14} /> +{pack.credits} AI-кредитов
              </strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Номер чека:" : "Invoice ID:"}</span>
              <span style={{ fontFamily: "monospace", color: "var(--wd-ms, #64748b)" }}>{invoiceId || "INV-LAVA"}</span>
            </div>
          </div>

          <div style={{ display: "flex", justifyContent: "center", gap: 12, flexWrap: "wrap" }}>
            <Link
              href={aiWorkspaceUrl}
              className="wd-button wd-button-primary"
              style={{ padding: "10px 24px", fontSize: 15 }}
            >
              <Sparkles size={16} style={{ marginRight: 6 }} />
              {ru ? "Открыть AI-помощники" : "Open AI Workspace"}
            </Link>
            <Link
              href={settingsUrl}
              className="wd-button wd-button-secondary"
              style={{ padding: "10px 24px", fontSize: 15 }}
            >
              {ru ? "В настройки кабинета" : "To cabinet settings"}
            </Link>
          </div>
        </div>
      ) : (
        /* CHECKOUT FORM VIEW */
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: 24 }}>
          {/* LEFT: PAYMENT TERMINAL */}
          <div
            style={{
              background: "var(--wd-s, #fff)",
              border: "1px solid var(--wd-l, #e2e8f0)",
              borderRadius: 16,
              padding: 24,
              boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
              <Lock size={18} style={{ color: "#2563eb" }} />
              <h2 style={{ fontSize: 18, fontWeight: 700, margin: 0, color: "var(--wd-f, #0f172a)" }}>
                {ru ? "Оплата заказа" : "Checkout"}
              </h2>
            </div>

            {/* Gateway indicator banner */}
            {isLive ? (
              <div
                style={{
                  padding: "10px 14px",
                  background: "rgba(16, 185, 129, 0.08)",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#065f46",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <ShieldCheck size={18} />
                <span>{ru ? "Боевой шлюз Lava.top активен (3D-Secure, МИР, СБП, Visa)" : "Live Lava.top gateway active"}</span>
              </div>
            ) : (
              <div
                style={{
                  padding: "12px 14px",
                  background: "rgba(99, 102, 241, 0.08)",
                  border: "1px solid rgba(99, 102, 241, 0.25)",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#3730a3",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 8,
                  marginBottom: 18,
                }}
              >
                <Info size={18} style={{ flexShrink: 0, marginTop: 1 }} />
                <div>
                  <strong>{ru ? "Демонстрационный платёжный шлюз (Sandbox)" : "Sandbox Payment Gateway"}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.9 }}>
                    {ru
                      ? "Боевой ключ LAVA_API_KEY не задан в переменных окружения. Вы можете протестировать сценарий оплаты в безопасном тестовом режиме."
                      : "Live LAVA_API_KEY is not set. You can test payment in safe sandbox mode."}
                  </p>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                style={{
                  padding: "10px 14px",
                  background: "#fef2f2",
                  border: "1px solid #fecaca",
                  borderRadius: 10,
                  fontSize: 13,
                  color: "#dc2626",
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                }}
              >
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* LIVE GATEWAY REDIRECT BUTTON */}
            {isLive ? (
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 14, color: "var(--wd-ms, #64748b)", marginBottom: 20 }}>
                  {ru
                    ? "Для завершения оплаты вы будете перенаправлены на защищённую страницу платёжного сервиса Lava.top."
                    : "You will be redirected to Lava.top secure checkout to complete payment."}
                </p>
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleLivePayment}
                  className="wd-button wd-button-primary"
                  style={{ width: "100%", padding: "12px 20px", fontSize: 15 }}
                >
                  {submitting
                    ? (ru ? "Создание платежа..." : "Redirecting...")
                    : (ru ? `Перейти к оплате ${pack.priceRub} ₽` : `Pay ${pack.priceRub} ₽ with Lava.top`)}
                </button>
              </div>
            ) : (
              /* SANDBOX INTERACTIVE TERMINAL */
              <div>
                {/* Method selector tabs */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 18 }}>
                  <button
                    type="button"
                    onClick={() => setMethod("card")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: method === "card" ? "2px solid #2563eb" : "1px solid var(--wd-l, #e2e8f0)",
                      background: method === "card" ? "rgba(37, 99, 235, 0.05)" : "var(--wd-s, #fff)",
                      color: method === "card" ? "#2563eb" : "var(--wd-f, #0f172a)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <CreditCard size={16} />
                    {ru ? "Карта РФ / МИР" : "Bank Card"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setMethod("sbp")}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: 8,
                      padding: "10px 14px",
                      borderRadius: 10,
                      border: method === "sbp" ? "2px solid #2563eb" : "1px solid var(--wd-l, #e2e8f0)",
                      background: method === "sbp" ? "rgba(37, 99, 235, 0.05)" : "var(--wd-s, #fff)",
                      color: method === "sbp" ? "#2563eb" : "var(--wd-f, #0f172a)",
                      fontWeight: 600,
                      fontSize: 13,
                      cursor: "pointer",
                    }}
                  >
                    <QrCode size={16} />
                    {ru ? "СБП (QR-код)" : "SBP QR-code"}
                  </button>
                </div>

                {method === "card" ? (
                  /* CARD FORM */
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 4 }}>
                        {ru ? "Номер карты (тестовый)" : "Card number (test)"}
                      </label>
                      <input
                        type="text"
                        value={cardNumber}
                        onChange={(e) => setCardNumber(e.target.value)}
                        placeholder="0000 0000 0000 0000"
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--wd-l, #cbd5e1)",
                          fontSize: 14,
                          fontFamily: "monospace",
                          boxSizing: "border-box",
                        }}
                      />
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 4 }}>
                          {ru ? "Срок действия" : "Expiry"}
                        </label>
                        <input
                          type="text"
                          value={cardExpiry}
                          onChange={(e) => setCardExpiry(e.target.value)}
                          placeholder="ММ/ГГ"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "1px solid var(--wd-l, #cbd5e1)",
                            fontSize: 14,
                            fontFamily: "monospace",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                      <div>
                        <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 4 }}>
                          CVC / CVV
                        </label>
                        <input
                          type="password"
                          value={cardCvc}
                          maxLength={3}
                          onChange={(e) => setCardCvc(e.target.value)}
                          placeholder="•••"
                          style={{
                            width: "100%",
                            padding: "10px 14px",
                            borderRadius: 8,
                            border: "1px solid var(--wd-l, #cbd5e1)",
                            fontSize: 14,
                            fontFamily: "monospace",
                            boxSizing: "border-box",
                          }}
                        />
                      </div>
                    </div>

                    <div>
                      <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 4 }}>
                        {ru ? "Владелец карты" : "Cardholder"}
                      </label>
                      <input
                        type="text"
                        value={cardHolder}
                        onChange={(e) => setCardHolder(e.target.value.toUpperCase())}
                        style={{
                          width: "100%",
                          padding: "10px 14px",
                          borderRadius: 8,
                          border: "1px solid var(--wd-l, #cbd5e1)",
                          fontSize: 14,
                          boxSizing: "border-box",
                        }}
                      />
                    </div>
                  </div>
                ) : (
                  /* SBP QR SIMULATOR */
                  <div style={{ textAlign: "center", padding: "16px 0" }}>
                    <div
                      style={{
                        width: 140,
                        height: 140,
                        margin: "0 auto 12px",
                        background: "#f1f5f9",
                        border: "2px dashed #94a3b8",
                        borderRadius: 12,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexDirection: "column",
                        gap: 6,
                      }}
                    >
                      <QrCode size={64} style={{ color: "#334155" }} />
                      <span style={{ fontSize: 11, color: "#64748b" }}>СБП QR Test</span>
                    </div>
                    <p style={{ fontSize: 13, color: "var(--wd-ms, #64748b)", margin: "0 0 10px" }}>
                      {ru
                        ? "В боевом режиме здесь отображается динамический QR-код для оплаты через банковские приложения (Сбер, Т-Банк, ВТБ)."
                        : "In live mode a dynamic SBP QR code is rendered here for banking apps."}
                    </p>
                  </div>
                )}

                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleConfirmSandboxPayment}
                  className="wd-button wd-button-primary"
                  style={{
                    width: "100%",
                    padding: "12px 20px",
                    fontSize: 15,
                    marginTop: 18,
                  }}
                >
                  {submitting ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
                      <span className="wd-spinner" style={{ width: 14, height: 14 }} />
                      {ru ? "Авторизация платежа..." : "Processing transaction..."}
                    </span>
                  ) : (
                    <span>
                      {ru ? `Оплатить заказ ${pack.priceRub} ₽ (Тестовый платёж)` : `Confirm test payment of ${pack.priceRub} ₽`}
                    </span>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* RIGHT: ORDER SUMMARY CARD */}
          <div>
            <div
              style={{
                background: "var(--wd-s, #fff)",
                border: "1px solid var(--wd-l, #e2e8f0)",
                borderRadius: 16,
                padding: 24,
                boxShadow: "0 4px 12px rgba(0,0,0,0.03)",
                marginBottom: 16,
              }}
            >
              <h3 style={{ fontSize: 16, fontWeight: 700, margin: "0 0 16px", color: "var(--wd-f, #0f172a)" }}>
                {ru ? "Детали заказа" : "Order Summary"}
              </h3>

              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <strong style={{ fontSize: 15 }}>{pack.title}</strong>
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>{pack.priceRub} ₽</span>
                </div>

                <p style={{ fontSize: 13, color: "var(--wd-ms, #64748b)", margin: 0 }}>
                  {pack.desc}
                </p>

                <div
                  style={{
                    padding: "10px 12px",
                    background: "var(--wd-s, #f8fafc)",
                    borderRadius: 8,
                    border: "1px solid var(--wd-l, #e2e8f0)",
                    fontSize: 13,
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Количество:" : "Quantity:"}</span>
                    <strong>{pack.credits} AI-кредитов</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
                    <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Срок действия:" : "Validity:"}</span>
                    <strong style={{ color: "#10b981" }}>{ru ? "Бессрочно (не сгорают)" : "Never expire"}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ color: "var(--wd-ms, #64748b)" }}>{ru ? "Итого к оплате:" : "Total:"}</span>
                    <strong style={{ fontSize: 15, color: "#2563eb" }}>{pack.priceRub} ₽</strong>
                  </div>
                </div>

                {/* Change pack buttons */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 6 }}>
                    {ru ? "Выбрать другой пакет:" : "Switch package:"}
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["pack-50", "pack-150", "pack-500"].map((id) => {
                      const item = PACKS[id];
                      if (!item) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => setPackId(id)}
                          style={{
                            padding: "6px 10px",
                            borderRadius: 6,
                            fontSize: 12,
                            fontWeight: 600,
                            border: packId === id ? "2px solid #2563eb" : "1px solid var(--wd-l, #e2e8f0)",
                            background: packId === id ? "rgba(37, 99, 235, 0.08)" : "var(--wd-s, #fff)",
                            color: packId === id ? "#2563eb" : "var(--wd-f, #0f172a)",
                            cursor: "pointer",
                          }}
                        >
                          {item.credits} {ru ? "кредитов" : "credits"} ({item.priceRub} ₽)
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* DOKPLOY / LIVE GATEWAY CONNECTION INSTRUCTIONS */}
            <div
              style={{
                background: "var(--wd-s, #f8fafc)",
                border: "1px solid var(--wd-l, #e2e8f0)",
                borderRadius: 12,
                padding: 16,
              }}
            >
              <button
                type="button"
                onClick={() => setShowDokployGuide(!showDokployGuide)}
                style={{
                  background: "none",
                  border: "none",
                  padding: 0,
                  fontSize: 13,
                  fontWeight: 600,
                  color: "#2563eb",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                }}
              >
                <span>⚙️ {ru ? "Как подключить боевой эквайринг Lava.top?" : "How to connect live Lava.top gateway?"}</span>
                <span>{showDokployGuide ? "▲" : "▼"}</span>
              </button>

              {showDokployGuide && (
                <div style={{ marginTop: 12, fontSize: 12, color: "var(--wd-ms, #64748b)", lineHeight: 1.6 }}>
                  <p style={{ margin: "0 0 6px" }}>
                    {ru
                      ? "Для приёма реальных платежей от пользователей банковскими картами РФ/зарубежных банков и СБП:"
                      : "To accept real card and SBP payments:"}
                  </p>
                  <ol style={{ paddingLeft: 18, margin: "0 0 10px" }}>
                    <li>{ru ? "Зарегистрируйтесь на сайте lava.top и создайте проект." : "Register at lava.top and create a project."}</li>
                    <li>{ru ? "В настройках проекта получите API-ключ и секрет вебхука." : "Get API Key and Webhook secret from project settings."}</li>
                    <li>
                      {ru ? "В панели Dokploy в Environment Variables укажите:" : "In Dokploy Environment Variables specify:"}
                      <pre style={{ background: "#1e293b", color: "#f8fafc", padding: "8px 10px", borderRadius: 6, margin: "6px 0", fontSize: 11, overflowX: "auto" }}>
                        {`LAVA_API_KEY=ваш_api_ключ\nLAVA_WEBHOOK_SECRET=ваш_секрет\nLAVA_OFFER_ID=id_оффера`}
                      </pre>
                    </li>
                    <li>{ru ? "В кабинете Lava.top укажите Webhook URL: https://ваш-домен/v1/billing/webhook" : "In Lava.top specify Webhook URL: https://your-domain/v1/billing/webhook"}</li>
                  </ol>
                  <p style={{ margin: 0, fontSize: 11, color: "#10b981", fontWeight: 600 }}>
                    {ru
                      ? "✓ После добавления ключей платформа автоматически переключится на приём реальных оплат."
                      : "✓ The platform automatically enables live payments once keys are present."}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
