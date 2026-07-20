import Link from "next/link";
import {
  Bot,
  Braces,
  CheckCheck,
  CheckCircle2,
  CircleAlert,
  ClipboardCheck,
  Code2,
  CopyCheck,
  FileText,
  Files,
  Flag,
  Gauge,
  Image as ImageIcon,
  Keyboard,
  ListFilter,
  Map,
  Network,
  Radar,
  RefreshCw,
  Route,
  ScanSearch,
  SearchCheck,
  ShieldCheck,
  Sparkles,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import type { Locale } from "@webdiag/tool-registry";
import { toolsPath } from "../../lib/routes";
import { HomeFaqAccordion } from "./home-faq-accordion";
import { HomeMonitoringChart } from "./home-monitoring-chart";
import { HomeReportTabs } from "./home-report-tabs";
import { HomeUrlCheckForm } from "./home-url-check-form";

interface IconCard {
  readonly icon: LucideIcon;
  readonly title: string;
  readonly description: string;
  readonly meta?: string;
  readonly href?: string;
}

const content = {
  ru: {
    heroEyebrow: "Технический SEO-аудит",
    heroTitle: "Найдите ошибки сайта до потери SEO-трафика",
    heroText: "WebDiag показывает будущий сценарий технического SEO-аудита: от проверки URL до отчёта с приоритетами, затронутыми страницами и рекомендациями. Сейчас рабочими являются отдельные инструменты и пример интерфейса отчёта.",
    heroPrimary: "Проверить сайт",
    heroSecondary: "Открыть пример отчёта",
    trust: ["URL-проверка", "Структура отчёта", "Приоритеты исправлений", "Рабочие инструменты"],
    heroIssues: [
      ["Критично", "robots.txt закрывает важные URL", "12 URL", "red"],
      ["Предупр.", "Description отсутствует на посадочных", "14 URL", "amber"],
      ["Предупр.", "LCP выше нормы", "9 шабл.", "amber"],
      ["Настроено", "SSL, sitemap и canonical настроены", "OK", "cyan"],
    ] as const,
    scenarioEyebrow: "Сценарии проверки",
    scenarioTitle: "Проверьте URL, запустите аудит или подключите контроль",
    scenarioText: "Сценарии разделены по задаче: бесплатная первичная проверка, разовые инструменты, полный технический аудит и регулярный мониторинг сайта.",
    scenarios: [
      { icon: SearchCheck, title: "Проверить бесплатно", description: "Быстрая диагностика одного URL: индексируемость, мета-теги, редиректы, скорость и SSL без обхода всего сайта.", meta: "Для первичной проверки посадочной, статьи, карточки товара или страницы услуги.", action: "Проверить URL", href: "/tools?category=seo-audit" },
      { icon: Gauge, title: "Запустить разовую проверку", description: "Точечные проверки отдельных сигналов из отчёта: sitemap, битые ссылки, изображения, HTML, JSON и технические данные.", meta: "Для быстрых задач после аудита, релиза или правок на странице.", action: "Открыть инструменты", href: "/tools" },
      { icon: ScanSearch, title: "Провести полный аудит", description: "Проверка сайта как системы: sitemap, внутренние ссылки, повторяющиеся ошибки, дубли, битые страницы и технические риски.", meta: "Для SEO-аудита, миграции, редизайна и проверки работы подрядчика.", action: "Провести аудит", href: "/audit" },
      { icon: Radar, title: "Подключить мониторинг", description: "Регулярный контроль после релизов: доступность, SSL, SEO-изменения, новые ошибки и возврат уже исправленных проблем.", meta: "Для проектов, где важно не пропустить регрессии и технические сбои.", action: "Подключить мониторинг", href: "/monitoring" },
    ],
    coverageEyebrow: "Полный аудит",
    coverageTitle: "Проверяем не отдельные метрики, а цепочку технических сигналов",
    coverageText: "Одна ошибка часто тянет за собой другую: закрытый URL не индексируется, дубли теряют релевантность, тяжёлый шаблон ухудшает скорость и поведение.",
    coverageBullets: ["где найдена проблема", "какие URL затронуты", "что исправлять первым"],
    coverage: [
      { icon: Bot, title: "Обход и индексация", meta: "robots.txt · sitemap · noindex", description: "Показываем, какие страницы доступны поисковым роботам и где сайт теряет важные URL." },
      { icon: Route, title: "Статусы и редиректы", meta: "3xx · 4xx · 5xx · chains", description: "Находим битые ссылки, лишние цепочки и недоступные страницы." },
      { icon: FileText, title: "Мета-теги и структура", meta: "title · description · H1–H6", description: "Показываем дубли, пустые значения и страницы с неясной структурой." },
      { icon: CopyCheck, title: "Контент и дубли", meta: "повторы · thin content", description: "Ищем страницы, которые конкурируют между собой или дают слишком мало полезной информации." },
      { icon: Network, title: "Внутренние ссылки", meta: "depth · nofollow · orphan", description: "Показываем глубину клика, важные страницы без ссылок и потерянную навигационную логику." },
      { icon: Gauge, title: "Производительность", meta: "LCP · CLS · TTFB", description: "Находим тяжёлые ресурсы и причины медленной загрузки ключевых шаблонов." },
      { icon: ShieldCheck, title: "Безопасность", meta: "SSL · HSTS · CSP", description: "Проверяем базовые сигналы доверия и технической защиты сайта." },
      { icon: Keyboard, title: "Доступность", meta: "alt · labels · ARIA · focus", description: "Проверяем читаемость, формы, навигацию с клавиатуры и семантику интерфейса." },
      { icon: Braces, title: "Разметка и сниппеты", meta: "Schema.org · JSON-LD · OG", description: "Проверяем структурированные данные и корректное превью страницы." },
      { icon: Sparkles, title: "AI / GEO / контент", meta: "FAQ · сущности · краткие ответы", description: "Оцениваем структуру контента как дополнительный слой, не заменяющий ручную SEO-работу." },
    ] as readonly IconCard[],
    reportEyebrow: "Пример отчёта",
    reportTitle: "Отчёт, который можно сразу передать специалисту или команде",
    reportText: "Ниже показан демонстрационный интерфейс будущего отчёта: оценка сайта, приоритеты, затронутые URL, рекомендации и проверки, которые уже настроены правильно.",
    priorityEyebrow: "Приоритеты",
    priorityTitle: "Не все ошибки одинаково важны",
    priorityText: "WebDiag разделяет проблемы по влиянию на индексацию, скорость, безопасность, доверие и пользовательский опыт.",
    priorities: [
      { icon: TriangleAlert, title: "Критично", description: "Ошибки, которые могут блокировать индексацию, ломать важные страницы или доступ к сайту.", chips: ["robots.txt", "5xx", "SSL"] },
      { icon: CircleAlert, title: "Предупреждения", description: "Проблемы, которые ухудшают SEO, сниппеты, скорость или качество страницы.", chips: ["description", "дубли title", "LCP"] },
      { icon: Sparkles, title: "Улучшения", description: "Задачи, которые усиливают сайт после устранения критичных проблем.", chips: ["alt", "Open Graph", "Schema.org"] },
      { icon: CheckCheck, title: "Что хорошо", description: "Проверки, которые сайт уже проходит и которые не требуют вмешательства.", chips: ["sitemap", "canonical", "HTTP"] },
    ],
    processEyebrow: "Процесс",
    processTitle: "Как WebDiag превращает проверку в план работ",
    processText: "Пользователь видит не набор случайных метрик, а последовательность: какие страницы проверены, что сломано, насколько это важно и что делать после исправлений.",
    process: [
      { icon: ScanSearch, title: "Запуск проверки", description: "Введите URL или sitemap: WebDiag показывает, какие страницы попадут в анализ и где начинается цепочка проблем." },
      { icon: Gauge, title: "Технические сигналы", description: "Статусы, индексация, мета-теги, скорость, безопасность и доступность собираются в один понятный контекст." },
      { icon: ListFilter, title: "Приоритеты и URL", description: "Проблемы группируются по влиянию, а каждая ошибка связывается с конкретными затронутыми страницами." },
      { icon: RefreshCw, title: "Повторная проверка", description: "После правок можно вернуться к тому же сигналу, сравнить состояние и контролировать регрессии." },
    ] as readonly IconCard[],
    monitoringEyebrow: "Мониторинг",
    monitoringTitle: "Мониторинг запланирован как следующий слой после рабочего аудита",
    monitoringText: "Сайт может сломаться после релиза, обновления CMS, правок шаблона или изменения настроек. Сейчас блок показывает целевую механику мониторинга, а не готовую систему уведомлений.",
    monitoringBullets: ["повторные проверки по расписанию", "новые ошибки и исправленные проблемы", "уведомления о критичных изменениях", "история технического состояния"],
    monitoringAction: "Как работает мониторинг",
    toolsEyebrow: "Инструменты",
    toolsTitle: "Инструменты помогают проверить конкретную проблему из отчёта",
    toolsText: "Они не заменяют полный аудит. Сейчас это рабочая часть продукта: точечные проверки отдельных сигналов до запуска полноценного audit engine.",
    toolCategories: [
      { icon: SearchCheck, title: "SEO и аудит сайта", description: "Проверки для страниц из отчёта: мета-теги, robots.txt, sitemap, canonical, hreflang, статусы и редиректы. Помогает быстро перепроверить базовые SEO-сигналы после правок без повторного полного аудита.", action: "SEO-инструменты", href: `${toolsPath("ru")}?category=seo-audit` },
      { icon: Gauge, title: "Производительность", description: "Проверка скорости, Core Web Vitals, веса ресурсов, изображений, скриптов и загрузки. Подходит для повторной диагностики медленных шаблонов, тяжёлых страниц и просадок после релизов.", action: "Проверить скорость", href: `${toolsPath("ru")}?category=performance` },
      { icon: ShieldCheck, title: "Безопасность и сеть", description: "Проверки SSL, HTTP-заголовков, DNS, CORS и mixed content. Нужны для контроля базовых сигналов доверия, сетевых ошибок и технических причин недоступности страниц.", action: "Проверить сеть", href: `${toolsPath("ru")}?category=security-network` },
      { icon: Keyboard, title: "Доступность", description: "Проверки контраста, alt-текстов, labels, ARIA, keyboard focus и читаемости интерфейса. Помогает находить ошибки, которые мешают пользователям, формам и сканированию контента.", action: "Проверить доступность", href: `${toolsPath("ru")}?category=css-design` },
      { icon: Braces, title: "Разметка и сниппеты", description: "Проверка Schema.org, JSON-LD, FAQ, Open Graph и Twitter Cards. Используется, чтобы не публиковать страницы с битой разметкой, пустыми сущностями или некорректными сниппетами.", action: "Проверить разметку", href: `${toolsPath("ru")}?category=development-data` },
      { icon: ImageIcon, title: "Изображения и медиа", description: "Проверка размеров, форматов, веса, alt-текстов и базовой оптимизации файлов. Помогает найти тяжёлые изображения и медиа, которые замедляют шаблоны и посадочные страницы.", action: "Оптимизировать медиа", href: `${toolsPath("ru")}?category=media-utilities` },
      { icon: Code2, title: "Разработка и данные", description: "Рабочие dev-инструменты для JSON, Base64, hash, UUID, timestamp и URL encoding. Ускоряют ручную проверку данных из отчёта.", action: "Dev-инструменты", href: `${toolsPath("ru")}?category=development-data` },
      { icon: Sparkles, title: "AI / GEO / контент", description: "Инструменты для мета-тегов, FAQ, структуры текста и коротких ответов. Это вспомогательный слой, а не замена SEO-стратегии и редактуре.", action: "Контент-инструменты", href: `${toolsPath("ru")}?category=ai-geo-content` },
    ] as const,
    mapperTitle: "От найденной ошибки — к точечной проверке",
    mapperText: "После исправления инструмент помогает повторно проверить отдельный сигнал.",
    toolMappings: [
      ["Проблема с sitemap.xml", "доступность карты сайта и URL внутри файла", "json-formatter-validator"],
      ["Цепочка редиректов", "маршрут переходов и финальный URL", "url-encoder-decoder"],
      ["Ошибка JSON-LD", "структура разметки перед публикацией", "json-formatter-validator"],
      ["Тяжёлые изображения", "вес страницы и загрузка", "image-optimizer"],
    ] as const,
    aiEyebrow: "AI / GEO",
    aiTitle: "AI ускоряет подготовку правок, но не заменяет эксперта",
    aiText: "AI-помощники полезны после диагностики: помогают быстрее оформить черновики meta-тегов, FAQ, schema.org, alt-текстов и коротких пояснений для SEO или разработки.",
    aiNote: "Решение остаётся за специалистом: WebDiag не заменяет SEO-стратегию, ручную проверку и работу с контентом.",
    aiCards: [
      { icon: FileText, title: "Мета-теги", description: "Черновики title и description по задаче страницы, чтобы быстрее подготовить правки после аудита." },
      { icon: Braces, title: "FAQ и Schema.org", description: "Структура вопросов, ответов и JSON-LD для страниц, где нужна понятная разметка без битых сущностей." },
      { icon: Sparkles, title: "AI / GEO", description: "Краткие ответы, сущности и структура текста для ручной доработки контента специалистом." },
      { icon: ClipboardCheck, title: "ТЗ для команды", description: "Короткое объяснение технической ошибки, затронутого сигнала и следующего шага для SEO или разработки." },
    ] as readonly IconCard[],
    pricingEyebrow: "Цены",
    pricingTitle: "Платите за нужный объём проверки",
    pricingText: "Базовые проверки остаются бесплатными. Полный аудит, расширенные лимиты и мониторинг оплачиваются отдельно: перед запуском WebDiag показывает стоимость и лимиты проверки.",
    pricing: [
      { icon: SearchCheck, title: "Бесплатно", pricePrefix: "", priceValue: "0", priceCurrency: "₽", priceSuffix: "", status: "Старт без оплаты", description: "Для первичной диагностики одного URL и знакомства с интерфейсом отчёта без оплаты.", items: ["Экспресс-проверка 1 URL", "Мета-теги, индексация, редиректы и SSL", "Базовые инструменты без истории проекта"], action: "Проверить бесплатно", href: "/tools?category=seo-audit" },
      { icon: Gauge, title: "Разовые проверки", pricePrefix: "от", priceValue: "99", priceCurrency: "₽", priceSuffix: "", status: "Проверка по запросу", description: "Для точечных задач: sitemap, битые ссылки, изображения, HTML validation и отдельные технические сигналы.", items: ["Sitemap до 5 000 URL — от 99 ₽", "Битые ссылки или изображения — от 149 ₽", "AI-черновики для правок — от 9 ₽"], action: "Запустить проверку", href: "/tools" },
      { icon: ScanSearch, title: "Полный аудит сайта", pricePrefix: "от", priceValue: "490", priceCurrency: "₽", priceSuffix: "", status: "Отчёт по сайту", description: "Для технического SEO-аудита сайта целиком с приоритетами, затронутыми URL и повторной проверкой исправлений.", items: ["До 100 страниц — от 490 ₽", "До 500 страниц — от 990 ₽", "До 2 000 страниц — от 1 990 ₽"], action: "Провести аудит", href: "/audit" },
      { icon: Radar, title: "Мониторинг", pricePrefix: "от", priceValue: "299", priceCurrency: "₽", priceSuffix: "/мес", status: "Контроль изменений", description: "Для регулярного контроля после релизов, миграций и SEO-правок, чтобы не пропускать новые ошибки и регрессии.", items: ["1 проект, проверка раз в неделю — от 299 ₽/мес", "Ежедневный контроль — от 990 ₽/мес", "Агентский формат — от 7 990 ₽/мес"], action: "Подключить мониторинг", href: "/monitoring" },
    ],
    pricingNote: "Цены предварительные и будут уточняться по фактической себестоимости audit engine, лимитам страниц и частоте проверок.",
    knowledgeEyebrow: "Контент",
    knowledgeTitle: "Блог и база знаний для технического SEO",
    knowledgeText: "Практические материалы об индексации, скорости, безопасности, доступности и структурированных данных.",
    knowledge: [
      { icon: FileText, title: "Блог", description: "Практические статьи о техническом SEO, разработке и поисковой видимости.", action: "Читать блог" },
      { icon: Map, title: "Руководства", description: "Пошаговые материалы по аудиту, sitemap, редиректам и индексации.", action: "Открыть руководства" },
      { icon: Braces, title: "Глоссарий", description: "Понятные определения SEO- и web-терминов.", action: "Открыть глоссарий" },
      { icon: ClipboardCheck, title: "Методология", description: "Как работает аудит, где границы автоматической проверки и когда нужна ручная работа.", action: "Как работает аудит" },
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Ответы о проверке сайта",
    faq: [
      ["Что даёт технический аудит сайта?", "Он показывает проблемы, которые мешают индексации, скорости, безопасности и нормальной работе страниц: от robots.txt и редиректов до дублей, мета-тегов, статусов ответа и структурированных данных."],
      ["Чем экспресс-проверка отличается от полного аудита?", "Экспресс-проверка подходит для одного URL. Полный аудит проходит по sitemap и внутренним ссылкам, группирует повторяющиеся ошибки и показывает, какие шаблоны или разделы сайта требуют исправления."],
      ["Будут ли видны конкретные URL с ошибками?", "Да. В рабочем отчёте каждая проблема должна быть связана со списком затронутых страниц, чтобы SEO-специалист, разработчик или владелец сайта понимал, где именно править."],
      ["Как WebDiag помогает расставлять приоритеты?", "Ошибки разделяются по влиянию на индексацию, доступность, скорость, безопасность, сниппеты и пользовательский опыт. Сначала идут проблемы, которые могут блокировать трафик или ломать важные страницы."],
      ["Зачем нужны отдельные инструменты, если есть аудит?", "Аудит показывает состояние сайта целиком, а инструменты помогают быстро перепроверить один сигнал после исправления: JSON-LD, URL, изображения, мета-данные или другой конкретный элемент."],
      ["Заменяет ли WebDiag SEO-специалиста?", "Нет. WebDiag ускоряет техническую диагностику и подготовку плана работ, но стратегия продвижения, семантика, контент и финальная экспертная оценка остаются за специалистом."],
    ] as const,
    finalEyebrow: "Начало работы",
    finalTitle: "Начните с примера отчёта и точечных инструментов",
    finalText: "Пока audit engine в разработке, можно оценить структуру отчёта и использовать готовые инструменты для проверки отдельных сигналов.",
  },
  en: {
    heroEyebrow: "Technical SEO audit",
    heroTitle: "Find site issues before they cost organic traffic",
    heroText: "WebDiag shows the target technical SEO audit flow: from a URL check to a prioritized report with affected pages and recommendations. Today, the working product surface is the tool catalog and sample report interface.",
    heroPrimary: "Check website",
    heroSecondary: "Open sample report",
    trust: ["URL check", "Report structure", "Fix priorities", "Working tools"],
    heroIssues: [
      ["Critical", "robots.txt blocks important URLs", "12 URLs", "red"],
      ["Warning", "Landing pages miss descriptions", "14 URLs", "amber"],
      ["Warning", "LCP is high on key templates", "9 templates", "amber"],
      ["Configured", "SSL, sitemap, and canonical checks pass", "OK", "cyan"],
    ] as const,
    scenarioEyebrow: "Audit modes",
    scenarioTitle: "Check a URL, run an audit, or connect monitoring",
    scenarioText: "The flows are separated by task: free first check, one-off tools, full technical audit, and ongoing site monitoring.",
    scenarios: [
      { icon: SearchCheck, title: "Check for free", description: "A quick diagnosis of one URL: indexing, metadata, redirects, performance, and SSL without crawling the full site.", meta: "For a landing page, article, product page, or service page.", action: "Check a URL", href: "/en/tools?category=seo-audit" },
      { icon: Gauge, title: "Run a one-off check", description: "Focused checks for report signals: sitemap, broken links, images, HTML, JSON, and technical data.", meta: "For quick tasks after an audit, release, or page-level fix.", action: "Open tools", href: "/en/tools" },
      { icon: ScanSearch, title: "Run a full audit", description: "A system-level check: sitemap, internal links, repeated issues, duplicates, broken pages, and technical risks.", meta: "For SEO audits, migrations, redesigns, and contractor reviews.", action: "Run an audit", href: "/en/audit" },
      { icon: Radar, title: "Enable monitoring", description: "Ongoing control after releases: availability, SSL, SEO changes, new issues, and recurring regressions.", meta: "For projects where regressions and technical failures cannot be missed.", action: "Enable monitoring", href: "/en/monitoring" },
    ],
    coverageEyebrow: "Full audit",
    coverageTitle: "Audit connected technical signals, not isolated metrics",
    coverageText: "One issue often causes another: a blocked URL is not indexed, duplicates weaken relevance, and a heavy template hurts performance.",
    coverageBullets: ["where the issue appears", "which URLs are affected", "what to fix first"],
    coverage: [
      { icon: Bot, title: "Crawling and indexing", meta: "robots.txt · sitemap · noindex", description: "See which pages search crawlers can access and where important URLs are lost." },
      { icon: Route, title: "Statuses and redirects", meta: "3xx · 4xx · 5xx · chains", description: "Find broken links, redirect chains, and unavailable pages." },
      { icon: FileText, title: "Metadata and structure", meta: "title · description · H1–H6", description: "Find duplicates, empty values, and unclear page structures." },
      { icon: CopyCheck, title: "Content and duplicates", meta: "repeats · thin content", description: "Find pages that compete with each other or offer too little information." },
      { icon: Network, title: "Internal linking", meta: "depth · nofollow · orphan", description: "See click depth, orphan pages, and broken navigation logic." },
      { icon: Gauge, title: "Performance", meta: "LCP · CLS · TTFB", description: "Identify heavy assets and slow templates." },
      { icon: ShieldCheck, title: "Security", meta: "SSL · HSTS · CSP", description: "Check baseline trust and security signals." },
      { icon: Keyboard, title: "Accessibility", meta: "alt · labels · ARIA · focus", description: "Check readability, forms, keyboard navigation, and interface semantics." },
      { icon: Braces, title: "Structured data", meta: "Schema.org · JSON-LD · OG", description: "Check machine-readable markup and social previews." },
      { icon: Sparkles, title: "AI / GEO / content", meta: "FAQ · entities · concise answers", description: "Review content structure as a supporting layer, not a replacement for manual SEO work." },
    ] as readonly IconCard[],
    reportEyebrow: "Sample report",
    reportTitle: "A report that can go straight to a specialist or team",
    reportText: "This is a demo of the future report interface: site score, priorities, affected URLs, recommendations, and checks that already pass.",
    priorityEyebrow: "Priorities",
    priorityTitle: "Not every issue has the same impact",
    priorityText: "WebDiag groups findings by their effect on indexing, performance, security, trust, and user experience.",
    priorities: [
      { icon: TriangleAlert, title: "Critical", description: "Issues that may block indexing, break key pages, or stop access to the site.", chips: ["robots.txt", "5xx", "SSL"] },
      { icon: CircleAlert, title: "Warnings", description: "Issues that weaken SEO, snippets, performance, or page quality.", chips: ["description", "title duplicates", "LCP"] },
      { icon: Sparkles, title: "Improvements", description: "Tasks that strengthen the site after critical issues are fixed.", chips: ["alt", "Open Graph", "Schema.org"] },
      { icon: CheckCheck, title: "Already good", description: "Checks the site already passes and that need no intervention.", chips: ["sitemap", "canonical", "HTTP"] },
    ],
    processEyebrow: "Process",
    processTitle: "How WebDiag turns a check into a work plan",
    processText: "The interface is designed to show a sequence, not a pile of metrics: checked pages, detected issues, impact level, affected URLs, and the next validation step.",
    process: [
      { icon: ScanSearch, title: "Finds pages", description: "Checks URL, sitemap, and internal links." },
      { icon: Gauge, title: "Collects signals", description: "Analyzes indexing, statuses, metadata, performance, and security." },
      { icon: ListFilter, title: "Sets priorities", description: "Shows which issues to fix first." },
      { icon: RefreshCw, title: "Verifies fixes", description: "Run the audit again and compare the result." },
    ] as readonly IconCard[],
    monitoringEyebrow: "Monitoring",
    monitoringTitle: "Monitoring is planned as the layer after the working audit",
    monitoringText: "A release, CMS update, template edit, or configuration change can break a site. This block shows the target monitoring mechanics, not a live alerting system yet.",
    monitoringBullets: ["scheduled repeat checks", "new and resolved issues", "critical change alerts", "technical health history"],
    monitoringAction: "How monitoring works",
    toolsEyebrow: "Tools",
    toolsTitle: "Tools verify a specific issue from the report",
    toolsText: "They do not replace a full audit. This is the working part of the product today: focused checks for individual signals before the full audit engine ships.",
    toolCategories: [
      { icon: SearchCheck, title: "SEO and site audit", description: "Checks for report pages: metadata, robots.txt, sitemap, canonical, hreflang, and redirects. Useful for quick re-checks after technical fixes.", action: "SEO tools", href: `${toolsPath("en")}?category=seo-audit` },
      { icon: Gauge, title: "Performance", description: "Performance checks for Core Web Vitals, resource weight, images, and loading. Useful for slow templates and heavy pages.", action: "Check speed", href: `${toolsPath("en")}?category=performance` },
      { icon: ShieldCheck, title: "Security and network", description: "Checks for SSL, HTTP headers, DNS, CORS, and mixed content. Helps verify baseline trust and network signals.", action: "Check network", href: `${toolsPath("en")}?category=security-network` },
      { icon: Keyboard, title: "Accessibility", description: "Checks for contrast, alt text, labels, ARIA, and keyboard focus. Helps catch interface issues that affect users and crawlers.", action: "Check accessibility", href: `${toolsPath("en")}?category=css-design` },
      { icon: Braces, title: "Markup and snippets", description: "Checks Schema.org, JSON-LD, FAQ, Open Graph, and Twitter Cards before publishing pages with incomplete markup.", action: "Check markup", href: `${toolsPath("en")}?category=development-data` },
      { icon: ImageIcon, title: "Images and media", description: "Checks dimensions, formats, file weight, and basic optimization. Useful for finding heavy images before re-checking a page.", action: "Optimize media", href: `${toolsPath("en")}?category=media-utilities` },
      { icon: Code2, title: "Development and data", description: "Developer utilities for JSON, Base64, hash, UUID, timestamp, and URL encoding. Useful for manual verification of report data.", action: "Dev tools", href: `${toolsPath("en")}?category=development-data` },
      { icon: Sparkles, title: "AI / GEO / content", description: "Helpers for metadata, FAQ, content structure, and concise answers. This is a supporting layer, not a replacement for SEO strategy.", action: "Content tools", href: `${toolsPath("en")}?category=ai-geo-content` },
    ] as const,
    mapperTitle: "From a detected issue to a focused recheck",
    mapperText: "After a fix, use a tool to verify the individual signal again.",
    toolMappings: [
      ["Sitemap.xml issue", "map availability and listed URLs", "json-formatter-validator"],
      ["Redirect chain", "redirect route and final URL", "url-encoder-decoder"],
      ["JSON-LD error", "markup structure before release", "json-formatter-validator"],
      ["Heavy images", "page weight and loading", "image-optimizer"],
    ] as const,
    aiEyebrow: "AI / GEO",
    aiTitle: "AI speeds up fix preparation",
    aiText: "AI helpers reduce routine work around metadata drafts, FAQ, schema, alt text, and concise explanations for the team.",
    aiNote: "The specialist remains responsible: WebDiag does not replace SEO strategy, manual review, or content work.",
    aiCards: [
      { icon: FileText, title: "Metadata", description: "Draft title and description for a specific page." },
      { icon: Braces, title: "FAQ and Schema.org", description: "Structure for rich results and clear answers." },
      { icon: Sparkles, title: "AI / GEO", description: "Concise answers, entities, and readable content structure." },
      { icon: ClipboardCheck, title: "Team brief", description: "A concise issue explanation and next step for SEO or engineering." },
    ] as readonly IconCard[],
    pricingEyebrow: "Pricing",
    pricingTitle: "Pay for the audit volume you need",
    pricingText: "Basic checks stay free. Full audits, higher limits, and monitoring are paid separately: WebDiag shows the cost and limits before starting a paid check.",
    pricing: [
      { icon: SearchCheck, title: "Free", pricePrefix: "", priceValue: "0", priceCurrency: "₽", priceSuffix: "", status: "Free start", description: "For an initial diagnosis of one URL and a quick look at the report interface without payment.", items: ["1 express URL check", "Metadata, indexing, redirects, and SSL", "Basic tools without project history"], action: "Check for free", href: "/en/tools?category=seo-audit" },
      { icon: Gauge, title: "One-off checks", pricePrefix: "from", priceValue: "99", priceCurrency: "₽", priceSuffix: "", status: "On-demand check", description: "For focused tasks: sitemap, broken links, images, HTML validation, and individual technical signals.", items: ["Sitemap up to 5,000 URLs — from 99 ₽", "Broken links or images — from 149 ₽", "AI drafts for fixes — from 9 ₽"], action: "Run a check", href: "/en/tools" },
      { icon: ScanSearch, title: "Full site audit", pricePrefix: "from", priceValue: "490", priceCurrency: "₽", priceSuffix: "", status: "Site report", description: "For a full technical SEO audit with priorities, affected URLs, and re-checks after fixes.", items: ["Up to 100 pages — from 490 ₽", "Up to 500 pages — from 990 ₽", "Up to 2,000 pages — from 1,990 ₽"], action: "Run an audit", href: "/en/audit" },
      { icon: Radar, title: "Monitoring", pricePrefix: "from", priceValue: "299", priceCurrency: "₽", priceSuffix: "/mo", status: "Change monitoring", description: "For ongoing control after releases, migrations, and SEO changes, so new issues and regressions are not missed.", items: ["1 project, weekly checks — from 299 ₽/mo", "Daily control — from 990 ₽/mo", "Agency format — from 7,990 ₽/mo"], action: "Enable monitoring", href: "/en/monitoring" },
    ],
    pricingNote: "Prices are preliminary and will be adjusted after the audit engine cost, page limits, and check frequency are validated.",
    knowledgeEyebrow: "Content",
    knowledgeTitle: "Technical SEO blog and knowledge base",
    knowledgeText: "Practical materials about indexing, performance, security, accessibility, and structured data.",
    knowledge: [
      { icon: FileText, title: "Blog", description: "Practical articles about technical SEO, engineering, and search visibility.", action: "Read blog" },
      { icon: Map, title: "Guides", description: "Step-by-step material for audits, sitemap, redirects, and indexing.", action: "Open guides" },
      { icon: Braces, title: "Glossary", description: "Clear definitions of SEO and web terms.", action: "Open glossary" },
      { icon: ClipboardCheck, title: "Methodology", description: "How the audit works, its limits, and when manual review is needed.", action: "How the audit works" },
    ],
    faqEyebrow: "FAQ",
    faqTitle: "Questions about site auditing",
    faq: [
      ["What does a technical site audit show?", "It surfaces issues that affect indexing, performance, security, and page reliability: robots.txt, redirects, duplicate metadata, response statuses, structured data, and template-level problems."],
      ["How is a quick check different from a full audit?", "A quick check is for one URL. A full audit crawls sitemap and internal links, groups repeated issues, and shows which templates or site sections need work."],
      ["Will the report show affected URLs?", "Yes. The report model connects every issue with affected pages so an SEO specialist, developer, or site owner can see where the fix is needed."],
      ["How does WebDiag prioritize issues?", "Issues are ranked by impact on indexing, availability, speed, security, snippets, and user experience. Problems that can block traffic or break key pages are shown first."],
      ["Why keep tools if there is a full audit?", "The audit gives the whole-site picture. Tools are for quick re-checks of one signal after a fix: JSON-LD, URLs, images, metadata, or another isolated item."],
      ["Does WebDiag replace an SEO specialist?", "No. WebDiag speeds up technical diagnostics and planning, but search strategy, keyword research, content, and final expert judgment still require a specialist."],
    ] as const,
    finalEyebrow: "Get started",
    finalTitle: "Start with the sample report and focused tools",
    finalText: "Live audit launch will follow the audit engine. For now, review the report structure and open the ready tools.",
  },
} as const;

function IconBox({ icon: Icon }: { icon: LucideIcon }) {
  return <span className="wd-icon-box"><Icon aria-hidden="true" /></span>;
}

export function HomePage({ locale }: { locale: Locale }) {
  const t = content[locale];
  const toolsHref = toolsPath(locale);

  return (
    <main className="wd-home">
      <section className="wd-hero" aria-labelledby="home-title">
        <div className="shell wd-hero-grid">
          <div className="wd-hero-copy">
            <span className="wd-eyebrow">{t.heroEyebrow}</span>
            <h1 id="home-title">{t.heroTitle}</h1>
            <p>{t.heroText}</p>
            <HomeUrlCheckForm locale={locale} />
            <div className="wd-trust-pills" aria-label={locale === "ru" ? "Возможности WebDiag" : "WebDiag capabilities"}>
              {t.trust.map((item, index) => {
                const icons = [SearchCheck, Map, Flag, Radar] as const;
                const Icon = icons[index] ?? SearchCheck;
                return <span key={item}><Icon aria-hidden="true" />{item}</span>;
              })}
            </div>
          </div>

          <div className="wd-hero-report" aria-label={locale === "ru" ? "Пример технического отчёта" : "Technical report preview"}>
            <header><span>site.ru · {locale === "ru" ? "технический аудит" : "technical audit"}</span></header>
            <div className="wd-hero-report-body">
              <div className="wd-hero-summary">
                <article className="wd-hero-score"><div className="wd-score-ring"><div className="wd-score-value"><strong>82</strong><span>/100</span></div></div><div><strong>{locale === "ru" ? "Состояние сайта" : "Site health"}</strong><span>{locale === "ru" ? "есть критичные ошибки" : "critical issues found"}</span></div></article>
                <div className="wd-hero-metrics">
                  <article><Files /><strong>128</strong><span>{locale === "ru" ? "страниц" : "pages"}</span></article>
                  <article><TriangleAlert /><strong>7</strong><span>{locale === "ru" ? "критично" : "critical"}</span></article>
                  <article><CircleAlert /><strong>24</strong><span>{locale === "ru" ? "предупр." : "warnings"}</span></article>
                  <article><CheckCircle2 /><strong>66</strong><span>{locale === "ru" ? "пройдено" : "passed"}</span></article>
                </div>
              </div>
              <div className="wd-hero-issues">
                {t.heroIssues.map(([label, issue, count, tone]) => <div key={issue}><span className={`wd-status-pill is-${tone}`}>{label}</span><strong>{issue}</strong><b>{count}</b></div>)}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="wd-section" id="audit">
        <div className="shell">
          <div className="wd-section-intro"><span className="wd-eyebrow">{t.scenarioEyebrow}</span><h2>{t.scenarioTitle}</h2><p>{t.scenarioText}</p></div>
          <div className="wd-scenario-grid">
            {t.scenarios.map(({ icon, title, description, meta, action, href }, index) => <article className={index === 1 ? "is-featured" : ""} key={title}><IconBox icon={icon} /><h3>{title}</h3><p>{description}</p><div className="wd-card-meta"><strong>{locale === "ru" ? "Подходит для" : "Best for"}</strong>{meta}</div><Link className="wd-card-link" href={href}>{action}<span aria-hidden="true">→</span></Link></article>)}
          </div>
        </div>
      </section>

      <section className="wd-section wd-section-soft">
        <div className="shell wd-coverage-layout">
          <aside className="wd-sticky-intro"><span className="wd-eyebrow">{t.coverageEyebrow}</span><h2>{t.coverageTitle}</h2><p>{t.coverageText}</p><ul>{t.coverageBullets.map((item) => <li key={item}><CheckCircle2 />{item}</li>)}</ul></aside>
          <div className="wd-coverage-grid">{t.coverage.map(({ icon, title, meta, description }) => <article key={title}><IconBox icon={icon} /><div><h3>{title}</h3><span>{meta}</span><p>{description}</p></div></article>)}</div>
        </div>
      </section>

      <section className="wd-section" id="report">
        <div className="shell">
          <div className="wd-section-intro"><span className="wd-eyebrow">{t.reportEyebrow}</span><h2>{t.reportTitle}</h2><p>{t.reportText}</p></div>
          <HomeReportTabs locale={locale} />
        </div>
      </section>

      <section className="wd-section wd-section-soft">
        <div className="shell"><div className="wd-section-intro is-centered"><span className="wd-eyebrow">{t.priorityEyebrow}</span><h2>{t.priorityTitle}</h2><p>{t.priorityText}</p></div><div className="wd-priority-grid">{t.priorities.map(({ icon, title, description, chips }, index) => <article className={`tone-${index + 1}`} key={title}><IconBox icon={icon} /><h3>{title}</h3><p>{description}</p><div>{chips.map((chip) => <span key={chip}>{chip}</span>)}</div></article>)}</div></div>
      </section>

      <section className="wd-section">
        <div className="shell">
          <div className="wd-section-intro wd-section-intro-wide"><span className="wd-eyebrow">{t.processEyebrow}</span><h2>{t.processTitle}</h2><p>{t.processText}</p></div>
          <div className="wd-process-flow">{t.process.map(({ icon, title, description }) => <article key={title}><IconBox icon={icon} /><h3>{title}</h3><p>{description}</p></article>)}</div>
        </div>
      </section>

      <section className="wd-section wd-section-soft" id="monitoring">
        <div className="shell wd-monitoring-layout"><div className="wd-section-intro"><span className="wd-eyebrow">{t.monitoringEyebrow}</span><h2>{t.monitoringTitle}</h2><p>{t.monitoringText}</p><ul className="wd-check-list">{t.monitoringBullets.map((item) => <li key={item}><CheckCircle2 />{item}</li>)}</ul><Link className="wd-button wd-button-primary" href={locale === "ru" ? "/monitoring" : "/en/monitoring"}>{t.monitoringAction}</Link></div><div className="wd-monitoring-dashboard" id="monitoring-dashboard"><header><span>Monitoring · site.ru</span><b><i />{locale === "ru" ? "сайт доступен" : "site online"}</b></header><div className="wd-monitoring-body"><div className="wd-monitoring-metrics"><article><strong>3</strong><span>{locale === "ru" ? "новые ошибки" : "new issues"}</span></article><article><strong>12</strong><span>{locale === "ru" ? "исправлено" : "resolved"}</span></article><article><strong>1</strong><span>{locale === "ru" ? "регрессия" : "regression"}</span></article><article><strong>18д</strong><span>SSL</span></article></div><div className="wd-monitoring-chart"><header><span>{locale === "ru" ? "Динамика проверок" : "Check trend"}</span><span>7 days</span></header><HomeMonitoringChart locale={locale} /></div><div className="wd-monitoring-timeline"><div><strong>{locale === "ru" ? "Сегодня" : "Today"}</strong><span>{locale === "ru" ? "изменился title на 4 страницах" : "title changed on 4 pages"}</span></div><div><strong>{locale === "ru" ? "Вчера" : "Yesterday"}</strong><span>{locale === "ru" ? "исправлено 8 alt-ошибок" : "8 alt issues resolved"}</span></div><div><strong>{locale === "ru" ? "3 дня назад" : "3 days ago"}</strong><span>{locale === "ru" ? "найдена цепочка редиректов" : "redirect chain detected"}</span></div></div></div></div></div>
      </section>

      <section className="wd-section" id="tools">
        <div className="shell">
          <div className="wd-section-headline"><div className="wd-section-intro"><span className="wd-eyebrow">{t.toolsEyebrow}</span><h2>{t.toolsTitle}</h2><p>{t.toolsText}</p></div></div>
          <div className="wd-tools-action-row"><Link className="wd-section-link" href={toolsHref}>{locale === "ru" ? "Все инструменты" : "All tools"}<span aria-hidden="true">→</span></Link></div>
          <div className="wd-tool-category-grid is-standalone">{t.toolCategories.map(({ icon, title, description, action, href }) => <Link className="wd-tool-category-card" href={href} key={title}><IconBox icon={icon} /><div><h3>{title}</h3><p>{description}</p><span className="wd-card-link">{action}<span aria-hidden="true">→</span></span></div></Link>)}</div>
        </div>
      </section>

      <section className="wd-section wd-section-soft">
        <div className="shell wd-ai-layout"><article className="wd-ai-main"><span className="wd-eyebrow">{t.aiEyebrow}</span><h2>{t.aiTitle}</h2><p>{t.aiText}</p><div>{t.aiNote}</div></article><div className="wd-ai-grid">{t.aiCards.map(({ icon, title, description }) => <article key={title}><IconBox icon={icon} /><h3>{title}</h3><p>{description}</p></article>)}</div></div>
      </section>

      <section className="wd-section" id="pricing">
        <div className="shell">
          <div className="wd-section-intro is-centered">
            <span className="wd-eyebrow">{t.pricingEyebrow}</span>
            <h2>{t.pricingTitle}</h2>
            <p>{t.pricingText}</p>
          </div>
          <div className="wd-pricing-grid wd-pricing-grid-final">
            {t.pricing.map(({ icon, title, pricePrefix, priceValue, priceCurrency, priceSuffix, status, description, items, action, href }, index) => (
              <article className={index === 2 ? "is-featured" : ""} key={title}>
                <IconBox icon={icon} />
                <span className="wd-price-label">{status}</span>
                <h3>{title}</h3>
                <div className="wd-price-line" aria-label={`${pricePrefix ? `${pricePrefix} ` : ""}${priceValue} ${priceCurrency}${priceSuffix}`}>
                  {pricePrefix ? <span className="wd-price-prefix">{pricePrefix}</span> : null}
                  <strong className="wd-price-amount">{priceValue}</strong>
                  <span className="wd-price-currency">{priceCurrency}</span>
                  {priceSuffix ? <span className="wd-price-period">{priceSuffix}</span> : null}
                </div>
                <p>{description}</p>
                <ul>{items.map((item) => <li key={item}><CheckCircle2 /><span>{item}</span></li>)}</ul>
                <Link className="wd-card-button" href={href}>{action}</Link>
              </article>
            ))}
          </div>
          <p className="wd-pricing-note">{t.pricingNote}</p>
        </div>
      </section>

      <section className="wd-section wd-section-soft" id="knowledge"><div className="shell"><div className="wd-section-intro"><span className="wd-eyebrow">{t.knowledgeEyebrow}</span><h2>{t.knowledgeTitle}</h2><p>{t.knowledgeText}</p></div><div className="wd-knowledge-grid">{t.knowledge.map(({ icon, title, description, action }) => <article key={title}><IconBox icon={icon} /><h3>{title}</h3><p>{description}</p><span className="wd-text-link" aria-disabled="true">{action}<span aria-hidden="true">→</span></span></article>)}</div></div></section>

      <section className="wd-section" id="faq"><div className="shell"><div className="wd-section-intro"><span className="wd-eyebrow">{t.faqEyebrow}</span><h2>{t.faqTitle}</h2></div><HomeFaqAccordion items={t.faq} /></div></section>

      <section className="wd-section"><div className="shell"><div className="wd-final-panel"><div><span className="wd-eyebrow">{t.finalEyebrow}</span><h2>{t.finalTitle}</h2><p>{t.finalText}</p></div><div><Link className="wd-button wd-button-primary" href={locale === "ru" ? "/audit" : "/en/audit"}>{t.heroSecondary}</Link><Link className="wd-button wd-button-secondary" href={toolsHref}>{locale === "ru" ? "Открыть инструменты" : "Open tools"}</Link></div></div></div></section>
    </main>
  );
}
