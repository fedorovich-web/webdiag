"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Check,
  Minus,
  ShieldCheck,
  ArrowRight,
  ChevronDown,
  Sparkles,
  UserCheck,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { getAccountSession } from "../account/account-client";
import type { AccountSessionResponse } from "../account/account-contract";

interface PricingHubPageProps {
  readonly locale: Locale;
}

export function PricingHubPage({ locale }: PricingHubPageProps) {
  const ru = locale === "ru";
  const router = useRouter();
  const [annual, setAnnual] = useState(true);
  const [activeFaq, setActiveFaq] = useState<number | null>(0);
  const [loadingPack, setLoadingPack] = useState<string | null>(null);
  const [billingError, setBillingError] = useState<string | null>(null);
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

  async function handleBuyPack(packId: string) {
    setLoadingPack(packId);
    setBillingError(null);
    try {
      const resp = await fetch("/api/billing/lava/invoice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pack_id: packId }),
      });
      if (resp.status === 401) {
        if (!session) {
          setBillingError(
            ru
              ? "Для совершения оплаты необходимо войти в аккаунт."
              : "You must be signed in to make a payment."
          );
          router.push(
            `${ru ? "/login" : "/en/login"}?return_to=${encodeURIComponent(
              "/pricing#credit-packs"
            )}`
          );
          return;
        }
        setBillingError(
          ru
            ? "Сессия не подтверждена платежным сервером. Пожалуйста, обновите страницу."
            : "Session not confirmed by billing server. Please refresh the page."
        );
        return;
      }
      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        throw new Error(
          data?.detail?.message ||
            (ru ? "Ошибка создания счета на оплату" : "Failed to create payment invoice")
        );
      }
      const data = await resp.json();
      if (data.payment_url) {
        window.location.assign(data.payment_url);
      } else {
        throw new Error(
          ru ? "Платежная ссылка не получена" : "Payment URL was not returned"
        );
      }
    } catch (err: unknown) {
      setBillingError(
        err instanceof Error
          ? err.message
          : ru
          ? "Не удалось перейти к оплате"
          : "Unable to initiate payment"
      );
    } finally {
      setLoadingPack(null);
    }
  }

  const homeHref = ru ? "/" : "/en";
  const registerHref = ru ? "/register" : "/en/register";

  const t = ru
    ? {
        breadcrumbs: { home: "Главная", pricing: "Тарифы" },
        hero: {
          eyebrow: "Прозрачные условия",
          title: "Простые и понятные тарифы без скрытых платежей",
          lead: "Выберите подходящий тариф для одного сайта или целого пула клиентских проектов. Начните бесплатно или получите максимум возможностей с тарифами Pro и Team.",
          monthly: "Ежемесячно",
          annual: "Оплата за год",
          discountBadge: "Скидка 20%",
        },
        plans: [
          {
            id: "free",
            name: "Стартовый",
            badge: null,
            desc: "Для владельцев сайтов и базовой экспресс-диагностики.",
            priceMonthly: "0 ₽",
            priceAnnual: "0 ₽",
            period: "навсегда",
            features: [
              "125 бесплатных диагностических инструментов",
              "10 приветственных AI-кредитов при регистрации",
              "Экспресс-аудиты отдельных страниц",
              "Проверка Core Web Vitals и скорости",
              "Базовый SSL и HTTP-анализ",
              "1 проект в личном кабинете",
              "Хранение истории 7 дней",
            ],
            missing: [
              "Глубокий краулинг всего сайта",
              "Неограниченные AI-планы исправлений (требуются кредиты)",
              "Экспорт отчетов в PDF и CSV",
              "Авто-мониторинг по расписанию",
            ],
            btnText: "Начать бесплатно",
            btnHref: session ? "/account" : registerHref,
            isPopular: false,
          },
          {
            id: "pro",
            name: "Профессиональный",
            badge: "Популярный выбор",
            desc: "Для SEO-специалистов, вебмастеров и растущих проектов.",
            priceMonthly: "990 ₽",
            priceAnnual: "790 ₽",
            period: "в месяц",
            features: [
              "Все возможности тарифа Стартовый",
              "Краулинг сайтов до 500 страниц",
              "5 активных проектов в мониторинге",
              "Доступ ко всем 10 AI-инструментам",
              "Приоритетный AI-план исправлений",
              "Выгрузка отчетов в PDF и CSV",
              "Хранение истории 90 дней",
              "Поиск битых ссылок и цепочек редиректов",
            ],
            missing: [
              "Командный доступ и несколько мест",
              "White-label брендирование отчетов",
            ],
            btnText: "Попробовать Pro",
            btnHref: session ? "/account/settings#billing" : `${registerHref}?plan=pro`,
            isPopular: true,
          },
          {
            id: "team",
            name: "Команда / Агентство",
            badge: "Для агентств",
            desc: "Для digital-агентств, веб-студий и крупных порталов.",
            priceMonthly: "2 990 ₽",
            priceAnnual: "2 390 ₽",
            period: "в месяц",
            features: [
              "Все возможности тарифа Pro",
              "Глубокий краулинг до 10 000 страниц",
              "25 проектов с авто-сканированием",
              "Регулярный мониторинг по расписанию",
              "White-label отчеты (ваш логотип в PDF)",
              "До 5 рабочих мест для команды",
              "Хранение истории 365 дней",
              "Приоритетная очередь обработки данных",
              "Персональная поддержка в Telegram",
            ],
            missing: [],
            btnText: "Выбрать Team",
            btnHref: session ? "/account/settings#billing" : `${registerHref}?plan=team`,
            isPopular: false,
          },
        ],
        comparisonTitle: "Сравнение возможностей тарифов",
        comparisonLead: "Подробный обзор функционала и лимитов для каждого уровня подписки.",
        tableHeaders: ["Функция", "Стартовый", "Pro", "Team"],
        comparisonGroups: [
          {
            category: "Проекты и сканирование",
            rows: [
              { name: "Количество активных проектов", free: "1 проект", pro: "5 проектов", team: "25 проектов" },
              { name: "Глубина краулинга на один аудит", free: "1 страница", pro: "500 страниц", team: "10 000 страниц" },
              { name: "Частота авто-проверок", free: "Вручную", pro: "Еженедельно", team: "Ежедневно / По расписанию" },
              { name: "Рендеринг Chromium (JS & SPA)", free: "Да", freeCheck: true, pro: "Да", proCheck: true, team: "Да", teamCheck: true },
            ],
          },
          {
            category: "AI-инструменты и аналитика",
            rows: [
              { name: "Доступ к 10 AI-сценариям", free: "Нет", freeCheck: false, pro: "Да (включено)", proCheck: true, team: "Неограниченно", teamCheck: true },
              { name: "AI-план исправлений по аудиту", free: "Нет", freeCheck: false, pro: "Да", proCheck: true, team: "Да", teamCheck: true },
              { name: "AI-брифы и оптимизатор текстов", free: "Нет", freeCheck: false, pro: "Да", proCheck: true, team: "Да", teamCheck: true },
              { name: "Анализ конкурентных пробелов", free: "Нет", freeCheck: false, pro: "Да", proCheck: true, team: "Да", teamCheck: true },
            ],
          },
          {
            category: "Отчеты и командная работа",
            rows: [
              { name: "Выгрузка в PDF и CSV", free: "Нет", freeCheck: false, pro: "Да", proCheck: true, team: "Да", teamCheck: true },
              { name: "White-label отчеты с вашим логотипом", free: "Нет", freeCheck: false, pro: "Нет", proCheck: false, team: "Да", teamCheck: true },
              { name: "Количество рабочих мест (seats)", free: "1 пользователь", pro: "1 пользователь", team: "До 5 пользователей" },
              { name: "Срок хранения истории", free: "7 дней", pro: "90 дней", team: "365 дней" },
            ],
          },
          {
            category: "Поддержка и закрывающие документы",
            rows: [
              { name: "Канал поддержки", free: "Email", pro: "Email (до 4 ч)", team: "Приоритетный Telegram + Email" },
              { name: "Оплата по безналичному расчету (юрлица)", free: "Нет", freeCheck: false, pro: "Да (при годовой)", proCheck: true, team: "Да (с актами и ЭДО)", teamCheck: true },
            ],
          },
        ],
        faqTitle: "Вопросы и ответы по тарифам",
        faqLead: "Все, что нужно знать об оплате, смене планов и возвратах.",
        faqs: [
          {
            q: "Можно ли сменить тариф или отменить подписку в любой момент?",
            a: "Да, вы можете повысить, понизить тариф или отменить автопродление в личном кабинете в любое время в один клик. При переходе на более высокий план оплаченные дни автоматически пересчитываются.",
          },
          {
            q: "Работаете ли вы с юридическими лицами и ИП?",
            a: "Да, мы предоставляем полный пакет закрывающих документов (счета, акты) через системы ЭДО (Диадок, СБИС) или на бумажном носителе. Для выставления счета напишите нам на support@webdiag.ru.",
          },
          {
            q: "Что происходит при исчерпании лимитов тарифа?",
            a: "Сервис предупредит вас заранее. Вы сможете докупить дополнительный объем проверок или безопасно дождаться следующего расчетного периода без потери сохраненных данных.",
          },
          {
            q: "Какие способы оплаты поддерживаются?",
            a: "Мы принимаем банковские карты МИР, Visa, Mastercard, СБП, а также безналичные платежи от юридических лиц и индивидуальных предпринимателей.",
          },
          {
            q: "Есть ли бесплатный пробный период для тарифов Pro?",
            a: "Вы можете сразу зарегистрироваться на бесплатном тарифе и протестировать работу платформы. Все базовые инструменты и экспресс-аудиты доступны без привязки банковской карты.",
          },
        ],
        creditPacks: {
          eyebrow: "Без абонентской платы",
          title: "Разовые пакеты AI-кредитов (Pay-As-You-Go)",
          lead: "Нужны только AI-инструменты для решения разовых задач без регулярной подписки? Покупайте кредиты по мере необходимости — они никогда не сгорают и действуют бессрочно.",
          badgeNonExpiring: "Кредиты никогда не сгорают",
          packs: [
            {
              id: "pack-50",
              name: "Старт",
              credits: "50",
              creditsUnit: "AI-кредитов",
              price: "390 ₽",
              perCredit: "~7.8 ₽ за кредит",
              desc: "Для быстрой оптимизации и исправления 1 сайта.",
              badge: null,
              features: [
                "5–10 запусков любых AI-инструментов",
                "Бессрочный баланс (кредиты не сгорают)",
                "AI-план устранения ошибок аудита",
                "Генерация микроразметки Schema.org и мета-тегов",
              ],
              btnText: "Выбрать 50 кредитов",
              btnHref: session ? "/account/settings#billing" : `${registerHref}?pack=50`,
              isPopular: false,
            },
            {
              id: "pack-150",
              name: "Оптимум",
              credits: "150",
              creditsUnit: "AI-кредитов",
              price: "890 ₽",
              perCredit: "~5.9 ₽ за кредит",
              desc: "Оптимальный выбор для аудита и доработки 3–5 сайтов.",
              badge: "Хит продаж · Выгода 25%",
              features: [
                "До 30 запусков любых AI-инструментов",
                "Бессрочный баланс без ограничений по времени",
                "Анализ конкурентных пробелов и ТЗ копирайтерам",
                "Оптимизатор контента и внутренняя перелинковка",
              ],
              btnText: "Выбрать 150 кредитов",
              btnHref: session ? "/account/settings#billing" : `${registerHref}?pack=150`,
              isPopular: true,
            },
            {
              id: "pack-500",
              name: "Бизнес",
              credits: "500",
              creditsUnit: "AI-кредитов",
              price: "1 990 ₽",
              perCredit: "~3.9 ₽ за кредит",
              desc: "Для постоянной работы вебмастеров, SEO-специалистов и агентств.",
              badge: "Максимальная выгода 50%",
              features: [
                "До 100 запусков любых AI-инструментов",
                "Бессрочный баланс без сгорания",
                "Приоритетная очередь генерации в LLM",
                "Доступ ко всем 15 AI-инструментам платформы",
              ],
              btnText: "Выбрать 500 кредитов",
              btnHref: session ? "/account/settings#billing" : `${registerHref}?pack=500`,
              isPopular: false,
            },
          ],
        },
        guarantee: {
          title: "14 дней гарантии возврата средств",
          text: "Если платформа WebDiag не подойдет под ваши задачи, мы вернем оплату в течение 14 дней с момента оформления первого платного заказа без лишних вопросов.",
        },
      }
    : {
        breadcrumbs: { home: "Home", pricing: "Pricing" },
        hero: {
          eyebrow: "Transparent Pricing",
          title: "Simple, Predictable Plans with Zero Hidden Fees",
          lead: "Choose the plan tailored to your single website or an entire client portfolio. Start free or unlock comprehensive diagnostics with Pro and Team tiers.",
          monthly: "Monthly billing",
          annual: "Annual billing",
          discountBadge: "Save 20%",
        },
        plans: [
          {
            id: "free",
            name: "Starter",
            badge: null,
            desc: "For website owners and quick technical health checks.",
            priceMonthly: "$0",
            priceAnnual: "$0",
            period: "forever free",
            features: [
              "125 free diagnostic web tools",
              "10 welcome AI credits upon signup",
              "Express single page audits",
              "Core Web Vitals & speed checks",
              "Basic SSL & HTTP header analysis",
              "1 project in workspace",
              "7-day history retention",
            ],
            missing: [
              "Deep multi-page website crawling",
              "Unlimited AI fix action plans (requires credits)",
              "PDF and CSV report exports",
              "Scheduled automated monitoring",
            ],
            btnText: "Start Free",
            btnHref: session ? "/en/account" : registerHref,
            isPopular: false,
          },
          {
            id: "pro",
            name: "Professional",
            badge: "Most Popular",
            desc: "For SEO consultants, developers, and growing websites.",
            priceMonthly: "$14",
            priceAnnual: "$11",
            period: "per month",
            features: [
              "Everything in Starter plan",
              "Deep crawling up to 500 pages",
              "5 active projects in monitoring",
              "Full access to all 10 AI workflows",
              "Actionable AI Fix Plan",
              "PDF & CSV report downloads",
              "90-day history retention",
              "Broken links and redirect chain finder",
            ],
            missing: [
              "Multi-seat team collaboration",
              "White-label branded reports",
            ],
            btnText: "Try Pro",
            btnHref: session ? "/en/account/settings#billing" : `${registerHref}?plan=pro`,
            isPopular: true,
          },
          {
            id: "team",
            name: "Team & Agency",
            badge: "For Agencies",
            desc: "For digital agencies, web studios, and large web portals.",
            priceMonthly: "$42",
            priceAnnual: "$34",
            period: "per month",
            features: [
              "Everything in Pro plan",
              "Deep crawl up to 10,000 pages",
              "25 projects with automated crawls",
              "Scheduled recurring monitoring",
              "White-label PDF reports (your branding)",
              "Up to 5 team member seats",
              "365-day history retention",
              "High-priority worker processing queue",
              "Dedicated priority support",
            ],
            missing: [],
            btnText: "Choose Team",
            btnHref: session ? "/en/account/settings#billing" : `${registerHref}?plan=team`,
            isPopular: false,
          },
        ],
        comparisonTitle: "Compare Features Across Plans",
        comparisonLead: "An in-depth matrix of technical features and limits for each subscription level.",
        tableHeaders: ["Feature", "Starter", "Pro", "Team"],
        comparisonGroups: [
          {
            category: "Projects & Crawling",
            rows: [
              { name: "Active projects in workspace", free: "1 project", pro: "5 projects", team: "25 projects" },
              { name: "Crawl depth per audit", free: "1 page", pro: "500 pages", team: "10,000 pages" },
              { name: "Automated scan frequency", free: "Manual", pro: "Weekly", team: "Daily / Scheduled" },
              { name: "Chromium rendering (JS & SPA)", free: "Yes", freeCheck: true, pro: "Yes", proCheck: true, team: "Yes", teamCheck: true },
            ],
          },
          {
            category: "AI Tools & Intelligence",
            rows: [
              { name: "Access to 10 AI workflows", free: "No", freeCheck: false, pro: "Yes (included)", proCheck: true, team: "Unlimited", teamCheck: true },
              { name: "Audit Action Plan generation", free: "No", freeCheck: false, pro: "Yes", proCheck: true, team: "Yes", teamCheck: true },
              { name: "Content brief & text optimizer", free: "No", freeCheck: false, pro: "Yes", proCheck: true, team: "Yes", teamCheck: true },
              { name: "Competitor gap analysis", free: "No", freeCheck: false, pro: "Yes", proCheck: true, team: "Yes", teamCheck: true },
            ],
          },
          {
            category: "Reporting & Collaboration",
            rows: [
              { name: "PDF and CSV exports", free: "No", freeCheck: false, pro: "Yes", proCheck: true, team: "Yes", teamCheck: true },
              { name: "White-label custom branding", free: "No", freeCheck: false, pro: "No", proCheck: false, team: "Yes", teamCheck: true },
              { name: "Team user seats", free: "1 user", pro: "1 user", team: "Up to 5 users" },
              { name: "History data retention", free: "7 days", pro: "90 days", team: "365 days" },
            ],
          },
          {
            category: "Support & SLA",
            rows: [
              { name: "Support channel", free: "Email", pro: "Priority Email (<4h)", team: "Dedicated Slack / Telegram & Email" },
              { name: "Invoicing & corporate VAT", free: "No", freeCheck: false, pro: "Yes (annual)", proCheck: true, team: "Yes (with VAT invoices)", teamCheck: true },
            ],
          },
        ],
        faqTitle: "Pricing & Billing FAQ",
        faqLead: "Common questions about payments, plan upgrades, and invoices.",
        faqs: [
          {
            q: "Can I switch plans or cancel at any time?",
            a: "Yes. You can upgrade, downgrade, or cancel auto-renewal in your account settings with a single click. Unused time on upgrades is prorated automatically.",
          },
          {
            q: "Do you offer corporate invoicing for companies?",
            a: "Yes. We support wire transfer invoices and electronic tax documentation for business clients on annual plans.",
          },
          {
            q: "What happens when I hit my monthly crawl limit?",
            a: "You will receive an alert in your dashboard. You can add extra credits on-demand or wait for the next billing cycle without losing any existing reports.",
          },
          {
            q: "What payment methods are supported?",
            a: "We accept all major credit and debit cards (Visa, Mastercard, MIR), Apple Pay, Google Pay, and bank wire transfers for businesses.",
          },
        ],
        creditPacks: {
          eyebrow: "No Recurring Subscription",
          title: "On-Demand AI Credit Packages (Pay-As-You-Go)",
          lead: "Need AI tools without monthly commitments? Purchase credits on demand — they never expire and can be used anytime for any website.",
          badgeNonExpiring: "Credits never expire",
          packs: [
            {
              id: "pack-50",
              name: "Starter",
              credits: "50",
              creditsUnit: "AI credits",
              price: "$5",
              perCredit: "~$0.10 per credit",
              desc: "For quick optimization and fixing a single website.",
              badge: null,
              features: [
                "5–10 runs of any AI workflow",
                "Non-expiring permanent balance",
                "AI Site Fix Action Plan",
                "Schema.org JSON-LD and meta tag generator",
              ],
              btnText: "Get 50 Credits",
              btnHref: session ? "/en/account/settings#billing" : `${registerHref}?pack=50`,
              isPopular: false,
            },
            {
              id: "pack-150",
              name: "Pro Pack",
              credits: "150",
              creditsUnit: "AI credits",
              price: "$11",
              perCredit: "~$0.07 per credit",
              desc: "Best value for auditing and optimizing 3–5 websites.",
              badge: "Popular · Save 25%",
              features: [
                "Up to 30 runs of any AI workflow",
                "Non-expiring permanent balance",
                "Competitor gap analysis & content briefs",
                "Copy optimizer & internal linking planner",
              ],
              btnText: "Get 150 Credits",
              btnHref: session ? "/en/account/settings#billing" : `${registerHref}?pack=150`,
              isPopular: true,
            },
            {
              id: "pack-500",
              name: "Business",
              credits: "500",
              creditsUnit: "AI credits",
              price: "$25",
              perCredit: "~$0.05 per credit",
              desc: "For SEO consultants, freelancers, and ongoing client audits.",
              badge: "Best Value · Save 50%",
              features: [
                "Up to 100 runs of any AI workflow",
                "Non-expiring permanent balance",
                "Priority LLM queue processing",
                "Full access to all 15 AI tools",
              ],
              btnText: "Get 500 Credits",
              btnHref: session ? "/en/account/settings#billing" : `${registerHref}?pack=500`,
              isPopular: false,
            },
          ],
        },
        guarantee: {
          title: "14-Day Money-Back Guarantee",
          text: "If WebDiag doesn't fully satisfy your diagnostic requirements, contact us within 14 days of your initial purchase for a full refund.",
        },
      };

  return (
    <div className="wd-pricing-page">
      {/* Breadcrumbs (strictly 12px) */}
      <nav className="shell breadcrumbs wd-pricing-breadcrumbs" aria-label="Breadcrumbs">
        <Link href={homeHref}>{t.breadcrumbs.home}</Link>
        <span aria-hidden="true">/</span>
        <span aria-current="page">{t.breadcrumbs.pricing}</span>
      </nav>

      {/* Hero */}
      <section className="wd-pricing-hero">
        <div className="shell wd-pricing-hero-inner">
          <span className="wd-eyebrow">{t.hero.eyebrow}</span>
          <h1 className="wd-pricing-h1">{t.hero.title}</h1>
          <p className="wd-pricing-hero-lead">{t.hero.lead}</p>

          {/* Billing Switcher */}
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

      {/* Pricing Cards Grid */}
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
                      Вы авторизованы как <strong>{session.user.email}</strong>. При выборе тарифа или покупке кредитов заказ сразу привязывается к вашему аккаунту.
                    </>
                  ) : (
                    <>
                      Signed in as <strong>{session.user.email}</strong>. Plan upgrades and credit packages will be applied directly to your account.
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
              const price = annual ? plan.priceAnnual : plan.priceMonthly;
              const isPlanLoading = loadingPack === `plan-${plan.id}`;
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
                    <span className="wd-pricing-card-amount">{price}</span>
                    <span className="wd-pricing-card-period">/ {plan.period}</span>
                  </div>

                  {session && plan.id !== "free" ? (
                    <button
                      type="button"
                      onClick={() => handleBuyPack(`plan-${plan.id}`)}
                      disabled={isPlanLoading}
                      className={`wd-pricing-card-btn ${plan.isPopular ? "is-primary" : ""}`}
                      style={{ width: "100%", cursor: isPlanLoading ? "wait" : "pointer" }}
                    >
                      <span>
                        {isPlanLoading
                          ? (ru ? "Создание счета..." : "Creating invoice...")
                          : (ru ? `Перейти на ${plan.name}` : `Upgrade to ${plan.name}`)}
                      </span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </button>
                  ) : session && plan.id === "free" ? (
                    <Link
                      href={ru ? "/account" : "/en/account"}
                      className="wd-pricing-card-btn"
                    >
                      <span>{ru ? "Текущий тариф (Кабинет)" : "Current Plan (Dashboard)"}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  ) : (
                    <Link
                      href={plan.btnHref}
                      className={`wd-pricing-card-btn ${plan.isPopular ? "is-primary" : ""}`}
                    >
                      <span>{plan.btnText}</span>
                      <ArrowRight size={16} aria-hidden="true" />
                    </Link>
                  )}

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
                    {plan.missing.map((feat, idx) => (
                      <li key={idx} className="is-missing">
                        <Minus size={16} aria-hidden="true" />
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

      {/* On-Demand Credit Packs (Pay-as-you-go) */}
      <section className="wd-pricing-section wd-credit-packs-section" id="credit-packs">
        <div className="shell">
          <div className="wd-pricing-section-header">
            <span className="wd-eyebrow">{t.creditPacks.eyebrow}</span>
            <h2>{t.creditPacks.title}</h2>
            <p className="wd-pricing-sub-h2">{t.creditPacks.lead}</p>
          </div>

          {billingError && (
            <div className="wd-credit-pack-error" role="alert" style={{ marginBottom: "20px", padding: "12px 18px", borderRadius: "12px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626", fontSize: "14px", textAlign: "center" }}>
              {billingError}
            </div>
          )}

          <div className="wd-credit-packs-grid">
            {t.creditPacks.packs.map((pack) => (
              <div
                className={`wd-credit-pack-card ${pack.isPopular ? "is-popular" : ""}`}
                key={pack.id}
              >
                {pack.badge && <span className="wd-credit-pack-badge">{pack.badge}</span>}
                <div className="wd-credit-pack-head">
                  <div className="wd-credit-pack-credits-wrap">
                    <Sparkles size={20} className="wd-credit-pack-icon" aria-hidden="true" />
                    <span className="wd-credit-pack-amount">{pack.credits}</span>
                    <span className="wd-credit-pack-unit">{pack.creditsUnit}</span>
                  </div>
                  <h3>{pack.name}</h3>
                  <p className="wd-credit-pack-desc">{pack.desc}</p>
                </div>

                <div className="wd-credit-pack-price-row">
                  <span className="wd-credit-pack-price">{pack.price}</span>
                  <span className="wd-credit-pack-rate">{pack.perCredit}</span>
                </div>

                <button
                  type="button"
                  onClick={() => handleBuyPack(pack.id)}
                  disabled={loadingPack === pack.id}
                  className={`wd-pricing-card-btn ${pack.isPopular ? "is-primary" : ""}`}
                  style={{ width: "100%", cursor: loadingPack === pack.id ? "wait" : "pointer" }}
                >
                  <span>{loadingPack === pack.id ? (ru ? "Создание счета..." : "Creating invoice...") : pack.btnText}</span>
                  <ArrowRight size={16} aria-hidden="true" />
                </button>

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
            ))}
          </div>
        </div>
      </section>

      {/* Comparison Table */}
      <section className="wd-pricing-section wd-comparison-section">
        <div className="shell">
          <div className="wd-pricing-section-header">
            <span className="wd-eyebrow">{ru ? "Матрица тарифов" : "Plan Matrix"}</span>
            <h2>{t.comparisonTitle}</h2>
            <p className="wd-pricing-sub-h2">{t.comparisonLead}</p>
          </div>

          <div className="wd-comparison-table-wrapper">
            <table className="wd-comparison-table">
              <thead>
                <tr>
                  {t.tableHeaders.map((header, idx) => (
                    <th key={idx}>{header}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.comparisonGroups.map((group, gIdx) => (
                  <tr key={gIdx} className="wd-table-group-header-row">
                    <td colSpan={4} className="wd-table-group-header">
                      {group.category}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Detailed comparison list */}
      <section className="wd-pricing-section wd-comparison-details-section">
        <div className="shell">
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
                          <small>Стартовый:</small>
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

      {/* FAQ */}
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

      {/* Guarantee Banner */}
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
    </div>
  );
}
