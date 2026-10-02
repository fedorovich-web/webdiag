"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  CheckCircle2,
  Clock3,
  Globe2,
  Headphones,
  Mail,
  Send,
  ChevronDown,
  AlertCircle,
  Copy,
  Check,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

const SUPPORT_EMAIL = "support@webdiag.ru";

export function ContactPage({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<"idle" | "success" | "error">("idle");
  const [statusMessage, setStatusMessage] = useState("");
  const [copied, setCopied] = useState(false);

  const t = ru
    ? {
        eyebrow: "Поддержка WebDiag",
        titleA: "Свяжитесь",
        titleB: "с нами",
        lead: "Мы всегда на связи и готовы помочь с диагностикой сайтов, ответами по инструментам или индивидуальными вопросами.",
        emailChannel: "Основной канал связи",
        copyEmail: "Скопировать email",
        copied: "Скопировано",
        formTitle: "Напишите нам",
        formText: "Заполните форму, и мы ответим вам на указанный email в течение одного рабочего дня.",
        name: "Ваше имя",
        email: "Email для ответа",
        topic: "Тема обращения",
        topicPlaceholder: "Выберите тему",
        topics: [
          "Техническая поддержка и аудит",
          "Вопрос по тарифам и оплате",
          "Предложение нового инструмента",
          "Сотрудничество и партнерство",
          "Другой вопрос",
        ],
        message: "Сообщение",
        send: "Отправить сообщение",
        sending: "Отправка...",
        privacy: "Нажимая кнопку, вы соглашаетесь с Политикой конфиденциальности.",
        namePlaceholder: "Иван Петров",
        emailPlaceholder: "ivan@example.ru",
        messagePlaceholder: "Опишите ваш вопрос или задачу...",
        successTitle: "Сообщение отправлено!",
        successText: "Спасибо за обращение. Мы получили ваше сообщение и ответим вам в ближайшее время на указанную почту.",
        onlineTitle: "Информация о поддержке",
        onlineText: "Условия и режим работы команды поддержки WebDiag.",
        infoRows: [
          ["Единый email", SUPPORT_EMAIL, "24/7 приём"],
          ["Время ответа", "Обычно в течение 1 рабочего дня", "до 24ч"],
          ["Режим работы", "Понедельник — Пятница, 10:00–19:00", "МСК"],
          ["Языки поддержки", "Русский, English", "RU / EN"],
          ["Часовой пояс", "Москва (UTC+3)", "UTC+3"],
        ],
        faqTitle: "Часто задаваемые вопросы",
        faqText: "Ответы на популярные вопросы о поддержке и работе сервиса.",
        faq: [
          ["Как быстро отвечает служба поддержки?", "Обычно мы отвечаем в течение нескольких часов в рабочее время и гарантированно в течение одного рабочего дня."],
          ["В каком режиме работает поддержка?", "Приём обращений ведётся круглосуточно на support@webdiag.ru. Обработка запросов и ответы осуществляются по будням с 10:00 до 19:00 по московскому времени."],
          ["Можно ли получить консультацию перед покупкой тарифа?", "Да, напишите нам через форму или на support@webdiag.ru с темой «Вопрос по тарифам», и мы подробно расскажем о возможностях сервиса."],
          ["Работаете ли вы с юридическими лицами?", "Да, мы предоставляем счета, акты и все необходимые закрывающие документы для юридических лиц."],
          ["Как предложить новый инструмент для диагностики?", "Выберите тему «Предложение нового инструмента» и опишите, какую задачу должен решать инструмент."],
        ],
        ctaTitle: "Остались вопросы?",
        ctaText: "Напишите на support@webdiag.ru — мы ответим на любые вопросы по работе инструментов и сервиса.",
        ctaAction: "Написать на support@webdiag.ru",
      }
    : {
        eyebrow: "WebDiag Support",
        titleA: "Get in",
        titleB: "touch",
        lead: "We are always ready to help with website diagnostics, technical questions, or subscription options.",
        emailChannel: "Primary communication channel",
        copyEmail: "Copy email",
        copied: "Copied",
        formTitle: "Send us a message",
        formText: "Fill out the form and our team will get back to you within one business day.",
        name: "Your name",
        email: "Your email address",
        topic: "Topic",
        topicPlaceholder: "Select a topic",
        topics: [
          "Technical support and audit",
          "Pricing and plans",
          "Feature or tool suggestion",
          "Partnership inquiry",
          "Other inquiry",
        ],
        message: "Message",
        send: "Send message",
        sending: "Sending...",
        privacy: "By submitting this form, you agree to our Privacy Policy.",
        namePlaceholder: "Alex Smith",
        emailPlaceholder: "alex@example.com",
        messagePlaceholder: "Describe your question or task in detail...",
        successTitle: "Message sent!",
        successText: "Thank you for reaching out. We received your message and will reply shortly to your email address.",
        onlineTitle: "Support Details",
        onlineText: "Direct support contact and availability hours.",
        infoRows: [
          ["Direct email", SUPPORT_EMAIL, "24/7 inbox"],
          ["Response time", "Usually within 1 business day", "< 24h"],
          ["Working hours", "Mon — Fri, 10:00–19:00", "MSK"],
          ["Support languages", "Russian, English", "RU / EN"],
          ["Time zone", "Moscow (UTC+3)", "UTC+3"],
        ],
        faqTitle: "Frequently Asked Questions",
        faqText: "Quick answers to common questions about WebDiag support.",
        faq: [
          ["How quickly does support reply?", "We usually reply within a few hours during business hours and always within one business day."],
          ["What are the support hours?", "Inquiries are accepted 24/7 at support@webdiag.ru and processed Monday through Friday, 10:00 to 19:00 MSK."],
          ["Can I consult with the team before purchasing?", "Yes, feel free to send a message about plans and we will gladly guide you to the right solution."],
          ["Do you support invoices and commercial contracts?", "Yes, we support commercial accounts with full accounting documentation and contracts."],
          ["How can I suggest a new tool?", "Select the tool suggestion topic in the form and let us know what diagnostic job you need to solve."],
        ],
        ctaTitle: "Still have questions?",
        ctaText: "Reach out directly to support@webdiag.ru — we are here to help.",
        ctaAction: "Email support@webdiag.ru",
      };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setSubmitStatus("idle");
    setStatusMessage("");

    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, topic, message }),
      });

      const data = await response.json().catch(() => null);

      if (response.ok && data?.ok) {
        setSubmitStatus("success");
        setStatusMessage(t.successText);
        setName("");
        setEmail("");
        setTopic("");
        setMessage("");
      } else {
        setSubmitStatus("error");
        setStatusMessage(
          data?.error ||
            (ru
              ? "Не удалось отправить сообщение. Пожалуйста, напишите нам напрямую на support@webdiag.ru"
              : "Failed to send message. Please contact us directly at support@webdiag.ru")
        );
      }
    } catch {
      setSubmitStatus("error");
      setStatusMessage(
        ru
          ? "Ошибка соединения. Пожалуйста, отправьте письмо на support@webdiag.ru"
          : "Network error. Please email us directly at support@webdiag.ru"
      );
    } finally {
      setSubmitting(false);
    }
  }

  function handleCopyEmail() {
    navigator.clipboard.writeText(SUPPORT_EMAIL);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <main className="wd-contact-page">
      <section className="wd-contact-hero">
        <div className="shell wd-contact-hero-grid">
          <div className="wd-contact-hero-copy">
            <span className="wd-eyebrow">{t.eyebrow}</span>
            <h1>
              {t.titleA}
              <br />
              <span>{t.titleB}</span>
            </h1>
            <p className="wd-hero-subtitle">{t.lead}</p>
          </div>
          <div className="wd-contact-hero-art" aria-hidden="true">
            <img src="/design/hero/contacts.webp" alt="" width="900" height="900" loading="eager" decoding="async" />
          </div>
        </div>
      </section>

      <section className="wd-contact-content">
        <div className="shell">
          {/* Direct Support Header Banner */}
          <div className="wd-contact-direct-banner">
            <div className="wd-contact-direct-badge">
              <Mail aria-hidden="true" size={24} />
            </div>
            <div className="wd-contact-direct-copy">
              <span className="wd-contact-channel-tag">{t.emailChannel}</span>
              <a className="wd-contact-primary-email" href={`mailto:${SUPPORT_EMAIL}`}>
                {SUPPORT_EMAIL}
              </a>
            </div>
            <button
              type="button"
              className="wd-contact-copy-btn"
              onClick={handleCopyEmail}
              aria-label={t.copyEmail}
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              <span>{copied ? t.copied : t.copyEmail}</span>
            </button>
          </div>

          <div className="wd-contact-main-grid">
            <section className="wd-contact-form-panel" aria-labelledby="contact-form-title">
              <div className="wd-contact-form-copy">
                <h2 id="contact-form-title">{t.formTitle}</h2>
                <p>{t.formText}</p>
              </div>

              {submitStatus === "success" ? (
                <div className="wd-contact-alert is-success" role="alert">
                  <CheckCircle2 size={24} aria-hidden="true" />
                  <div>
                    <strong>{t.successTitle}</strong>
                    <p>{statusMessage}</p>
                    <button
                      type="button"
                      className="wd-button wd-button-secondary"
                      style={{ marginTop: "12px" }}
                      onClick={() => setSubmitStatus("idle")}
                    >
                      {ru ? "Отправить еще сообщение" : "Send another message"}
                    </button>
                  </div>
                </div>
              ) : (
                <form onSubmit={submit}>
                  {submitStatus === "error" && (
                    <div className="wd-contact-alert is-error" role="alert">
                      <AlertCircle size={20} aria-hidden="true" />
                      <span>{statusMessage}</span>
                    </div>
                  )}

                  <div className="wd-contact-fields">
                    <label>
                      <span>{t.name} *</span>
                      <input
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        placeholder={t.namePlaceholder}
                        required
                        disabled={submitting}
                      />
                    </label>
                    <label>
                      <span>{t.email} *</span>
                      <input
                        type="email"
                        value={email}
                        onChange={(event) => setEmail(event.target.value)}
                        placeholder={t.emailPlaceholder}
                        required
                        disabled={submitting}
                      />
                    </label>
                  </div>

                  <label>
                    <span>{t.topic} *</span>
                    <select
                      value={topic}
                      onChange={(event) => setTopic(event.target.value)}
                      required
                      disabled={submitting}
                    >
                      <option value="">{t.topicPlaceholder}</option>
                      {t.topics.map((item) => (
                        <option value={item} key={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>

                  <label className="wd-contact-message">
                    <span>{t.message} *</span>
                    <textarea
                      rows={5}
                      maxLength={4000}
                      value={message}
                      onChange={(event) => setMessage(event.target.value)}
                      placeholder={t.messagePlaceholder}
                      required
                      disabled={submitting}
                    />
                  </label>

                  <div className="wd-contact-form-actions">
                    <button type="submit" disabled={submitting}>
                      <Send aria-hidden="true" />
                      {submitting ? t.sending : t.send}
                      <ArrowRight aria-hidden="true" />
                    </button>
                    <small>{t.privacy}</small>
                  </div>
                </form>
              )}
            </section>

            <aside className="wd-contact-online-panel" aria-labelledby="contact-online-title">
              <h2 id="contact-online-title">{t.onlineTitle}</h2>
              <p>{t.onlineText}</p>
              <div>
                {t.infoRows.map(([title, text, badge], index) => {
                  const Icon = index === 0 ? Mail : index === 1 ? Clock3 : index === 2 ? Headphones : Globe2;
                  return (
                    <article key={title}>
                      <span>
                        <Icon aria-hidden="true" />
                      </span>
                      <div>
                        <strong>{title}</strong>
                        <small>{text}</small>
                      </div>
                      {badge && <b>{badge}</b>}
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>

          <div className="wd-contact-faq-full">
            <section className="wd-contact-faq" aria-labelledby="contact-faq-title">
              <header>
                <h2 id="contact-faq-title">{t.faqTitle}</h2>
                <p>{t.faqText}</p>
              </header>
              <div className="wd-contact-faq-list">
                {t.faq.map(([question, answer]) => (
                  <details key={question}>
                    <summary>
                      {question}
                      <ChevronDown aria-hidden="true" />
                    </summary>
                    <p>{answer}</p>
                  </details>
                ))}
              </div>
            </section>
          </div>
        </div>
      </section>

      <section className="wd-contact-support-cta" aria-labelledby="contact-support-cta-title">
        <div className="shell">
          <div>
            <h2 id="contact-support-cta-title">{t.ctaTitle}</h2>
            <p>{t.ctaText}</p>
          </div>
          <a href={`mailto:${SUPPORT_EMAIL}`}>
            <Mail aria-hidden="true" />
            {t.ctaAction}
            <ArrowRight aria-hidden="true" />
          </a>
        </div>
      </section>
    </main>
  );
}
