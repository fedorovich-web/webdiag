"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Check,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { getAccountSession } from "../account/account-client";
import type { AccountSessionResponse } from "../account/account-contract";
import { billingSku, checkoutPackage, planSku } from "../account/billing-catalog";
import { PriceAmount } from "../../components/price-amount";

interface PricingHubPageProps {
  readonly locale: Locale;
}

export function PricingHubPage({ locale }: PricingHubPageProps) {
  const ru = locale === "ru";
  const [annual, setAnnual] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [session, setSession] = useState<AccountSessionResponse | null>(null);

  useEffect(() => {
    let active = true;
    getAccountSession()
      .then((sess) => {
        if (active) setSession(sess);
      })
      .catch(() => {
        if (active) setSession(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const homeHref = ru ? "/" : "/en";
  const registerHref = ru ? "/register" : "/en/register";

  const t = ru
    ? {
        breadcrumbs: { home: "Главная", pricing: "Тарифы" },
        hero: {
          eyebrow: "Прозрачные условия",
          title: "Простые и понятные тарифы без скрытых платежей",
          lead: "Базовые проверки доступны бесплатно. Для AI-задач выберите разовый пакет кредитов или тариф Pro и Team.",
          monthly: "Оплата за 30 дней",
          annual: "Оплата за год",
          discountBadge: "Без автопродления",
        },
        plans: [
          {
            id: "free",
            name: "Стартовый",
            badge: null,
            desc: "Для владельцев сайтов и базовой экспресс-диагностики.",
            period: "навсегда",
            features: [
              "Бесплатные диагностические инструменты",
              "Экспресс-аудит отдельных страниц",
              "HTML-краулинг: до 100 страниц по умолчанию",
              "Сохранение аудитов в личном кабинете",
              "HTML-отчеты с печатью через браузер",
              "Мониторинг по расписанию и история проверок",
              "AI-инструменты при достаточном балансе кредитов"
            ],
            btnText: "Начать бесплатно",
            isPopular: false,
          },
          {
            id: "pro",
            name: "Профессиональный",
            badge: "Pro",
            desc: "Для SEO-специалистов, вебмастеров и растущих проектов.",
            period: "в месяц",
            features: [
              "Все базовые диагностические инструменты",
              "150 AI-кредитов при оплате за 30 дней",
              "1 800 AI-кредитов при оплате за год",
              "Годовой период действует 365 дней",
              "Текстовый AI-запуск — 1 кредит",
              "Создание или редактирование изображения — 2 кредита",
              "HTML-отчеты и мониторинг по расписанию",
              "Разовая оплата без автопродления"
            ],
            btnText: "Выбрать Pro",
            isPopular: true,
          },
          {
            id: "team",
            name: "Team",
            badge: "Больше AI-кредитов",
            desc: "Для регулярной работы с текстами и изображениями.",
            period: "в месяц",
            features: [
              "Все базовые диагностические инструменты",
              "500 AI-кредитов при оплате за 30 дней",
              "6 000 AI-кредитов при оплате за год",
              "Годовой период действует 365 дней",
              "Текстовый AI-запуск — 1 кредит",
              "Создание или редактирование изображения — 2 кредита",
              "HTML-отчеты и мониторинг по расписанию",
              "Дополнительные пакеты кредитов доступны отдельно",
              "Разовая оплата без автопродления"
            ],
            btnText: "Выбрать Team",
            isPopular: false,
          },
        ],
        comparisonTitle: "Сравнение возможностей тарифов",
        comparisonLead: "Доступные проверки, AI-кредиты и условия оплаты.",
        comparisonGroups: [
          {
            "category": "Диагностика и краулинг",
            "rows": [
              {
                "name": "Диагностические инструменты",
                "free": "Доступны",
                "pro": "Доступны",
                "team": "Доступны"
              },
              {
                "name": "Краулинг по умолчанию",
                "free": "До 100 HTML-страниц",
                "pro": "До 100 HTML-страниц",
                "team": "До 100 HTML-страниц"
              },
              {
                "name": "Обработка страниц",
                "free": "HTML без выполнения JavaScript",
                "pro": "HTML без выполнения JavaScript",
                "team": "HTML без выполнения JavaScript"
              }
            ]
          },
          {
            "category": "AI-кредиты и инструменты",
            "rows": [
              {
                "name": "Кредиты в оплаченном тарифе",
                "free": "Отдельная покупка",
                "pro": "150 за 30 дней; 1 800 за год",
                "team": "500 за 30 дней; 6 000 за год"
              },
              {
                "name": "AI-инструменты каталога",
                "free": "При достаточном балансе",
                "pro": "При достаточном балансе",
                "team": "При достаточном балансе"
              },
              {
                "name": "Текстовый AI-запуск",
                "free": "1 кредит",
                "pro": "1 кредит",
                "team": "1 кредит"
              },
              {
                "name": "Создание или редактирование изображения",
                "free": "2 кредита",
                "pro": "2 кредита",
                "team": "2 кредита"
              }
            ]
          },
          {
            "category": "Отчеты и мониторинг",
            "rows": [
              {
                "name": "Сохраненные аудиты",
                "free": "В личном кабинете",
                "pro": "В личном кабинете",
                "team": "В личном кабинете"
              },
              {
                "name": "Формат отчета",
                "free": "HTML и печать в браузере",
                "pro": "HTML и печать в браузере",
                "team": "HTML и печать в браузере"
              },
              {
                "name": "Мониторинг",
                "free": "Расписание и история проверок",
                "pro": "Расписание и история проверок",
                "team": "Расписание и история проверок"
              }
            ]
          },
          {
            "category": "Оплата и поддержка",
            "rows": [
              {
                "name": "Период оплаченного тарифа",
                "free": "Без оплаты тарифа",
                "pro": "30 или 365 дней",
                "team": "30 или 365 дней"
              },
              {
                "name": "Автоматическое продление",
                "free": "Не применяется",
                "pro": "Нет",
                "team": "Нет"
              },
              {
                "name": "Дополнительные AI-кредиты",
                "free": "Разовые пакеты без срока действия",
                "pro": "Разовые пакеты без срока действия",
                "team": "Разовые пакеты без срока действия"
              },
              {
                "name": "Вопросы об оплате",
                "free": "support@webdiag.ru",
                "pro": "support@webdiag.ru",
                "team": "support@webdiag.ru"
              }
            ]
          }
        ],
        faqTitle: "Вопросы и ответы по тарифам",
        faqLead: "Как выбрать пакет, оплатить заказ и использовать кредиты.",
        faqs: [
          {
            "q": "Что доступно без покупки тарифа?",
            "a": "Бесплатные диагностические инструменты и экспресс-аудит можно использовать без покупки тарифа. Для сохраненных аудитов, отчетов и мониторинга нужен личный кабинет. AI-инструменты требуют достаточного баланса кредитов; купить разовый пакет можно и без платного тарифа."
          },
          {
            "q": "На какой срок оплачиваются Pro и Team?",
            "a": "Оплата за 30 дней включает 150 кредитов для Pro или 500 для Team. Годовой платеж включает 1 800 или 6 000 кредитов соответственно и период 365 дней. Годовая сумма оплачивается целиком, кредиты начисляются после подтверждения оплаты. Автоматического продления нет."
          },
          {
            "q": "Как продлить или сменить оплаченный тариф?",
            "a": "Повторная покупка того же тарифа продлевает его период. Для перехода с действующего Pro на Team или обратно обратитесь на support@webdiag.ru. Автоматического пересчета стоимости оставшихся дней в личном кабинете нет."
          },
          {
            "q": "Как расходуются кредиты и можно ли их докупить?",
            "a": "Текстовый AI-запуск стоит 1 кредит, создание или редактирование изображения — 2 кредита. Доступные инструменты показаны в AI-каталоге. Дополнить баланс можно пакетами на 50, 150 или 500 кредитов; у купленных пакетов нет срока действия. Если баланса недостаточно, сначала пополните его."
          },
          {
            "q": "Как проходит оплата?",
            "a": "Для выбранного тарифа или пакета создается заказ с переходом на платежную страницу Lava. Доступные способы оплаты показывает провайдер. Кредиты начисляются после подтверждения платежа. По вопросам оплаты и документов напишите на support@webdiag.ru, указав email аккаунта и номер заказа."
          }
        ],
        creditPacks: {
          eyebrow: "Без абонентской платы",
          title: "Разовые пакеты AI-кредитов (Pay-As-You-Go)",
          lead: "Пополняйте AI-баланс разовыми пакетами без покупки тарифа. Купленные кредиты не имеют срока действия. Текстовый запуск стоит 1 кредит, создание или редактирование изображения — 2 кредита.",
          badgeNonExpiring: "Кредиты никогда не сгорают",
          packs: [
            {
              id: "pack-50",
              name: "Старт",
              creditsUnit: "AI-кредитов",
              desc: "Для отдельных задач с текстом и изображениями.",
              badge: null,
              features: [
                "50 AI-кредитов на баланс",
                "Кредиты без срока действия",
                "Текстовый запуск — 1 кредит",
                "Создание или редактирование изображения — 2 кредита"
              ],
              btnText: "Выбрать 50 кредитов",
              isPopular: false,
            },
            {
              id: "pack-150",
              name: "Оптимум",
              creditsUnit: "AI-кредитов",
              desc: "Запас кредитов для повторяющихся задач.",
              badge: "150 кредитов",
              features: [
                "150 AI-кредитов на баланс",
                "Кредиты без срока действия",
                "Доступ к инструментам при достаточном балансе",
                "Покупка без платного тарифа"
              ],
              btnText: "Выбрать 150 кредитов",
              isPopular: true,
            },
            {
              id: "pack-500",
              name: "Бизнес",
              creditsUnit: "AI-кредитов",
              desc: "Больший запас кредитов для регулярной работы.",
              badge: "500 кредитов",
              features: [
                "500 AI-кредитов на баланс",
                "Кредиты без срока действия",
                "Доступ к инструментам при достаточном балансе",
                "Разовая оплата без автопродления"
              ],
              btnText: "Выбрать 500 кредитов",
              isPopular: false,
            },
          ],
        },
        guarantee: {
          "title": "Помощь с оплатой",
          "text": "Вопросы о заказе, платеже или подтверждающих документах можно отправить на support@webdiag.ru. Укажите email аккаунта и номер заказа, чтобы мы могли найти платеж."
        },
      }
    : {
        breadcrumbs: { home: "Home", pricing: "Pricing" },
        hero: {
          eyebrow: "Transparent Pricing",
          title: "Simple, Predictable Plans with Zero Hidden Fees",
          lead: "Basic diagnostics are free. Choose a one-off credit package or a Pro or Team plan for AI tasks.",
          monthly: "30-day payment",
          annual: "Annual billing",
          discountBadge: "No auto-renewal",
        },
        plans: [
          {
            id: "free",
            name: "Starter",
            badge: null,
            desc: "For website owners and quick technical health checks.",
            period: "forever free",
            features: [
              "Free diagnostic tools",
              "Single-page express audits",
              "HTML crawling: up to 100 pages by default",
              "Saved audits in your account",
              "HTML reports with browser printing",
              "Scheduled monitoring and check history",
              "AI tools with a sufficient credit balance"
            ],
            btnText: "Start Free",
            isPopular: false,
          },
          {
            id: "pro",
            name: "Professional",
            badge: "Pro",
            desc: "For SEO consultants, developers, and growing websites.",
            period: "per month",
            features: [
              "All basic diagnostic tools",
              "150 AI credits with a 30-day purchase",
              "1,800 AI credits with an annual purchase",
              "Annual plan period of 365 days",
              "Text AI runs cost 1 credit",
              "Image generation or editing costs 2 credits",
              "HTML reports and scheduled monitoring",
              "One-time payment with no automatic renewal"
            ],
            btnText: "Choose Pro",
            isPopular: true,
          },
          {
            id: "team",
            name: "Team",
            badge: "More AI credits",
            desc: "For regular work with text and images.",
            period: "per month",
            features: [
              "All basic diagnostic tools",
              "500 AI credits with a 30-day purchase",
              "6,000 AI credits with an annual purchase",
              "Annual plan period of 365 days",
              "Text AI runs cost 1 credit",
              "Image generation or editing costs 2 credits",
              "HTML reports and scheduled monitoring",
              "Additional credit packs available separately",
              "One-time payment with no automatic renewal"
            ],
            btnText: "Choose Team",
            isPopular: false,
          },
        ],
        comparisonTitle: "Compare Features Across Plans",
        comparisonLead: "Available diagnostics, AI credits, and payment terms.",
        comparisonGroups: [
          {
            "category": "Diagnostics and crawling",
            "rows": [
              {
                "name": "Diagnostic tools",
                "free": "Available",
                "pro": "Available",
                "team": "Available"
              },
              {
                "name": "Default crawl limit",
                "free": "Up to 100 HTML pages",
                "pro": "Up to 100 HTML pages",
                "team": "Up to 100 HTML pages"
              },
              {
                "name": "Page processing",
                "free": "HTML without JavaScript execution",
                "pro": "HTML without JavaScript execution",
                "team": "HTML without JavaScript execution"
              }
            ]
          },
          {
            "category": "AI credits and tools",
            "rows": [
              {
                "name": "Credits included in a paid plan",
                "free": "Purchased separately",
                "pro": "150 per 30 days; 1,800 per year",
                "team": "500 per 30 days; 6,000 per year"
              },
              {
                "name": "AI tools in the catalog",
                "free": "With a sufficient balance",
                "pro": "With a sufficient balance",
                "team": "With a sufficient balance"
              },
              {
                "name": "Text AI run",
                "free": "1 credit",
                "pro": "1 credit",
                "team": "1 credit"
              },
              {
                "name": "Image generation or editing",
                "free": "2 credits",
                "pro": "2 credits",
                "team": "2 credits"
              }
            ]
          },
          {
            "category": "Reports and monitoring",
            "rows": [
              {
                "name": "Saved audits",
                "free": "In your account",
                "pro": "In your account",
                "team": "In your account"
              },
              {
                "name": "Report format",
                "free": "HTML and browser printing",
                "pro": "HTML and browser printing",
                "team": "HTML and browser printing"
              },
              {
                "name": "Monitoring",
                "free": "Schedules and check history",
                "pro": "Schedules and check history",
                "team": "Schedules and check history"
              }
            ]
          },
          {
            "category": "Payments and support",
            "rows": [
              {
                "name": "Paid plan period",
                "free": "No plan purchase required",
                "pro": "30 or 365 days",
                "team": "30 or 365 days"
              },
              {
                "name": "Automatic renewal",
                "free": "Not applicable",
                "pro": "No",
                "team": "No"
              },
              {
                "name": "Additional AI credits",
                "free": "One-time packs that never expire",
                "pro": "One-time packs that never expire",
                "team": "One-time packs that never expire"
              },
              {
                "name": "Payment questions",
                "free": "support@webdiag.ru",
                "pro": "support@webdiag.ru",
                "team": "support@webdiag.ru"
              }
            ]
          }
        ],
        faqTitle: "Pricing & Billing FAQ",
        faqLead: "How to choose a package, pay, and use credits.",
        faqs: [
          {
            "q": "What can I use without buying a plan?",
            "a": "Free diagnostic tools and single-page express audits are available without a plan purchase. An account is required for saved audits, reports, and monitoring. AI tools require a sufficient credit balance; you can buy a one-time credit pack without a paid plan."
          },
          {
            "q": "How long do Pro and Team purchases last?",
            "a": "A 30-day purchase includes 150 credits for Pro or 500 for Team. An annual purchase includes 1,800 or 6,000 credits respectively and a 365-day plan period. The annual amount is paid in full, and credits are added after payment confirmation. Plans do not renew automatically."
          },
          {
            "q": "How do I extend or change a paid plan?",
            "a": "Buying the same plan again extends its period. To switch an active Pro plan to Team or the other way around, contact support@webdiag.ru. The account does not automatically prorate the remaining days."
          },
          {
            "q": "How are credits used, and can I buy more?",
            "a": "A text AI run costs 1 credit; image generation or editing costs 2 credits. Available tools are shown in the AI catalog. You can add packs of 50, 150, or 500 credits, and purchased packs never expire. If your balance is insufficient, top it up before starting a run."
          },
          {
            "q": "How does payment work?",
            "a": "An order is created for your selected plan or pack and opens the Lava payment page. The provider shows the payment methods available to you. Credits are added after payment confirmation. For payment or document questions, email support@webdiag.ru with your account email and order number."
          }
        ],
        creditPacks: {
          eyebrow: "No Recurring Subscription",
          title: "On-Demand AI Credit Packages (Pay-As-You-Go)",
          lead: "Top up your AI balance with one-time packs without buying a plan. Purchased credits never expire. A text run costs 1 credit; image generation or editing costs 2 credits.",
          badgeNonExpiring: "Credits never expire",
          packs: [
            {
              id: "pack-50",
              name: "Starter",
              creditsUnit: "AI credits",
              desc: "For individual text and image tasks.",
              badge: null,
              features: [
                "50 AI credits added to your balance",
                "Credits never expire",
                "Text AI runs cost 1 credit",
                "Image generation or editing costs 2 credits"
              ],
              btnText: "Get 50 Credits",
              isPopular: false,
            },
            {
              id: "pack-150",
              name: "Pro Pack",
              creditsUnit: "AI credits",
              desc: "A credit reserve for recurring tasks.",
              badge: "150 credits",
              features: [
                "150 AI credits added to your balance",
                "Credits never expire",
                "Tools available with a sufficient balance",
                "No paid plan required"
              ],
              btnText: "Get 150 Credits",
              isPopular: true,
            },
            {
              id: "pack-500",
              name: "Business",
              creditsUnit: "AI credits",
              desc: "A larger credit reserve for regular work.",
              badge: "500 credits",
              features: [
                "500 AI credits added to your balance",
                "Credits never expire",
                "Tools available with a sufficient balance",
                "One-time payment with no automatic renewal"
              ],
              btnText: "Get 500 Credits",
              isPopular: false,
            },
          ],
        },
        guarantee: {
          "title": "Payment support",
          "text": "For questions about an order, a payment, or supporting documents, email support@webdiag.ru. Include your account email and order number so we can locate the payment."
        },
      };

  return (
    <main className="wd-pricing-page" id="main-content">
      <nav className="shell breadcrumbs wd-pricing-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.pricing}</span>
      </nav>

      <section className="wd-pricing-hero">
        <div className="shell wd-pricing-hero-inner">
          <span className="wd-eyebrow">{t.hero.eyebrow}</span>
          <h1 className="wd-pricing-h1">{t.hero.title}</h1>
          <p className="wd-pricing-hero-lead">{t.hero.lead}</p>

          <div className="wd-billing-toggle-wrap">
            <span className={`wd-billing-toggle-label ${!annual ? "is-active" : ""}`}>
              {t.hero.monthly}
            </span>
            <button
              type="button"
              className={`wd-billing-toggle-switch ${annual ? "is-annual" : ""}`}
              onClick={() => setAnnual(!annual)}
              aria-label="Toggle billing interval"
            >
              <span className="wd-billing-toggle-knob" />
            </button>
            <span className={`wd-billing-toggle-label ${annual ? "is-active" : ""}`}>
              {t.hero.annual}
              <span className="wd-discount-pill">{t.hero.discountBadge}</span>
            </span>
          </div>
        </div>
      </section>

      <section className="wd-pricing-section wd-pricing-cards-section">
        <div className="shell">
          {session && (
            <div
              className="wd-pricing-session-banner"
              style={{
                marginBottom: "32px",
                padding: "16px 24px",
                background: "linear-gradient(135deg, rgba(37, 99, 235, 0.08), rgba(124, 58, 237, 0.08))",
                border: "1px solid rgba(99, 102, 241, 0.25)",
                borderRadius: "14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                flexWrap: "wrap",
                gap: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <UserCheck size={22} color="#2563eb" aria-hidden="true" />
                <span style={{ fontSize: "14px", color: "var(--wd-f, #1e293b)", lineHeight: 1.5 }}>
                  {ru ? (
                    <>
                      Вы авторизованы как <strong>{session.user.email}</strong>. Оплаченные кредиты поступят на баланс этого аккаунта.
                    </>
                  ) : (
                    <>
                      Signed in as <strong>{session.user.email}</strong>. Purchased credits will be added to this account after payment confirmation.
                    </>
                  )}
                </span>
              </div>
              <Link
                href={ru ? "/account" : "/en/account"}
                style={{
                  fontSize: "13px",
                  fontWeight: 600,
                  color: "#2563eb",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
              >
                {ru ? "Перейти в кабинет →" : "Open workspace →"}
              </Link>
            </div>
          )}

          <div className="wd-pricing-cards-grid">
            {t.plans.map((plan) => {
              const sku = planSku(plan.id, annual, locale);
              const amount = plan.id === "free" ? 0 : checkoutPackage(sku, locale)?.amount;
              if (amount === undefined) throw new Error(`Unknown billing plan: ${sku}`);
              const price = annual && plan.id !== "free" ? amount / 12 : amount;
              const checkoutHref = `${ru ? "/account/checkout" : "/en/account/checkout"}?pack=${encodeURIComponent(sku)}`;
              const planHref = plan.id === "free"
                ? session ? (ru ? "/account" : "/en/account") : registerHref
                : session ? checkoutHref : `${registerHref}?return_to=${encodeURIComponent(checkoutHref)}`;
              return (
                <div
                  className={`wd-pricing-card ${plan.isPopular ? "is-popular" : ""}`}
                  key={plan.id}
                >
                  {plan.badge && <span className="wd-pricing-badge">{plan.badge}</span>}
                  <div className="wd-pricing-card-head">
                    <h3>{plan.name}</h3>
                    <p className="wd-pricing-card-desc">{plan.desc}</p>
                  </div>

                  <div className="wd-pricing-card-price-row">
                    <PriceAmount className="wd-pricing-card-amount" amount={price} currency={ru ? "RUB" : "USD"} locale={locale} />
                    <span className="wd-pricing-card-period">/ {plan.period}</span>
                  </div>

                  <Link href={planHref} className={`wd-pricing-card-btn ${plan.isPopular ? "is-primary" : ""}`}>
                    <span>{session && plan.id === "free" ? (ru ? "Открыть кабинет" : "Open workspace") : plan.btnText}</span>
                    <ArrowRight size={16} aria-hidden="true" />
                  </Link>

                <div className="wd-pricing-features-wrap">
                  <strong className="wd-pricing-features-title">
                    {ru ? "В тариф входит:" : "What's included:"}
                  </strong>
                  <ul className="wd-pricing-features-list">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="is-included">
                        <Check size={16} aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            );
          })}
          </div>
        </div>
      </section>

      <section className="wd-pricing-section wd-credit-packs-section" id="credit-packs">
        <div className="shell">
          <div className="wd-pricing-section-header">
            <span className="wd-eyebrow">{t.creditPacks.eyebrow}</span>
            <h2>{t.creditPacks.title}</h2>
            <p className="wd-pricing-sub-h2">{t.creditPacks.lead}</p>
          </div>

          <div className="wd-credit-packs-grid">
            {t.creditPacks.packs.map((pack) => {
              const product = checkoutPackage(billingSku(pack.id, locale), locale);
              if (!product) throw new Error(`Unknown credit package: ${pack.id}`);
              const checkoutHref = `${ru ? "/account/checkout" : "/en/account/checkout"}?pack=${encodeURIComponent(billingSku(pack.id, locale))}`;
              const packHref = session ? checkoutHref : `${ru ? "/login" : "/en/login"}?return_to=${encodeURIComponent(checkoutHref)}`;
              const rate = new Intl.NumberFormat(ru ? "ru-RU" : "en-US", {
                style: "currency",
                currency: product.currency,
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              }).format(product.amount / product.credits);
              return (
              <div
                className={`wd-credit-pack-card ${pack.isPopular ? "is-popular" : ""}`}
                key={pack.id}
              >
                {pack.badge && <span className="wd-credit-pack-badge">{pack.badge}</span>}
                <div className="wd-credit-pack-head">
                  <div className="wd-credit-pack-credits-wrap">
                    <Sparkles size={20} className="wd-credit-pack-icon" aria-hidden="true" />
                    <span className="wd-credit-pack-amount">{product.credits}</span>
                    <span className="wd-credit-pack-unit">{pack.creditsUnit}</span>
                  </div>
                  <h3>{pack.name}</h3>
                  <p className="wd-credit-pack-desc">{pack.desc}</p>
                </div>

                <div className="wd-credit-pack-price-row">
                  <PriceAmount className="wd-credit-pack-price" amount={product.amount} currency={product.currency} locale={locale} />
                  <span className="wd-credit-pack-rate">{rate} {ru ? "за кредит" : "per credit"}</span>
                </div>

                <Link
                  href={packHref}
                  className={`wd-pricing-card-btn ${pack.isPopular ? "is-primary" : ""}`}
                >
                  <span>{pack.btnText}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>

                <div className="wd-credit-pack-features">
                  <ul>
                    {pack.features.map((feat, idx) => (
                      <li key={idx}>
                        <Check size={16} aria-hidden="true" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wd-pricing-section wd-comparison-details-section">
        <div className="shell">
          <div className="wd-pricing-section-header">
            <h2>{t.comparisonTitle}</h2>
            <p className="wd-pricing-sub-h2">{t.comparisonLead}</p>
          </div>
          <div className="wd-comparison-groups">
            {t.comparisonGroups.map((group, gIdx) => (
              <div className="wd-comparison-group-card" key={gIdx}>
                <h3 className="wd-comparison-group-title">{group.category}</h3>
                <div className="wd-comparison-rows">
                  {group.rows.map((row, rIdx) => (
                    <div className="wd-comparison-row" key={rIdx}>
                      <span className="wd-comparison-row-name">{row.name}</span>
                      <div className="wd-comparison-row-values">
                        <div className="wd-comparison-val-item">
                          <small>{ru ? "Стартовый:" : "Starter:"}</small>
                          <span>{row.free}</span>
                        </div>
                        <div className="wd-comparison-val-item is-highlight">
                          <small>Pro:</small>
                          <span>{row.pro}</span>
                        </div>
                        <div className="wd-comparison-val-item">
                          <small>Team:</small>
                          <span>{row.team}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="wd-pricing-section wd-pricing-faq-section">
        <div className="shell">
          <div className="wd-pricing-section-header">
            <span className="wd-eyebrow">{ru ? "Вопросы и ответы" : "FAQ"}</span>
            <h2>{t.faqTitle}</h2>
            <p className="wd-pricing-sub-h2">{t.faqLead}</p>
          </div>

          <div className="wd-pricing-faq-list">
            {t.faqs.map((faq, idx) => {
              const isOpen = activeFaq === idx;
              return (
                <div className={`wd-pricing-faq-item ${isOpen ? "is-open" : ""}`} key={idx}>
                  <button
                    type="button"
                    className="wd-pricing-faq-btn"
                    onClick={() => setActiveFaq(isOpen ? null : idx)}
                    aria-expanded={isOpen}
                  >
                    <span>{faq.q}</span>
                    <ChevronDown size={20} className="wd-pricing-faq-arrow" aria-hidden="true" />
                  </button>
                  {isOpen && (
                    <div className="wd-pricing-faq-content">
                      <p>{faq.a}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section className="wd-pricing-section wd-guarantee-section">
        <div className="shell">
          <div className="wd-guarantee-card">
            <ShieldCheck size={36} aria-hidden="true" />
            <div>
              <h3>{t.guarantee.title}</h3>
              <p>{t.guarantee.text}</p>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
