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
] as const;
