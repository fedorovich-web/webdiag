import {
  Activity,
  ArrowRight,
  Bot,
  Braces,
  FileText,
  Gauge,
  Image as ImageIcon,
  Link2,
  Map,
  MonitorCheck,
  Route,
  Search,
  SearchCheck,
  ShieldCheck,
} from "lucide-react";
import styles from "./page.module.css";

const tools = [
  [SearchCheck, "Проверка SEO", "Техническая проверка страницы с итоговой оценкой."],
  [Gauge, "Анализ скорости", "Core Web Vitals, Lighthouse и причины просадок."],
  [Bot, "Проверка robots.txt", "Правила обхода, доступность и Sitemap directives."],
  [Map, "Проверка sitemap.xml", "XML, доступность sitemap и наличие нужного URL."],
  [Route, "Проверка редиректов", "HTTP-статус, финальный адрес и цепочка переходов."],
  [FileText, "Проверка мета-тегов", "Title, description, robots, canonical, Open Graph."],
  [ShieldCheck, "Проверка HTTPS", "SSL-сертификат и параметры защищённого соединения."],
  [ImageIcon, "Проверка изображений", "Alt, размеры, lazy-loading и responsive-разметка."],
] as const;

const checks = [
  [Bot, "Файл robots.txt", "Доступность файла, Allow/Disallow и влияние на обход URL."],
  [Map, "Sitemap.xml", "Структура sitemap, доступность, URL и ошибки XML."],
  [Route, "Редиректы и статусы", "3xx/4xx/5xx, цепочки переходов и битые страницы."],
  [FileText, "Мета-теги и структура", "Title, description, H1–H6, robots и Open Graph."],
  [Gauge, "Скорость загрузки", "Core Web Vitals, Lighthouse и тяжёлые ресурсы."],
  [ShieldCheck, "HTTPS и безопасность", "SSL, mixed content и HTTP security headers."],
  [Link2, "Внутренние ссылки", "Битые ссылки, глубина и связь страниц внутри сайта."],
  [Activity, "Каноникализация", "Canonical, noindex и конфликтующие сигналы."],
  [MonitorCheck, "Доступность", "Alt, labels, контраст, ARIA и клавиатурная навигация."],
  [Braces, "Контент и дубли", "Повторы метаданных и конкурирующие сигналы."],
  [Search, "Индексирование", "Robots, noindex, canonical и доступность для поисковиков."],
  [ImageIcon, "Изображения", "Битые файлы, alt, размеры и responsive markup."],
] as const;

const cms = ["WordPress", "OpenCart", "1С-Битрикс", "Tilda", "Joomla", "MODX"];

