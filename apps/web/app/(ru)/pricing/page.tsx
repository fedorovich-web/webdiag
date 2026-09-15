import type { Metadata } from "next";
import Link from "next/link";
import { pageMetadata } from "../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "ru",
  title: "Тарифы WebDiag — инструменты и личный кабинет",
  description: "Условия доступа к инструментам и личному кабинету WebDiag. Учитывайте только стоимость, лимиты и условия, явно опубликованные в интерфейсе сервиса.",
  canonical: "/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return (
    <main className="shell page-main wd-internal-page">
      <header className="page-heading wd-internal-hero">
        <span className="eyebrow">WebDiag</span>
        <h1>Тарифы WebDiag</h1>
        <p>Выбирайте формат работы по задаче: быстрые публичные проверки или личный кабинет для проектов, сохранённой истории и повторной работы с результатами.</p>
      </header>
      <section className="wd-internal-grid wd-availability-grid" aria-label="Условия использования WebDiag">
        <article><h2>Публичные инструменты</h2><p>Подходят для точечных технических и SEO-проверок. Доступность конкретного инструмента всегда видна в каталоге.</p><Link className="wd-text-link" href="/tools">Все инструменты</Link></article>
        <article><h2>Личный кабинет</h2><p>Используйте аккаунт для проектов, сохранённых результатов, приоритетов, отчётов и повторных проверок.</p><Link className="wd-text-link" href="/register">Создать аккаунт</Link></article>
        <article><h2>Стоимость</h2><p>WebDiag не показывает неподтверждённые цены. Учитывайте только стоимость, которая явно указана на этой странице или непосредственно в интерфейсе сервиса.</p></article>
        <article><h2>Лимиты и условия</h2><p>Ориентируйтесь только на лимиты и условия, явно показанные рядом с соответствующей функцией WebDiag.</p></article>
      </section>
      <section className="wd-internal-note">
        <strong>Нужно начать с проверки сайта?</strong>
        <p>Откройте каталог и выберите конкретную техническую или SEO-проверку для своей задачи.</p>
        <Link className="wd-button wd-button-primary" href="/tools">Открыть инструменты</Link>
      </section>
    </main>
  );
}
