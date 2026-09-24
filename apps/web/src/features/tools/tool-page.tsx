import Link from "next/link";
import { notFound } from "next/navigation";
import { Check, ChevronRight } from "lucide-react";
import { getCategoryTitle, getPublicTool, localize, type Locale } from "@webdiag/tool-registry";
import { getToolPageContent, localizeContent } from "../../content/tool-pages";
import { toolsPath } from "../../lib/routes";
import { ToolRenderer } from "./tool-renderer";
import { getToolPageChromeCopy } from "./tool-page-copy";

const categoryArtwork: Readonly<Record<string, string>> = {
  "seo-audit": "/design/icons/seo-audit.webp",
  performance: "/design/icons/performance.webp",
  "security-network": "/design/icons/security.webp",
  "css-design": "/design/icons/issues.webp",
  "media-utilities": "/design/icons/images.webp",
  "development-data": "/design/icons/analytics.webp",
};

function toolArtwork(slug: string, category: string, locale: Locale): string {
  if (slug === "robots-txt-tester") return "/design/hero/tool-robots.webp";
  return categoryArtwork[category] ?? "/design/icons/seo-audit.webp";
}

export function ToolPage({ locale, slug }: { locale: Locale; slug: string }) {
  const tool = getPublicTool(slug);
  const content = getToolPageContent(slug);
  if (!tool || !content) notFound();

  const prefix = locale === "ru" ? "" : "/en";
  const category = getCategoryTitle(tool.category, locale);
  const related = content.relatedToolSlugs.map((relatedSlug) => getPublicTool(relatedSlug)).filter(Boolean);
  const t = <T extends { readonly ru: string; readonly en: string }>(value: T) => localizeContent(value, locale);
  const text = getToolPageChromeCopy(locale, tool.executorClass);
  const art = toolArtwork(slug, tool.category, locale);

  return (
    <main className="wd-tool-page">
      <section className="wd-tool-hero">
        <div className="shell">
          <nav className="wd-tool-breadcrumbs" aria-label={locale === "ru" ? "Хлебные крошки" : "Breadcrumbs"}>
            <Link href={prefix || "/"} prefetch={false}>{text.home}</Link>
            <ChevronRight aria-hidden="true" />
            <Link href={toolsPath(locale)} prefetch={false}>{text.tools}</Link>
            <ChevronRight aria-hidden="true" />
            <span aria-current="page">{t(content.h1)}</span>
          </nav>

          <div className="wd-tool-hero-grid">
            <div className="wd-tool-hero-copy">
              <div className="wd-tool-badges">
                <span>{category}</span>
                <span className="wd-tool-status"><i aria-hidden="true" />{text.local}</span>
              </div>
              <h1>{t(content.h1)}</h1>
              <p>{t(content.lead)}</p>
              <ul className="wd-tool-quick-facts">
                {content.quickFacts.map((fact) => (
                  <li key={fact.en}><Check aria-hidden="true" />{t(fact)}</li>
                ))}
              </ul>
            </div>

            <div className="wd-tool-hero-art" aria-hidden="true" data-specific={slug === "robots-txt-tester" ? "true" : "false"}>
              <img src={art} alt="" width={900} height={900} loading="lazy" decoding="async" />
            </div>
          </div>
        </div>
      </section>

      <section className="wd-tool-workspace-section" aria-labelledby="workspace-title">
        <div className="shell">
          <div className="wd-tool-workspace-head">
            <div>
              <span className="wd-eyebrow">{locale === "ru" ? "Онлайн-инструмент" : "Online tool"}</span>
              <h2 id="workspace-title">{text.workspace}</h2>
            </div>
            <p>{text.note}</p>
          </div>

          <div className="wd-tool-workspace tool-workspace">
            <ToolRenderer slug={slug} locale={locale} />
          </div>

          <div className="wd-tool-processing processing-note" aria-labelledby="processing-title">
            <span className="wd-tool-processing-icon" aria-hidden="true"><Check /></span>
            <div>
              <h2 id="processing-title">{text.processing}</h2>
              <p>{text.processingText}</p>
            </div>
            <small>{text.reviewed}: {content.lastReviewedAt}</small>
          </div>
        </div>
      </section>

      <section className="wd-tool-content-section">
        <div className="shell wd-tool-editorial-layout tool-editorial-layout">
          <article className="wd-tool-editorial-main tool-editorial-main">
            <section aria-labelledby="how-title">
              <span className="wd-tool-section-number">01</span>
              <h2 id="how-title">{text.how}</h2>
              <ol className="wd-tool-instructions">
                {content.howToSteps.map((step, index) => (
                  <li key={step.en}><span>{index + 1}</span><p>{t(step)}</p></li>
                ))}
              </ol>
            </section>

            <section aria-labelledby="supports-title">
              <span className="wd-tool-section-number">02</span>
              <h2 id="supports-title">{text.supports}</h2>
              <ul className="wd-tool-feature-list">
                {content.supportedFeatures.map((item) => (
                  <li key={item.en}><Check aria-hidden="true" /><span>{t(item)}</span></li>
                ))}
              </ul>
            </section>

            <section aria-labelledby="use-cases-title">
              <span className="wd-tool-section-number">03</span>
              <h2 id="use-cases-title">{text.useCases}</h2>
              <ul className="wd-tool-use-cases use-case-grid">
                {content.useCases.map((item) => <li key={item.en}>{t(item)}</li>)}
              </ul>
            </section>

            <section aria-labelledby="technical-title">
              <span className="wd-tool-section-number">04</span>
              <h2 id="technical-title">{text.technical}</h2>
              <div className="wd-tool-technical-notes">
                {content.technicalNotes.map((item) => <p key={item.en}>{t(item)}</p>)}
              </div>
            </section>

            <section aria-labelledby="faq-tool-title">
              <span className="wd-tool-section-number">05</span>
              <h2 id="faq-tool-title">{text.faq}</h2>
              <div className="wd-tool-faq">
                {content.faq.map((item, index) => (
                  <details key={item.question.en} open={index === 0}>
                    <summary>{t(item.question)}<span aria-hidden="true">+</span></summary>
                    <p>{t(item.answer)}</p>
                  </details>
                ))}
              </div>
            </section>
          </article>

          <aside className="wd-tool-editorial-aside">
            <section className="wd-tool-aside-card limitations-card">
              <h2>{text.limitations}</h2>
              <ul>{content.limitations.map((item) => <li key={item.en}>{t(item)}</li>)}</ul>
            </section>

            {related.length > 0 && (
              <section className="wd-tool-aside-card wd-tool-related related-tools-card">
                <h2>{text.related}</h2>
                <div>
                  {related.map((candidate) => candidate ? (
                    <Link href={`${prefix}/tools/${candidate.slug}`} prefetch={false} key={candidate.slug}>
                      <span>
                        <strong>{localize(candidate.title, locale)}</strong>
                        <small>{getCategoryTitle(candidate.category, locale)}</small>
                      </span>
                      <ChevronRight aria-hidden="true" />
                    </Link>
                  ) : null)}
                </div>
                <Link className="wd-tool-all-link" href={toolsPath(locale)} prefetch={false}>{text.allTools}<span aria-hidden="true">→</span></Link>
              </section>
            )}
          </aside>
        </div>
      </section>
    </main>
  );
}