export default function DesignPreviewPage() {
  return (
    <main className={styles.page}>
      <header className={styles.header}>
        <div className={styles.shell}>
          <div className={styles.headerInner}>
            <a className={styles.brand} href="#">
              <span className={styles.brandMark}><span /></span>
              <strong>WebDiag</strong>
            </a>
            <nav className={styles.nav}>
              <a href="#tools">Инструменты</a>
              <a href="#report">SEO-аудит</a>
              <a href="#pricing">Тарифы</a>
              <a href="#faq">Материалы</a>
            </nav>
            <div className={styles.headerActions}>
              <button aria-label="Поиск" className={styles.searchButton}><Search size={16} /></button>
              <a className={styles.login} href="#">Войти</a>
              <a className={styles.signup} href="#">Создать аккаунт <ArrowRight size={14} /></a>
            </div>
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div className={styles.shell}>
          <div className={styles.heroGrid}>
            <div className={styles.heroCopy}>
              <span className={styles.eyebrow}>Техническая диагностика сайта</span>
              <h1>Проверка сайта<br />на технические<br /><span>и SEO-ошибки</span></h1>
              <p>
                Проверьте страницу или весь сайт: мета-теги, robots.txt, sitemap.xml, редиректы,
                HTTPS, скорость и другие технические SEO-сигналы. WebDiag показывает найденные
                проблемы, затронутые URL и помогает понять, что исправлять в первую очередь.
              </p>
              <div className={styles.urlForm}>
                <span>https://example.ru</span>
                <button>Проверить сайт <ArrowRight size={15} /></button>
              </div>
              <small>Быстрая проверка URL без сложной настройки. Ниже — пример отчёта с приоритетами.</small>
              <div className={styles.heroBenefits}>
                <div><i>↯</i><b>140+ инструментов<br />для SEO и диагностики</b></div>
                <div><i>▥</i><b>Понятные отчёты<br />с приоритетами</b></div>
                <div><i>➜</i><b>Экономия времени<br />на рутинных проверках</b></div>
              </div>
            </div>

            <div className={styles.heroVisual}>
              <span className={styles.heroGlow} />
              <img src="/home/hero-dashboard.webp" alt="" />
              <span className={styles.noteTop}>Понятный отчёт<br />с приоритетами</span>
              <span className={styles.noteBottom}>Больше порядка<br />для вашего сайта</span>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.cmsStrip}>
        <div className={styles.shell}>
          <p>Работает с сайтами на популярных CMS и конструкторах</p>
          <div className={styles.cmsList}>
            {cms.map((name) => <span key={name}><i>{name.slice(0, 2)}</i>{name}</span>)}
            <small>и другие</small>
          </div>
        </div>
      </section>

      <section className={styles.section} id="tools">
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div><h2>Популярные инструменты</h2><p>Быстрые проверки для самых частых технических и SEO-задач.</p></div>
            <a href="#">Все 140+ инструментов <ArrowRight size={14} /></a>
          </div>
          <div className={styles.toolsGrid}>
            {tools.map(([Icon, title, description], index) => (
              <article className={styles.toolCard} key={title}>
                <span className={styles.icon} data-tone={index % 3}><Icon /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
                <ArrowRight className={styles.cardArrow} />
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.processSection}>
        <div className={styles.shell}>
          <div className={styles.processPanel}>
            <div className={styles.processHeading}><h2>Как проходит<br />проверка</h2><p>3 простых шага — от URL до готового отчёта</p></div>
            <div className={styles.processSteps}>
              <article><span>1</span><div><h3>Укажите URL</h3><p>Введите адрес страницы или всего сайта</p></div></article>
              <article><span>2</span><div><h3>Мы проверяем</h3><p>Анализируем более 100 параметров</p></div></article>
              <article><span>3</span><div><h3>Получите результат</h3><p>Список проблем, приоритеты и рекомендации</p></div></article>
            </div>
            <div className={styles.processArt}><span>↗</span></div>
            <div className={styles.processNote}>Просто.<br />Быстро.<br />Полезно.</div>
          </div>
        </div>
      </section>

      <section className={styles.checksSection}>
        <div className={styles.shell}>
          <div className={styles.sectionHead}>
            <div><h2>Что проверяет WebDiag</h2><p>Полный технический и SEO-аудит сайта.</p></div>
          </div>
          <div className={styles.checkGrid}>
            {checks.map(([Icon, title, description], index) => (
              <article className={styles.checkCard} key={title}>
                <span className={styles.icon} data-tone={index % 3}><Icon /></span>
                <div><h3>{title}</h3><p>{description}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.section} id="report">
        <div className={styles.shell}>
          <div className={styles.productGrid}>
            <div>
              <div className={styles.compactHead}><h2>Пример отчёта</h2><p>Понятные приоритеты, конкретные страницы и рекомендации.</p></div>
              <div className={styles.reportCard}>
                <div className={styles.tabs}><b>Проблемы 36</b><span>Страницы</span><span>Параметры</span><span>Сравнение</span></div>
                <div className={styles.reportBody}>
                  <div>
                    <div className={styles.tableHead}><span>Проблема</span><span>Страницы</span><span>Приоритет</span></div>
                    {[
                      ["critical","Отсутствует meta description","12","Критический"],
                      ["high","Битые ссылки","4","Высокий"],
                      ["medium","Слишком большие изображения","23","Средний"],
                      ["medium","Не настроен robots.txt","1","Средний"],
                      ["medium","Отсутствует canonical","8","Средний"],
                    ].map(([tone, title, count, priority]) => (
                      <div className={styles.issueRow} key={title}>
                        <strong><i data-tone={tone} />{title}</strong><b>{count}</b><span data-tone={tone}>{priority}</span>
                      </div>
                    ))}
                  </div>
                  <aside className={styles.recommendation}>
                    <strong>Отсутствует meta description</strong><small>12 страниц (4,8% страниц)</small>
                    <div><b>Рекомендация</b><p>Добавьте уникальные meta description для всех важных страниц сайта.</p></div>
                    <a href="#">Как исправить? →</a>
                  </aside>
                </div>
              </div>
              <a className={styles.belowLink} href="#">Смотреть полный пример отчёта →</a>
            </div>

            <div>
              <div className={styles.compactHead}><h2>Мониторинг изменений</h2><p>Следите за состоянием сайта в динамике.</p></div>
              <div className={styles.monitorCard}>
                <div className={styles.monitorTop}><strong>Динамика SEO-здоровья</strong><span><b>78</b><small>+12%</small></span></div>
                <div className={styles.chart}>
                  <svg viewBox="0 0 500 160" preserveAspectRatio="none" aria-hidden="true">
                    <defs><linearGradient id="previewArea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#2dd4bf" stopOpacity=".24"/><stop offset="1" stopColor="#2dd4bf" stopOpacity="0"/></linearGradient></defs>
                    <path d="M0,121 C45,108 80,113 122,102 C165,90 203,94 246,79 C290,64 328,68 371,52 C415,35 455,39 500,20 L500,160 L0,160 Z" fill="url(#previewArea)" />
                    <path d="M0,121 C45,108 80,113 122,102 C165,90 203,94 246,79 C290,64 328,68 371,52 C415,35 455,39 500,20" fill="none" stroke="#20c7bd" strokeWidth="4" strokeLinecap="round" />
                  </svg>
                </div>
                <div className={styles.metrics}><div><strong>142</strong><span>Проверено страниц</span></div><div><strong>36</strong><span>Найдено проблем</span></div><div><strong>28</strong><span>Исправлено</span></div></div>
              </div>
              <a className={styles.belowLink} href="#">Настроить мониторинг →</a>
            </div>
          </div>
        </div>
      </section>

      <section className={styles.faqSection} id="faq">
        <div className={styles.shell}>
          <div className={styles.faqGrid}>
            <div className={styles.faqIntro}>
              <span className={styles.eyebrow}>FAQ</span>
              <h2>Часто задаваемые вопросы</h2>
              <p>Короткие ответы на популярные вопросы о проверках, аудите проекта и мониторинге.</p>
              <div className={styles.supportBadge}><span>?</span> Не нашли ответ? support@webdiag.ru</div>
            </div>
            <div className={styles.faqList}>
              {[
                "Нужна ли регистрация для проверки?",
                "Что именно проверяет WebDiag?",
                "Чем быстрая проверка отличается от аудита проекта?",
                "Показывает ли отчёт затронутые URL?",
                "Можно ли перепроверить сайт после исправлений?",
              ].map((question) => <div className={styles.faqItem} key={question}><strong>{question}</strong><span>+</span></div>)}
            </div>
          </div>
        </div>
      </section>

      <section className={styles.finalCta}>
        <div className={styles.shell}>
          <div className={styles.finalGrid}>
            <div><h2>Проверьте свой сайт прямо сейчас</h2><p>Введите URL и получите техническую проверку страницы. Для регулярного контроля добавьте сайт в личный кабинет и подключите мониторинг.</p></div>
            <div className={styles.finalForm}><span>https://example.ru</span><button>Проверить сайт <ArrowRight size={14} /></button></div>
          </div>
        </div>
      </section>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerGrid}>
            <div><a className={styles.brand} href="#"><span className={styles.brandMark}><span /></span><strong>WebDiag</strong></a><p>Инструменты для диагностики и SEO-аудита сайтов.</p></div>
            <div><b>Продукт</b><a>Все инструменты</a><a>SEO-аудит</a><a>Тарифы</a><a>Мониторинг</a></div>
            <div><b>Материалы</b><a>Руководства</a></div>
            <div><b>Компания</b><a>О проекте</a><a>Политика конфиденциальности</a></div>
            <div><b>Мы в сети</b><a>support@webdiag.ru</a></div>
          </div>
          <div className={styles.footerBottom}><span>© 2026 WebDiag. Все права защищены.</span><span>WebDiag</span></div>
        </div>
      </footer>
    </main>
  );
}
