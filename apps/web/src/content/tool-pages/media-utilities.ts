import { toolPage } from "./shared";

export const mediaUtilityToolPages = [
  toolPage({
    slug: "image-optimizer",
    seoTitle: { ru: "Сжатие PNG, JPEG, WebP и AVIF онлайн", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
    metaDescription: { ru: "Сжимайте изображения в AVIF, WebP, JPEG или PNG с выбранным качеством. Файл обрабатывается локально в браузере; AVIF зависит от поддержки браузера.", en: "Compress images as AVIF, WebP, JPEG, or PNG with selected quality. The file is processed locally in your browser; AVIF depends on browser support." },
    h1: { ru: "Сжатие PNG, JPEG, WebP и AVIF в браузере", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
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
      { question: { ru: "Почему PNG может не стать меньше?", en: "Why might a PNG not become smaller?" }, answer: { ru: "Canvas-кодирование и исходная оптимизация файла различаются. Уже оптимизированный PNG может остаться такого же размера или увеличиться.", en: "Canvas encoding differs from the source optimization. An already optimized PNG can remain similar in size or become larger." } },
      { question: { ru: "Файл отправляется на сервер?", en: "Is the file uploaded?" }, answer: { ru: "Нет. Выбор, декодирование и повторное кодирование происходят в браузере.", en: "No. Selection, decoding, and re-encoding occur in the browser." } },
    ],
    relatedToolSlugs: ["image-format-converter", "image-resizer", "image-cropper"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/HTMLCanvasElement/toBlob"],
  }),
  toolPage({
    slug: "image-format-converter",
    seoTitle: { ru: "Конвертер PNG, JPEG, WebP и AVIF онлайн", en: "PNG, JPEG, WebP & AVIF Image Converter" },
    metaDescription: { ru: "Конвертируйте одно изображение в AVIF, WebP, JPEG или PNG без загрузки файла на сервер.", en: "Convert one image to AVIF, WebP, JPEG, or PNG without uploading the file to a server." },
    h1: { ru: "Конвертер PNG, JPEG, WebP и AVIF", en: "PNG, JPEG, WebP & AVIF Image Converter" },
    lead: { ru: "Выберите изображение, задайте один из современных выходных форматов и скачайте новый файл, созданный браузером.", en: "Choose an image, select one modern output format, and download a new file created by the browser." },
    quickFacts: [
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
      { ru: "Один файл", en: "One file" },
      { ru: "Без загрузки", en: "No upload" },
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
      { question: { ru: "Можно конвертировать HEIC?", en: "Can it convert HEIC?" }, answer: { ru: "Только если конкретный браузер умеет декодировать выбранный файл; HEIC не заявлен как поддерживаемый формат.", en: "Only if the current browser can decode the selected file; HEIC is not an advertised supported format." } },
      { question: { ru: "Сохранится прозрачность?", en: "Will transparency be preserved?" }, answer: { ru: "PNG, WebP и AVIF могут поддерживать прозрачность, JPEG — нет.", en: "PNG, WebP, and AVIF can support transparency; JPEG cannot." } },
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
      { question: { ru: "Можно не сохранять пропорции?", en: "Can I ignore the aspect ratio?" }, answer: { ru: "Да. Отключите сохранение пропорций и задайте обе стороны вручную.", en: "Yes. Disable aspect-ratio preservation and enter both dimensions manually." } },
      { question: { ru: "Инструмент улучшает качество?", en: "Does it enhance image quality?" }, answer: { ru: "Нет. Он только масштабирует и повторно кодирует изображение.", en: "No. It only scales and re-encodes the image." } },
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
      { question: { ru: "Можно выделить область мышью?", en: "Can I drag to select an area?" }, answer: { ru: "Нет. Текущая версия использует числовые координаты и размеры.", en: "No. The current version uses numeric coordinates and dimensions." } },
      { question: { ru: "Что означает X и Y?", en: "What do X and Y mean?" }, answer: { ru: "Это положение верхнего левого угла области относительно верхнего левого угла изображения.", en: "They define the crop area's top-left corner relative to the image's top-left corner." } },
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
      { question: { ru: "Нужно загружать изображение?", en: "Do I need to upload an image?" }, answer: { ru: "Нет. Инструмент работает только с введёнными числами.", en: "No. The tool works only with entered numbers." } },
      { question: { ru: "Какое соотношение у Full HD?", en: "What is the Full HD aspect ratio?" }, answer: { ru: "Размер 1920×1080 сокращается до 16:9.", en: "1920×1080 reduces to 16:9." } },
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
      { question: { ru: "Это полноценная замена SVGO?", en: "Is this a full SVGO replacement?" }, answer: { ru: "Нет. Это безопасный локальный optimizer для базовой очистки SVG перед публикацией.", en: "No. It is a safe local optimizer for basic SVG cleanup before publishing." } },
      { question: { ru: "SVG отправляется на сервер?", en: "Is the SVG uploaded?" }, answer: { ru: "Нет. Обработка идёт в браузере.", en: "No. Processing happens in the browser." } },
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
      { question: { ru: "Можно удалить водяной знак?", en: "Can it remove watermarks?" }, answer: { ru: "Нет. Инструмент только добавляет watermark на ваши изображения.", en: "No. The tool only adds a watermark to your images." } },
      { question: { ru: "Файл загружается на сервер?", en: "Is the file uploaded?" }, answer: { ru: "Нет. Обработка происходит локально в браузере.", en: "No. Processing happens locally in the browser." } },
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
      { question: { ru: "Это показывает GPS координаты?", en: "Does it show GPS coordinates?" }, answer: { ru: "Нет. Текущая версия показывает наличие metadata chunks, а не декодирует каждое поле.", en: "No. This version shows metadata chunk presence, not every decoded field." } },
      { question: { ru: "Удаление гарантировано?", en: "Is removal guaranteed?" }, answer: { ru: "Для Canvas re-encode исходные EXIF/XMP chunks не переносятся, но итог зависит от возможностей браузера и формата.", en: "Canvas re-encode does not carry source EXIF/XMP chunks, but output depends on browser and format capabilities." } },
    ],
    relatedToolSlugs: ["image-optimizer", "image-format-converter", "add-watermark-to-image"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/Canvas_API"],
  }),
] as const;
