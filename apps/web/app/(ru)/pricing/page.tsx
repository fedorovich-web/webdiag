import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Доступность функций WebDiag",
  description: "Текущая доступность публичных инструментов, личного кабинета, AI-функций и оплаты.",
  canonical: "/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Доступность функций WebDiag</h1>
        <p>Здесь зафиксировано, что можно использовать сейчас, а что остаётся закрытым до завершения проверок готовности продукта.</p>
      </header>
      <section className="wd-internal-grid wd-availability-grid" aria-label="Текущая доступность">
        <article><h2>Публичные инструменты</h2><p>Доступны без подключения оплаты. Каталог показывает каждую рабочую проверку.</p></article>
        <article><h2>Личный кабинет</h2><p>Доступен после входа: проекты, сохранённые аудиты, приоритеты, отчёты и настройки.</p><Link className="wd-text-link" href="/register">Создать аккаунт</Link></article>
        <article><h2>AI-инструменты пока недоступны</h2><p>Публичные запуски закрыты до завершения проверок качества ответов на русском и английском, себестоимости, безопасности и хранения.</p></article>
        <article><h2>Оплата не подключена</h2><p>Платёжный контур, форма оплаты и подписки отсутствуют. WebDiag не может списать средства.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Цены не опубликованы</strong>
        <p>Тарифы можно публиковать только после подтверждения качества функций, лимитов, себестоимости и платёжного контура.</p>
        <Link className="wd-button wd-button-primary" href="/tools">Открыть инструменты</Link>
      </section>
    </main>
  );
}
