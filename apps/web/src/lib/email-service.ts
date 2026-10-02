import nodemailer from "nodemailer";

export interface ContactSubmission {
  name: string;
  email: string;
  topic: string;
  message: string;
}

export interface TransactionalEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
  from?: string;
}

/**
 * Sends a contact form message via Nevtan SMTP to support@webdiag.ru
 */
export async function sendContactEmailViaNevtan(data: ContactSubmission): Promise<{ success: boolean; error?: string }> {
  const host = process.env.NEVTAN_SMTP_HOST || process.env.SMTP_HOST || "smtp.nevtan.com";
  const port = Number(process.env.NEVTAN_SMTP_PORT || process.env.SMTP_PORT || "465");
  const secure = process.env.NEVTAN_SMTP_SECURE ? process.env.NEVTAN_SMTP_SECURE === "true" : port === 465;
  const user = process.env.NEVTAN_SMTP_USER || process.env.SMTP_USER || "support@webdiag.ru";
  const pass = process.env.NEVTAN_SMTP_PASS || process.env.SMTP_PASS;
  const recipient = process.env.SUPPORT_EMAIL || "support@webdiag.ru";

  if (!pass) {
    console.warn("[Nevtan SMTP] Password (NEVTAN_SMTP_PASS) is not configured. Feedback recorded in server logs.");
    console.info("[Feedback Log]", { from: data.email, name: data.name, topic: data.topic, message: data.message });
    // Return success in test / unconfigured mode so user feedback is not dropped
    return { success: true };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port,
      secure,
      auth: { user, pass },
      tls: {
        rejectUnauthorized: false,
      },
    });

    const mailOptions = {
      from: `"WebDiag Contact" <${user}>`,
      to: recipient,
      replyTo: `"${data.name}" <${data.email}>`,
      subject: `[Обратная связь WebDiag] ${data.topic || "Новое сообщение"} от ${data.name}`,
      text: [
        `Имя: ${data.name}`,
        `Email: ${data.email}`,
        `Тема: ${data.topic}`,
        "",
        "Сообщение:",
        data.message,
      ].join("\n"),
      html: `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e2e8f0; border-radius: 12px; background: #ffffff;">
          <div style="border-bottom: 2px solid #22d3ee; padding-bottom: 16px; margin-bottom: 20px;">
            <h2 style="margin: 0; color: #08133f; font-size: 20px;">Новое сообщение с формы обратной связи WebDiag</h2>
          </div>
          <table style="width: 100%; border-collapse: collapse; margin-bottom: 20px;">
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px; width: 120px;"><strong>Отправитель:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${escapeHtml(data.name)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Email:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px;"><a href="mailto:${escapeHtml(data.email)}" style="color: #0284c7;">${escapeHtml(data.email)}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #64748b; font-size: 14px;"><strong>Тема:</strong></td>
              <td style="padding: 8px 0; color: #0f172a; font-size: 14px;">${escapeHtml(data.topic)}</td>
            </tr>
          </table>
          <div style="background: #f8fafc; border-radius: 8px; padding: 16px; border: 1px solid #e2e8f0;">
            <h4 style="margin: 0 0 8px 0; color: #475569; font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em;">Текст сообщения:</h4>
            <div style="color: #1e293b; font-size: 15px; line-height: 1.6; white-space: pre-wrap;">${escapeHtml(data.message)}</div>
          </div>
          <p style="margin-top: 24px; color: #94a3b8; font-size: 12px; text-align: center;">WebDiag — Платформа технической диагностики и SEO-аудита сайтов</p>
        </div>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Nevtan SMTP error]", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends transactional email via Resend API from no-replay@webdiag.ru
 */
export async function sendTransactionalEmailViaResend(options: TransactionalEmailOptions): Promise<{ success: boolean; error?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = options.from || "WebDiag <no-replay@webdiag.ru>";

  if (!apiKey) {
    console.warn("[Resend] RESEND_API_KEY is not configured. Email logged to console instead.");
    console.info("[Resend Simulated Email]", { to: options.to, from, subject: options.subject });
    return { success: true };
  }

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [options.to],
        subject: options.subject,
        html: options.html,
        text: options.text,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Resend API Error]", response.status, errorText);
      return { success: false, error: `Resend error: ${response.status} ${errorText}` };
    }

    return { success: true };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    console.error("[Resend dispatch error]", errorMsg);
    return { success: false, error: errorMsg };
  }
}

/**
 * Sends a welcome email to a new user after successful registration
 */
export async function sendWelcomeEmail(email: string, locale: "ru" | "en" = "ru"): Promise<void> {
  const isRu = locale === "ru";
  const subject = isRu
    ? "Добро пожаловать в WebDiag — диагностика и SEO-аудит сайтов"
    : "Welcome to WebDiag — Website Diagnostics and SEO Audit";

  const html = `
    <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 32px 24px; border: 1px solid #e2e8f0; border-radius: 16px; background: #ffffff;">
      <div style="text-align: center; margin-bottom: 28px;">
        <h1 style="margin: 0; color: #08133f; font-size: 24px; font-weight: 800;">WebDiag</h1>
        <p style="margin: 6px 0 0 0; color: #0e9fba; font-size: 14px; font-weight: 600;">Fresh Mint Diagnostics & SEO</p>
      </div>

      <div style="background: linear-gradient(135deg, #f0fdf4 0%, #ecfeff 100%); border-radius: 12px; padding: 24px; margin-bottom: 24px; border: 1px solid #cffafe;">
        <h2 style="margin: 0 0 10px 0; color: #0f172a; font-size: 18px;">
          ${isRu ? "Рады приветствовать вас на платформе!" : "Welcome aboard!"}
        </h2>
        <p style="margin: 0; color: #475569; font-size: 14px; line-height: 1.6;">
          ${isRu
            ? "Ваш аккаунт WebDiag успешно зарегистрирован. Теперь вам доступны сохранение проектов, регулярный мониторинг, детальные отчёты и расширенный SEO-аудит."
            : "Your WebDiag account has been successfully created. You now have access to saved projects, scheduled monitoring, detailed reports, and advanced SEO audits."}
        </p>
      </div>

      <div style="margin-bottom: 28px;">
        <h3 style="color: #0f172a; font-size: 15px; margin-bottom: 12px;">
          ${isRu ? "Что вы можете сделать прямо сейчас:" : "What you can do right now:"}
        </h3>
        <ul style="margin: 0; padding-left: 20px; color: #334155; font-size: 14px; line-height: 1.8;">
          <li>${isRu ? "Запустить экспресс-проверку страницы любого сайта" : "Run a quick single-page audit for any website"}</li>
          <li>${isRu ? "Создать первый проект в личном кабинете для отслеживания динамики" : "Create your first project in the workspace to track health trends"}</li>
          <li>${isRu ? "Воспользоваться более чем 115 специализированными техническими инструментами" : "Explore over 115 specialized technical tools"}</li>
          <li>${isRu ? "Попробовать AI-помощника для составления плана исправлений" : "Use AI assistants to prioritize and plan fixes"}</li>
        </ul>
      </div>

      <div style="text-align: center; margin-bottom: 32px;">
        <a href="https://webdiag.ru/login" style="display: inline-block; background: linear-gradient(120deg, #34d399 0%, #22d3ee 52%, #60a5fa 100%); color: #06191b; font-weight: 700; text-decoration: none; padding: 14px 28px; border-radius: 999px; font-size: 15px; box-shadow: 0 8px 20px rgba(34, 211, 238, 0.25);">
          ${isRu ? "Войти в личный кабинет →" : "Sign in to Dashboard →"}
        </a>
      </div>

      <div style="border-top: 1px solid #f1f5f9; padding-top: 20px; text-align: center; color: #94a3b8; font-size: 12px; line-height: 1.6;">
        <p style="margin: 0 0 4px 0;">
          ${isRu ? "Это письмо отправлено автоматически с адреса no-replay@webdiag.ru" : "This is an automated email sent from no-replay@webdiag.ru"}
        </p>
        <p style="margin: 0;">
          ${isRu ? "Служба поддержки:" : "Support contact:"} <a href="mailto:support@webdiag.ru" style="color: #0ea5e9; text-decoration: none;">support@webdiag.ru</a>
        </p>
      </div>
    </div>
  `;

  await sendTransactionalEmailViaResend({
    to: email,
    subject,
    html,
  });
}

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}
