import { toolPage } from "./shared";

export const cssDesignToolPages = [
  toolPage({
    slug: "color-palette-extractor",
    seoTitle: { ru: "Извлечение палитры из изображения", en: "Image Color Palette Extractor" },
    metaDescription: { ru: "Получите детерминированную палитру выборки с HEX, RGB и долей цвета из JPEG, PNG, WebP или AVIF локально в браузере.", en: "Get a deterministic sampled palette with HEX, RGB, and color share from a JPEG, PNG, WebP, or AVIF locally in your browser." },
    h1: { ru: "Извлечение палитры из изображения", en: "Image Color Palette Extractor" },
    lead: { ru: "Извлеките до восьми цветов из уменьшенной выборки изображения без отправки файла на сервер.", en: "Extract up to eight colors from a downsampled image without sending the file to a server." },
    quickFacts: [
      { ru: "4–8 цветов", en: "4–8 colors" },
      { ru: "HEX и RGB", en: "HEX and RGB" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите JPEG, PNG, WebP или AVIF.", en: "Choose a JPEG, PNG, WebP, or AVIF file." },
      { ru: "Укажите количество цветов от четырёх до восьми.", en: "Select four to eight palette colors." },
      { ru: "Извлеките палитру и скопируйте нужные HEX-значения.", en: "Extract the palette and copy the HEX values you need." },
    ],
    supportedFeatures: [
      { ru: "Детерминированная 5-bit RGB quantization уменьшенной выборки.", en: "Deterministic five-bit RGB quantization of a downsampled image." },
      { ru: "HEX, RGB, количество и процент пикселей выборки.", en: "HEX, RGB, count, and percentage of sampled pixels." },
      { ru: "Прозрачные пиксели пропускаются, частичная прозрачность компонуется на белом.", en: "Transparent pixels are skipped; partial transparency is composited onto white." },
    ],
    limitations: [
      { ru: "Это палитра уменьшенной выборки, а не точный список всех цветов и не perceptual clustering.", en: "This is a downsampled palette, not an exact color inventory or perceptual clustering model." },
      { ru: "Инструмент не определяет названия, брендовые роли, контраст или цветовой профиль.", en: "The tool does not infer color names, brand roles, contrast, or color profiles." },
    ],
    useCases: [
      { ru: "Быстрое получение HEX из референса.", en: "Quickly getting HEX values from a reference image." },
      { ru: "Подготовка черновой UI-палитры.", en: "Preparing a draft UI palette." },
      { ru: "Сравнение доминирующих цветов нескольких изображений вручную.", en: "Manually comparing dominant colors across images." },
    ],
    technicalNotes: [
      { ru: "Длинная сторона выборки ограничена 160 пикселями.", en: "The sample's longest side is limited to 160 pixels." },
      { ru: "При равной частоте цвета сортируются по HEX для стабильного результата.", en: "Equal-frequency colors are sorted by HEX for stable output." },
    ],
    faq: [
      { question: { ru: "Как получить основные цвета фотографии?", en: "How can I extract a photo's main colours?" }, answer: { ru: "Выберите изображение и количество цветов от четырёх до восьми. Инструмент обработает уменьшенную копию в браузере и покажет выбранные цвета с кодами HEX и RGB. Скопируйте нужный код для своего макета.", en: "Choose an image and select four to eight colours. The tool analyses a downsampled copy in the browser and shows selected colours with HEX and RGB codes. Copy the code you need for your design." } },
      { question: { ru: "Почему небольшой цветной элемент не попал в палитру?", en: "Why is a small coloured detail missing from the palette?" }, answer: { ru: "Палитра показывает ограниченное число цветов из уменьшенной выборки. Небольшие детали и близкие оттенки могут не получить отдельный цвет. Для точного цвета конкретной детали используйте пипетку в редакторе изображения.", en: "The palette contains a limited set of colours from a smaller sample. Small details and similar shades may not appear separately. Use an image editor's colour picker when you need an exact colour from a particular detail." } }
    ],
    relatedToolSlugs: ["color-converter", "color-contrast-checker", "image-optimizer"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/Canvas_API"],
  }),
  toolPage({
    slug: "color-contrast-checker",
    seoTitle: {
      ru: "Проверка контраста HEX-цветов по WCAG",
      en: "WCAG HEX Color Contrast Checker",
    },
    metaDescription: {
      ru: "Рассчитайте контраст двух HEX-цветов и проверьте пороги WCAG для обычного и крупного текста прямо в браузере.",
      en: "Calculate the contrast ratio of two HEX colors and check WCAG thresholds for normal and large text directly in your browser.",
    },
    h1: {
      ru: "Проверка контраста HEX-цветов по WCAG",
      en: "WCAG HEX Color Contrast Checker",
    },
    lead: {
      ru: "Сравните цвет текста и фона, получите числовой коэффициент и проверьте соответствие уровням AA и AAA для текста.",
      en: "Compare text and background colors, get the numeric ratio, and check AA and AAA text thresholds.",
    },
    quickFacts: [
      { ru: "HEX 3 или 6 символов", en: "3- or 6-digit HEX" },
      { ru: "WCAG text thresholds", en: "WCAG text thresholds" },
      { ru: "Живой preview", en: "Live preview" },
    ],
    howToSteps: [
      {
        ru: "Введите цвет текста и цвет фона в HEX.",
        en: "Enter text and background colors in HEX.",
      },
      {
        ru: "Запустите расчёт коэффициента.",
        en: "Run the contrast calculation.",
      },
      {
        ru: "Проверьте результаты AA и AAA для обычного и крупного текста.",
        en: "Review AA and AAA results for normal and large text.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Трёх- и шестизначные HEX-значения с символом # или без него.",
        en: "Three- and six-digit HEX values with or without #.",
      },
      {
        ru: "Расчёт relative luminance и contrast ratio.",
        en: "Relative luminance and contrast-ratio calculation.",
      },
      {
        ru: "Проверка AA для обычного и крупного текста и AAA для обычного текста.",
        en: "AA checks for normal and large text and an AAA check for normal text.",
      },
    ],
    limitations: [
      {
        ru: "RGB, HSL, alpha и градиенты не поддерживаются.",
        en: "RGB, HSL, alpha, and gradients are not supported.",
      },
      {
        ru: "Автоматическая проверка всех элементов страницы не выполняется.",
        en: "The tool does not audit all elements on a webpage.",
      },
    ],
    useCases: [
      {
        ru: "Проверка текста кнопки на выбранном фоне.",
        en: "Checking button text against its background.",
      },
      {
        ru: "Подбор доступной пары цветов для интерфейса.",
        en: "Selecting an accessible color pair for an interface.",
      },
      {
        ru: "Быстрая проверка design token перед внедрением.",
        en: "Quickly checking a design token before implementation.",
      },
    ],
    technicalNotes: [
      {
        ru: "Коэффициент 1:1 означает одинаковую яркость, максимальный контраст — 21:1.",
        en: "A 1:1 ratio means equal luminance; the maximum contrast is 21:1.",
      },
      {
        ru: "Прохождение числового порога не заменяет проверку состояния, размера текста и всего пользовательского сценария.",
        en: "Passing a numeric threshold does not replace checking states, text size, and the complete user experience.",
      },
    ],
    faq: [
      { question: { ru: "Как проверить, хорошо ли читается текст на фоне?", en: "How can I check whether text is readable on its background?" }, answer: { ru: "Укажите конечные непрозрачные цвета текста и фона в формате HEX. Инструмент рассчитает их контраст. Для обычного текста порог уровня WCAG AA — 4,5:1; оценивать нужно именно ту пару цветов, которая используется на странице.", en: "Enter the final opaque text and background colours in HEX format. The tool calculates their contrast. The WCAG AA threshold for normal text is 4.5:1; check the actual colour pair used on your page." } },
      { question: { ru: "Достаточно ли подходящего контраста для доступной страницы?", en: "Does sufficient contrast make a page accessible?" }, answer: { ru: "Контраст — одна из проверок доступности. Дополнительно проверьте размер текста, увеличение страницы, видимость фокуса и работу с клавиатуры. Инструмент оценивает введённые цвета, а не весь интерфейс сайта.", en: "Contrast is one accessibility check. Also assess text size, page zoom, visible focus, and keyboard use. This tool evaluates the entered colours, not your site's entire interface." } }
    ],
    relatedToolSlugs: [
      "px-rem-converter",
      "json-formatter-validator",
      "image-optimizer",
    ],
    sourceUrls: [
      "https://www.w3.org/WAI/WCAG22/Understanding/contrast-minimum.html",
    ],
  }),
  toolPage({
    slug: "px-rem-converter",
    seoTitle: {
      ru: "Конвертер px в rem и rem в px",
      en: "px to rem & rem to px Converter",
    },
    metaDescription: {
      ru: "Переводите значения между px и rem с выбранным базовым размером шрифта прямо в браузере.",
      en: "Convert values between px and rem using a selected root font size directly in your browser.",
    },
    h1: { ru: "Конвертер px ↔ rem", en: "px ↔ rem Converter" },
    lead: {
      ru: "Рассчитайте относительное rem-значение по пикселям или переведите rem обратно в px для выбранного root font size.",
      en: "Calculate a relative rem value from pixels or convert rem back to pixels for a selected root font size.",
    },
    quickFacts: [
      { ru: "Два направления", en: "Two-way conversion" },
      { ru: "Настраиваемая база", en: "Custom root size" },
      { ru: "Мгновенный расчёт", en: "Instant calculation" },
    ],
    howToSteps: [
      {
        ru: "Укажите базовый размер шрифта корневого элемента.",
        en: "Enter the root font size.",
      },
      { ru: "Введите значение px или rem.", en: "Enter a px or rem value." },
      {
        ru: "Получите эквивалент в другой единице.",
        en: "Read the equivalent value in the other unit.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Преобразование px ÷ root size = rem.",
        en: "px divided by root size equals rem.",
      },
      {
        ru: "Преобразование rem × root size = px.",
        en: "rem multiplied by root size equals px.",
      },
      { ru: "Дробные числовые значения.", en: "Decimal numeric values." },
    ],
    limitations: [
      {
        ru: "Инструмент преобразует одно значение за раз.",
        en: "The tool converts one value at a time.",
      },
      {
        ru: "Он не анализирует CSS-файлы и не учитывает локальный font-size вложенного элемента.",
        en: "It does not parse CSS files or account for a nested element's local font size.",
      },
    ],
    useCases: [
      {
        ru: "Перенос размеров из макета в относительные CSS-единицы.",
        en: "Translating design dimensions into relative CSS units.",
      },
      {
        ru: "Проверка значения при нестандартном root font size.",
        en: "Checking a value with a non-default root font size.",
      },
      {
        ru: "Обратный расчёт rem для сравнения с пиксельным макетом.",
        en: "Converting rem back to pixels for comparison with a design.",
      },
    ],
    technicalNotes: [
      {
        ru: "1rem равен вычисленному размеру шрифта корневого элемента html.",
        en: "1rem equals the computed font size of the root html element.",
      },
      {
        ru: "Значение 16 px используется часто, но не является обязательным для любого проекта.",
        en: "16 px is common but is not mandatory for every project.",
      },
    ],
    faq: [
      { question: { ru: "Как правильно перевести пиксели в rem?", en: "How do I convert pixels to rem correctly?" }, answer: { ru: "Укажите размер в пикселях и базовый размер шрифта вашего сайта. Например, при базе 16 px размер 24 px равен 1,5 rem. Если база отличается, результат тоже изменится.", en: "Enter the pixel size and your site's root font size. For example, with a 16 px base, 24 px equals 1.5 rem. A different base produces a different result." } },
      { question: { ru: "Почему рассчитанный размер на сайте выглядит иначе?", en: "Why does the calculated size look different on my site?" }, answer: { ru: "Проверьте размер шрифта корневого элемента страницы и настройки браузера. Единица rem зависит от корневого размера, а em — от размера шрифта в соответствующем месте страницы. Калькулятор использует введённую вами базу и не читает стили сайта.", en: "Check the page's root font size and browser settings. rem depends on the root font size, while em depends on the relevant font-size context. The calculator uses the base you enter; it does not read your site's styles." } }
    ],
    relatedToolSlugs: [
      "color-contrast-checker",
      "image-aspect-ratio-calculator",
      "json-formatter-validator",
    ],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Learn/CSS/Building_blocks/Values_and_units",
    ],
  }),
  toolPage({
    slug: "color-converter",
    seoTitle: {
      ru: "Конвертер HEX-цветов в RGB и HSL",
      en: "HEX to RGB and HSL Color Converter",
    },
    metaDescription: {
      ru: "Преобразуйте HEX-цвет в RGB и HSL, проверьте каналы и скопируйте CSS-значения прямо в браузере без загрузки данных на сервер.",
      en: "Convert a HEX color to RGB and HSL, inspect channels, and copy CSS values directly in the browser without sending data to a server.",
    },
    h1: { ru: "Конвертер HEX-цветов", en: "HEX Color Converter" },
    lead: {
      ru: "Введите 3- или 6-значный HEX и получите нормализованный HEX, RGB, HSL и числовые каналы для design-token workflow.",
      en: "Enter a 3- or 6-digit HEX value and get normalized HEX, RGB, HSL, and numeric channels for a design-token workflow.",
    },
    quickFacts: [
      { ru: "HEX → RGB/HSL", en: "HEX to RGB/HSL" },
      { ru: "3/6 digit support", en: "3/6 digit support" },
      { ru: "Локальный расчёт", en: "Local calculation" },
    ],
    howToSteps: [
      {
        ru: "Введите HEX-цвет с символом # или без него.",
        en: "Enter a HEX color with or without #.",
      },
      {
        ru: "Проверьте нормализованное значение и preview.",
        en: "Review the normalized value and preview.",
      },
      {
        ru: "Скопируйте RGB или HSL CSS value.",
        en: "Copy the RGB or HSL CSS value.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Нормализация short HEX в полный #RRGGBB.",
        en: "Normalizes short HEX to full #RRGGBB.",
      },
      {
        ru: "Расчёт RGB channels и CSS rgb() notation.",
        en: "Calculates RGB channels and CSS rgb() notation.",
      },
      {
        ru: "Расчёт HSL hue, saturation и lightness.",
        en: "Calculates HSL hue, saturation, and lightness.",
      },
    ],
    limitations: [
      {
        ru: "RGB, HSL, alpha, lab/lch и named colors не принимаются как вход.",
        en: "RGB, HSL, alpha, lab/lch, and named colors are not accepted as input.",
      },
      {
        ru: "Инструмент не извлекает палитры из файлов и не оценивает contrast ratio.",
        en: "The tool does not extract palettes from files or evaluate contrast ratio.",
      },
    ],
    useCases: [
      {
        ru: "Перевод HEX design token в CSS rgb() или hsl().",
        en: "Converting a HEX design token to CSS rgb() or hsl().",
      },
      {
        ru: "Проверка цветовых каналов перед документацией UI kit.",
        en: "Checking color channels before documenting a UI kit.",
      },
      {
        ru: "Быстрая нормализация short HEX из макета.",
        en: "Quickly normalizing short HEX from a design.",
      },
    ],
    technicalNotes: [
      {
        ru: "HSL округляется до целых градусов и процентов для практического CSS output.",
        en: "HSL is rounded to whole degrees and percentages for practical CSS output.",
      },
      {
        ru: "Расчёт выполняется в браузере и не требует network request.",
        en: "The calculation runs in the browser and does not require a network request.",
      },
    ],
    faq: [
      { question: { ru: "Как получить RGB и HSL из HEX-цвета?", en: "How do I get RGB and HSL from a HEX colour?" }, answer: { ru: "Введите цвет в поддерживаемом HEX-формате, например #336699. Инструмент покажет его представления в других форматах. Скопируйте нужное значение в редактор или стили сайта.", en: "Enter a supported HEX colour, such as #336699. The tool shows its representations in other formats. Copy the value you need into your editor or stylesheet." } },
      { question: { ru: "Изменится ли цвет при преобразовании формата?", en: "Will converting formats change the colour?" }, answer: { ru: "Форматы описывают один цвет разными способами; преобразование не подбирает новую палитру. Округление чисел может слегка менять точность записи. Для проверки читаемости текста используйте отдельную проверку контраста.", en: "The formats describe the same colour in different ways; conversion does not choose a new palette. Numeric rounding may affect representation precision slightly. Use the contrast checker to assess text readability." } }
    ],
    relatedToolSlugs: [
      "color-contrast-checker",
      "gradient-generator",
      "box-shadow-generator",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/color_value"],
  }),
  toolPage({
    slug: "css-specificity-calculator",
    seoTitle: {
      ru: "Калькулятор специфичности CSS selectors",
      en: "CSS Selector Specificity Calculator",
    },
    metaDescription: {
      ru: "Посчитайте специфичность CSS selector list в формате ID/class/type, включая bounded поддержку :where(), :is(), :not() и :has().",
      en: "Calculate CSS selector-list specificity as ID/class/type values, including bounded support for :where(), :is(), :not(), and :has().",
    },
    h1: {
      ru: "Калькулятор специфичности CSS",
      en: "CSS Specificity Calculator",
    },
    lead: {
      ru: "Проверьте, почему один selector перекрывает другой, без выполнения CSS и без анализа всего stylesheet.",
      en: "Check why one selector overrides another without executing CSS or analyzing a full stylesheet.",
    },
    quickFacts: [
      { ru: "ID/class/type score", en: "ID/class/type score" },
      { ru: "Selector list", en: "Selector list" },
      { ru: "Без CSS execution", en: "No CSS execution" },
    ],
    howToSteps: [
      {
        ru: "Вставьте один selector или список через запятую.",
        en: "Paste one selector or a comma-separated list.",
      },
      {
        ru: "Проверьте итоговый score для каждого selector.",
        en: "Review the resulting score for each selector.",
      },
      {
        ru: "Сравните ID, class/attribute/pseudo-class и type buckets.",
        en: "Compare ID, class/attribute/pseudo-class, and type buckets.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Подсчёт ID selectors, classes, attributes и pseudo-classes.",
        en: "Counts ID selectors, classes, attributes, and pseudo-classes.",
      },
      {
        ru: "Подсчёт type selectors и pseudo-elements.",
        en: "Counts type selectors and pseudo-elements.",
      },
      {
        ru: "Bounded обработка :where() как zero и :is/:not/:has по strongest argument.",
        en: "Bounded handling of :where() as zero and :is/:not/:has by strongest argument.",
      },
    ],
    limitations: [
      {
        ru: "Это не полноценный CSS parser и не учитывает cascade layers, source order или !important.",
        en: "This is not a full CSS parser and does not account for cascade layers, source order, or !important.",
      },
      {
        ru: "Сложные вложенные selector functions ограничены, чтобы расчёт оставался bounded.",
        en: "Complex nested selector functions are limited so the calculation remains bounded.",
      },
    ],
    useCases: [
      {
        ru: "Разбор конфликта между utility class и component selector.",
        en: "Debugging a conflict between a utility class and a component selector.",
      },
      {
        ru: "Проверка selector перед упрощением CSS.",
        en: "Checking a selector before simplifying CSS.",
      },
      {
        ru: "Документация правил специфичности в дизайн-системе.",
        en: "Documenting specificity rules in a design system.",
      },
    ],
    technicalNotes: [
      {
        ru: "Score выводится как IDs-classes-types, например 1-2-0.",
        en: "The score is emitted as IDs-classes-types, for example 1-2-0.",
      },
      {
        ru: "Функция :where() обнуляется согласно современным правилам specificity.",
        en: ":where() is zeroed according to modern specificity rules.",
      },
    ],
    faq: [
      { question: { ru: "Как понять, почему одно CSS-правило перекрывает другое?", en: "How can I understand why one CSS rule overrides another?" }, answer: { ru: "Вставьте селекторы и сравните их специфичность — приоритет, который зависит от состава селектора. Учитывайте и другие правила CSS: порядок подключения, слои и !important. Самого числа специфичности недостаточно для объяснения любого конфликта.", en: "Paste the selectors and compare their specificity, a priority determined by selector structure. Also consider stylesheet order, cascade layers, and !important. Specificity alone cannot explain every conflict." } },
      { question: { ru: "Нужно ли вставлять весь файл стилей?", en: "Should I paste an entire stylesheet?" }, answer: { ru: "Введите нужные селекторы, а не полный CSS-файл. Калькулятор разбирает их приоритет, но не загружает страницу и не определяет фактически применённый стиль элемента. Такой стиль можно посмотреть в инструментах разработчика браузера.", en: "Enter the selectors you want to compare rather than a complete CSS file. The calculator analyses their priority but does not load a page or determine an element's applied style. Inspect applied styles in your browser's developer tools." } }
    ],
    relatedToolSlugs: [
      "color-converter",
      "px-rem-converter",
      "gradient-generator",
    ],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/CSS/CSS_cascade/Specificity",
    ],
  }),
  toolPage({
    slug: "typography-scale-generator",
    seoTitle: {
      ru: "Генератор типографической шкалы px/rem",
      en: "px/rem Typography Scale Generator",
    },
    metaDescription: {
      ru: "Соберите bounded typography scale из базового размера, ratio и диапазона шагов, получите px, rem и CSS custom properties.",
      en: "Build a bounded typography scale from a base size, ratio, and step range, with px, rem, and CSS custom properties.",
    },
    h1: {
      ru: "Генератор типографической шкалы",
      en: "Typography Scale Generator",
    },
    lead: {
      ru: "Настройте modular scale для интерфейса и скопируйте CSS variables без анализа шрифтов или внешних библиотек.",
      en: "Configure a modular scale for an interface and copy CSS variables without font analysis or external libraries.",
    },
    quickFacts: [
      { ru: "Base px + ratio", en: "Base px + ratio" },
      { ru: "px и rem output", en: "px and rem output" },
      { ru: "CSS variables", en: "CSS variables" },
    ],
    howToSteps: [
      {
        ru: "Укажите базовый размер текста в px.",
        en: "Enter the base text size in px.",
      },
      {
        ru: "Задайте ratio и диапазон шагов.",
        en: "Set the ratio and step range.",
      },
      {
        ru: "Скопируйте CSS custom properties.",
        en: "Copy the CSS custom properties.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Шаги от отрицательных размеров до крупных heading values.",
        en: "Steps from smaller text values to larger heading values.",
      },
      {
        ru: "Расчёт px и rem относительно выбранной базы.",
        en: "Calculates px and rem relative to the selected base.",
      },
      {
        ru: "Генерация custom properties для token layer.",
        en: "Generates custom properties for a token layer.",
      },
    ],
    limitations: [
      {
        ru: "Инструмент не измеряет реальные font metrics, optical size или line-height.",
        en: "The tool does not measure real font metrics, optical size, or line-height.",
      },
      {
        ru: "Он не заменяет визуальную проверку typographic rhythm в макете.",
        en: "It does not replace visual review of typographic rhythm in a layout.",
      },
    ],
    useCases: [
      {
        ru: "Подготовка font-size tokens для UI kit.",
        en: "Preparing font-size tokens for a UI kit.",
      },
      {
        ru: "Сравнение ratio перед редизайном typography scale.",
        en: "Comparing a ratio before redesigning a typography scale.",
      },
      {
        ru: "Быстрая генерация px/rem значений для документации.",
        en: "Quickly generating px/rem values for documentation.",
      },
    ],
    technicalNotes: [
      {
        ru: "Каждый шаг считается как base × ratio^step.",
        en: "Each step is calculated as base multiplied by ratio to the step power.",
      },
      {
        ru: "Диапазон ограничен, чтобы output оставался читаемым и предсказуемым.",
        en: "The range is bounded so output remains readable and predictable.",
      },
    ],
    faq: [
      { question: { ru: "Как подобрать размеры заголовков и основного текста?", en: "How can I choose sizes for headings and body text?" }, answer: { ru: "Укажите базовый размер и коэффициент изменения. Генератор рассчитает последовательность размеров, которую можно использовать в стилях. Сравните её на реальных заголовках и абзацах: один коэффициент не подходит всем интерфейсам.", en: "Enter a base size and scale ratio. The generator calculates a sequence of sizes for your styles. Try it with real headings and paragraphs; one ratio will not suit every interface." } },
      { question: { ru: "Генератор подберёт шрифт и расстояние между строками?", en: "Will the generator choose a font and line spacing?" }, answer: { ru: "Он рассчитывает размеры текста. Семейство шрифта, насыщенность и межстрочный интервал нужно выбрать отдельно. После применения проверьте длинные заголовки и текст на узком экране.", en: "It calculates font sizes. Choose the font family, weight, and line height separately. After applying the sizes, check long headings and text on a narrow screen." } }
    ],
    relatedToolSlugs: [
      "px-rem-converter",
      "color-converter",
      "css-specificity-calculator",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/font-size"],
  }),
  toolPage({
    slug: "gradient-generator",
    seoTitle: {
      ru: "Генератор CSS-градиентов с live preview",
      en: "CSS Gradient Generator with Live Preview",
    },
    metaDescription: {
      ru: "Собирайте linear и radial CSS-градиенты из двух HEX-цветов, угла и stop-позиций прямо в браузере без изображений и внешних библиотек.",
      en: "Build linear and radial CSS gradients from two HEX colors, an angle, and stop positions directly in the browser without images or external libraries.",
    },
    h1: { ru: "Генератор CSS-градиентов", en: "CSS Gradient Generator" },
    lead: {
      ru: "Настройте безопасный CSS gradient, проверьте preview и скопируйте готовую declaration для интерфейсного слоя или design token.",
      en: "Configure a safe CSS gradient, review the preview, and copy a ready declaration for UI styling or design tokens.",
    },
    quickFacts: [
      { ru: "Linear и radial", en: "Linear and radial" },
      { ru: "HEX color stops", en: "HEX color stops" },
      { ru: "Без remote assets", en: "No remote assets" },
    ],
    howToSteps: [
      {
        ru: "Выберите linear или radial mode.",
        en: "Choose linear or radial mode.",
      },
      {
        ru: "Введите два HEX-цвета и stop-позиции.",
        en: "Enter two HEX colors and stop positions.",
      },
      {
        ru: "Скопируйте готовую CSS declaration после проверки preview.",
        en: "Copy the generated CSS declaration after checking the preview.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Linear gradient с углом 0–360 градусов.",
        en: "Linear gradient with a 0–360 degree angle.",
      },
      {
        ru: "Radial gradient circle at center для базовых UI surfaces.",
        en: "Radial gradient circle at center for basic UI surfaces.",
      },
      {
        ru: "Проверка HEX 3/6 символов и диапазона stop-позиций 0–100%.",
        en: "Validation for 3/6-digit HEX and 0–100% stop positions.",
      },
    ],
    limitations: [
      {
        ru: "Инструмент поддерживает две цветовые точки, а не сложную multi-stop палитру.",
        en: "The tool supports two color stops, not a complex multi-stop palette.",
      },
      {
        ru: "Он не анализирует существующие CSS-файлы и не проверяет брендовые design tokens.",
        en: "It does not analyze existing CSS files or validate brand design tokens.",
      },
    ],
    useCases: [
      {
        ru: "Быстрый background для hero, карточки или CTA.",
        en: "Quick background for a hero, card, or CTA.",
      },
      {
        ru: "Подбор gradient token перед переносом в дизайн-систему.",
        en: "Choosing a gradient token before moving it into a design system.",
      },
      {
        ru: "Проверка угла и stop-позиций без ручного CSS набора.",
        en: "Checking angle and stop positions without hand-writing CSS.",
      },
    ],
    technicalNotes: [
      {
        ru: "Preview использует только валидированные HEX-цвета и числовые значения.",
        en: "The preview uses only validated HEX colors and numeric values.",
      },
      {
        ru: "Генератор выдаёт plain CSS и не создаёт изображения или JavaScript snippets.",
        en: "The generator emits plain CSS and does not create images or JavaScript snippets.",
      },
    ],
    faq: [
      { question: { ru: "Как сделать градиент и перенести его на сайт?", en: "How do I create a gradient and use it on my site?" }, answer: { ru: "Выберите два цвета, тип градиента и доступные настройки направления и положения. Сравните предпросмотр и скопируйте полученное CSS-значение в стили нужного элемента.", en: "Choose two colours, a gradient type, and the available direction and position settings. Check the preview and copy the CSS value into the relevant element's styles." } },
      { question: { ru: "Можно ли добавить третий цвет?", en: "Can I add a third colour?" }, answer: { ru: "В этом генераторе используются два цвета. Для более сложного перехода отредактируйте скопированный CSS самостоятельно и проверьте его в браузере. Предпросмотр здесь показывает только заданную пару цветов.", en: "This generator uses two colours. Edit the copied CSS yourself for a more complex transition and test it in a browser. The preview here shows only the selected colour pair." } }
    ],
    relatedToolSlugs: [
      "color-contrast-checker",
      "box-shadow-generator",
      "border-radius-generator",
    ],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/CSS/gradient/linear-gradient",
    ],
  }),
  toolPage({
    slug: "box-shadow-generator",
    seoTitle: {
      ru: "Генератор CSS box-shadow с preview",
      en: "CSS box-shadow Generator with Preview",
    },
    metaDescription: {
      ru: "Настройте offset, blur, spread, HEX-цвет и opacity для box-shadow, посмотрите preview и скопируйте готовый CSS прямо в браузере.",
      en: "Tune offset, blur, spread, HEX color, and opacity for box-shadow, preview the result, and copy ready CSS directly in the browser.",
    },
    h1: { ru: "Генератор CSS box-shadow", en: "CSS box-shadow Generator" },
    lead: {
      ru: "Соберите аккуратную тень карточки или панели из явных числовых параметров без сторонних библиотек и скрытых CSS side effects.",
      en: "Build a clean card or panel shadow from explicit numeric parameters without third-party libraries or hidden CSS side effects.",
    },
    quickFacts: [
      { ru: "Offset/blur/spread", en: "Offset/blur/spread" },
      { ru: "HEX + opacity", en: "HEX + opacity" },
      { ru: "Copyable CSS", en: "Copyable CSS" },
    ],
    howToSteps: [
      {
        ru: "Укажите X/Y offset, blur и spread.",
        en: "Enter X/Y offset, blur, and spread.",
      },
      {
        ru: "Выберите HEX-цвет и opacity от 0 до 1.",
        en: "Choose a HEX color and opacity from 0 to 1.",
      },
      {
        ru: "Проверьте preview и скопируйте declaration.",
        en: "Check the preview and copy the declaration.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Отрицательные X/Y offsets в bounded диапазоне.",
        en: "Negative X/Y offsets within a bounded range.",
      },
      {
        ru: "Blur до 400 px и spread от -200 до 200 px.",
        en: "Blur up to 400 px and spread from -200 to 200 px.",
      },
      {
        ru: "HEX to rgba conversion для контролируемой прозрачности.",
        en: "HEX to rgba conversion for controlled opacity.",
      },
    ],
    limitations: [
      {
        ru: "Multiple shadows и inset mode пока не поддерживаются.",
        en: "Multiple shadows and inset mode are not supported yet.",
      },
      {
        ru: "Инструмент не проверяет визуальную доступность всей дизайн-системы.",
        en: "The tool does not validate visual accessibility across a full design system.",
      },
    ],
    useCases: [
      {
        ru: "Подбор shadow token для карточек и dropdown.",
        en: "Choosing a shadow token for cards and dropdowns.",
      },
      {
        ru: "Смягчение border-heavy интерфейса через elevation.",
        en: "Replacing border-heavy UI with elevation.",
      },
      {
        ru: "Быстрая проверка тени перед переносом в CSS variables.",
        en: "Quickly checking a shadow before moving it into CSS variables.",
      },
    ],
    technicalNotes: [
      {
        ru: "Цвет выводится как rgba после безопасного HEX parsing.",
        en: "The color is emitted as rgba after safe HEX parsing.",
      },
      {
        ru: "Все числовые параметры ограничены, чтобы исключить случайные огромные CSS values.",
        en: "All numeric parameters are bounded to avoid accidental huge CSS values.",
      },
    ],
    faq: [
      { question: { ru: "Как настроить мягкую тень блока?", en: "How can I create a soft box shadow?" }, answer: { ru: "Задайте смещение, размытие, размер, цвет и прозрачность тени. Смотрите на предпросмотр, затем скопируйте CSS для своего элемента. На реальном фоне сайта результат может выглядеть иначе.", en: "Adjust the offset, blur, spread, colour, and opacity. Check the preview, then copy the CSS for your element. The result may look different against your site's actual background." } },
      { question: { ru: "Можно ли получить несколько теней для одного элемента?", en: "Can I create several shadows for one element?" }, answer: { ru: "Форма создаёт одну тень. Если нужны несколько, добавьте другие значения в CSS через запятую после копирования. Проверяйте итоговый вид на странице, где будет применена тень.", en: "The form generates one shadow. If you need several, add more comma-separated values to the copied CSS. Check the final appearance on the page where the shadow will be used." } }
    ],
    relatedToolSlugs: [
      "gradient-generator",
      "border-radius-generator",
      "color-contrast-checker",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/box-shadow"],
  }),
  toolPage({
    slug: "border-radius-generator",
    seoTitle: {
      ru: "Генератор CSS border-radius для четырёх углов",
      en: "Four-Corner CSS border-radius Generator",
    },
    metaDescription: {
      ru: "Настройте border-radius для каждого угла, проверьте форму на preview и скопируйте короткую CSS declaration без canvas и внешних зависимостей.",
      en: "Set border-radius for each corner, inspect the shape in a preview, and copy a compact CSS declaration without canvas or external dependencies.",
    },
    h1: {
      ru: "Генератор CSS border-radius",
      en: "CSS border-radius Generator",
    },
    lead: {
      ru: "Рассчитайте shorthand border-radius для четырёх углов и быстро проверьте геометрию панели, кнопки или карточки.",
      en: "Calculate a four-corner border-radius shorthand and quickly review the geometry for a panel, button, or card.",
    },
    quickFacts: [
      { ru: "4 угла", en: "4 corners" },
      { ru: "0–240 px", en: "0–240 px" },
      { ru: "Live preview", en: "Live preview" },
    ],
    howToSteps: [
      {
        ru: "Введите radius для каждого угла в px.",
        en: "Enter the radius for each corner in px.",
      },
      {
        ru: "Проверьте форму в preview-блоке.",
        en: "Review the shape in the preview block.",
      },
      {
        ru: "Скопируйте готовый shorthand для CSS.",
        en: "Copy the generated CSS shorthand.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Top-left, top-right, bottom-right и bottom-left значения.",
        en: "Top-left, top-right, bottom-right, and bottom-left values.",
      },
      {
        ru: "Bounded numeric validation от 0 до 240 px.",
        en: "Bounded numeric validation from 0 to 240 px.",
      },
      {
        ru: "Короткий shorthand output в стандартном CSS порядке.",
        en: "Compact shorthand output in standard CSS order.",
      },
    ],
    limitations: [
      {
        ru: "Elliptical slash syntax не поддерживается в этом batch.",
        en: "Elliptical slash syntax is not supported in this batch.",
      },
      {
        ru: "Инструмент не измеряет реальные размеры DOM-элемента.",
        en: "The tool does not measure a real DOM element's dimensions.",
      },
    ],
    useCases: [
      {
        ru: "Подбор radius token для карточек и модальных окон.",
        en: "Choosing a radius token for cards and modals.",
      },
      {
        ru: "Проверка асимметричной формы для UI-компонента.",
        en: "Testing an asymmetric shape for a UI component.",
      },
      {
        ru: "Быстрое получение shorthand вместо четырёх ручных declarations.",
        en: "Getting shorthand quickly instead of writing four declarations.",
      },
    ],
    technicalNotes: [
      {
        ru: "Порядок output: top-left, top-right, bottom-right, bottom-left.",
        en: "Output order is top-left, top-right, bottom-right, bottom-left.",
      },
      {
        ru: "Значения ограничены px, чтобы сохранить простой и проверяемый генератор.",
        en: "Values are limited to px to keep the generator simple and verifiable.",
      },
    ],
    faq: [
      { question: { ru: "Как сделать разное скругление у каждого угла?", en: "How do I give each corner a different radius?" }, answer: { ru: "Укажите значение в пикселях для каждого угла. Предпросмотр поможет сравнить форму, а результат можно скопировать в CSS. Порядок значений: левый верхний, правый верхний, правый нижний и левый нижний угол.", en: "Enter a pixel value for each corner. Compare the shape in the preview and copy the result into CSS. Values run from top-left to top-right, bottom-right, and bottom-left." } },
      { question: { ru: "Можно ли сделать скругление в процентах?", en: "Can I use percentage corner radii?" }, answer: { ru: "Поля этого генератора принимают значения в пикселях. Если нужны проценты, измените единицы в полученном CSS самостоятельно. Затем проверьте форму на элементах разного размера.", en: "This generator's fields accept pixel values. Change the units in the generated CSS yourself if you need percentages, then test the shape on elements of different sizes." } }
    ],
    relatedToolSlugs: [
      "box-shadow-generator",
      "gradient-generator",
      "px-rem-converter",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/border-radius"],
  }),
  toolPage({
    slug: "landmark-structure-analyzer",
    seoTitle: {
      ru: "Анализ структуры landmarks страницы",
      en: "Page Landmark Structure Analyzer",
    },
    metaDescription: {
      ru: "Проверьте main, navigation, banner, contentinfo, complementary, search, form и region landmarks в исходном HTML без fake WCAG-оценки.",
      en: "Inspect main, navigation, banner, contentinfo, complementary, search, form, and region landmarks in source HTML without a fake WCAG score.",
    },
    h1: { ru: "Анализ структуры landmarks", en: "Landmark Structure Analyzer" },
    lead: {
      ru: "Получите bounded inventory семантических и ARIA landmarks, их доступных имён, дублей и структурных конфликтов.",
      en: "Get a bounded inventory of semantic and ARIA landmarks, their accessible names, duplicates, and structural conflicts.",
    },
    quickFacts: [
      { ru: "Один safe fetch", en: "One safe fetch" },
      { ru: "До 150 элементов", en: "Up to 150 items" },
      { ru: "Без browser runtime", en: "No browser runtime" },
    ],
    howToSteps: [
      {
        ru: "Введите публичный HTTP/HTTPS URL.",
        en: "Enter a public HTTP/HTTPS URL.",
      },
      {
        ru: "Запустите bounded static HTML scan.",
        en: "Run the bounded static HTML scan.",
      },
      {
        ru: "Проверьте main, повторяющиеся landmarks и различимость имён.",
        en: "Review main, repeated landmarks, and distinguishable names.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Семантические header, nav, main, footer, aside, form, section и search candidates.",
        en: "Semantic header, nav, main, footer, aside, form, section, and search candidates.",
      },
      {
        ru: "Явные ARIA roles banner, navigation, main, contentinfo, complementary, search, form и region.",
        en: "Explicit ARIA roles for banner, navigation, main, contentinfo, complementary, search, form, and region.",
      },
      {
        ru: "aria-label, aria-labelledby, duplicate role/name, hidden signals и nested main review.",
        en: "aria-label, aria-labelledby, duplicate role/name, hidden signals, and nested-main review.",
      },
    ],
    limitations: [
      {
        ru: "JavaScript и browser accessibility tree не выполняются.",
        en: "JavaScript and the browser accessibility tree are not executed.",
      },
      {
        ru: "Статус означает только выбранные static findings, а не соответствие WCAG.",
        en: "Status covers only selected static findings, not WCAG conformance.",
      },
    ],
    useCases: [
      {
        ru: "Проверка layout-шаблона после редизайна.",
        en: "Reviewing a layout template after a redesign.",
      },
      {
        ru: "Поиск нескольких main или одинаково названных nav.",
        en: "Finding multiple main landmarks or identically named nav landmarks.",
      },
      {
        ru: "Предварительная проверка перед ручным screen-reader audit.",
        en: "Pre-screening before a manual screen-reader audit.",
      },
    ],
    technicalNotes: [
      {
        ru: "Header и footer считаются page-level candidates только вне sectioning ancestors по статической структуре.",
        en: "Header and footer are treated as page-level candidates only outside sectioning ancestors in the static structure.",
      },
      {
        ru: "Итоговую landmark mapping необходимо подтверждать в accessibility tree браузера.",
        en: "Final landmark mapping must be confirmed in the browser accessibility tree.",
      },
    ],
    faq: [
      { question: { ru: "Зачем проверять основные области страницы?", en: "Why check a page's main regions?" }, answer: { ru: "Основная часть, меню, шапка и подвал помогают пользователям вспомогательных программ перемещаться по странице. Инструмент ищет такие области в HTML и отмечает выбранные проблемы их структуры и названий.", en: "Main content, navigation, header, and footer help assistive technology users move around a page. The tool finds these regions in HTML and flags selected structural or naming concerns." } },
      { question: { ru: "Что делать после получения списка замечаний?", en: "What should I do with the findings?" }, answer: { ru: "Проверьте отмеченные области в шаблоне страницы и передайте список разработчику. После изменений повторите проверку и протестируйте страницу с клавиатуры и программой экранного доступа. Разбор HTML не заменяет такую проверку в браузере.", en: "Review the flagged regions in your page template and share the list with a developer. After changing it, rerun the check and test keyboard and screen reader use. HTML inspection does not replace those browser checks." } }
    ],
    relatedToolSlugs: [
      "form-accessibility-analyzer",
      "interactive-accessible-name-analyzer",
      "heading-structure-checker",
    ],
    sourceUrls: ["https://www.w3.org/WAI/ARIA/apg/practices/landmark-regions/"],
  }),
  toolPage({
    slug: "form-accessibility-analyzer",
    seoTitle: {
      ru: "Анализ labels и группировки HTML-форм",
      en: "HTML Form Labels and Grouping Analyzer",
    },
    metaDescription: {
      ru: "Проверьте labels, aria-labelledby, aria-describedby, placeholder-only controls, fieldset/legend и radio/checkbox grouping в исходном HTML.",
      en: "Check labels, aria-labelledby, aria-describedby, placeholder-only controls, fieldset/legend, and radio/checkbox grouping in source HTML.",
    },
    h1: { ru: "Анализ доступности форм", en: "Form Accessibility Analyzer" },
    lead: {
      ru: "Проверьте программные имена controls, связи label/ARIA, fieldset/legend и статические сигналы группировки без отправки формы.",
      en: "Review programmatic control names, label/ARIA relationships, fieldset/legend, and static grouping signals without submitting the form.",
    },
    quickFacts: [
      {
        ru: "input, select, textarea, button",
        en: "input, select, textarea, button",
      },
      { ru: "Labels и ARIA references", en: "Labels and ARIA references" },
      { ru: "Без ввода данных", en: "No data entry" },
    ],
    howToSteps: [
      {
        ru: "Введите URL страницы с формой.",
        en: "Enter the URL of a page containing a form.",
      },
      {
        ru: "Запустите static HTML analysis.",
        en: "Run the static HTML analysis.",
      },
      {
        ru: "Исправьте controls без имени, broken references и слабую группировку.",
        en: "Fix unnamed controls, broken references, and weak grouping.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Explicit и implicit label, aria-label, aria-labelledby, button text, alt и value sources.",
        en: "Explicit and implicit labels, aria-label, aria-labelledby, button text, alt, and value sources.",
      },
      {
        ru: "Placeholder-only, title-only, duplicate IDs и broken aria-describedby signals.",
        en: "Placeholder-only, title-only, duplicate ID, and broken aria-describedby signals.",
      },
      {
        ru: "Fieldset/legend и повторяющиеся radio/checkbox name groups.",
        en: "Fieldset/legend and repeated radio/checkbox name groups.",
      },
    ],
    limitations: [
      {
        ru: "Не проверяются focus order, ошибки валидации, live regions и динамические состояния.",
        en: "Focus order, validation errors, live regions, and dynamic states are not tested.",
      },
      {
        ru: "CSS visibility и browser-computed accessible names не вычисляются.",
        en: "CSS visibility and browser-computed accessible names are not calculated.",
      },
    ],
    useCases: [
      {
        ru: "Проверка формы регистрации или checkout.",
        en: "Reviewing a registration or checkout form.",
      },
      {
        ru: "Поиск placeholder вместо постоянного label.",
        en: "Finding placeholders used instead of persistent labels.",
      },
      {
        ru: "Контроль fieldset/legend для наборов вариантов.",
        en: "Checking fieldset/legend for option groups.",
      },
    ],
    technicalNotes: [
      {
        ru: "Hidden input исключается из списка пользовательских controls.",
        en: "Hidden input elements are excluded from the user-control inventory.",
      },
      {
        ru: "Submit/reset input без value учитывает стандартный default-value signal, но локализация браузера не моделируется.",
        en: "Submit/reset inputs without value use a default-value signal, but browser localization is not modeled.",
      },
    ],
    faq: [
      { question: { ru: "Почему подсказки внутри поля недостаточно вместо подписи?", en: "Why is an in-field placeholder not enough as a label?" }, answer: { ru: "Подсказка исчезает при вводе и не всегда даёт полю надёжное название для вспомогательных программ. У поля должна быть понятная подпись. Инструмент помогает найти поля, для которых в HTML обнаружена только подсказка или нет доступного имени.", en: "A placeholder disappears when typing and does not always provide a reliable accessible name. A field needs a clear label. The tool helps find controls with only a placeholder or no detected accessible name in HTML." } },
      { question: { ru: "Проверка отправит данные через форму моего сайта?", en: "Will the check submit data through my site's forms?" }, answer: { ru: "Нет. Она разбирает полученный HTML и не заполняет поля, не нажимает кнопки и не отправляет форму. Работу отправки, ошибки ввода и удобство заполнения нужно проверить отдельно.", en: "No. It inspects retrieved HTML without filling controls, clicking buttons, or submitting forms. Test submission, validation errors, and ease of completion separately." } }
    ],
    relatedToolSlugs: [
      "landmark-structure-analyzer",
      "interactive-accessible-name-analyzer",
      "color-contrast-checker",
    ],
    sourceUrls: ["https://www.w3.org/WAI/tutorials/forms/labels/"],
  }),
  toolPage({
    slug: "interactive-accessible-name-analyzer",
    seoTitle: {
      ru: "Проверка доступных имён ссылок и кнопок",
      en: "Link and Button Accessible Name Analyzer",
    },
    metaDescription: {
      ru: "Проверьте доступные имена ссылок, кнопок и role=link/button: текст, alt, ARIA, общие названия и nested interactive элементы.",
      en: "Check accessible names for links, buttons, and role=link/button: text, alt, ARIA, generic names, and nested interactive elements.",
    },
    h1: {
      ru: "Анализ доступных имён ссылок и кнопок",
      en: "Link and Button Accessible Name Analyzer",
    },
    lead: {
      ru: "Получите bounded static inventory интерактивных элементов и найдите отсутствующие, общие или неоднозначные имена.",
      en: "Get a bounded static inventory of interactive elements and find missing, generic, or ambiguous names.",
    },
    quickFacts: [
      { ru: "Links и buttons", en: "Links and buttons" },
      { ru: "Text, alt и ARIA", en: "Text, alt, and ARIA" },
      { ru: "Custom-role signals", en: "Custom-role signals" },
    ],
    howToSteps: [
      { ru: "Введите публичный URL страницы.", en: "Enter a public page URL." },
      {
        ru: "Запустите анализ исходного HTML.",
        en: "Run the source-HTML analysis.",
      },
      {
        ru: "Проверьте unnamed, generic, nested и custom-role findings.",
        en: "Review unnamed, generic, nested, and custom-role findings.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Native a/button/input/area и explicit role=link/role=button.",
        en: "Native a/button/input/area and explicit role=link/role=button.",
      },
      {
        ru: "Имена из aria-label, aria-labelledby, text, img alt, input value и title.",
        en: "Names from aria-label, aria-labelledby, text, img alt, input value, and title.",
      },
      {
        ru: "Generic names, nested interactive, duplicate IDs, javascript: href и tabindex signals.",
        en: "Generic names, nested interactive elements, duplicate IDs, javascript: href, and tabindex signals.",
      },
    ],
    limitations: [
      {
        ru: "Event listeners и keyboard activation не исполняются.",
        en: "Event listeners and keyboard activation are not executed.",
      },
      {
        ru: "Контекст соседнего текста и итоговый accessible-name computation браузера могут отличаться.",
        en: "Nearby context and the browser's final accessible-name computation may differ.",
      },
    ],
    useCases: [
      {
        ru: "Поиск icon-only buttons без aria-label.",
        en: "Finding icon-only buttons without aria-label.",
      },
      {
        ru: "Проверка ссылок «Подробнее» с разными destinations.",
        en: "Reviewing 'Read more' links with different destinations.",
      },
      {
        ru: "Поиск div role=button без focus signal.",
        en: "Finding div role=button elements without a focus signal.",
      },
    ],
    technicalNotes: [
      {
        ru: "Generic-name detection использует прозрачный ограниченный словарь и требует ручного контекста.",
        en: "Generic-name detection uses a transparent limited dictionary and requires manual context review.",
      },
      {
        ru: "tabindex=0 — только static signal; наличие Enter/Space handlers инструмент не доказывает.",
        en: "tabindex=0 is only a static signal; the tool does not prove Enter/Space handlers exist.",
      },
    ],
    faq: [
      { question: { ru: "Почему кнопке с иконкой нужно понятное название?", en: "Why does an icon button need a clear name?" }, answer: { ru: "По одной иконке программа экранного доступа может не понять назначение кнопки. Инструмент ищет названия ссылок и кнопок в HTML и помогает найти элементы, назначение которых требует проверки.", en: "A screen reader may not be able to determine a button's purpose from its icon alone. The tool looks for link and button names in HTML and helps identify elements whose purpose needs review." } },
      { question: { ru: "Как проверить исправление названия кнопки?", en: "How can I verify a button name fix?" }, answer: { ru: "Убедитесь, что название описывает действие, затем повторите проверку страницы. Дополнительно послушайте кнопку программой экранного доступа: её итоговое имя в браузере может отличаться от того, что удалось определить по исходному HTML.", en: "Make sure the name describes the action, then rerun the page check. Also listen to it with a screen reader: the final browser name can differ from what was inferred from source HTML." } }
    ],
    relatedToolSlugs: [
      "form-accessibility-analyzer",
      "landmark-structure-analyzer",
      "color-contrast-checker",
    ],
    sourceUrls: [
      "https://www.w3.org/WAI/WCAG22/Understanding/name-role-value.html",
    ],
  }),
  toolPage({
    slug: "clip-path-generator",
    seoTitle: {
      ru: "Генератор CSS clip-path с preview",
      en: "CSS clip-path Generator with Preview",
    },
    metaDescription: {
      ru: "Соберите bounded clip-path для inset, circle, ellipse или четырёхточечного polygon прямо в браузере и скопируйте CSS declaration.",
      en: "Build a bounded clip-path for inset, circle, ellipse, or a four-point polygon directly in the browser and copy the CSS declaration.",
    },
    h1: { ru: "Генератор CSS clip-path", en: "CSS clip-path Generator" },
    lead: {
      ru: "Настройте простую shape mask без canvas, SVG export или runtime parsing полного CSS.",
      en: "Configure a simple shape mask without canvas, SVG export, or runtime parsing of full CSS.",
    },
    quickFacts: [
      {
        ru: "Inset/circle/ellipse/polygon",
        en: "Inset/circle/ellipse/polygon",
      },
      { ru: "0–100% values", en: "0–100% values" },
      { ru: "Локальный preview", en: "Local preview" },
    ],
    howToSteps: [
      { ru: "Выберите shape mode.", en: "Choose the shape mode." },
      {
        ru: "Введите bounded процентные значения.",
        en: "Enter bounded percentage values.",
      },
      {
        ru: "Проверьте preview и скопируйте clip-path declaration.",
        en: "Check the preview and copy the clip-path declaration.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Inset, circle, ellipse и polygon из четырёх точек.",
        en: "Inset, circle, ellipse, and four-point polygon.",
      },
      {
        ru: "Проверка значений в диапазоне 0–100%.",
        en: "Validation for values in the 0–100% range.",
      },
      {
        ru: "Вывод plain CSS без изображения или SVG export.",
        en: "Plain CSS output without image or SVG export.",
      },
    ],
    limitations: [
      {
        ru: "Инструмент не является полноценным vector editor и не поддерживает произвольное число polygon points.",
        en: "The tool is not a full vector editor and does not support an arbitrary number of polygon points.",
      },
      {
        ru: "Сложные path() values и browser-specific rendering differences не анализируются.",
        en: "Complex path() values and browser-specific rendering differences are not analyzed.",
      },
    ],
    useCases: [
      {
        ru: "Быстрая shape mask для карточки, hero image или decorative surface.",
        en: "Quick shape mask for a card, hero image, or decorative surface.",
      },
      {
        ru: "Проверка процента перед переносом в design token.",
        en: "Checking percentages before moving them into a design token.",
      },
      {
        ru: "Прототипирование simple CSS-only visual effect.",
        en: "Prototyping a simple CSS-only visual effect.",
      },
    ],
    technicalNotes: [
      {
        ru: "Все значения валидируются как проценты и не выполняют пользовательский CSS.",
        en: "All values are validated as percentages and user CSS is not executed.",
      },
      {
        ru: "Preview применяет только сгенерированное clip-path value.",
        en: "The preview applies only the generated clip-path value.",
      },
    ],
    faq: [
      { question: { ru: "Как получить CSS для фигурной обрезки элемента?", en: "How can I generate CSS for a shaped clipping area?" }, answer: { ru: "Выберите поддерживаемую форму и настройте её параметры. Сравните предпросмотр и скопируйте свойство clip-path в стили элемента. Это меняет видимую область в браузере, но не обрезает исходный файл изображения.", en: "Choose a supported shape and adjust its settings. Check the preview and copy the clip-path property into your element's styles. It changes the visible area in the browser without cropping the original image file." } },
      { question: { ru: "Можно ли нарисовать произвольную сложную фигуру?", en: "Can I draw an arbitrary complex shape?" }, answer: { ru: "Доступны формы и параметры, показанные в инструменте; многоугольник ограничен четырьмя точками. Для более сложного контура отредактируйте CSS отдельно. Генератор не является редактором SVG-контуров.", en: "Use the shapes and settings shown in the tool; polygons are limited to four points. Edit CSS separately for a more complex outline. The generator is not an SVG path editor." } }
    ],
    relatedToolSlugs: [
      "border-radius-generator",
      "css-filter-playground",
      "gradient-generator",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/clip-path"],
  }),
  toolPage({
    slug: "css-filter-playground",
    seoTitle: {
      ru: "CSS filter playground с copyable output",
      en: "CSS filter Playground with Copyable Output",
    },
    metaDescription: {
      ru: "Настройте blur, brightness, contrast, grayscale, saturate и hue-rotate, проверьте preview и скопируйте bounded CSS filter declaration.",
      en: "Tune blur, brightness, contrast, grayscale, saturate, and hue-rotate, preview the result, and copy a bounded CSS filter declaration.",
    },
    h1: { ru: "CSS Filter Playground", en: "CSS Filter Playground" },
    lead: {
      ru: "Соберите безопасную CSS filter declaration без загрузки изображений, canvas export или внешних библиотек.",
      en: "Build a safe CSS filter declaration without image uploads, canvas export, or external libraries.",
    },
    quickFacts: [
      { ru: "6 filter functions", en: "6 filter functions" },
      { ru: "Bounded ranges", en: "Bounded ranges" },
      { ru: "Live preview", en: "Live preview" },
    ],
    howToSteps: [
      {
        ru: "Введите значения filter functions.",
        en: "Enter filter-function values.",
      },
      { ru: "Проверьте preview sample.", en: "Check the preview sample." },
      {
        ru: "Скопируйте готовую filter declaration.",
        en: "Copy the generated filter declaration.",
      },
    ],
    supportedFeatures: [
      {
        ru: "blur, brightness, contrast, grayscale, saturate и hue-rotate.",
        en: "blur, brightness, contrast, grayscale, saturate, and hue-rotate.",
      },
      {
        ru: "Проверка bounded numeric ranges.",
        en: "Validation of bounded numeric ranges.",
      },
      {
        ru: "Plain CSS declaration output.",
        en: "Plain CSS declaration output.",
      },
    ],
    limitations: [
      {
        ru: "Инструмент не загружает изображения и не экспортирует raster result.",
        en: "The tool does not upload images or export a raster result.",
      },
      {
        ru: "Backdrop-filter и SVG filter graph не поддерживаются.",
        en: "Backdrop-filter and SVG filter graphs are not supported.",
      },
    ],
    useCases: [
      {
        ru: "Прототип hover-state или disabled-state effect.",
        en: "Prototyping a hover-state or disabled-state effect.",
      },
      {
        ru: "Подбор filter token для UI surface.",
        en: "Choosing a filter token for a UI surface.",
      },
      {
        ru: "Быстрая проверка numeric range перед CSS implementation.",
        en: "Quickly checking a numeric range before CSS implementation.",
      },
    ],
    technicalNotes: [
      {
        ru: "Output состоит только из фиксированного набора filter functions.",
        en: "The output consists only of a fixed set of filter functions.",
      },
      {
        ru: "Пользовательский raw CSS не выполняется.",
        en: "User-provided raw CSS is not executed.",
      },
    ],
    faq: [
      { question: { ru: "Как подобрать яркость, контраст и другие CSS-фильтры?", en: "How can I choose brightness, contrast, and other CSS filters?" }, answer: { ru: "Изменяйте доступные параметры и сравнивайте пример в предпросмотре. Скопируйте свойство filter и примените его к нужному элементу на сайте. Затем проверьте результат на своём изображении.", en: "Adjust the available settings and compare the sample preview. Copy the filter property to the relevant element on your site, then check it on your own image." } },
      { question: { ru: "Можно ли скачать обработанную фотографию?", en: "Can I download a filtered photo?" }, answer: { ru: "Здесь создаётся CSS-код, а не новый графический файл. Собственная фотография в инструмент не загружается. Чтобы сохранить изменённые пиксели в отдельный файл, используйте редактор изображений.", en: "This tool generates CSS rather than a new image file. It does not upload your own photo. Use an image editor if you need the changed pixels saved to a separate file." } }
    ],
    relatedToolSlugs: [
      "clip-path-generator",
      "gradient-generator",
      "box-shadow-generator",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/filter"],
  }),
  toolPage({
    slug: "css-grid-generator",
    seoTitle: {
      ru: "CSS Grid Generator для bounded layout",
      en: "CSS Grid Generator for Bounded Layouts",
    },
    metaDescription: {
      ru: "Соберите базовый CSS Grid container: columns, rows, gap и minmax column size с copyable CSS output прямо в браузере.",
      en: "Build a basic CSS Grid container: columns, rows, gap, and minmax column size with copyable CSS output directly in the browser.",
    },
    h1: { ru: "CSS Grid Generator", en: "CSS Grid Generator" },
    lead: {
      ru: "Настройте простой grid container для layout prototype без drag-and-drop редактора и без анализа существующих stylesheet.",
      en: "Configure a simple grid container for a layout prototype without a drag-and-drop editor or existing stylesheet analysis.",
    },
    quickFacts: [
      { ru: "1–12 columns", en: "1–12 columns" },
      { ru: "1–8 rows", en: "1–8 rows" },
      { ru: "minmax columns", en: "minmax columns" },
    ],
    howToSteps: [
      {
        ru: "Укажите число колонок и рядов.",
        en: "Enter the number of columns and rows.",
      },
      {
        ru: "Настройте gap и минимальную ширину колонки.",
        en: "Tune the gap and minimum column width.",
      },
      {
        ru: "Скопируйте container CSS declaration block.",
        en: "Copy the container CSS declaration block.",
      },
    ],
    supportedFeatures: [
      {
        ru: "repeat() + minmax() columns.",
        en: "repeat() + minmax() columns.",
      },
      {
        ru: "Bounded rows and gap values.",
        en: "Bounded rows and gap values.",
      },
      {
        ru: "Plain CSS block for container usage.",
        en: "Plain CSS block for container usage.",
      },
    ],
    limitations: [
      {
        ru: "Grid areas, named lines, subgrid и responsive breakpoints не генерируются.",
        en: "Grid areas, named lines, subgrid, and responsive breakpoints are not generated.",
      },
      {
        ru: "Инструмент не анализирует DOM и не является visual layout builder.",
        en: "The tool does not analyze the DOM and is not a visual layout builder.",
      },
    ],
    useCases: [
      {
        ru: "Быстрый старт для cards grid или dashboard surface.",
        en: "Quick start for a cards grid or dashboard surface.",
      },
      {
        ru: "Подбор gap/minmax values перед реализацией.",
        en: "Choosing gap/minmax values before implementation.",
      },
      {
        ru: "Документация базового layout token.",
        en: "Documenting a basic layout token.",
      },
    ],
    technicalNotes: [
      {
        ru: "Columns ограничены 12, rows — 8, чтобы output оставался компактным.",
        en: "Columns are limited to 12 and rows to 8 so the output stays compact.",
      },
      {
        ru: "Инструмент генерирует только container declarations.",
        en: "The tool generates container declarations only.",
      },
    ],
    faq: [
      { question: { ru: "Как создать сетку из колонок и строк?", en: "How do I create a grid of columns and rows?" }, answer: { ru: "Укажите их количество, расстояния и доступные параметры ширины. Предпросмотр покажет расположение элементов. Скопируйте полученный CSS в стили контейнера и добавьте собственное содержимое на странице.", en: "Set the column and row counts, gaps, and available width settings. The preview shows item placement. Copy the generated CSS into the container's styles and add your own page content." } },
      { question: { ru: "Будет ли сетка сразу адаптирована под телефон?", en: "Will the grid automatically include a mobile layout?" }, answer: { ru: "Генератор создаёт один набор CSS-правил и не добавляет отдельные правила для ширины экрана. Проверьте сетку на узком экране и при необходимости настройте количество колонок и дополнительные стили самостоятельно.", en: "The generator creates one set of CSS rules without separate screen-width rules. Test the grid on a narrow screen and adjust column counts or add responsive styles as needed." } }
    ],
    relatedToolSlugs: [
      "flexbox-playground",
      "typography-scale-generator",
      "px-rem-converter",
    ],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/CSS_grid_layout"],
  }),
  toolPage({
    slug: "flexbox-playground",
    seoTitle: {
      ru: "Flexbox Playground для container CSS",
      en: "Flexbox Playground for Container CSS",
    },
    metaDescription: {
      ru: "Настройте flex-direction, justify-content, align-items, gap и wrap, затем скопируйте bounded CSS container declaration.",
      en: "Configure flex-direction, justify-content, align-items, gap, and wrap, then copy a bounded CSS container declaration.",
    },
    h1: { ru: "Flexbox Playground", en: "Flexbox Playground" },
    lead: {
      ru: "Соберите базовую flex container declaration без drag-and-drop layout builder и без исполнения произвольного CSS.",
      en: "Build a basic flex container declaration without a drag-and-drop layout builder or arbitrary CSS execution.",
    },
    quickFacts: [
      { ru: "Direction/justify/align", en: "Direction/justify/align" },
      { ru: "Gap + wrap", en: "Gap + wrap" },
      { ru: "Plain CSS output", en: "Plain CSS output" },
    ],
    howToSteps: [
      { ru: "Выберите flex-direction.", en: "Choose flex-direction." },
      {
        ru: "Настройте justify-content, align-items, gap и wrap.",
        en: "Tune justify-content, align-items, gap, and wrap.",
      },
      {
        ru: "Скопируйте CSS declaration block.",
        en: "Copy the CSS declaration block.",
      },
    ],
    supportedFeatures: [
      {
        ru: "Основные flex-direction values.",
        en: "Core flex-direction values.",
      },
      {
        ru: "Основные justify-content и align-items values.",
        en: "Core justify-content and align-items values.",
      },
      {
        ru: "Bounded gap и flex-wrap toggle.",
        en: "Bounded gap and flex-wrap toggle.",
      },
    ],
    limitations: [
      {
        ru: "Инструмент не генерирует child item rules, order или flex-basis.",
        en: "The tool does not generate child item rules, order, or flex-basis.",
      },
      {
        ru: "Он не симулирует реальные content sizes и wrapping edge cases.",
        en: "It does not simulate real content sizes or wrapping edge cases.",
      },
    ],
    useCases: [
      {
        ru: "Базовая настройка toolbar, card row или navigation group.",
        en: "Basic setup for a toolbar, card row, or navigation group.",
      },
      {
        ru: "Сравнение alignment values перед внедрением.",
        en: "Comparing alignment values before implementation.",
      },
      {
        ru: "Фиксация container declaration для UI kit documentation.",
        en: "Capturing a container declaration for UI kit documentation.",
      },
    ],
    technicalNotes: [
      {
        ru: "Output ограничен container-level declarations.",
        en: "The output is limited to container-level declarations.",
      },
      {
        ru: "Gap ограничен 0–64 px для компактного и предсказуемого CSS.",
        en: "Gap is limited to 0–64 px for compact, predictable CSS.",
      },
    ],
    faq: [
      { question: { ru: "Как выровнять элементы по центру или распределить между ними место?", en: "How can I centre items or distribute space between them?" }, answer: { ru: "Выберите направление, выравнивание и расстояние между элементами. Посмотрите результат на примере и скопируйте CSS для родительского контейнера. Содержимое и размеры своих элементов нужно проверить на странице.", en: "Choose direction, alignment, and gaps. Check the sample result and copy the CSS for the parent container. Test your own item content and sizes on the actual page." } },
      { question: { ru: "Что делать, если элементы не помещаются в строку?", en: "What should I do when items do not fit in one row?" }, answer: { ru: "Проверьте настройку переноса и доступную ширину контейнера. Генератор задаёт правила контейнера; ширина, сжатие и рост отдельных элементов настраиваются отдельно. Используйте предпросмотр как основу, затем проверьте реальное содержимое.", en: "Check wrapping and the available container width. The generator sets container rules; individual item widths, shrinking, and growing are configured separately. Use the preview as a starting point, then test real content." } }
    ],
    relatedToolSlugs: [
      "css-grid-generator",
      "typography-scale-generator",
      "px-rem-converter",
    ],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/CSS/CSS_flexible_box_layout",
    ],
  }),
] as const;
