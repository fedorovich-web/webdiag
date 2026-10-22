import { toolPage } from "./shared";

export const mediaUtilityToolPages = [
  toolPage({
    slug: "image-optimizer",
    seoTitle: { ru: "Сжатие PNG, JPEG, WebP и AVIF онлайн", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
    metaDescription: { ru: "Сжимайте изображения в AVIF, WebP, JPEG или PNG с выбранным качеством. WebP, JPEG и PNG обрабатываются в браузере. Для AVIF файл отправляется в конвертер WebDiag без сохранения.", en: "Compress images as AVIF, WebP, JPEG, or PNG with selected quality. WebP, JPEG and PNG are processed in the browser. AVIF uses the WebDiag converter without storage." },
    h1: { ru: "Сжатие PNG, JPEG, WebP и AVIF", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
    lead: { ru: "Повторно закодируйте одно изображение с выбранным форматом и качеством, сравните итоговый размер и скачайте результат.", en: "Re-encode one image with a selected format and quality, compare the resulting size, and download the output." },
    quickFacts: [
      { ru: "Один файл", en: "One file" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
      { ru: "Canvas re-encode", en: "Canvas re-encode" },
    ],
    howToSteps: [
      { ru: "Выберите изображение на устройстве.", en: "Choose an image from your device." },
      { ru: "Укажите формат и качество результата.", en: "Select the output format and quality." },
      { ru: "Запустите обработку, сравните размер и скачайте файл.", en: "Run processing, compare sizes, and download the file." },
    ],
    supportedFeatures: [
      { ru: "Декодирование форматов, поддерживаемых текущим браузером.", en: "Decoding formats supported by the current browser." },
      { ru: "Вывод AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "AVIF, WebP, JPEG, or PNG output." },
      { ru: "Настройка качества для форматов, где браузер её учитывает.", en: "Quality control for formats where the browser applies it." },
    ],
    limitations: [
      { ru: "Пакетная обработка и сохранение метаданных не поддерживаются.", en: "Batch processing and metadata preservation are not supported." },
      { ru: "Уменьшение размера не гарантируется: результат зависит от исходника, формата и качества.", en: "A smaller file is not guaranteed; output depends on the source, format, and quality." },
    ],
    useCases: [
      { ru: "Подготовка изображения для веб-страницы.", en: "Preparing an image for a webpage." },
      { ru: "Сравнение JPEG и WebP для одного исходника.", en: "Comparing JPEG and WebP for the same source." },
      { ru: "Быстрое уменьшение веса изображения перед отправкой.", en: "Quickly reducing an image before sharing." },
    ],
    technicalNotes: [
      { ru: "Инструмент рисует изображение на Canvas и создаёт новый Blob.", en: "The tool draws the image to Canvas and creates a new Blob." },
      { ru: "Повторное кодирование может изменить цветовой профиль, metadata и точное представление пикселей.", en: "Re-encoding can change color-profile data, metadata, and exact pixel representation." },
    ],
    faq: [
      { question: { ru: "Как уменьшить файл и сохранить приемлемое качество?", en: "How can I reduce file size while keeping acceptable quality?" }, answer: { ru: "Выберите изображение, формат результата и качество, затем сравните полученный файл с оригиналом. Если появились заметные искажения, увеличьте качество. Уже сжатый файл может не стать меньше — проверьте итоговый размер перед скачиванием.", en: "Choose an image, output format, and quality, then compare the result with the original. Increase quality if visible artefacts appear. An already compressed file may not get smaller, so check the output size before downloading." } },
      { question: { ru: "Какие форматы доступны и куда отправляется изображение?", en: "Which formats are available, and where is the image processed?" }, answer: { ru: "Можно выбрать JPEG, PNG, WebP или AVIF. JPEG, PNG и WebP обрабатываются в браузере. При выборе AVIF изображение отправляется в конвертер WebDiag, обрабатывается в памяти сервера и не сохраняется.", en: "You can choose JPEG, PNG, WebP, or AVIF. JPEG, PNG, and WebP are processed in your browser. AVIF uploads the image to the WebDiag converter, which processes it in server memory without storing it." } }
    ],
    relatedToolSlugs: ["image-format-converter", "image-resizer", "image-cropper"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/toBlob"],
  }),
  toolPage({
    slug: "image-format-converter",
    seoTitle: { ru: "Конвертер PNG, JPEG, WebP и AVIF онлайн", en: "PNG, JPEG, WebP & AVIF Image Converter" },
    metaDescription: { ru: "Конвертируйте одно изображение в AVIF, WebP, JPEG или PNG с обработкой AVIF на сервере без сохранения файла.", en: "Convert one image to AVIF, WebP, JPEG, or PNG with AVIF processed on the server without storing your file." },
    h1: { ru: "Конвертер PNG, JPEG, WebP и AVIF", en: "PNG, JPEG, WebP & AVIF Image Converter" },
    lead: { ru: "Выберите изображение, задайте один из современных выходных форматов и скачайте новый файл. AVIF кодируется сервером WebDiag, остальные форматы — браузером.", en: "Choose an image, select one modern output format, and download the result. AVIF is encoded by the WebDiag server; other formats use the browser." },
    quickFacts: [
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
      { ru: "Один файл", en: "One file" },
      { ru: "AVIF: обработка без сохранения", en: "AVIF: processed without storage" },
    ],
    howToSteps: [
      { ru: "Выберите исходное изображение.", en: "Choose the source image." },
      { ru: "Укажите AVIF, WebP, JPEG или PNG.", en: "Select AVIF, WebP, JPEG, or PNG." },
      { ru: "Запустите конвертацию и скачайте результат.", en: "Run conversion and download the result." },
    ],
    supportedFeatures: [
      { ru: "Выход в image/avif, image/webp, image/jpeg или image/png при поддержке браузера.", en: "Output as image/avif, image/webp, image/jpeg, or image/png when supported by the browser." },
      { ru: "Локальное декодирование и Canvas-конвертация.", en: "Local decoding and Canvas conversion." },
      { ru: "Автоматическое расширение имени результата.", en: "Automatic output filename extension." },
    ],
    limitations: [
      { ru: "HEIC, SVG и GIF output не поддерживаются; AVIF output зависит от Canvas encoder текущего браузера.", en: "HEIC, SVG, and GIF output are not supported; AVIF output depends on the current browser Canvas encoder." },
      { ru: "Анимация и исходные metadata не сохраняются.", en: "Animation and source metadata are not preserved." },
    ],
    useCases: [
      { ru: "Преобразование PNG в WebP для веб-публикации.", en: "Converting PNG to WebP for web publishing." },
      { ru: "Создание JPEG-версии изображения.", en: "Creating a JPEG version of an image." },
      { ru: "Получение PNG, когда нужна поддержка прозрачности.", en: "Creating PNG output when transparency is required." },
    ],
    technicalNotes: [
      { ru: "JPEG не поддерживает прозрачность; прозрачные области могут получить фон при кодировании.", en: "JPEG does not support transparency; transparent areas may receive a background during encoding." },
      { ru: "Качество и поддержка WebP зависят от возможностей браузера.", en: "WebP support and encoding behavior depend on browser capabilities." },
    ],
    faq: [
      { question: { ru: "Какой формат выбрать, если нужен прозрачный фон?", en: "Which format should I choose for a transparent background?" }, answer: { ru: "Выберите PNG, WebP или AVIF: эти форматы могут сохранять прозрачность. JPEG прозрачность не поддерживает. После преобразования проверьте фон на предпросмотре и скачайте подходящий вариант.", en: "Choose PNG, WebP, or AVIF, which can preserve transparency. JPEG does not support it. Check the background in the preview after converting, then download the suitable version." } },
      { question: { ru: "Можно ли преобразовать несколько изображений сразу?", en: "Can I convert several images at once?" }, answer: { ru: "Здесь обрабатывается одно изображение за запуск. Выберите файл, укажите формат и скачайте результат, прежде чем переходить к следующему. Для AVIF файл отправляется в конвертер WebDiag; JPEG, PNG и WebP создаются в браузере.", en: "This tool processes one image per run. Choose the file and output format, then download the result before moving to the next image. AVIF uses the WebDiag server converter; JPEG, PNG, and WebP are created in the browser." } }
    ],
    relatedToolSlugs: ["image-optimizer", "image-resizer", "image-cropper"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/toBlob"],
  }),
  toolPage({
    slug: "image-resizer",
    seoTitle: { ru: "Изменить размер изображения онлайн", en: "Resize an Image Online" },
    metaDescription: { ru: "Измените ширину и высоту одного изображения с сохранением пропорций или по точным размерам. AVIF, WebP, JPEG и PNG output.", en: "Change one image's width and height while preserving proportions or using exact dimensions. AVIF, WebP, JPEG, and PNG output." },
    h1: { ru: "Изменить размер изображения онлайн", en: "Resize an Image Online" },
    lead: { ru: "Задайте новую ширину и высоту, сохраните исходное соотношение сторон при необходимости и скачайте результат.", en: "Set a new width and height, preserve the source aspect ratio when needed, and download the result." },
    quickFacts: [
      { ru: "Ширина и высота", en: "Width and height" },
      { ru: "Сохранение пропорций", en: "Preserve aspect ratio" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
    ],
    howToSteps: [
      { ru: "Выберите изображение.", en: "Choose an image." },
      { ru: "Введите новые размеры и настройте сохранение пропорций.", en: "Enter new dimensions and configure aspect-ratio preservation." },
      { ru: "Выберите формат, измените размер и скачайте файл.", en: "Select a format, resize, and download the file." },
    ],
    supportedFeatures: [
      { ru: "Изменение ширины и высоты в целых пикселях.", en: "Integer-pixel width and height changes." },
      { ru: "Автоматический расчёт второй стороны при сохранении пропорций.", en: "Automatic calculation of the second dimension when preserving proportions." },
      { ru: "Выход AVIF, WebP, JPEG или PNG.", en: "AVIF, WebP, JPEG, or PNG output." },
    ],
    limitations: [
      { ru: "Пакетный resize, presets и увеличение качества изображения не поддерживаются.", en: "Batch resizing, presets, and quality enhancement are not included." },
      { ru: "Очень большие размеры могут быть ограничены памятью и Canvas браузера.", en: "Very large dimensions may be limited by browser memory and Canvas limits." },
    ],
    useCases: [
      { ru: "Подготовка изображения под точный размер блока.", en: "Preparing an image for an exact layout size." },
      { ru: "Создание уменьшенной копии для публикации.", en: "Creating a smaller copy for publishing." },
      { ru: "Пересчёт высоты по заданной ширине.", en: "Calculating height from a target width." },
    ],
    technicalNotes: [
      { ru: "Масштабирование выполняется через Canvas drawImage.", en: "Scaling is performed with Canvas drawImage." },
      { ru: "Увеличение изображения создаёт больше пикселей, но не добавляет исходных деталей.", en: "Upscaling creates more pixels but cannot add original detail." },
    ],
    faq: [
      { question: { ru: "Как изменить ширину и не исказить изображение?", en: "How can I change width without distorting the image?" }, answer: { ru: "Оставьте включённым сохранение пропорций и измените ширину: высота пересчитается автоматически. Если нужны строго заданные ширина и высота, отключите этот параметр, но учитывайте возможное растяжение изображения.", en: "Keep aspect ratio preservation enabled and change the width; the height updates automatically. Disable it if you need exact independent dimensions, but watch for stretching." } },
      { question: { ru: "Станет ли маленькое изображение чётче после увеличения?", en: "Will enlarging a small image make it sharper?" }, answer: { ru: "Увеличение добавляет пиксели, но не восстанавливает утраченные детали. Инструмент меняет размеры и создаёт новый файл; для лучшего результата используйте исходник достаточного разрешения и сравните предпросмотр с оригиналом.", en: "Enlargement adds pixels but does not recover missing detail. The tool resizes the image and creates a new file. Use a sufficiently large source and compare the preview with the original." } }
    ],
    relatedToolSlugs: ["image-optimizer", "image-format-converter", "image-aspect-ratio-calculator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/drawImage"],
  }),
  toolPage({
    slug: "image-cropper",
    seoTitle: { ru: "Обрезать изображение по координатам", en: "Crop an Image by Coordinates" },
    metaDescription: { ru: "Обрежьте одно изображение по X, Y, ширине и высоте и скачайте результат в AVIF, WebP, JPEG или PNG.", en: "Crop one image by X, Y, width, and height, then download the result as AVIF, WebP, JPEG, or PNG." },
    h1: { ru: "Обрезать изображение по координатам", en: "Crop an Image by Coordinates" },
    lead: { ru: "Укажите начальную точку и размер прямоугольной области, чтобы создать новый файл из выбранной части изображения.", en: "Enter the starting point and rectangular dimensions to create a new file from the selected image area." },
    quickFacts: [
      { ru: "X / Y / ширина / высота", en: "X / Y / width / height" },
      { ru: "Прямоугольная область", en: "Rectangular crop" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
    ],
    howToSteps: [
      { ru: "Выберите изображение.", en: "Choose an image." },
      { ru: "Введите X, Y, ширину и высоту области.", en: "Enter the crop X, Y, width, and height." },
      { ru: "Выберите формат, выполните обрезку и скачайте результат.", en: "Select an output format, crop, and download the result." },
    ],
    supportedFeatures: [
      { ru: "Целочисленные координаты и размеры.", en: "Integer coordinates and dimensions." },
      { ru: "Автоматическое ограничение области границами изображения.", en: "Automatic clamping to image boundaries." },
      { ru: "Выход AVIF, WebP, JPEG или PNG.", en: "AVIF, WebP, JPEG, or PNG output." },
    ],
    limitations: [
      { ru: "Нет визуального drag-selection, aspect presets и вращения.", en: "Visual drag selection, aspect presets, and rotation are not included." },
      { ru: "Поддерживается только прямоугольная область.", en: "Only rectangular crops are supported." },
    ],
    useCases: [
      { ru: "Точная обрезка по известным координатам.", en: "Exact cropping with known coordinates." },
      { ru: "Удаление края изображения.", en: "Removing an image border or edge." },
      { ru: "Создание фрагмента для последующей обработки.", en: "Creating a region for further processing." },
    ],
    technicalNotes: [
      { ru: "Координата X отсчитывается слева, Y — сверху.", en: "X is measured from the left and Y from the top." },
      { ru: "Если область выходит за изображение, размеры ограничиваются доступными пикселями.", en: "If the rectangle extends outside the image, dimensions are clamped to available pixels." },
    ],
    faq: [
      { question: { ru: "Как указать область, которую нужно оставить?", en: "How do I specify the area to keep?" }, answer: { ru: "X и Y задают расстояние от левого верхнего угла изображения до начала области. Ширина и высота определяют размер сохраняемого фрагмента в пикселях. Укажите эти значения в форме и проверьте результат обрезки.", en: "X and Y give the distance from the image's top-left corner to the crop area's start. Width and height set the saved area's size in pixels. Enter these values and check the cropped result." } },
      { question: { ru: "Обрезка заменит мой исходный файл?", en: "Will cropping replace my original file?" }, answer: { ru: "Инструмент создаёт отдельный результат для скачивания. Исходный файл на устройстве не изменяется. Сохраните результат, если выбранный фрагмент вас устраивает; область задаётся числами, без выделения мышью.", en: "The tool creates a separate downloadable result and does not alter the source file on your device. Save the result when you are satisfied with the crop. The area is set numerically, without dragging a selection." } }
    ],
    relatedToolSlugs: ["image-resizer", "image-format-converter", "image-aspect-ratio-calculator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/drawImage"],
  }),
  toolPage({
    slug: "image-aspect-ratio-calculator",
    seoTitle: { ru: "Калькулятор соотношения сторон изображения", en: "Image Aspect Ratio Calculator" },
    metaDescription: { ru: "Сократите соотношение ширины и высоты и рассчитайте недостающий размер по заданной пропорции.", en: "Reduce a width-to-height ratio and calculate a missing dimension from a selected proportion." },
    h1: { ru: "Калькулятор соотношения сторон изображения", en: "Image Aspect Ratio Calculator" },
    lead: { ru: "Сократите размеры до простой пропорции и рассчитайте ширину или высоту без загрузки изображения.", en: "Reduce dimensions to a simple ratio and calculate a width or height without uploading an image." },
    quickFacts: [
      { ru: "Сокращение пропорции", en: "Ratio reduction" },
      { ru: "Расчёт стороны", en: "Dimension calculation" },
      { ru: "Без загрузки файла", en: "No file required" },
    ],
    howToSteps: [
      { ru: "Введите исходную ширину и высоту, чтобы получить сокращённое соотношение.", en: "Enter source width and height to reduce the ratio." },
      { ru: "Либо укажите пропорцию и одну известную сторону.", en: "Or enter a ratio and one known dimension." },
      { ru: "Получите рассчитанную ширину или высоту.", en: "Read the calculated width or height." },
    ],
    supportedFeatures: [
      { ru: "Сокращение положительных целых размеров через НОД.", en: "Reduction of positive integer dimensions using the greatest common divisor." },
      { ru: "Расчёт высоты по ширине и пропорции.", en: "Height calculation from width and ratio." },
      { ru: "Расчёт ширины по высоте и пропорции.", en: "Width calculation from height and ratio." },
    ],
    limitations: [
      { ru: "Изображение не загружается и его фактические размеры не считываются.", en: "The tool does not load an image or read its actual dimensions." },
      { ru: "Значения должны быть положительными; сокращение исходных размеров требует целых чисел.", en: "Values must be positive; source-dimension reduction requires integers." },
    ],
    useCases: [
      { ru: "Проверка отношения 1920×1080 или другого размера.", en: "Checking the ratio of 1920×1080 or another size." },
      { ru: "Расчёт высоты адаптивного блока по ширине.", en: "Calculating responsive block height from width." },
      { ru: "Подготовка точных размеров для resize.", en: "Preparing exact dimensions for resizing." },
    ],
    technicalNotes: [
      { ru: "Например, 1920:1080 сокращается до 16:9.", en: "For example, 1920:1080 reduces to 16:9." },
      { ru: "Результат расчёта стороны может быть дробным и потребовать округления для пиксельного размера.", en: "A calculated dimension can be fractional and may need rounding for pixel output." },
    ],
    faq: [
      { question: { ru: "Нужно ли загружать фотографию для расчёта пропорций?", en: "Do I need to upload a photo to calculate its aspect ratio?" }, answer: { ru: "Достаточно ввести её ширину и высоту в пикселях. Калькулятор сократит соотношение сторон и поможет рассчитать размер с теми же пропорциями. Само изображение он не открывает и не изменяет.", en: "Enter its width and height in pixels. The calculator simplifies the aspect ratio and helps calculate another size with the same proportions. It does not open or modify the image." } },
      { question: { ru: "Как подобрать новый размер без растяжения?", en: "How do I choose another size without stretching?" }, answer: { ru: "Сохраните найденное соотношение ширины и высоты. Например, у 1920 × 1080 оно равно 16:9, поэтому 1280 × 720 имеет те же пропорции. Для изменения самого файла используйте инструмент изменения размера изображений.", en: "Keep the same width-to-height ratio. For example, 1920 × 1080 is 16:9, so 1280 × 720 has the same proportions. Use the image resizer to change the actual file." } }
    ],
    relatedToolSlugs: ["image-resizer", "image-cropper", "px-rem-converter"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/CSS/aspect-ratio"],
  }),

  toolPage({
    slug: "svg-optimizer",
    seoTitle: { ru: "Оптимизация SVG онлайн", en: "SVG Optimizer Online" },
    metaDescription: { ru: "Оптимизируйте безопасный SVG локально в браузере: удаление комментариев, metadata, XML/DOCTYPE и лишних пробелов без серверной загрузки.", en: "Optimize safe SVG locally in the browser: remove comments, metadata, XML/DOCTYPE, and redundant whitespace without server upload." },
    h1: { ru: "Оптимизация SVG в браузере", en: "SVG Optimizer in the Browser" },
    lead: { ru: "Вставьте SVG или выберите файл, получите компактный результат и скачайте оптимизированный SVG.", en: "Paste SVG or choose a file, get compact output, and download the optimized SVG." },
    quickFacts: [
      { ru: "SVG input", en: "SVG input" },
      { ru: "Без загрузки на сервер", en: "No server upload" },
      { ru: "Active content blocked", en: "Active content blocked" },
    ],
    howToSteps: [
      { ru: "Вставьте SVG-код или выберите .svg файл.", en: "Paste SVG code or choose an .svg file." },
      { ru: "Запустите оптимизацию и проверьте экономию байтов.", en: "Run optimization and check byte savings." },
      { ru: "Скачайте оптимизированный SVG.", en: "Download the optimized SVG." },
    ],
    supportedFeatures: [
      { ru: "Удаление XML declaration, doctype, comments и metadata.", en: "Removal of XML declaration, doctype, comments, and metadata." },
      { ru: "Сжатие лишних пробелов между тегами.", en: "Whitespace compaction between tags." },
      { ru: "Блокировка script, inline event handlers, javascript: и foreignObject.", en: "Blocking of script, inline event handlers, javascript:, and foreignObject." },
    ],
    limitations: [
      { ru: "Это safe browser optimizer, а не полный SVGO pipeline с плагинами.", en: "This is a safe browser optimizer, not a full SVGO plugin pipeline." },
      { ru: "Инструмент не выполняет и не рендерит SVG-код.", en: "The tool does not execute or render SVG code." },
    ],
    useCases: [
      { ru: "Очистка SVG-иконки перед публикацией.", en: "Cleaning an SVG icon before publishing." },
      { ru: "Удаление editor metadata.", en: "Removing editor metadata." },
      { ru: "Быстрая проверка безопасного SVG input.", en: "Quick safe SVG input check." },
    ],
    technicalNotes: [
      { ru: "Оптимизация выполняется строковыми преобразованиями без dangerouslySetInnerHTML.", en: "Optimization uses string transforms without dangerouslySetInnerHTML." },
      { ru: "Активный SVG-контент намеренно блокируется.", en: "Active SVG content is intentionally blocked." },
    ],
    faq: [
      { question: { ru: "Что делает оптимизация SVG?", en: "What does SVG optimisation do?" }, answer: { ru: "Инструмент очищает вставленный код SVG в пределах поддерживаемых правил и показывает результат для копирования. Сравните внешний вид изображения после изменения, прежде чем заменять файл на сайте.", en: "The tool cleans pasted SVG code using its supported rules and shows the result for copying. Compare the image's appearance after the change before replacing the file on your site." } },
      { question: { ru: "Будет ли результат всегда меньше исходного кода?", en: "Will the result always be smaller than the source?" }, answer: { ru: "Размер зависит от того, как подготовлен исходник. Базовая очистка не заменяет все возможности специализированных SVG-оптимизаторов. Обработка выполняется в браузере; инструмент не загружает код на сайт и не заменяет файлы автоматически.", en: "Size depends on how the source was prepared. Basic cleanup does not replace every feature of a dedicated SVG optimiser. Processing runs in the browser; the tool does not upload code to your site or replace files automatically." } }
    ],
    relatedToolSlugs: ["image-optimizer", "image-format-converter", "favicon-checker"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/SVG"],
  }),
  toolPage({
    slug: "add-watermark-to-image",
    seoTitle: { ru: "Добавить водяной знак на изображение", en: "Add Watermark to an Image" },
    metaDescription: { ru: "Добавьте текстовый водяной знак на изображение локально в браузере: позиция, прозрачность, размер и AVIF/WebP/JPEG/PNG output.", en: "Add a text watermark to an image locally in the browser: position, opacity, size, and AVIF/WebP/JPEG/PNG output." },
    h1: { ru: "Добавить водяной знак на изображение", en: "Add a Watermark to an Image" },
    lead: { ru: "Нанесите текстовый водяной знак на одно изображение и скачайте результат без отправки файла на сервер.", en: "Apply a text watermark to one image and download the result without uploading the file to a server." },
    quickFacts: [
      { ru: "Текстовый watermark", en: "Text watermark" },
      { ru: "Позиция и прозрачность", en: "Position and opacity" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
    ],
    howToSteps: [
      { ru: "Выберите изображение.", en: "Choose an image." },
      { ru: "Введите текст, позицию, прозрачность и размер.", en: "Enter text, position, opacity, and size." },
      { ru: "Выберите формат результата и скачайте файл.", en: "Select output format and download the file." },
    ],
    supportedFeatures: [
      { ru: "Пять позиций: углы и центр.", en: "Five positions: corners and center." },
      { ru: "Настройка прозрачности и размера текста.", en: "Opacity and text-size controls." },
      { ru: "Локальный Canvas output в modern raster formats.", en: "Local Canvas output in modern raster formats." },
    ],
    limitations: [
      { ru: "Поддерживается только добавление текстового водяного знака, не удаление watermark.", en: "Only adding a text watermark is supported, not watermark removal." },
      { ru: "Логотип-watermark, тайлинг и пакетная обработка не включены.", en: "Logo watermark, tiling, and batch processing are not included." },
    ],
    useCases: [
      { ru: "Маркировка превью для клиента.", en: "Marking a preview for a client." },
      { ru: "Публикация демо-изображения с подписью.", en: "Publishing a demo image with a label." },
      { ru: "Быстрое добавление copyright notice.", en: "Quickly adding a copyright notice." },
    ],
    technicalNotes: [
      { ru: "Водяной знак отрисовывается через Canvas text API.", en: "The watermark is drawn through the Canvas text API." },
      { ru: "Результат является новым raster-файлом и может потерять исходные metadata.", en: "The result is a new raster file and can lose source metadata." },
    ],
    faq: [
      { question: { ru: "Как добавить подпись на изображение?", en: "How do I add a caption or watermark to an image?" }, answer: { ru: "Выберите своё изображение, введите текст водяного знака и настройте доступные параметры размещения. Проверьте результат и скачайте новый файл. Исходное изображение на устройстве останется прежним.", en: "Choose your image, enter the watermark text, and adjust the available placement settings. Check the result and download the new file. The original on your device remains unchanged." } },
      { question: { ru: "Водяной знак гарантирует защиту от копирования?", en: "Does a watermark guarantee protection against copying?" }, answer: { ru: "Он помогает обозначить авторство, но не запрещает скачивание или редактирование картинки. Используйте инструмент для добавления своей подписи. Удаление чужих водяных знаков здесь не предусмотрено.", en: "It can identify authorship, but it does not prevent downloading or editing the image. Use the tool to add your own caption. It does not remove other people's watermarks." } }
    ],
    relatedToolSlugs: ["image-optimizer", "image-format-converter", "image-metadata-viewer"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/CanvasRenderingContext2D/fillText"],
  }),
  toolPage({
    slug: "image-metadata-viewer",
    seoTitle: { ru: "Просмотр и удаление метаданных изображения", en: "Image Metadata Viewer and Remover" },
    metaDescription: { ru: "Проверьте EXIF, XMP, ICC, IPTC/JFIF и PNG/WebP/AVIF metadata signals и удалите метаданные локальным перекодированием.", en: "Check EXIF, XMP, ICC, IPTC/JFIF, and PNG/WebP/AVIF metadata signals and remove metadata through local re-encoding." },
    h1: { ru: "Просмотр и удаление метаданных изображения", en: "Image Metadata Viewer and Remover" },
    lead: { ru: "Посмотрите metadata-сигналы в изображении и создайте новую копию через Canvas re-encode без исходных EXIF/XMP chunks.", en: "Inspect image metadata signals and create a new Canvas re-encoded copy without source EXIF/XMP chunks." },
    quickFacts: [
      { ru: "EXIF / XMP / ICC", en: "EXIF / XMP / ICC" },
      { ru: "Canvas re-encode", en: "Canvas re-encode" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите JPEG, PNG, WebP или AVIF.", en: "Choose a JPEG, PNG, WebP, or AVIF file." },
      { ru: "Проверьте обнаруженные metadata signals.", en: "Review detected metadata signals." },
      { ru: "Выберите формат и создайте metadata-stripped копию.", en: "Select a format and create a metadata-stripped copy." },
    ],
    supportedFeatures: [
      { ru: "Byte-level detection для EXIF, XMP, ICC, IPTC/JFIF и PNG text chunks.", en: "Byte-level detection for EXIF, XMP, ICC, IPTC/JFIF, and PNG text chunks." },
      { ru: "Удаление метаданных через локальное raster re-encode.", en: "Metadata removal through local raster re-encoding." },
      { ru: "Вывод AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "AVIF, WebP, JPEG, or PNG output when supported by the browser." },
    ],
    limitations: [
      { ru: "Инструмент не показывает все поля EXIF по именам; он определяет наличие metadata chunks.", en: "The tool does not display every EXIF field by name; it detects metadata chunk presence." },
      { ru: "Перекодирование может изменить размер, качество, цветовой профиль и формат файла.", en: "Re-encoding can change file size, quality, color profile, and format." },
    ],
    useCases: [
      { ru: "Проверка, есть ли EXIF/XMP перед публикацией.", en: "Checking whether EXIF/XMP exists before publishing." },
      { ru: "Создание копии без исходных metadata.", en: "Creating a copy without source metadata." },
      { ru: "Подготовка изображения к веб-публикации.", en: "Preparing an image for web publishing." },
    ],
    technicalNotes: [
      { ru: "Metadata detection выполняется по сигнатурам байтов, а не через внешние сервисы.", en: "Metadata detection uses byte signatures, not external services." },
      { ru: "Canvas output обычно не сохраняет исходные metadata chunks.", en: "Canvas output normally does not preserve source metadata chunks." },
    ],
    faq: [
      { question: { ru: "Покажет ли инструмент место, где сделана фотография?", en: "Will this tool show where a photo was taken?" }, answer: { ru: "Он показывает наличие служебных блоков данных в файле, но не расшифровывает каждое поле EXIF и GPS-координаты. По этому отчёту нельзя определить место съёмки или подтвердить отсутствие всех личных данных.", en: "It detects metadata blocks in the file but does not decode every EXIF field or GPS coordinates. This report cannot locate a photo or confirm the absence of all personal information." } },
      { question: { ru: "Как получить копию без исходных служебных данных?", en: "How can I obtain a copy without the source metadata?" }, answer: { ru: "Используйте доступную в инструменте обработку с созданием нового изображения и скачайте результат. Исходные блоки EXIF и XMP при таком перекодировании не переносятся. Перед публикацией проверьте новый файл, особенно если он содержал чувствительные сведения.", en: "Use the tool's image re-encoding option and download the result. Source EXIF and XMP blocks are not carried over during that process. Check the new file before publishing, particularly if it contained sensitive information." } }
    ],
    relatedToolSlugs: ["image-optimizer", "image-format-converter", "add-watermark-to-image"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/Canvas_API"],
  }),
  toolPage({
    slug: "favicon-generator",
    seoTitle: { ru: "Генератор PNG favicon и web app icons", en: "PNG Favicon and Web App Icon Generator" },
    metaDescription: { ru: "Создайте пять PNG favicon и web app icons из центральной квадратной области JPEG, PNG, WebP или AVIF локально в браузере.", en: "Create five PNG favicon and web app icons from the centered square crop of a JPEG, PNG, WebP, or AVIF locally in your browser." },
    h1: { ru: "Генератор PNG favicon и web app icons", en: "PNG Favicon and Web App Icon Generator" },
    lead: { ru: "Подготовьте пять PNG-файлов и точные HTML/manifest фрагменты без серверной загрузки исходного изображения.", en: "Prepare five PNG files and exact HTML/manifest snippets without uploading the source image to a server." },
    quickFacts: [
      { ru: "5 PNG-файлов", en: "5 PNG files" },
      { ru: "32–512 px", en: "32–512 px" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите JPEG, PNG, WebP или AVIF.", en: "Choose a JPEG, PNG, WebP, or AVIF file." },
      { ru: "Проверьте, подходит ли центральная квадратная область.", en: "Confirm that the centered square crop fits your composition." },
      { ru: "Создайте файлы, скачайте их и скопируйте фрагменты подключения.", en: "Generate and download the files, then copy the integration snippets." },
    ],
    supportedFeatures: [
      { ru: "favicon-32x32.png и favicon-48x48.png для favicon.", en: "favicon-32x32.png and favicon-48x48.png for favicon." },
      { ru: "PNG 180 × 180 для apple-touch-icon.", en: "180 × 180 PNG for apple-touch-icon." },
      { ru: "PNG 192 × 192 и 512 × 512 и manifest icons fragment.", en: "192 × 192 and 512 × 512 PNG files plus a manifest icons fragment." },
    ],
    limitations: [
      { ru: "Инструмент не создаёт .ico, ZIP, SVG и maskable padding.", en: "The tool does not create .ico, ZIP, SVG, or maskable padding." },
      { ru: "Используется только центральная квадратная область; автоматическая установка на сайт не выполняется.", en: "Only a centered square crop is used; the generated assets are not installed on a site automatically." },
    ],
    useCases: [
      { ru: "Подготовка базового набора PNG favicon.", en: "Preparing a basic PNG favicon set." },
      { ru: "Создание apple-touch-icon из квадратного логотипа.", en: "Creating an apple-touch-icon from a square logo." },
      { ru: "Подготовка двух размеров web app icon для manifest.", en: "Preparing two web app icon sizes for a manifest." },
    ],
    technicalNotes: [
      { ru: "Canvas drawImage применяет центральную квадратную обрезку и масштабирование.", en: "Canvas drawImage applies the centered square crop and scaling." },
      { ru: "Каждый результат кодируется отдельно через Canvas PNG encoder браузера.", en: "Each result is encoded separately through the browser Canvas PNG encoder." },
    ],
    faq: [
      { question: { ru: "Как подготовить изображение для иконки сайта?", en: "How should I prepare an image for a site icon?" }, answer: { ru: "Выберите изображение, которое остаётся узнаваемым в маленьком размере. Инструмент подготовит квадратные PNG-иконки из центральной области исходника. Проверьте, что важные детали не обрезались, и скачайте нужные размеры.", en: "Choose an image that remains recognisable at a small size. The tool creates square PNG icons from the centre of the source. Check that important details were not cropped out, then download the sizes you need." } },
      { question: { ru: "Какие файлы я получу и что делать с ними дальше?", en: "Which files will I receive, and how do I use them?" }, answer: { ru: "Генератор создаёт пять PNG-иконок: 32 × 32, 48 × 48, 180 × 180, 192 × 192 и 512 × 512. Разместите выбранные файлы на сайте и подключите их в настройках или разметке страницы. Файл favicon.ico инструмент не создаёт.", en: "The generator creates five PNG icons: 32 × 32, 48 × 48, 180 × 180, 192 × 192, and 512 × 512. Upload the chosen files to your site and reference them in its settings or page markup. The tool does not create favicon.ico." } }
    ],
    relatedToolSlugs: ["favicon-checker", "image-cropper", "image-resizer"],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/HTML/Reference/Attributes/rel/icon",
      "https://developer.mozilla.org/docs/Web/Progressive_web_apps/Manifest/Reference/icons",
    ],
  }),
  toolPage({
    slug: "qr-code-generator",
    seoTitle: { ru: "Генератор и чтение QR-кодов", en: "QR Code Workbench" },
    metaDescription: { ru: "Создавайте QR-коды из текста и читайте один QR-код из локального JPEG, PNG, WebP или AVIF без загрузки файла.", en: "Generate QR codes from text and read one QR code from a local JPEG, PNG, WebP, or AVIF without uploading the file." },
    h1: { ru: "Генератор и чтение QR-кодов", en: "QR Code Workbench" },
    lead: { ru: "Создайте PNG с выбранным уровнем коррекции или прочитайте текст из локального изображения. Результат не открывается автоматически.", en: "Create a PNG with the selected error-correction level or read text from a local image. Decoded content is never opened automatically." },
    quickFacts: [
      { ru: "До 2 000 символов", en: "Up to 2,000 characters" },
      { ru: "PNG 256–512 px", en: "256–512 px PNG" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Введите текст, выберите коррекцию ошибок и размер PNG.", en: "Enter text, choose error correction, and select the PNG size." },
      { ru: "Создайте и скачайте QR-код либо выберите локальное изображение.", en: "Generate and download the QR code or choose a local image." },
      { ru: "Прочитайте результат и проверьте текст перед использованием.", en: "Read the result and inspect the text before using it." },
    ],
    supportedFeatures: [
      { ru: "Уровни коррекции L, M, Q и H и quiet zone в четыре модуля.", en: "L, M, Q, and H error-correction levels with a four-module quiet zone." },
      { ru: "UTF-8 text, PNG export и чтение одного QR-кода из raster image.", en: "UTF-8 text, PNG export, and reading one QR code from a raster image." },
      { ru: "JPEG, PNG, WebP и AVIF при поддержке декодирования браузером.", en: "JPEG, PNG, WebP, and AVIF when the browser can decode the format." },
    ],
    limitations: [
      { ru: "Камера, пакетное чтение, barcode formats и проверка безопасности URL не поддерживаются.", en: "Camera scanning, batch reading, barcode formats, and URL safety validation are not included." },
      { ru: "Фактическая ёмкость зависит от текста и уровня коррекции; неподходящее содержимое возвращает ошибку.", en: "Actual capacity depends on content and error correction; content that does not fit returns an error." },
    ],
    useCases: [
      { ru: "Передать короткий URL или текст между устройствами.", en: "Transfer a short URL or text between devices." },
      { ru: "Подготовить QR PNG для ручной вставки в документ.", en: "Prepare a QR PNG for manual placement in a document." },
      { ru: "Проверить содержимое QR-кода из локального скриншота.", en: "Inspect QR content from a local screenshot." },
    ],
    technicalNotes: [
      { ru: "QR matrix создаётся локально и растеризуется в Canvas PNG с чёрными и белыми модулями.", en: "The QR matrix is generated locally and rasterized into a black-and-white Canvas PNG." },
      { ru: "Изображение декодируется в RGBA pixels; найденный текст показывается только в read-only textarea.", en: "The image is decoded to RGBA pixels; found text is shown only in a read-only textarea." },
    ],
    faq: [
      { question: { ru: "Как создать QR-код для ссылки?", en: "How do I create a QR code for a link?" }, answer: { ru: "Вставьте полный адрес, создайте код и скачайте PNG. Перед публикацией считайте полученное изображение телефоном и проверьте адрес. Генератор кодирует введённый текст и не проверяет, работает ли ссылка.", en: "Paste the full address, generate the code, and download the PNG. Scan the result with a phone and verify the address before publishing. The generator encodes your text; it does not check whether the link works." } },
      { question: { ru: "Как посмотреть содержимое готового QR-кода?", en: "How can I read an existing QR code?" }, answer: { ru: "Выберите изображение в режиме чтения кода. Найденное содержимое появится как текст; инструмент не открывает ссылки автоматически. Проверьте текст и адрес перед тем, как переходить по нему.", en: "Select an image in the code-reading mode. Detected content appears as text, and links are not opened automatically. Review the text and address before visiting a link." } }
    ],
    relatedToolSlugs: ["image-data-uri-converter", "image-optimizer", "responsive-image-srcset-generator"],
    sourceUrls: [
      "https://github.com/paulmillr/qr",
      "https://developer.mozilla.org/docs/Web/API/Canvas_API",
    ],
  }),
  toolPage({
    slug: "image-data-uri-converter",
    seoTitle: { ru: "Data URI и PNG placeholder для изображения", en: "Image Data URI Workbench" },
    metaDescription: { ru: "Создайте точный Data URI для JPEG, PNG, WebP или AVIF до 1 МиБ и отдельный PNG placeholder до 24 px локально в браузере.", en: "Create an exact Data URI for a JPEG, PNG, WebP, or AVIF up to 1 MiB and a separate PNG placeholder up to 24 px locally in your browser." },
    h1: { ru: "Data URI и placeholder для изображения", en: "Image Data URI Workbench" },
    lead: { ru: "Получите точное base64-представление исходного файла и отдельную миниатюрную PNG-заглушку без загрузки изображения на сервер.", en: "Get an exact base64 representation of the source file and a separate tiny PNG placeholder without uploading the image." },
    quickFacts: [
      { ru: "До 1 МиБ", en: "Up to 1 MiB" },
      { ru: "Placeholder до 24 px", en: "Placeholder up to 24 px" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите один JPEG, PNG, WebP или AVIF.", en: "Choose one JPEG, PNG, WebP, or AVIF file." },
      { ru: "Создайте точный Data URI исходника и миниатюрный PNG placeholder.", en: "Create the exact source Data URI and a tiny PNG placeholder." },
      { ru: "Скопируйте нужный Data URI или готовое CSS-свойство.", en: "Copy the required Data URI or the ready-to-use CSS declaration." },
    ],
    supportedFeatures: [
      { ru: "Определение формата по сигнатуре байтов, а не по заявленному MIME type.", en: "Format detection from the byte signature rather than the declared MIME type." },
      { ru: "Точное base64-кодирование всех байтов исходного файла.", en: "Exact base64 encoding of every source-file byte." },
      { ru: "PNG placeholder с сохранением пропорций и стороной не более 24 px.", en: "An aspect-preserving PNG placeholder with no side larger than 24 px." },
    ],
    limitations: [
      { ru: "Data URI увеличивает текстовый размер и не оптимизирует исходное изображение.", en: "A Data URI increases text size and does not optimize the source image." },
      { ru: "Placeholder не является BlurHash или рекомендацией по загрузке изображения.", en: "The placeholder is not BlurHash or an image-loading recommendation." },
    ],
    useCases: [
      { ru: "Встраивание небольшого локального изображения в CSS или HTML.", en: "Embedding a small local image in CSS or HTML." },
      { ru: "Подготовка отдельной миниатюрной заглушки для ручной интеграции.", en: "Preparing a separate tiny placeholder for manual integration." },
      { ru: "Проверка фактического MIME type по содержимому файла.", en: "Checking the effective MIME type from file content." },
    ],
    technicalNotes: [
      { ru: "Исходный Data URI строится непосредственно из прочитанных байтов и показывается только как текст.", en: "The source Data URI is built directly from the read bytes and displayed only as text." },
      { ru: "Placeholder декодируется и кодируется через Canvas API текущего браузера.", en: "The placeholder is decoded and encoded through the current browser's Canvas API." },
    ],
    faq: [
      { question: { ru: "Для чего изображение преобразуют в Data URI?", en: "Why convert an image to a Data URI?" }, answer: { ru: "Так изображение можно включить прямо в HTML или CSS одной текстовой строкой без отдельной ссылки на файл. Это удобно для небольших ресурсов. Преобразование в строку не сжимает исходное изображение и может увеличить объём данных.", en: "It lets you embed an image directly in HTML or CSS as one text string instead of linking a separate file. This can be useful for small resources. Converting to text does not compress the image and can increase data size." } },
      { question: { ru: "Чем точная копия отличается от изображения-заглушки?", en: "How does an exact copy differ from a placeholder image?" }, answer: { ru: "Режим точной копии сохраняет байты выбранного файла в текстовом представлении. Заглушка создаёт отдельное небольшое PNG-изображение для предварительного отображения. Выберите подходящий режим и проверьте результат перед использованием в коде.", en: "Exact-copy mode preserves the selected file's bytes as text. Placeholder mode creates a separate small PNG for an initial preview. Choose the mode you need and inspect the result before using it in code." } }
    ],
    relatedToolSlugs: ["image-optimizer", "responsive-image-srcset-generator", "color-palette-extractor"],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/API/FileReader/readAsDataURL",
      "https://developer.mozilla.org/docs/Web/API/Canvas_API",
    ],
  }),
  toolPage({
    slug: "responsive-image-srcset-generator",
    seoTitle: { ru: "Генератор srcset для адаптивных изображений", en: "Responsive Image Srcset Generator" },
    metaDescription: { ru: "Соберите srcset и экранированный img-фрагмент из существующих HTTPS или root-relative URL и фактической ширины файлов.", en: "Build a srcset and escaped img fragment from existing HTTPS or root-relative URLs and the files' actual intrinsic widths." },
    h1: { ru: "Генератор srcset для адаптивных изображений", en: "Responsive Image Srcset Generator" },
    lead: { ru: "Упорядочьте до 20 существующих ресурсов по width descriptor и получите текст для безопасного ручного подключения.", en: "Order up to 20 existing resources by width descriptor and get text for safe manual integration." },
    quickFacts: [
      { ru: "1–20 URL", en: "1–20 URLs" },
      { ru: "Width descriptors", en: "Width descriptors" },
      { ru: "HTML escaping", en: "HTML escaping" },
    ],
    howToSteps: [
      { ru: "Введите URL и фактическую ширину через разделитель |.", en: "Enter each URL and actual intrinsic width separated by |." },
      { ru: "Укажите резервный src, sizes и осмысленный alt.", en: "Provide the fallback src, sizes value, and meaningful alt text." },
      { ru: "Создайте и скопируйте srcset или экранированный img-фрагмент.", en: "Generate and copy the srcset or escaped img fragment." },
    ],
    supportedFeatures: [
      { ru: "HTTPS и root-relative URL без credentials и fragments.", en: "HTTPS and root-relative URLs without credentials or fragments." },
      { ru: "Уникальные width descriptors от 1 до 8192.", en: "Unique width descriptors from 1 through 8192." },
      { ru: "Сортировка кандидатов и экранирование HTML attributes.", en: "Candidate sorting and HTML attribute escaping." },
    ],
    limitations: [
      { ru: "Инструмент не создаёт, не загружает и не проверяет image-файлы или их размеры.", en: "The tool does not create image files, upload them, or verify their dimensions." },
      { ru: "Нет picture art direction, DPR descriptors, CDN transforms и полного парсера media conditions.", en: "Picture art direction, DPR descriptors, CDN transforms, and full media-condition parsing are not included." },
    ],
    useCases: [
      { ru: "Подготовка srcset для заранее созданных WebP-файлов.", en: "Preparing a srcset for pre-generated WebP files." },
      { ru: "Сортировка набора изображений по фактической ширине.", en: "Sorting an image set by intrinsic width." },
      { ru: "Безопасная вставка пользовательского alt в HTML-фрагмент.", en: "Safely placing user-supplied alt text in an HTML fragment." },
    ],
    technicalNotes: [
      { ru: "URL с raw comma или whitespace блокируются, чтобы не менять грамматику srcset.", en: "URLs containing raw commas or whitespace are blocked so they cannot alter srcset grammar." },
      { ru: "Результат показывается как текст и не исполняется в DOM.", en: "The result is rendered as text and is not executed in the DOM." },
    ],
    faq: [
      { question: { ru: "Что нужно подготовить для адаптивного изображения?", en: "What should I prepare for a responsive image?" }, answer: { ru: "Создайте несколько файлов одного изображения с разной шириной. Укажите адрес и реальную ширину каждого файла в форме. Генератор соберёт разметку, по которой браузер сможет выбирать подходящий вариант.", en: "Create several files of the same image at different widths. Enter each file's address and actual width. The generator builds markup that lets a browser select an appropriate version." } },
      { question: { ru: "Генератор сам уменьшит картинку и загрузит файлы на сайт?", en: "Will the generator resize the picture and upload the files?" }, answer: { ru: "Файлы нужно создать и разместить самостоятельно. Здесь проверяется введённый список и формируется код, а доступность адресов по сети не проверяется. Для подготовки файлов используйте инструмент изменения размера изображений.", en: "Create and host the files yourself. This tool validates the entered list and generates code without checking addresses over the network. Use the image resizer to prepare the files." } }
    ],
    relatedToolSlugs: ["image-resizer", "image-format-converter", "image-performance-checker"],
    sourceUrls: [
      "https://developer.mozilla.org/docs/Web/API/HTMLImageElement/srcset",
      "https://developer.mozilla.org/docs/Web/API/HTMLImageElement/sizes",
    ],
  }),
] as const;
