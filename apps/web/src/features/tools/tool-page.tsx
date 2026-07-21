import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategoryTitle, getPublicTool, localize, type Locale } from "@webdiag/tool-registry";
import { getToolPageContent, localizeContent } from "../../content/tool-pages";
import { toolsPath } from "../../lib/routes";
import { ToolRenderer } from "./tool-renderer";

export function ToolPage({ locale, slug }: { locale: Locale; slug: string }) {
  const tool = getPublicTool(slug);
  const content = getToolPageContent(slug);
  if (!tool || !content) notFound();

  const prefix = locale === "ru" ? "" : "/en";
  const category = getCategoryTitle(tool.category, locale);
  const related = content.relatedToolSlugs.map((relatedSlug) => getPublicTool(relatedSlug)).filter(Boolean);
  const t = <T extends { readonly ru: string; readonly en: string }>(value: T) => localizeContent(value, locale);
  const isServerBackedTool = tool.executorClass === "safe_fetch";
  const text = locale === "ru"
    ? {
        home: "Главная",
        tools: "Инструменты",
        local: isServerBackedTool ? "Проверяется через WebDiag API" : "Работает в браузере",
        workspace: "Попробуйте инструмент",
        note: isServerBackedTool ? "Введите URL: WebDiag безопасно выполнит сетевую проверку и покажет результат." : "Добавьте данные, выберите нужные параметры и получите готовый результат.",
        processing: isServerBackedTool ? "Сетевая проверка через backend" : "Ваши данные остаются здесь",
        processingText: isServerBackedTool ? "Для HTTP/SEO-инструментов URL отправляется в WebDiag API, где применяются SSRF-защита, DNS/IP policy и лимиты редиректов." : "Текст и выбранные файлы обрабатываются в текущем браузере и не отправляются на сервер для получения результата.",
        how: "Как пользоваться",
        supports: "Что умеет инструмент",
        limitations: "Что важно учитывать",
        useCases: "Когда пригодится",
        technical: "Что происходит внутри",
        faq: "Вопросы и ответы",
        related: "Связанные инструменты",
        allTools: "Все инструменты",
        reviewed: "Проверено",
      }
    : {
        home: "Home",
        tools: "Tools",
        local: isServerBackedTool ? "Checked through WebDiag API" : "Runs in your browser",
        workspace: "Try the tool",
        note: isServerBackedTool ? "Enter a URL: WebDiag will run a safe network check and show the result." : "Add your data, choose the settings, and get the result.",
        processing: isServerBackedTool ? "Network check through backend" : "Your data stays here",
        processingText: isServerBackedTool ? "For HTTP/SEO tools, the URL is sent to the WebDiag API, where SSRF protection, DNS/IP policy, and redirect limits are applied." : "Text and selected files are processed in the current browser and are not sent to a server to produce the result.",
        how: "How to use it",
        supports: "What the tool can do",
        limitations: "What to keep in mind",
        useCases: "Common use cases",
        technical: "How it works inside",
        faq: "Questions and answers",
        related: "Related tools",
        allTools: "All tools",
        reviewed: "Reviewed",
      };

  return (
    <main className="shell page-main tool-page-main">
      <nav className="breadcrumbs" aria-label={locale === "ru" ? "Хлебные крошки" : "Breadcrumbs"}>
        <Link href={prefix || "/"}>{text.home}</Link><span aria-hidden="true">/</span>
        <Link href={toolsPath(locale)}>{text.tools}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{t(content.h1)}</span>
      </nav>

      <header className="tool-heading">
        <div className="heading-badges"><span>{category}</span><span className="local-badge"><i aria-hidden="true" />{text.local}</span></div>
        <h1>{t(content.h1)}</h1>
        <p>{t(content.lead)}</p>
        <ul className="tool-quick-facts">{content.quickFacts.map((fact) => <li key={fact.en}>{t(fact)}</li>)}</ul>
      </header>

      <section className="tool-workspace" aria-labelledby="workspace-title">
        <div className="workspace-heading"><div><span className="eyebrow">WebDiag</span><h2 id="workspace-title">{text.workspace}</h2></div><p>{text.note}</p></div>
        <ToolRenderer slug={slug} locale={locale} />
      </section>

      <section className="processing-note" aria-labelledby="processing-title">
        <span className="processing-icon" aria-hidden="true">⌁</span>
        <div><h2 id="processing-title">{text.processing}</h2><p>{text.processingText}</p></div>
        <small>{text.reviewed}: {content.lastReviewedAt}</small>
      </section>

      <div className="tool-editorial-layout">
        <article className="tool-editorial-main">
          <section aria-labelledby="how-title"><span className="editorial-kicker">01</span><h2 id="how-title">{text.how}</h2><ol className="instruction-list">{content.howToSteps.map((step) => <li key={step.en}>{t(step)}</li>)}</ol></section>
          <section aria-labelledby="supports-title"><span className="editorial-kicker">02</span><h2 id="supports-title">{text.supports}</h2><ul className="feature-list">{content.supportedFeatures.map((item) => <li key={item.en}><span aria-hidden="true">✓</span>{t(item)}</li>)}</ul></section>
          <section aria-labelledby="use-cases-title"><span className="editorial-kicker">03</span><h2 id="use-cases-title">{text.useCases}</h2><ul className="use-case-grid">{content.useCases.map((item) => <li key={item.en}>{t(item)}</li>)}</ul></section>
          <section aria-labelledby="technical-title"><span className="editorial-kicker">04</span><h2 id="technical-title">{text.technical}</h2><div className="technical-notes">{content.technicalNotes.map((item) => <p key={item.en}>{t(item)}</p>)}</div></section>
          <section aria-labelledby="faq-tool-title"><span className="editorial-kicker">05</span><h2 id="faq-tool-title">{text.faq}</h2><div className="faq-list tool-faq">{content.faq.map((item, index) => <details key={item.question.en} open={index === 0}><summary>{t(item.question)}<span aria-hidden="true">+</span></summary><p>{t(item.answer)}</p></details>)}</div></section>
        </article>

        <aside className="tool-editorial-aside">
          <section className="limitations-card"><h2>{text.limitations}</h2><ul>{content.limitations.map((item) => <li key={item.en}>{t(item)}</li>)}</ul></section>
          {related.length > 0 && <section className="related-tools-card"><h2>{text.related}</h2><div>{related.map((candidate) => candidate ? <Link href={`${prefix}/tools/${candidate.slug}`} key={candidate.slug}><span><strong>{localize(candidate.title, locale)}</strong><small>{getCategoryTitle(candidate.category, locale)}</small></span><span aria-hidden="true">→</span></Link> : null)}</div><Link className="text-link" href={toolsPath(locale)}>{text.allTools}<span aria-hidden="true">→</span></Link></section>}
        </aside>
      </div>
    </main>
  );
}
