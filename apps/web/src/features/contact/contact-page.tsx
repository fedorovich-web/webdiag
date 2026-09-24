"use client";

import { FormEvent, useState } from "react";
import {
  ArrowRight,
  BarChart3,
  ChevronDown,
  Clock3,
  FileText,
  Globe2,
  Handshake,
  Headphones,
  Mail,
  Send,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

const SUPPORT_EMAIL = "support@webdiag.ru";

export function ContactPage({ locale }: { locale: Locale }) {
  const ru = locale === "ru";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState("");
  const [message, setMessage] = useState("");

  const t = ru
    ? {
        eyebrow: "Поддержка WebDiag",
        titleA: "Свяжитесь",
        titleB: "с нами",
        lead: "Мы всегда готовы помочь — ответим на вопросы, подскажем по инструментам и подберём решение под ваши задачи.",
        cards: [
          ["Техническая поддержка", "Поможем с настройкой, ответим на вопросы по работе сервиса и решим технические сложности.", SUPPORT_EMAIL],
          ["Вопросы по сервису", "Если нужно уточнить возможности WebDiag, тарифы или работу инструментов — напишите в поддержку.", SUPPORT_EMAIL],
          ["Идеи и обратная связь", "Присылайте предложения по новым инструментам, улучшениям и интеграциям.", SUPPORT_EMAIL],
        ],
        formTitle: "Напишите нам",
        formText: "Заполните форму, и мы ответим вам в ближайшее время.",
        name: "Ваше имя",
        email: "Email",
        topic: "Тема обращения",
        topicPlaceholder: "Выберите тему",
        topics: ["Техническая поддержка", "Вопрос по тарифам", "Сотрудничество", "Предложение инструмента", "Другое"],
        message: "Сообщение",
        send: "Отправить сообщение",
        privacy: "Нажимая кнопку, вы соглашаетесь с нашей Политикой конфиденциальности.",
        namePlaceholder: "Иван Петров",
        emailPlaceholder: "ivan@example.ru",
        messagePlaceholder: "Опишите ваш вопрос или задачу...",
        onlineTitle: "Мы на связи",
        onlineText: "Несколько полезных деталей о нашей работе.",
        infoRows: [
          ["Время ответа", "Обычно отвечаем в течение одного рабочего дня.", "до 1 дня"],
          ["Режим работы", "Пн — Пт, 10:00–19:00", "МСК"],
          ["Языки поддержки", "Русский, English", "RU / EN"],
          ["Часовой пояс", "Москва (UTC+3)", "UTC+3"],
          ["Другие способы связи", "Вы также можете написать нам через форму на сайте или в личном кабинете.", ""],
        ],
        officeTitle: "WebDiag онлайн",
        officeText: "WebDiag работает как онлайн-сервис — для связи используйте поддержку.",
        officeAddress: SUPPORT_EMAIL,
        officeDetail: "Основной канал связи с командой WebDiag",
        route: "Написать",
        faqTitle: "Часто задаваемые вопросы",
        faqText: "Короткие ответы на популярные вопросы.",
        faq: [
          ["Как быстро вы отвечаете на обращения?", "Обычно отвечаем в течение одного рабочего дня."],
          ["В каком режиме работает поддержка?", "Поддержка работает по будням с 10:00 до 19:00 по московскому времени."],
          ["Можно ли получить консультацию перед покупкой?", "Да. Напишите в отдел продаж — поможем выбрать подходящий вариант."],
          ["Вы работаете с юридическими лицами?", "Да, вопросы по документам и условиям можно направить в отдел продаж."],
          ["Можно ли заказать индивидуальное решение?", "Опишите задачу в форме или напишите нам — рассмотрим возможный формат."],
        ],
        ctaTitle: "Остались вопросы?",
        ctaText: "Напишите нам — мы поможем разобраться и подберём оптимальное решение для ваших задач.",
        ctaAction: "Написать нам",
      }
    : {
        eyebrow: "WebDiag support",
        titleA: "Get in",
        titleB: "touch",
        lead: "We are ready to help with product questions, tools, and choosing the right solution for your workflow.",
        cards: [
          ["Technical support", "Help with setup, product questions, and technical issues.", SUPPORT_EMAIL],
          ["Product questions", "Ask about WebDiag capabilities, plans, or how the tools work.", SUPPORT_EMAIL],
          ["Ideas and feedback", "Send suggestions for new tools, improvements, and integrations.", SUPPORT_EMAIL],
        ],
        formTitle: "Send us a message",
        formText: "Fill in the form and we will get back to you as soon as possible.",
        name: "Your name",
        email: "Email",
        topic: "Topic",
        topicPlaceholder: "Choose a topic",
        topics: ["Technical support", "Plans and pricing", "Partnership", "Tool suggestion", "Other"],
        message: "Message",
        send: "Send message",
        privacy: "By sending this message, you agree to our Privacy Policy.",
        namePlaceholder: "Alex Smith",
        emailPlaceholder: "alex@example.com",
        messagePlaceholder: "Describe your question or task...",
        onlineTitle: "We are available",
        onlineText: "A few useful details about our support.",
        infoRows: [
          ["Response time", "We usually reply within one business day.", "within 1 day"],
          ["Working hours", "Mon — Fri, 10:00–19:00", "MSK"],
          ["Support languages", "Russian, English", "RU / EN"],
          ["Time zone", "Moscow (UTC+3)", "UTC+3"],
          ["Other ways to contact us", "You can also use the website form or contact us from your account.", ""],
        ],
        officeTitle: "WebDiag online",
        officeText: "WebDiag is an online service. Use support to contact the team.",
        officeAddress: SUPPORT_EMAIL,
        officeDetail: "Primary contact channel for the WebDiag team",
        route: "Message us",
        faqTitle: "Frequently asked questions",
        faqText: "Short answers to common questions.",
        faq: [
          ["How quickly do you respond?", "We usually reply within one business day."],
          ["When is support available?", "Support is available on weekdays from 10:00 to 19:00 Moscow time."],
          ["Can I get advice before purchasing?", "Yes. Contact sales and we will help you choose the appropriate option."],
          ["Do you work with companies?", "Yes. Send billing and contract questions to the sales team."],
          ["Can I request a custom solution?", "Describe the task in the form and we will review possible options."],
        ],
        ctaTitle: "Still have questions?",
        ctaText: "Send us a message and we will help you find the right answer or product path.",
        ctaAction: "Message us",
      };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = topic.trim() || (ru ? "Сообщение с WebDiag" : "Message from WebDiag");
    const body = [
      ru ? `Имя: ${name || "—"}` : `Name: ${name || "—"}`,
      `Email: ${email || "—"}`,
      ru ? `Тема: ${topic || "—"}` : `Topic: ${topic || "—"}`,
      "",
      message,
    ].join("\n");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  const cardIcons = [Headphones, BarChart3, Handshake] as const;
  const infoIcons = [Clock3, Clock3, Globe2, Clock3, FileText] as const;

  return (
    <main className="wd-contact-page">
      <section className="wd-contact-hero">
        <div className="shell wd-contact-hero-grid">
          <div className="wd-contact-hero-copy">
            <span className="wd-eyebrow">{t.eyebrow}</span>
            <h1>{t.titleA}<br /><span>{t.titleB}</span></h1>
            <p>{t.lead}</p>
          </div>
          <div className="wd-contact-hero-art" aria-hidden="true">
            <img src={ru ? "/design/hero/contacts.webp" : "/design/icons/support.webp"} alt="" width="900" height="900" loading="eager" decoding="async" />
          </div>
        </div>
      </section>

      <section className="wd-contact-content">
        <div className="shell">
          <div className="wd-contact-cards">
            {t.cards.map(([title, text, address], index) => {
              const Icon = cardIcons[index] ?? Headphones;
              return (
                <article key={address}>
                  <span><Icon aria-hidden="true" /></span>
                  <div>
                    <h2>{title}</h2>
                    <p>{text}</p>
                    <a href={`mailto:${address}`}><Mail aria-hidden="true" />{address}</a>
                  </div>
                </article>
              );
            })}
          </div>

          <div className="wd-contact-main-grid">
            <section className="wd-contact-form-panel" aria-labelledby="contact-form-title">
              <div className="wd-contact-form-copy">
                <h2 id="contact-form-title">{t.formTitle}</h2>
                <p>{t.formText}</p>
              </div>
              <form onSubmit={submit}>
                <div className="wd-contact-fields">
                  <label><span>{t.name} *</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} required /></label>
                  <label><span>{t.email} *</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} required /></label>
                </div>
                <label><span>{t.topic} *</span>
                  <select value={topic} onChange={(event) => setTopic(event.target.value)} required>
                    <option value="">{t.topicPlaceholder}</option>
                    {t.topics.map((item) => <option value={item} key={item}>{item}</option>)}
                  </select>
                </label>
                <label className="wd-contact-message"><span>{t.message} *</span><textarea rows={6} maxLength={1000} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t.messagePlaceholder} required /></label>
                <div className="wd-contact-form-actions">
                  <button type="submit"><Send aria-hidden="true" />{t.send}<ArrowRight aria-hidden="true" /></button>
                  <small>{t.privacy}</small>
                </div>
              </form>
            </section>

            <aside className="wd-contact-online-panel" aria-labelledby="contact-online-title">
              <h2 id="contact-online-title">{t.onlineTitle}</h2>
              <p>{t.onlineText}</p>
              <div>
                {t.infoRows.map(([title, text, badge], index) => {
                  const Icon = infoIcons[index] ?? FileText;
                  return (
                    <article key={title}>
                      <span><Icon aria-hidden="true" /></span>
                      <div><strong>{title}</strong><small>{text}</small></div>
                      {badge && <b>{badge}</b>}
                    </article>
                  );
                })}
              </div>
            </aside>
          </div>

          <div className="wd-contact-bottom-grid">
            <section className="wd-contact-office" aria-labelledby="contact-office-title">
              <header><h2 id="contact-office-title">{t.officeTitle}</h2><p>{t.officeText}</p></header>
              <div className="wd-contact-map" aria-hidden="true"><span><Globe2 /></span><b>WebDiag</b></div>
              <div className="wd-contact-address">
                <span><Mail aria-hidden="true" /></span>
                <div><strong>{t.officeAddress}</strong><small>{t.officeDetail}</small></div>
                <a href={`mailto:${SUPPORT_EMAIL}`}>{t.route}<ArrowRight aria-hidden="true" /></a>
              </div>
            </section>

            <section className="wd-contact-faq" aria-labelledby="contact-faq-title">
              <header><h2 id="contact-faq-title">{t.faqTitle}</h2><p>{t.faqText}</p></header>
              <div>
                {t.faq.map(([question, answer]) => (
                  <details key={question}>
                    <summary>{question}<ChevronDown aria-hidden="true" /></summary>
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
          <a href={`mailto:${SUPPORT_EMAIL}`}><Mail aria-hidden="true" />{t.ctaAction}<ArrowRight aria-hidden="true" /></a>
        </div>
      </section>
    </main>
  );
}
