import { toolPage } from "./shared";

export const cssDesignToolPages = [
  toolPage({
    slug: "color-contrast-checker",
    seoTitle: { ru: "Проверка контраста HEX-цветов по WCAG", en: "WCAG HEX Color Contrast Checker" },
    metaDescription: { ru: "Рассчитайте контраст двух HEX-цветов и проверьте пороги WCAG для обычного и крупного текста прямо в браузере.", en: "Calculate the contrast ratio of two HEX colors and check WCAG thresholds for normal and large text directly in your browser." },
    h1: { ru: "Проверка контраста HEX-цветов по WCAG", en: "WCAG HEX Color Contrast Checker" },
    lead: { ru: "Сравните цвет текста и фона, получите числовой коэффициент и проверьте соответствие уровням AA и AAA для текста.", en: "Compare text and background colors, get the numeric ratio, and check AA and AAA text thresholds." },
    quickFacts: [
      { ru: "HEX 3 или 6 символов", en: "3- or 6-digit HEX" },
      { ru: "WCAG text thresholds", en: "WCAG text thresholds" },
      { ru: "Живой preview", en: "Live preview" },
    ],
    howToSteps: [
      { ru: "Введите цвет текста и цвет фона в HEX.", en: "Enter text and background colors in HEX." },
      { ru: "Запустите расчёт коэффициента.", en: "Run the contrast calculation." },
      { ru: "Проверьте результаты AA и AAA для обычного и крупного текста.", en: "Review AA and AAA results for normal and large text." },
    ],
    supportedFeatures: [
      { ru: "Трёх- и шестизначные HEX-значения с символом # или без него.", en: "Three- and six-digit HEX values with or without #." },
      { ru: "Расчёт relative luminance и contrast ratio.", en: "Relative luminance and contrast-ratio calculation." },
      { ru: "Проверка AA для обычного и крупного текста и AAA для обычного текста.", en: "AA checks for normal and large text and an AAA check for normal text." },
    ],
    limitations: [
      { ru: "RGB, HSL, alpha и градиенты не поддерживаются.", en: "RGB, HSL, alpha, and gradients are not supported." },
      { ru: "Автоматическая проверка всех элементов страницы не выполняется.", en: "The tool does not audit all elements on a webpage." },
    ],
    useCases: [
      { ru: "Проверка текста кнопки на выбранном фоне.", en: "Checking button text against its background." },
      { ru: "Подбор доступной пары цветов для интерфейса.", en: "Selecting an accessible color pair for an interface." },
      { ru: "Быстрая проверка design token перед внедрением.", en: "Quickly checking a design token before implementation." },
    ],
    technicalNotes: [
      { ru: "Коэффициент 1:1 означает одинаковую яркость, максимальный контраст — 21:1.", en: "A 1:1 ratio means equal luminance; the maximum contrast is 21:1." },
      { ru: "Прохождение числового порога не заменяет проверку состояния, размера текста и всего пользовательского сценария.", en: "Passing a numeric threshold does not replace checking states, text size, and the complete user experience." },
    ],
    faq: [
      { question: { ru: "Какой коэффициент нужен для обычного текста?", en: "What ratio is required for normal text?" }, answer: { ru: "Для уровня AA обычно требуется не менее 4.5:1, а для AAA — 7:1.", en: "Level AA generally requires at least 4.5:1, while AAA requires 7:1." } },
      { question: { ru: "Можно проверить прозрачный цвет?", en: "Can it check transparent colors?" }, answer: { ru: "Нет. Нужно указать итоговые непрозрачные HEX-цвета текста и фона.", en: "No. Enter the final opaque HEX colors for text and background." } },
    ],
    relatedToolSlugs: ["px-rem-converter", "json-formatter-validator", "image-optimizer"],
    sourceUrls: ["https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html"],
  }),
  toolPage({
    slug: "px-rem-converter",
    seoTitle: { ru: "Конвертер px в rem и rem в px", en: "px to rem & rem to px Converter" },
    metaDescription: { ru: "Переводите значения между px и rem с выбранным базовым размером шрифта прямо в браузере.", en: "Convert values between px and rem using a selected root font size directly in your browser." },
    h1: { ru: "Конвертер px ↔ rem", en: "px ↔ rem Converter" },
    lead: { ru: "Рассчитайте относительное rem-значение по пикселям или переведите rem обратно в px для выбранного root font size.", en: "Calculate a relative rem value from pixels or convert rem back to pixels for a selected root font size." },
    quickFacts: [
      { ru: "Два направления", en: "Two-way conversion" },
      { ru: "Настраиваемая база", en: "Custom root size" },
      { ru: "Мгновенный расчёт", en: "Instant calculation" },
    ],
    howToSteps: [
      { ru: "Укажите базовый размер шрифта корневого элемента.", en: "Enter the root font size." },
      { ru: "Введите значение px или rem.", en: "Enter a px or rem value." },
      { ru: "Получите эквивалент в другой единице.", en: "Read the equivalent value in the other unit." },
    ],
    supportedFeatures: [
      { ru: "Преобразование px ÷ root size = rem.", en: "px divided by root size equals rem." },
      { ru: "Преобразование rem × root size = px.", en: "rem multiplied by root size equals px." },
      { ru: "Дробные числовые значения.", en: "Decimal numeric values." },
    ],
    limitations: [
      { ru: "Инструмент преобразует одно значение за раз.", en: "The tool converts one value at a time." },
      { ru: "Он не анализирует CSS-файлы и не учитывает локальный font-size вложенного элемента.", en: "It does not parse CSS files or account for a nested element's local font size." },
    ],
    useCases: [
      { ru: "Перенос размеров из макета в относительные CSS-единицы.", en: "Translating design dimensions into relative CSS units." },
      { ru: "Проверка значения при нестандартном root font size.", en: "Checking a value with a non-default root font size." },
      { ru: "Обратный расчёт rem для сравнения с пиксельным макетом.", en: "Converting rem back to pixels for comparison with a design." },
    ],
    technicalNotes: [
      { ru: "1rem равен вычисленному размеру шрифта корневого элемента html.", en: "1rem equals the computed font size of the root html element." },
      { ru: "Значение 16 px используется часто, но не является обязательным для любого проекта.", en: "16 px is common but is not mandatory for every project." },
    ],
    faq: [
      { question: { ru: "Почему 16 px часто равно 1rem?", en: "Why is 16 px often equal to 1rem?" }, answer: { ru: "Во многих браузерах 16 px — стандартный root font size, если сайт или пользователь его не изменили.", en: "Many browsers use 16 px as the default root font size unless the site or user changes it." } },
      { question: { ru: "Чем rem отличается от em?", en: "How does rem differ from em?" }, answer: { ru: "rem зависит от корневого размера шрифта, а em обычно зависит от font-size текущего или родительского контекста.", en: "rem is based on the root font size, while em usually depends on the current or parent font-size context." } },
    ],
    relatedToolSlugs: ["color-contrast-checker", "image-aspect-ratio-calculator", "json-formatter-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Learn/CSS/Building_blocks/Values_and_units"],
  }),

  toolPage({
    slug: "landmark-structure-analyzer",
    seoTitle: { ru: "Анализ структуры landmarks страницы", en: "Page Landmark Structure Analyzer" },
    metaDescription: { ru: "Проверьте main, navigation, banner, contentinfo, complementary, search, form и region landmarks в исходном HTML без fake WCAG-оценки.", en: "Inspect main, navigation, banner, contentinfo, complementary, search, form, and region landmarks in source HTML without a fake WCAG score." },
    h1: { ru: "Анализ структуры landmarks", en: "Landmark Structure Analyzer" },
    lead: { ru: "Получите bounded inventory семантических и ARIA landmarks, их доступных имён, дублей и структурных конфликтов.", en: "Get a bounded inventory of semantic and ARIA landmarks, their accessible names, duplicates, and structural conflicts." },
    quickFacts: [
      { ru: "Один safe fetch", en: "One safe fetch" },
      { ru: "До 150 элементов", en: "Up to 150 items" },
      { ru: "Без browser runtime", en: "No browser runtime" },
    ],
    howToSteps: [
      { ru: "Введите публичный HTTP/HTTPS URL.", en: "Enter a public HTTP/HTTPS URL." },
      { ru: "Запустите bounded static HTML scan.", en: "Run the bounded static HTML scan." },
      { ru: "Проверьте main, повторяющиеся landmarks и различимость имён.", en: "Review main, repeated landmarks, and distinguishable names." },
    ],
    supportedFeatures: [
      { ru: "Семантические header, nav, main, footer, aside, form, section и search candidates.", en: "Semantic header, nav, main, footer, aside, form, section, and search candidates." },
      { ru: "Явные ARIA roles banner, navigation, main, contentinfo, complementary, search, form и region.", en: "Explicit ARIA roles for banner, navigation, main, contentinfo, complementary, search, form, and region." },
      { ru: "aria-label, aria-labelledby, duplicate role/name, hidden signals и nested main review.", en: "aria-label, aria-labelledby, duplicate role/name, hidden signals, and nested-main review." },
    ],
    limitations: [
      { ru: "JavaScript и browser accessibility tree не выполняются.", en: "JavaScript and the browser accessibility tree are not executed." },
      { ru: "Статус означает только выбранные static findings, а не соответствие WCAG.", en: "Status covers only selected static findings, not WCAG conformance." },
    ],
    useCases: [
      { ru: "Проверка layout-шаблона после редизайна.", en: "Reviewing a layout template after a redesign." },
      { ru: "Поиск нескольких main или одинаково названных nav.", en: "Finding multiple main landmarks or identically named nav landmarks." },
      { ru: "Предварительная проверка перед ручным screen-reader audit.", en: "Pre-screening before a manual screen-reader audit." },
    ],
    technicalNotes: [
      { ru: "Header и footer считаются page-level candidates только вне sectioning ancestors по статической структуре.", en: "Header and footer are treated as page-level candidates only outside sectioning ancestors in the static structure." },
      { ru: "Итоговую landmark mapping необходимо подтверждать в accessibility tree браузера.", en: "Final landmark mapping must be confirmed in the browser accessibility tree." },
    ],
    faq: [
      { question: { ru: "Почему найденный section не всегда region?", en: "Why is a section not always a region?" }, answer: { ru: "В анализе section считается region candidate только при найденном доступном имени.", en: "The analyzer treats section as a region candidate only when an accessible name is found." } },
      { question: { ru: "PASS означает соответствие WCAG?", en: "Does PASS mean WCAG conformance?" }, answer: { ru: "Нет. PASS означает отсутствие выбранных static findings в полученном HTML.", en: "No. PASS means the selected static findings were not detected in the fetched HTML." } },
    ],
    relatedToolSlugs: ["form-accessibility-analyzer", "interactive-accessible-name-analyzer", "heading-structure-checker"],
    sourceUrls: ["https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"],
  }),
  toolPage({
    slug: "form-accessibility-analyzer",
    seoTitle: { ru: "Анализ labels и группировки HTML-форм", en: "HTML Form Labels and Grouping Analyzer" },
    metaDescription: { ru: "Проверьте labels, aria-labelledby, aria-describedby, placeholder-only controls, fieldset/legend и radio/checkbox grouping в исходном HTML.", en: "Check labels, aria-labelledby, aria-describedby, placeholder-only controls, fieldset/legend, and radio/checkbox grouping in source HTML." },
    h1: { ru: "Анализ доступности форм", en: "Form Accessibility Analyzer" },
    lead: { ru: "Проверьте программные имена controls, связи label/ARIA, fieldset/legend и статические сигналы группировки без отправки формы.", en: "Review programmatic control names, label/ARIA relationships, fieldset/legend, and static grouping signals without submitting the form." },
    quickFacts: [
      { ru: "input, select, textarea, button", en: "input, select, textarea, button" },
      { ru: "Labels и ARIA references", en: "Labels and ARIA references" },
      { ru: "Без ввода данных", en: "No data entry" },
    ],
    howToSteps: [
      { ru: "Введите URL страницы с формой.", en: "Enter the URL of a page containing a form." },
      { ru: "Запустите static HTML analysis.", en: "Run the static HTML analysis." },
      { ru: "Исправьте controls без имени, broken references и слабую группировку.", en: "Fix unnamed controls, broken references, and weak grouping." },
    ],
    supportedFeatures: [
      { ru: "Explicit и implicit label, aria-label, aria-labelledby, button text, alt и value sources.", en: "Explicit and implicit labels, aria-label, aria-labelledby, button text, alt, and value sources." },
      { ru: "Placeholder-only, title-only, duplicate IDs и broken aria-describedby signals.", en: "Placeholder-only, title-only, duplicate ID, and broken aria-describedby signals." },
      { ru: "Fieldset/legend и повторяющиеся radio/checkbox name groups.", en: "Fieldset/legend and repeated radio/checkbox name groups." },
    ],
    limitations: [
      { ru: "Не проверяются focus order, ошибки валидации, live regions и динамические состояния.", en: "Focus order, validation errors, live regions, and dynamic states are not tested." },
      { ru: "CSS visibility и browser-computed accessible names не вычисляются.", en: "CSS visibility and browser-computed accessible names are not calculated." },
    ],
    useCases: [
      { ru: "Проверка формы регистрации или checkout.", en: "Reviewing a registration or checkout form." },
      { ru: "Поиск placeholder вместо постоянного label.", en: "Finding placeholders used instead of persistent labels." },
      { ru: "Контроль fieldset/legend для наборов вариантов.", en: "Checking fieldset/legend for option groups." },
    ],
    technicalNotes: [
      { ru: "Hidden input исключается из списка пользовательских controls.", en: "Hidden input elements are excluded from the user-control inventory." },
      { ru: "Submit/reset input без value учитывает стандартный default-value signal, но локализация браузера не моделируется.", en: "Submit/reset inputs without value use a default-value signal, but browser localization is not modeled." },
    ],
    faq: [
      { question: { ru: "Placeholder считается label?", en: "Does placeholder count as a label?" }, answer: { ru: "Нет. Инструмент показывает placeholder-only controls как отдельный риск для ручной проверки.", en: "No. The tool reports placeholder-only controls as a separate review risk." } },
      { question: { ru: "Проверяется отправка формы?", en: "Does it submit the form?" }, answer: { ru: "Нет. Выполняется только bounded static analysis исходного HTML.", en: "No. Only bounded static analysis of source HTML is performed." } },
    ],
    relatedToolSlugs: ["landmark-structure-analyzer", "interactive-accessible-name-analyzer", "color-contrast-checker"],
    sourceUrls: ["https://www.w3.org/WAI/tutorials/forms/labels/"],
  }),
  toolPage({
    slug: "interactive-accessible-name-analyzer",
    seoTitle: { ru: "Проверка доступных имён ссылок и кнопок", en: "Link and Button Accessible Name Analyzer" },
    metaDescription: { ru: "Проверьте доступные имена ссылок, кнопок и role=link/button: текст, alt, ARIA, общие названия и nested interactive элементы.", en: "Check accessible names for links, buttons, and role=link/button: text, alt, ARIA, generic names, and nested interactive elements." },
    h1: { ru: "Анализ доступных имён ссылок и кнопок", en: "Link and Button Accessible Name Analyzer" },
    lead: { ru: "Получите bounded static inventory интерактивных элементов и найдите отсутствующие, общие или неоднозначные имена.", en: "Get a bounded static inventory of interactive elements and find missing, generic, or ambiguous names." },
    quickFacts: [
      { ru: "Links и buttons", en: "Links and buttons" },
      { ru: "Text, alt и ARIA", en: "Text, alt, and ARIA" },
      { ru: "Custom-role signals", en: "Custom-role signals" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      { ru: "Запустите анализ исходного HTML.", en: "Run the source-HTML analysis." },
      { ru: "Проверьте unnamed, generic, nested и custom-role findings.", en: "Review unnamed, generic, nested, and custom-role findings." },
    ],
    supportedFeatures: [
      { ru: "Native a/button/input/area и explicit role=link/role=button.", en: "Native a/button/input/area and explicit role=link/role=button." },
      { ru: "Имена из aria-label, aria-labelledby, text, img alt, input value и title.", en: "Names from aria-label, aria-labelledby, text, img alt, input value, and title." },
      { ru: "Generic names, nested interactive, duplicate IDs, javascript: href и tabindex signals.", en: "Generic names, nested interactive elements, duplicate IDs, javascript: href, and tabindex signals." },
    ],
    limitations: [
      { ru: "Event listeners и keyboard activation не исполняются.", en: "Event listeners and keyboard activation are not executed." },
      { ru: "Контекст соседнего текста и итоговый accessible-name computation браузера могут отличаться.", en: "Nearby context and the browser's final accessible-name computation may differ." },
    ],
    useCases: [
      { ru: "Поиск icon-only buttons без aria-label.", en: "Finding icon-only buttons without aria-label." },
      { ru: "Проверка ссылок «Подробнее» с разными destinations.", en: "Reviewing 'Read more' links with different destinations." },
      { ru: "Поиск div role=button без focus signal.", en: "Finding div role=button elements without a focus signal." },
    ],
    technicalNotes: [
      { ru: "Generic-name detection использует прозрачный ограниченный словарь и требует ручного контекста.", en: "Generic-name detection uses a transparent limited dictionary and requires manual context review." },
      { ru: "tabindex=0 — только static signal; наличие Enter/Space handlers инструмент не доказывает.", en: "tabindex=0 is only a static signal; the tool does not prove Enter/Space handlers exist." },
    ],
    faq: [
      { question: { ru: "Текст внутри SVG считается именем?", en: "Does text inside SVG count as a name?" }, answer: { ru: "Может попасть в static text inventory, но итог нужно подтверждать в accessibility tree браузера.", en: "It may appear in the static text inventory, but the final result must be confirmed in the browser accessibility tree." } },
      { question: { ru: "Почему title-only отмечается отдельно?", en: "Why is title-only reported separately?" }, answer: { ru: "Title не является надёжной заменой видимому тексту или явной ARIA-связи во всех сценариях.", en: "Title is not a reliable replacement for visible text or an explicit ARIA relationship in every scenario." } },
    ],
    relatedToolSlugs: ["form-accessibility-analyzer", "landmark-structure-analyzer", "color-contrast-checker"],
    sourceUrls: ["https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html"],
  }),
] as const;
