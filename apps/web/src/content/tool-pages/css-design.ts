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
    slug: "color-converter",
    seoTitle: { ru: "Конвертер HEX-цветов в RGB и HSL", en: "HEX to RGB and HSL Color Converter" },
    metaDescription: { ru: "Преобразуйте HEX-цвет в RGB и HSL, проверьте каналы и скопируйте CSS-значения прямо в браузере без загрузки данных на сервер.", en: "Convert a HEX color to RGB and HSL, inspect channels, and copy CSS values directly in the browser without sending data to a server." },
    h1: { ru: "Конвертер HEX-цветов", en: "HEX Color Converter" },
    lead: { ru: "Введите 3- или 6-значный HEX и получите нормализованный HEX, RGB, HSL и числовые каналы для design-token workflow.", en: "Enter a 3- or 6-digit HEX value and get normalized HEX, RGB, HSL, and numeric channels for a design-token workflow." },
    quickFacts: [
      { ru: "HEX → RGB/HSL", en: "HEX to RGB/HSL" },
      { ru: "3/6 digit support", en: "3/6 digit support" },
      { ru: "Локальный расчёт", en: "Local calculation" },
    ],
    howToSteps: [
      { ru: "Введите HEX-цвет с символом # или без него.", en: "Enter a HEX color with or without #." },
      { ru: "Проверьте нормализованное значение и preview.", en: "Review the normalized value and preview." },
      { ru: "Скопируйте RGB или HSL CSS value.", en: "Copy the RGB or HSL CSS value." },
    ],
    supportedFeatures: [
      { ru: "Нормализация short HEX в полный #RRGGBB.", en: "Normalizes short HEX to full #RRGGBB." },
      { ru: "Расчёт RGB channels и CSS rgb() notation.", en: "Calculates RGB channels and CSS rgb() notation." },
      { ru: "Расчёт HSL hue, saturation и lightness.", en: "Calculates HSL hue, saturation, and lightness." },
    ],
    limitations: [
      { ru: "RGB, HSL, alpha, lab/lch и named colors не принимаются как вход.", en: "RGB, HSL, alpha, lab/lch, and named colors are not accepted as input." },
      { ru: "Инструмент не извлекает палитры из файлов и не оценивает contrast ratio.", en: "The tool does not extract palettes from files or evaluate contrast ratio." },
    ],
    useCases: [
      { ru: "Перевод HEX design token в CSS rgb() или hsl().", en: "Converting a HEX design token to CSS rgb() or hsl()." },
      { ru: "Проверка цветовых каналов перед документацией UI kit.", en: "Checking color channels before documenting a UI kit." },
      { ru: "Быстрая нормализация short HEX из макета.", en: "Quickly normalizing short HEX from a design." },
    ],
    technicalNotes: [
      { ru: "HSL округляется до целых градусов и процентов для практического CSS output.", en: "HSL is rounded to whole degrees and percentages for practical CSS output." },
      { ru: "Расчёт выполняется в браузере и не требует network request.", en: "The calculation runs in the browser and does not require a network request." },
    ],
    faq: [
      { question: { ru: "Почему вход только HEX?", en: "Why is input HEX only?" }, answer: { ru: "Так инструмент остаётся детерминированным и безопасным для быстрого token conversion.", en: "This keeps the tool deterministic and safe for quick token conversion." } },
      { question: { ru: "Это заменяет contrast checker?", en: "Does this replace the contrast checker?" }, answer: { ru: "Нет. Для проверки доступности пары цветов используйте отдельный инструмент контраста.", en: "No. Use the dedicated contrast tool to evaluate an accessible color pair." } },
    ],
    relatedToolSlugs: ["color-contrast-checker", "gradient-generator", "box-shadow-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/color_value"],
  }),
  toolPage({
    slug: "css-specificity-calculator",
    seoTitle: { ru: "Калькулятор специфичности CSS selectors", en: "CSS Selector Specificity Calculator" },
    metaDescription: { ru: "Посчитайте специфичность CSS selector list в формате ID/class/type, включая bounded поддержку :where(), :is(), :not() и :has().", en: "Calculate CSS selector-list specificity as ID/class/type values, including bounded support for :where(), :is(), :not(), and :has()." },
    h1: { ru: "Калькулятор специфичности CSS", en: "CSS Specificity Calculator" },
    lead: { ru: "Проверьте, почему один selector перекрывает другой, без выполнения CSS и без анализа всего stylesheet.", en: "Check why one selector overrides another without executing CSS or analyzing a full stylesheet." },
    quickFacts: [
      { ru: "ID/class/type score", en: "ID/class/type score" },
      { ru: "Selector list", en: "Selector list" },
      { ru: "Без CSS execution", en: "No CSS execution" },
    ],
    howToSteps: [
      { ru: "Вставьте один selector или список через запятую.", en: "Paste one selector or a comma-separated list." },
      { ru: "Проверьте итоговый score для каждого selector.", en: "Review the resulting score for each selector." },
      { ru: "Сравните ID, class/attribute/pseudo-class и type buckets.", en: "Compare ID, class/attribute/pseudo-class, and type buckets." },
    ],
    supportedFeatures: [
      { ru: "Подсчёт ID selectors, classes, attributes и pseudo-classes.", en: "Counts ID selectors, classes, attributes, and pseudo-classes." },
      { ru: "Подсчёт type selectors и pseudo-elements.", en: "Counts type selectors and pseudo-elements." },
      { ru: "Bounded обработка :where() как zero и :is/:not/:has по strongest argument.", en: "Bounded handling of :where() as zero and :is/:not/:has by strongest argument." },
    ],
    limitations: [
      { ru: "Это не полноценный CSS parser и не учитывает cascade layers, source order или !important.", en: "This is not a full CSS parser and does not account for cascade layers, source order, or !important." },
      { ru: "Сложные вложенные selector functions ограничены, чтобы расчёт оставался bounded.", en: "Complex nested selector functions are limited so the calculation remains bounded." },
    ],
    useCases: [
      { ru: "Разбор конфликта между utility class и component selector.", en: "Debugging a conflict between a utility class and a component selector." },
      { ru: "Проверка selector перед упрощением CSS.", en: "Checking a selector before simplifying CSS." },
      { ru: "Документация правил специфичности в дизайн-системе.", en: "Documenting specificity rules in a design system." },
    ],
    technicalNotes: [
      { ru: "Score выводится как IDs-classes-types, например 1-2-0.", en: "The score is emitted as IDs-classes-types, for example 1-2-0." },
      { ru: "Функция :where() обнуляется согласно современным правилам specificity.", en: ":where() is zeroed according to modern specificity rules." },
    ],
    faq: [
      { question: { ru: "Почему !important не входит в score?", en: "Why is !important not in the score?" }, answer: { ru: "!important относится к cascade resolution, а не к числу specificity selector.", en: "!important belongs to cascade resolution, not to the selector specificity number." } },
      { question: { ru: "Можно анализировать весь CSS-файл?", en: "Can it analyze a whole CSS file?" }, answer: { ru: "Нет. Инструмент считает явно вставленные selectors, без stylesheet parsing.", en: "No. The tool calculates explicitly pasted selectors without stylesheet parsing." } },
    ],
    relatedToolSlugs: ["color-converter", "px-rem-converter", "gradient-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/CSS_cascade/Specificity"],
  }),
  toolPage({
    slug: "typography-scale-generator",
    seoTitle: { ru: "Генератор типографической шкалы px/rem", en: "px/rem Typography Scale Generator" },
    metaDescription: { ru: "Соберите bounded typography scale из базового размера, ratio и диапазона шагов, получите px, rem и CSS custom properties.", en: "Build a bounded typography scale from a base size, ratio, and step range, with px, rem, and CSS custom properties." },
    h1: { ru: "Генератор типографической шкалы", en: "Typography Scale Generator" },
    lead: { ru: "Настройте modular scale для интерфейса и скопируйте CSS variables без анализа шрифтов или внешних библиотек.", en: "Configure a modular scale for an interface and copy CSS variables without font analysis or external libraries." },
    quickFacts: [
      { ru: "Base px + ratio", en: "Base px + ratio" },
      { ru: "px и rem output", en: "px and rem output" },
      { ru: "CSS variables", en: "CSS variables" },
    ],
    howToSteps: [
      { ru: "Укажите базовый размер текста в px.", en: "Enter the base text size in px." },
      { ru: "Задайте ratio и диапазон шагов.", en: "Set the ratio and step range." },
      { ru: "Скопируйте CSS custom properties.", en: "Copy the CSS custom properties." },
    ],
    supportedFeatures: [
      { ru: "Шаги от отрицательных размеров до крупных heading values.", en: "Steps from smaller text values to larger heading values." },
      { ru: "Расчёт px и rem относительно выбранной базы.", en: "Calculates px and rem relative to the selected base." },
      { ru: "Генерация custom properties для token layer.", en: "Generates custom properties for a token layer." },
    ],
    limitations: [
      { ru: "Инструмент не измеряет реальные font metrics, optical size или line-height.", en: "The tool does not measure real font metrics, optical size, or line-height." },
      { ru: "Он не заменяет визуальную проверку typographic rhythm в макете.", en: "It does not replace visual review of typographic rhythm in a layout." },
    ],
    useCases: [
      { ru: "Подготовка font-size tokens для UI kit.", en: "Preparing font-size tokens for a UI kit." },
      { ru: "Сравнение ratio перед редизайном typography scale.", en: "Comparing a ratio before redesigning a typography scale." },
      { ru: "Быстрая генерация px/rem значений для документации.", en: "Quickly generating px/rem values for documentation." },
    ],
    technicalNotes: [
      { ru: "Каждый шаг считается как base × ratio^step.", en: "Each step is calculated as base multiplied by ratio to the step power." },
      { ru: "Диапазон ограничен, чтобы output оставался читаемым и предсказуемым.", en: "The range is bounded so output remains readable and predictable." },
    ],
    faq: [
      { question: { ru: "Как выбрать ratio?", en: "How do I choose a ratio?" }, answer: { ru: "Начните с 1.2–1.333 для интерфейсов и проверьте результат в реальном layout.", en: "Start with 1.2–1.333 for interfaces and review the result in the actual layout." } },
      { question: { ru: "Почему нет line-height?", en: "Why no line-height?" }, answer: { ru: "Line-height зависит от шрифта, длины строк и компонента; здесь генерируются только font-size tokens.", en: "Line-height depends on the font, line length, and component; this tool generates font-size tokens only." } },
    ],
    relatedToolSlugs: ["px-rem-converter", "color-converter", "css-specificity-calculator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/font-size"],
  }),
  toolPage({
    slug: "gradient-generator",
    seoTitle: { ru: "Генератор CSS-градиентов с live preview", en: "CSS Gradient Generator with Live Preview" },
    metaDescription: { ru: "Собирайте linear и radial CSS-градиенты из двух HEX-цветов, угла и stop-позиций прямо в браузере без изображений и внешних библиотек.", en: "Build linear and radial CSS gradients from two HEX colors, an angle, and stop positions directly in the browser without images or external libraries." },
    h1: { ru: "Генератор CSS-градиентов", en: "CSS Gradient Generator" },
    lead: { ru: "Настройте безопасный CSS gradient, проверьте preview и скопируйте готовую declaration для интерфейсного слоя или design token.", en: "Configure a safe CSS gradient, review the preview, and copy a ready declaration for UI styling or design tokens." },
    quickFacts: [
      { ru: "Linear и radial", en: "Linear and radial" },
      { ru: "HEX color stops", en: "HEX color stops" },
      { ru: "Без remote assets", en: "No remote assets" },
    ],
    howToSteps: [
      { ru: "Выберите linear или radial mode.", en: "Choose linear or radial mode." },
      { ru: "Введите два HEX-цвета и stop-позиции.", en: "Enter two HEX colors and stop positions." },
      { ru: "Скопируйте готовую CSS declaration после проверки preview.", en: "Copy the generated CSS declaration after checking the preview." },
    ],
    supportedFeatures: [
      { ru: "Linear gradient с углом 0–360 градусов.", en: "Linear gradient with a 0–360 degree angle." },
      { ru: "Radial gradient circle at center для базовых UI surfaces.", en: "Radial gradient circle at center for basic UI surfaces." },
      { ru: "Проверка HEX 3/6 символов и диапазона stop-позиций 0–100%.", en: "Validation for 3/6-digit HEX and 0–100% stop positions." },
    ],
    limitations: [
      { ru: "Инструмент поддерживает две цветовые точки, а не сложную multi-stop палитру.", en: "The tool supports two color stops, not a complex multi-stop palette." },
      { ru: "Он не анализирует существующие CSS-файлы и не проверяет брендовые design tokens.", en: "It does not analyze existing CSS files or validate brand design tokens." },
    ],
    useCases: [
      { ru: "Быстрый background для hero, карточки или CTA.", en: "Quick background for a hero, card, or CTA." },
      { ru: "Подбор gradient token перед переносом в дизайн-систему.", en: "Choosing a gradient token before moving it into a design system." },
      { ru: "Проверка угла и stop-позиций без ручного CSS набора.", en: "Checking angle and stop positions without hand-writing CSS." },
    ],
    technicalNotes: [
      { ru: "Preview использует только валидированные HEX-цвета и числовые значения.", en: "The preview uses only validated HEX colors and numeric values." },
      { ru: "Генератор выдаёт plain CSS и не создаёт изображения или JavaScript snippets.", en: "The generator emits plain CSS and does not create images or JavaScript snippets." },
    ],
    faq: [
      { question: { ru: "Можно добавить больше двух цветов?", en: "Can I add more than two colors?" }, answer: { ru: "В этом batch — нет. Инструмент намеренно ограничен двумя stop-позициями, чтобы не превращаться в визуальный редактор.", en: "Not in this batch. The tool is intentionally limited to two stops so it does not become a visual editor." } },
      { question: { ru: "Почему только HEX?", en: "Why HEX only?" }, answer: { ru: "HEX проще валидировать безопасно и достаточно для быстрого design-token workflow.", en: "HEX is straightforward to validate safely and is enough for a quick design-token workflow." } },
    ],
    relatedToolSlugs: ["color-contrast-checker", "box-shadow-generator", "border-radius-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/gradient/linear-gradient"],
  }),
  toolPage({
    slug: "box-shadow-generator",
    seoTitle: { ru: "Генератор CSS box-shadow с preview", en: "CSS box-shadow Generator with Preview" },
    metaDescription: { ru: "Настройте offset, blur, spread, HEX-цвет и opacity для box-shadow, посмотрите preview и скопируйте готовый CSS прямо в браузере.", en: "Tune offset, blur, spread, HEX color, and opacity for box-shadow, preview the result, and copy ready CSS directly in the browser." },
    h1: { ru: "Генератор CSS box-shadow", en: "CSS box-shadow Generator" },
    lead: { ru: "Соберите аккуратную тень карточки или панели из явных числовых параметров без сторонних библиотек и скрытых CSS side effects.", en: "Build a clean card or panel shadow from explicit numeric parameters without third-party libraries or hidden CSS side effects." },
    quickFacts: [
      { ru: "Offset/blur/spread", en: "Offset/blur/spread" },
      { ru: "HEX + opacity", en: "HEX + opacity" },
      { ru: "Copyable CSS", en: "Copyable CSS" },
    ],
    howToSteps: [
      { ru: "Укажите X/Y offset, blur и spread.", en: "Enter X/Y offset, blur, and spread." },
      { ru: "Выберите HEX-цвет и opacity от 0 до 1.", en: "Choose a HEX color and opacity from 0 to 1." },
      { ru: "Проверьте preview и скопируйте declaration.", en: "Check the preview and copy the declaration." },
    ],
    supportedFeatures: [
      { ru: "Отрицательные X/Y offsets в bounded диапазоне.", en: "Negative X/Y offsets within a bounded range." },
      { ru: "Blur до 400 px и spread от -200 до 200 px.", en: "Blur up to 400 px and spread from -200 to 200 px." },
      { ru: "HEX to rgba conversion для контролируемой прозрачности.", en: "HEX to rgba conversion for controlled opacity." },
    ],
    limitations: [
      { ru: "Multiple shadows и inset mode пока не поддерживаются.", en: "Multiple shadows and inset mode are not supported yet." },
      { ru: "Инструмент не проверяет визуальную доступность всей дизайн-системы.", en: "The tool does not validate visual accessibility across a full design system." },
    ],
    useCases: [
      { ru: "Подбор shadow token для карточек и dropdown.", en: "Choosing a shadow token for cards and dropdowns." },
      { ru: "Смягчение border-heavy интерфейса через elevation.", en: "Replacing border-heavy UI with elevation." },
      { ru: "Быстрая проверка тени перед переносом в CSS variables.", en: "Quickly checking a shadow before moving it into CSS variables." },
    ],
    technicalNotes: [
      { ru: "Цвет выводится как rgba после безопасного HEX parsing.", en: "The color is emitted as rgba after safe HEX parsing." },
      { ru: "Все числовые параметры ограничены, чтобы исключить случайные огромные CSS values.", en: "All numeric parameters are bounded to avoid accidental huge CSS values." },
    ],
    faq: [
      { question: { ru: "Можно сделать несколько теней?", en: "Can it create multiple shadows?" }, answer: { ru: "Нет. Текущая версия генерирует одну тень для предсказуемого token workflow.", en: "No. The current version generates one shadow for a predictable token workflow." } },
      { question: { ru: "Почему цвет вводится в HEX?", en: "Why is the color entered as HEX?" }, answer: { ru: "HEX удобно валидировать, а opacity затем добавляется отдельно в rgba output.", en: "HEX is easy to validate, and opacity is added separately in the rgba output." } },
    ],
    relatedToolSlugs: ["gradient-generator", "border-radius-generator", "color-contrast-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/box-shadow"],
  }),
  toolPage({
    slug: "border-radius-generator",
    seoTitle: { ru: "Генератор CSS border-radius для четырёх углов", en: "Four-Corner CSS border-radius Generator" },
    metaDescription: { ru: "Настройте border-radius для каждого угла, проверьте форму на preview и скопируйте короткую CSS declaration без canvas и внешних зависимостей.", en: "Set border-radius for each corner, inspect the shape in a preview, and copy a compact CSS declaration without canvas or external dependencies." },
    h1: { ru: "Генератор CSS border-radius", en: "CSS border-radius Generator" },
    lead: { ru: "Рассчитайте shorthand border-radius для четырёх углов и быстро проверьте геометрию панели, кнопки или карточки.", en: "Calculate a four-corner border-radius shorthand and quickly review the geometry for a panel, button, or card." },
    quickFacts: [
      { ru: "4 угла", en: "4 corners" },
      { ru: "0–240 px", en: "0–240 px" },
      { ru: "Live preview", en: "Live preview" },
    ],
    howToSteps: [
      { ru: "Введите radius для каждого угла в px.", en: "Enter the radius for each corner in px." },
      { ru: "Проверьте форму в preview-блоке.", en: "Review the shape in the preview block." },
      { ru: "Скопируйте готовый shorthand для CSS.", en: "Copy the generated CSS shorthand." },
    ],
    supportedFeatures: [
      { ru: "Top-left, top-right, bottom-right и bottom-left значения.", en: "Top-left, top-right, bottom-right, and bottom-left values." },
      { ru: "Bounded numeric validation от 0 до 240 px.", en: "Bounded numeric validation from 0 to 240 px." },
      { ru: "Короткий shorthand output в стандартном CSS порядке.", en: "Compact shorthand output in standard CSS order." },
    ],
    limitations: [
      { ru: "Elliptical slash syntax не поддерживается в этом batch.", en: "Elliptical slash syntax is not supported in this batch." },
      { ru: "Инструмент не измеряет реальные размеры DOM-элемента.", en: "The tool does not measure a real DOM element's dimensions." },
    ],
    useCases: [
      { ru: "Подбор radius token для карточек и модальных окон.", en: "Choosing a radius token for cards and modals." },
      { ru: "Проверка асимметричной формы для UI-компонента.", en: "Testing an asymmetric shape for a UI component." },
      { ru: "Быстрое получение shorthand вместо четырёх ручных declarations.", en: "Getting shorthand quickly instead of writing four declarations." },
    ],
    technicalNotes: [
      { ru: "Порядок output: top-left, top-right, bottom-right, bottom-left.", en: "Output order is top-left, top-right, bottom-right, bottom-left." },
      { ru: "Значения ограничены px, чтобы сохранить простой и проверяемый генератор.", en: "Values are limited to px to keep the generator simple and verifiable." },
    ],
    faq: [
      { question: { ru: "Можно использовать проценты?", en: "Can I use percentages?" }, answer: { ru: "Нет. В этой версии поддерживаются только px-значения для стабильного preview и простого shorthand.", en: "No. This version supports only px values for a stable preview and simple shorthand." } },
      { question: { ru: "Почему порядок именно такой?", en: "Why this order?" }, answer: { ru: "Это стандартный CSS shorthand порядок: top-left, top-right, bottom-right, bottom-left.", en: "It is the standard CSS shorthand order: top-left, top-right, bottom-right, bottom-left." } },
    ],
    relatedToolSlugs: ["box-shadow-generator", "gradient-generator", "px-rem-converter"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/border-radius"],
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
