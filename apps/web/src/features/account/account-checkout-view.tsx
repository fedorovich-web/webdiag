"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { CheckCircle2, ShieldCheck, Sparkles, ArrowLeft, AlertCircle, Info, Lock } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

import { billingSku, checkoutPackage, packagePrice } from "./billing-catalog";

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

  const [packId, setPackId] = useState(billingSku(initialPackId, locale));
  const [invoiceId, setInvoiceId] = useState(initialInvoiceId);
  const [isLive, setIsLive] = useState<boolean | null>(null);

  // Flow states
  const [submitting, setSubmitting] = useState(Boolean(initialInvoiceId));
  const [paidSuccess, setPaidSuccess] = useState(false);
  const [planStartsAt, setPlanStartsAt] = useState<number | null>(null);
  const [error, setError] = useState("");

  const selectedPack = checkoutPackage(packId, locale);
  const validPack = Boolean(selectedPack);
  const pack = selectedPack ?? checkoutPackage(billingSku("pack-50", locale), locale)!;
  const price = packagePrice(pack, locale);

  useEffect(() => {
    let active = true;
    fetch("/api/billing/lava/status", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (active && data) {
          setIsLive(Boolean(data.is_live));
        }
      })
      .catch(() => { if (active) setIsLive(false); });
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
        if (data?.detail?.code === "billing_active_plan_change" && ru) {
          throw new Error("Для смены действующего оплаченного тарифа обратитесь в поддержку. Оставшийся срок сохраняется.");
        }
        throw new Error(
          data?.detail?.message ||
            (ru ? "Не удалось выставить счёт на оплату." : "Failed to create payment invoice.")
        );
      }
      const data = await resp.json();
      if (data.pack_id === packId && data.currency === pack.currency && data.amount === pack.amount && data.is_live === true && typeof data.payment_url === "string" && new URL(data.payment_url).protocol === "https:") {
        window.location.assign(data.payment_url);
      } else {
        throw new Error(ru ? "Ссылка на оплату не получена." : "Payment URL not returned.");
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : (ru ? "Ошибка связи со шлюзом." : "Gateway error."));
      setSubmitting(false);
    }
  }

  const checkPayment = useCallback(() => {
    if (!invoiceId || !validPack) return;
    return fetch("/api/billing/lava/confirm", {
      method: "POST", headers: { "content-type": "application/json" }, credentials: "include",
      body: JSON.stringify({ pack_id: packId, invoice_id: invoiceId }), cache: "no-store",
    }).then(async (response) => {
      const data = await response.json();
      if (!response.ok) throw new Error(data?.detail?.message || (ru ? "Не удалось проверить оплату." : "Payment verification failed."));
      return data;
    }).then((data) => {
      if (data.status === "paid" && data.invoice_id === invoiceId && data.pack_id === packId && data.currency === pack.currency && data.amount === pack.amount) {
        setPaidSuccess(true);
        setPlanStartsAt(typeof data.plan_starts_at === "number" && data.plan_starts_at > Date.now() / 1000 ? data.plan_starts_at : null);
      } else {
        setError(ru ? "Оплата пока не подтверждена. Проверьте статус через несколько секунд." : "Payment is not confirmed yet. Check again shortly.");
      }
    }).catch((caught: unknown) => {
      setError(caught instanceof Error ? caught.message : (ru ? "Не удалось проверить оплату." : "Payment verification failed."));
    }).finally(() => setSubmitting(false));
  }, [invoiceId, packId, pack.currency, pack.amount, ru, validPack]);

  useEffect(() => { if (initialInvoiceId) void checkPayment(); }, [initialInvoiceId, checkPayment]);

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
            {planStartsAt ? (ru
              ? ` Оплаченный период начнётся ${new Date(planStartsAt * 1000).toLocaleDateString("ru-RU")} после уже оплаченных периодов.`
              : ` The paid period starts on ${new Date(planStartsAt * 1000).toLocaleDateString("en-US")} after previously paid periods.`) : null}
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
              <strong style={{ color: "var(--wd-f, #0f172a)" }}>{price}</strong>
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
                <span>{ru ? "Оплата через Lava.top" : "Live Lava.top gateway active"}</span>
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
                  <strong>{ru ? "Оплата временно недоступна" : "Payments temporarily unavailable"}</strong>
                  <p style={{ margin: "2px 0 0", fontSize: 12, opacity: 0.9 }}>
                    {ru
                      ? "Попробуйте позже или обратитесь в поддержку."
                      : "Try again later or contact support."}
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
            {(
              <div style={{ textAlign: "center", padding: "20px 0" }}>
                <p style={{ fontSize: 14, color: "var(--wd-ms, #64748b)", marginBottom: 20 }}>
                  {ru
                    ? "Для завершения оплаты вы будете перенаправлены на защищённую страницу платёжного сервиса Lava.top."
                    : "You will be redirected to Lava.top secure checkout to complete payment."}
                </p>
                <button
                  type="button"
                  disabled={submitting || isLive !== true || !validPack}
                  onClick={invoiceId ? () => { setSubmitting(true); setError(""); void checkPayment(); } : handleLivePayment}
                  className="wd-button wd-button-primary"
                  style={{ width: "100%", padding: "12px 20px", fontSize: 15 }}
                >
                  {submitting
                    ? (ru ? "Создание платежа..." : "Redirecting...")
                    : invoiceId ? (ru ? "Проверить оплату" : "Check payment") : (ru ? `Перейти к оплате ${price}` : `Pay ${price} with Lava.top`)}
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
                  <span style={{ fontSize: 18, fontWeight: 800, color: "#2563eb" }}>{price}</span>
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
                    <strong style={{ fontSize: 15, color: "#2563eb" }}>{price}</strong>
                  </div>
                </div>

                {/* Change pack buttons */}
                <div>
                  <label style={{ display: "block", fontSize: 12, fontWeight: 600, color: "var(--wd-ms, #64748b)", marginBottom: 6 }}>
                    {ru ? "Выбрать другой пакет:" : "Switch package:"}
                  </label>
                  <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                    {["pack-50", "pack-150", "pack-500"].map((id) => {
                      id = billingSku(id, locale);
                      const item = checkoutPackage(id, locale);
                      if (!item) return null;
                      return (
                        <button
                          key={id}
                          type="button"
                          onClick={() => { setPackId(id); setInvoiceId(""); setError(""); setPaidSuccess(false); }}
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
                          {item.credits} {ru ? "кредитов" : "credits"} ({packagePrice(item, locale)})
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
