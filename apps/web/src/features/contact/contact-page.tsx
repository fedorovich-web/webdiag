"use client";

import { FormEvent, useState } from "react";
import { Clock3, Mail, MessageCircle, Send } from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";

const SUPPORT_EMAIL = "support@webdiag.ru";

export function ContactPage({ locale }: { locale: Locale }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  const t = locale === "ru"
    ? {
        eyebrow: "Поддержка WebDiag",
        title: "Свяжитесь с нами",
        lead: "Есть вопрос по WebDiag, нашли проблему или хотите предложить улучшение? Напишите нам — разберёмся и ответим по делу.",
        emailTitle: "Электронная почта",
        emailText: "Для вопросов по сервису, оплате и аккаунту.",
        responseTitle: "Время ответа",
        responseText: "Обычно отвечаем в течение одного рабочего дня.",
        feedbackTitle: "Идеи и обратная связь",
        feedbackText: "Присылайте предложения по новым инструментам и улучшениям.",
        formTitle: "Написать в поддержку",
        formText: "Заполните форму — письмо откроется в вашем почтовом приложении.",
        name: "Ваше имя",
        email: "Email для ответа",
        message: "Сообщение",
        send: "Отправить сообщение",
        namePlaceholder: "Как к вам обращаться",
        emailPlaceholder: "you@example.ru",
        messagePlaceholder: "Опишите вопрос или предложение...",
      }
    : {
        eyebrow: "WebDiag support",
        title: "Contact us",
        lead: "Have a question about WebDiag, found an issue, or want to suggest an improvement? Send us a message and we will get back to you.",
        emailTitle: "Email",
        emailText: "For product, billing, and account questions.",
        responseTitle: "Response time",
        responseText: "We usually reply within one business day.",
        feedbackTitle: "Ideas and feedback",
        feedbackText: "Send suggestions for new tools and product improvements.",
        formTitle: "Message support",
        formText: "Fill in the form and the message will open in your email app.",
        name: "Your name",
        email: "Reply email",
        message: "Message",
        send: "Send message",
        namePlaceholder: "How should we address you?",
        emailPlaceholder: "you@example.com",
        messagePlaceholder: "Describe your question or suggestion...",
      };

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const subject = locale === "ru" ? "Сообщение с WebDiag" : "Message from WebDiag";
    const body = [
      locale === "ru" ? `Имя: ${name || "—"}` : `Name: ${name || "—"}`,
      locale === "ru" ? `Email: ${email || "—"}` : `Email: ${email || "—"}`,
      "",
      message,
    ].join("\n");
    window.location.href = `mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  }

  return (
    <main className="wd-contact-page">
      <section className="wd-contact-hero">
        <div className="shell wd-contact-hero-grid">
          <div className="wd-contact-hero-copy">
            <span className="wd-eyebrow">{t.eyebrow}</span>
            <h1>{t.title}</h1>
            <p>{t.lead}</p>
            <a className="wd-contact-primary" href={`mailto:${SUPPORT_EMAIL}`}><Mail aria-hidden="true" />{SUPPORT_EMAIL}</a>
          </div>
          <div className="wd-contact-hero-art" aria-hidden="true">
            <img src={locale === "ru" ? "/design/hero/contacts.webp" : "/design/icons/support.webp"} alt="" width="900" height="900" loading="eager" decoding="async" />
          </div>
        </div>
      </section>

      <section className="wd-contact-content">
        <div className="shell">
          <div className="wd-contact-cards">
            <article><span><Mail aria-hidden="true" /></span><div><h2>{t.emailTitle}</h2><p>{t.emailText}</p><a href={`mailto:${SUPPORT_EMAIL}`}>{SUPPORT_EMAIL}</a></div></article>
            <article><span><Clock3 aria-hidden="true" /></span><div><h2>{t.responseTitle}</h2><p>{t.responseText}</p></div></article>
            <article><span><MessageCircle aria-hidden="true" /></span><div><h2>{t.feedbackTitle}</h2><p>{t.feedbackText}</p></div></article>
          </div>

          <section className="wd-contact-form-panel">
            <div className="wd-contact-form-copy"><span className="wd-eyebrow">{locale === "ru" ? "Обратная связь" : "Feedback"}</span><h2>{t.formTitle}</h2><p>{t.formText}</p></div>
            <form onSubmit={submit}>
              <div className="wd-contact-fields">
                <label><span>{t.name}</span><input value={name} onChange={(event) => setName(event.target.value)} placeholder={t.namePlaceholder} /></label>
                <label><span>{t.email}</span><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder={t.emailPlaceholder} /></label>
              </div>
              <label className="wd-contact-message"><span>{t.message}</span><textarea rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder={t.messagePlaceholder} required /></label>
              <button type="submit"><Send aria-hidden="true" />{t.send}<span aria-hidden="true">→</span></button>
            </form>
          </section>
        </div>
      </section>
    </main>
  );
}
