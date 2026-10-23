import { toolPage } from "./shared";

export const mediaUtilityToolPages = [
  toolPage({
    slug: "image-optimizer",
    seoTitle: { ru: "Сжатие PNG, JPEG, WebP и AVIF онлайн", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
    metaDescription: { ru: "Сжимайте изображения в AVIF, WebP, JPEG или PNG с выбранным качеством. WebP, JPEG и PNG обрабатываются в браузере. Для AVIF файл отправляется на сервер WebDiag без сохранения.", en: "Compress images as AVIF, WebP, JPEG, or PNG with selected quality. WebP, JPEG, and PNG are processed in the browser. AVIF uploads the file to the WebDiag server without storage." },
    h1: { ru: "Сжатие PNG, JPEG, WebP и AVIF", en: "PNG, JPEG, WebP & AVIF Image Compressor" },
    lead: { ru: "Выберите формат и качество изображения, сравните размер готового файла с исходным и скачайте результат.", en: "Choose an image format and quality, compare the file size with the original, and download the result." },
    quickFacts: [
      { ru: "Один файл", en: "One file" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
      { ru: "Выбор качества", en: "Adjustable quality" },
    ],
    howToSteps: [
      { ru: "Выберите изображение на устройстве.", en: "Choose an image from your device." },
      { ru: "Укажите формат и качество результата.", en: "Select the output format and quality." },
      { ru: "Сожмите изображение, сравните размер и скачайте файл.", en: "Compress the image, compare file sizes, and download the result." },
    ],
    supportedFeatures: [
      { ru: "Открытие изображений в форматах, которые поддерживает браузер.", en: "Open images in formats your browser can read." },
      { ru: "Сохранение в AVIF, WebP, JPEG или PNG.", en: "Save as AVIF, WebP, JPEG, or PNG." },
      { ru: "Настройка качества JPEG, WebP и AVIF.", en: "Adjust JPEG, WebP, and AVIF quality." },
    ],
    limitations: [
      { ru: "Пакетная обработка и сохранение метаданных не поддерживаются.", en: "Batch processing and metadata preservation are not supported." },
      { ru: "Уменьшение размера не гарантируется: результат зависит от исходника, формата и качества.", en: "A smaller file is not guaranteed; output depends on the source, format, and quality." },
    ],
    useCases: [
      { ru: "Подготовка изображения для веб-страницы.", en: "Preparing an image for a webpage." },
      { ru: "Сравнение JPEG и WebP для одного исходника.", en: "Comparing JPEG and WebP for the same source." },
      { ru: "Сжатие изображения перед отправкой.", en: "Compressing an image before sharing." },
    ],
    technicalNotes: [
      { ru: "JPEG, WebP и PNG создаются в браузере. Для AVIF файл отправляется на сервер WebDiag и обрабатывается без сохранения.", en: "JPEG, WebP, and PNG are created in your browser. AVIF uploads the file to the WebDiag server for processing without storage." },
      { ru: "Повторное кодирование может изменить цветовой профиль, метаданные и отдельные пиксели изображения.", en: "Re-encoding can change the color profile, metadata, and individual pixels." },
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
    lead: { ru: "Выберите изображение и формат результата, затем скачайте новый файл. AVIF создаётся на сервере WebDiag, остальные форматы — в браузере.", en: "Choose an image and output format, then download the converted file. AVIF is created on the WebDiag server; other formats are created in your browser." },
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
      { ru: "Преобразование в AVIF, WebP, JPEG или PNG.", en: "Convert to AVIF, WebP, JPEG, or PNG." },
      { ru: "Обработка JPEG, WebP и PNG в браузере, AVIF — на сервере без сохранения файла.", en: "Process JPEG, WebP, and PNG in the browser, or AVIF on the server without storing the file." },
      { ru: "Расширение готового файла соответствует выбранному формату.", en: "The downloaded file's extension matches the selected format." },
    ],
    limitations: [
      { ru: "Сохранение в HEIC, SVG и GIF не поддерживается. Для AVIF требуется соединение с сервером WebDiag.", en: "HEIC, SVG, and GIF output are not supported. AVIF requires a connection to the WebDiag server." },
      { ru: "Анимация и исходные метаданные не сохраняются.", en: "Animation and source metadata are not preserved." },
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
    metaDescription: { ru: "Измените ширину и высоту изображения с сохранением пропорций или задайте точные размеры. Сохраните результат в формате, который поддерживает браузер.", en: "Resize an image while keeping its proportions or set an exact width and height. Save the result in an output format supported by your browser." },
    h1: { ru: "Изменить размер изображения онлайн", en: "Resize an Image Online" },
    lead: { ru: "Задайте новую ширину и высоту, сохраните исходное соотношение сторон при необходимости и скачайте результат.", en: "Set a new width and height, preserve the source aspect ratio when needed, and download the result." },
    quickFacts: [
      { ru: "Ширина и высота", en: "Width and height" },
      { ru: "Сохранение пропорций", en: "Preserve aspect ratio" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
    ],
    howToSteps: [
      { ru: "Выберите изображение.", en: "Choose an image." },
      { ru: "Введите новые размеры и выберите, сохранять ли пропорции.", en: "Enter the new dimensions and choose whether to keep the aspect ratio." },
      { ru: "Выберите формат, измените размер и скачайте файл.", en: "Select a format, resize, and download the file." },
    ],
    supportedFeatures: [
      { ru: "Ширина и высота задаются в целых пикселях.", en: "Set width and height in whole pixels." },
      { ru: "Автоматический расчёт второй стороны при сохранении пропорций.", en: "Automatic calculation of the second dimension when preserving proportions." },
      { ru: "Сохранение в AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "Save as AVIF, WebP, JPEG, or PNG when supported by your browser." },
    ],
    limitations: [
      { ru: "Пакетное изменение размера, готовые наборы размеров и улучшение качества не поддерживаются.", en: "Batch resizing, preset dimensions, and quality enhancement are not supported." },
      { ru: "Очень большие размеры могут быть ограничены памятью и Canvas браузера.", en: "Very large dimensions may be limited by browser memory and Canvas limits." },
    ],
    useCases: [
      { ru: "Подготовка изображения под точный размер блока.", en: "Preparing an image for an exact layout size." },
      { ru: "Создание уменьшенной копии для публикации.", en: "Creating a smaller copy for publishing." },
      { ru: "Пересчёт высоты по заданной ширине.", en: "Calculating height from a target width." },
    ],
    technicalNotes: [
      { ru: "Изображение масштабируется локально в браузере с помощью Canvas.", en: "The image is scaled locally in your browser using Canvas." },
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
      { ru: "Сохранение в AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "Save as AVIF, WebP, JPEG, or PNG when supported by your browser." },
    ],
    limitations: [
      { ru: "Выделение мышью, готовые пропорции обрезки и вращение не поддерживаются.", en: "Dragging a selection, preset crop ratios, and rotation are not supported." },
      { ru: "Поддерживается только прямоугольная область.", en: "Only rectangular crops are supported." },
    ],
    useCases: [
      { ru: "Точная обрезка по известным координатам.", en: "Exact cropping with known coordinates." },
      { ru: "Удаление края изображения.", en: "Removing an image border or edge." },
      { ru: "Создание фрагмента для последующей обработки.", en: "Creating a region for further processing." },
    ],
    technicalNotes: [
      { ru: "Координата X отсчитывается слева, Y — сверху.", en: "X is measured from the left and Y from the top." },
      { ru: "Если область выходит за изображение, она обрезается по его границам. Обработка выполняется в браузере.", en: "Areas that extend past the image are cropped to its boundaries. Processing runs in your browser." },
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
      { ru: "Расчёт размеров перед масштабированием изображения.", en: "Calculating dimensions before resizing an image." },
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
    metaDescription: { ru: "Удалите из SVG комментарии, метаданные, объявления XML, DOCTYPE и лишние пробелы. Обработка выполняется в браузере без отправки кода на сервер.", en: "Remove SVG comments, metadata, XML declarations, DOCTYPE, and redundant whitespace in your browser without sending the code to a server." },
    h1: { ru: "Оптимизация SVG в браузере", en: "SVG Optimizer in the Browser" },
    lead: { ru: "Вставьте SVG или выберите файл, получите компактный результат и скачайте оптимизированный SVG.", en: "Paste SVG or choose a file, get compact output, and download the optimized SVG." },
    quickFacts: [
      { ru: "Код или файл SVG", en: "SVG code or file" },
      { ru: "Без загрузки на сервер", en: "No server upload" },
      { ru: "Блокировка активного содержимого", en: "Active content blocked" },
    ],
    howToSteps: [
      { ru: "Вставьте SVG-код или выберите .svg файл.", en: "Paste SVG code or choose an .svg file." },
      { ru: "Запустите оптимизацию и сравните размер кода.", en: "Run optimization and compare the code size." },
      { ru: "Скачайте оптимизированный SVG.", en: "Download the optimized SVG." },
    ],
    supportedFeatures: [
      { ru: "Удаление объявления XML, DOCTYPE, комментариев и метаданных.", en: "Remove the XML declaration, DOCTYPE, comments, and metadata." },
      { ru: "Сжатие лишних пробелов между тегами.", en: "Whitespace compaction between tags." },
      { ru: "Блокировка элементов script и foreignObject, обработчиков событий в атрибутах и адресов javascript:.", en: "Block script and foreignObject elements, inline event handlers, and javascript: URLs." },
    ],
    limitations: [
      { ru: "Доступна базовая очистка кода; плагины и расширенные преобразования SVGO не поддерживаются.", en: "Basic code cleanup is available; SVGO plugins and advanced transformations are not supported." },
      { ru: "Инструмент не выполняет и не рендерит SVG-код.", en: "The tool does not execute or render SVG code." },
    ],
    useCases: [
      { ru: "Очистка SVG-иконки перед публикацией.", en: "Cleaning an SVG icon before publishing." },
      { ru: "Удаление метаданных графического редактора.", en: "Removing graphics-editor metadata." },
      { ru: "Проверка SVG на блокируемые элементы и обработчики событий.", en: "Checking SVG for blocked elements and event handlers." },
    ],
    technicalNotes: [
      { ru: "Код обрабатывается как текст и не вставляется в страницу как разметка.", en: "The code is processed as text and is not inserted into the page as markup." },
      { ru: "SVG со скриптами и другим блокируемым активным содержимым отклоняется.", en: "SVG containing scripts or other blocked active content is rejected." },
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
    metaDescription: { ru: "Добавьте текстовый водяной знак в браузере. Выберите позицию, прозрачность и размер текста, затем сохраните изображение в поддерживаемом формате.", en: "Add a text watermark in your browser. Choose its position, opacity, and text size, then save the image in a supported output format." },
    h1: { ru: "Добавить водяной знак на изображение", en: "Add a Watermark to an Image" },
    lead: { ru: "Нанесите текстовый водяной знак на одно изображение и скачайте результат без отправки файла на сервер.", en: "Apply a text watermark to one image and download the result without uploading the file to a server." },
    quickFacts: [
      { ru: "Текстовый водяной знак", en: "Text watermark" },
      { ru: "Позиция и прозрачность", en: "Position and opacity" },
      { ru: "AVIF / WebP / JPEG / PNG", en: "AVIF / WebP / JPEG / PNG" },
    ],
    howToSteps: [
      { ru: "Выберите изображение.", en: "Choose an image." },
      { ru: "Введите текст, выберите позицию, прозрачность и размер.", en: "Enter the text and choose its position, opacity, and size." },
      { ru: "Выберите формат результата и скачайте файл.", en: "Select output format and download the file." },
    ],
    supportedFeatures: [
      { ru: "Пять позиций: углы и центр.", en: "Five positions: corners and center." },
      { ru: "Настройка прозрачности и размера текста.", en: "Opacity and text-size controls." },
      { ru: "Сохранение в AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "Save as AVIF, WebP, JPEG, or PNG when supported by your browser." },
    ],
    limitations: [
      { ru: "Инструмент добавляет текстовый водяной знак. Удаление водяных знаков не поддерживается.", en: "The tool adds text watermarks. Watermark removal is not supported." },
      { ru: "Логотипы, повторение знака по всему изображению и пакетная обработка не поддерживаются.", en: "Logo watermarks, repeated watermarks, and batch processing are not supported." },
    ],
    useCases: [
      { ru: "Маркировка превью для клиента.", en: "Marking a preview for a client." },
      { ru: "Публикация демо-изображения с подписью.", en: "Publishing a demo image with a label." },
      { ru: "Добавление уведомления об авторских правах.", en: "Adding a copyright notice." },
    ],
    technicalNotes: [
      { ru: "Текст наносится на изображение в браузере с помощью Canvas.", en: "Text is drawn onto the image in your browser using Canvas." },
      { ru: "Создаётся новый растровый файл; исходные метаданные могут не сохраниться.", en: "The result is a new raster image; source metadata may not be preserved." },
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
    metaDescription: { ru: "Проверьте наличие блоков EXIF, XMP, ICC, IPTC/JFIF и метаданных PNG, WebP или AVIF. Создайте копию изображения перекодированием в браузере.", en: "Detect EXIF, XMP, ICC, IPTC/JFIF, and PNG, WebP, or AVIF metadata blocks. Create a new image copy by re-encoding it in your browser." },
    h1: { ru: "Просмотр и удаление метаданных изображения", en: "Image Metadata Viewer and Remover" },
    lead: { ru: "Проверьте, какие блоки метаданных найдены в файле, и создайте копию изображения без переноса исходных блоков EXIF и XMP.", en: "Check which metadata blocks are present in the file and create a re-encoded copy without carrying over the source EXIF and XMP blocks." },
    quickFacts: [
      { ru: "EXIF / XMP / ICC", en: "EXIF / XMP / ICC" },
      { ru: "Удаление перекодированием", en: "Remove by re-encoding" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите JPEG, PNG, WebP или AVIF.", en: "Choose a JPEG, PNG, WebP, or AVIF file." },
      { ru: "Посмотрите, какие блоки метаданных обнаружены.", en: "Review the detected metadata blocks." },
      { ru: "Выберите формат и создайте новую копию перекодированием.", en: "Select a format and re-encode the image to create a new copy." },
    ],
    supportedFeatures: [
      { ru: "Поиск блоков EXIF, XMP, ICC, IPTC/JFIF и текстовых блоков PNG по байтам файла.", en: "Detect EXIF, XMP, ICC, IPTC/JFIF, and PNG text blocks from the file's bytes." },
      { ru: "Создание копии без исходных метаданных с помощью перекодирования в браузере.", en: "Create a copy without the source metadata by re-encoding in the browser." },
      { ru: "Вывод AVIF, WebP, JPEG или PNG при поддержке браузера.", en: "AVIF, WebP, JPEG, or PNG output when supported by the browser." },
    ],
    limitations: [
      { ru: "Инструмент определяет наличие блоков метаданных, но не расшифровывает все поля EXIF.", en: "The tool detects metadata blocks but does not decode every EXIF field." },
      { ru: "Перекодирование может изменить размер, качество, цветовой профиль и формат файла.", en: "Re-encoding can change file size, quality, color profile, and format." },
    ],
    useCases: [
      { ru: "Проверка, есть ли EXIF/XMP перед публикацией.", en: "Checking whether EXIF/XMP exists before publishing." },
      { ru: "Создание копии без исходных метаданных.", en: "Creating a copy without source metadata." },
      { ru: "Подготовка изображения к веб-публикации.", en: "Preparing an image for web publishing." },
    ],
    technicalNotes: [
      { ru: "Поиск метаданных выполняется локально по сигнатурам байтов файла.", en: "Metadata is detected locally by examining byte signatures in the file." },
      { ru: "Перекодирование через Canvas обычно не переносит исходные блоки метаданных. Результат стоит проверить перед публикацией.", en: "Canvas re-encoding normally omits the source metadata blocks. Check the result before publishing." },
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
    seoTitle: { ru: "Генератор PNG-иконок для сайта и веб-приложения", en: "PNG Favicon and Web App Icon Generator" },
    metaDescription: { ru: "Создайте пять PNG-иконок для сайта и веб-приложения из JPEG, PNG, WebP или AVIF в браузере. Скачайте файлы отдельно или ZIP-архивом с разметкой.", en: "Create five PNG icons for a site or web app from a JPEG, PNG, WebP, or AVIF in your browser. Download individual files or a ZIP with markup." },
    h1: { ru: "Генератор PNG-иконок для сайта и веб-приложения", en: "PNG Favicon and Web App Icon Generator" },
    lead: { ru: "Создайте пять PNG-иконок из центральной квадратной области изображения. Скачайте их отдельно или ZIP-архивом вместе с разметкой HTML и манифестом.", en: "Create five PNG icons from a centered square crop of your image. Download them individually or as a ZIP with HTML markup and a manifest." },
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
      { ru: "Иконки сайта favicon-32x32.png и favicon-48x48.png.", en: "Site icons named favicon-32x32.png and favicon-48x48.png." },
      { ru: "PNG 180 × 180 для apple-touch-icon.", en: "180 × 180 PNG for apple-touch-icon." },
      { ru: "PNG 192 × 192 и 512 × 512 с описанием иконок в манифесте.", en: "192 × 192 and 512 × 512 PNG files with manifest icon entries." },
    ],
    limitations: [
      { ru: "Инструмент не создаёт .ico и SVG и не добавляет отступы для иконок с маской (maskable).", en: "The tool does not create .ico or SVG files or add padding for maskable icons." },
      { ru: "Используется только центральная квадратная область; автоматическая установка на сайт не выполняется.", en: "Only a centered square crop is used; the generated assets are not installed on a site automatically." },
    ],
    useCases: [
      { ru: "Подготовка набора PNG-иконок для сайта.", en: "Preparing a set of PNG site icons." },
      { ru: "Создание apple-touch-icon из квадратного логотипа.", en: "Creating an apple-touch-icon from a square logo." },
      { ru: "Подготовка двух размеров иконок для манифеста веб-приложения.", en: "Preparing two web app icon sizes for a manifest." },
    ],
    technicalNotes: [
      { ru: "Изображение обрезается по центру до квадрата и масштабируется с помощью Canvas.", en: "Canvas crops the image to a centered square and resizes it for each icon." },
      { ru: "Все PNG-файлы и ZIP-архив создаются в браузере без отправки исходного изображения на сервер.", en: "All PNG files and the ZIP archive are created in your browser without uploading the source image to a server." },
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
    seoTitle: { ru: "Создание и чтение QR-кодов онлайн", en: "QR Code Generator and Reader" },
    metaDescription: { ru: "Создавайте QR-коды из текста и читайте один QR-код из локального JPEG, PNG, WebP или AVIF без загрузки файла.", en: "Generate QR codes from text and read one QR code from a local JPEG, PNG, WebP, or AVIF without uploading the file." },
    h1: { ru: "Создание и чтение QR-кодов", en: "QR Code Generator and Reader" },
    lead: { ru: "Создайте QR-код в формате PNG или прочитайте код из изображения на устройстве. Найденный текст показывается без автоматического перехода по ссылкам.", en: "Create a QR code as a PNG or read one from an image on your device. Decoded text is displayed without opening links automatically." },
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
      { ru: "Уровни коррекции ошибок L, M, Q и H и свободное поле шириной в четыре модуля.", en: "L, M, Q, and H error-correction levels with a four-module quiet zone." },
      { ru: "Кодирование текста UTF-8, сохранение PNG и чтение одного QR-кода из растрового изображения.", en: "Encode UTF-8 text, save a PNG, or read one QR code from a raster image." },
      { ru: "JPEG, PNG, WebP и AVIF при поддержке декодирования браузером.", en: "JPEG, PNG, WebP, and AVIF when the browser can decode the format." },
    ],
    limitations: [
      { ru: "Сканирование камерой, пакетное чтение, другие форматы штрихкодов и проверка безопасности ссылок не поддерживаются.", en: "Camera scanning, batch reading, other barcode formats, and link safety checks are not supported." },
      { ru: "Объём текста, который поместится в код, зависит от символов и уровня коррекции. Если текст слишком длинный, появится ошибка.", en: "How much text fits depends on its characters and the error-correction level. Text that exceeds this capacity produces an error." },
    ],
    useCases: [
      { ru: "Передать короткий URL или текст между устройствами.", en: "Transfer a short URL or text between devices." },
      { ru: "Подготовить QR-код в PNG для вставки в документ.", en: "Prepare a QR code as a PNG for a document." },
      { ru: "Проверить содержимое QR-кода из локального скриншота.", en: "Inspect QR content from a local screenshot." },
    ],
    technicalNotes: [
      { ru: "QR-код создаётся локально в браузере и сохраняется как чёрно-белое PNG-изображение.", en: "The QR code is generated locally in your browser and saved as a black-and-white PNG." },
      { ru: "При чтении анализируются пиксели изображения. Найденный текст выводится в поле только для чтения.", en: "Reading analyzes the image's pixels. Detected text is displayed in a read-only field." },
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
    seoTitle: { ru: "Data URI и PNG-заглушка для изображения", en: "Image to Data URI and PNG Placeholder" },
    metaDescription: { ru: "Преобразуйте JPEG, PNG, WebP или AVIF до 1 МиБ в Data URI и создайте отдельную PNG-заглушку до 24 пикселей. Обработка выполняется в браузере.", en: "Convert a JPEG, PNG, WebP, or AVIF up to 1 MiB to a Data URI and create a separate PNG placeholder up to 24 pixels. Processing runs in your browser." },
    h1: { ru: "Data URI и PNG-заглушка для изображения", en: "Image to Data URI and PNG Placeholder" },
    lead: { ru: "Получите исходный файл в виде строки base64 и отдельную миниатюрную PNG-заглушку без отправки изображения на сервер.", en: "Get the source file as a base64 string and create a separate tiny PNG placeholder without uploading the image to a server." },
    quickFacts: [
      { ru: "До 1 МиБ", en: "Up to 1 MiB" },
      { ru: "Заглушка до 24 пикселей", en: "Placeholder up to 24 pixels" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Выберите один JPEG, PNG, WebP или AVIF.", en: "Choose one JPEG, PNG, WebP, or AVIF file." },
      { ru: "Создайте Data URI исходного файла и миниатюрную PNG-заглушку.", en: "Create a Data URI of the source file and a tiny PNG placeholder." },
      { ru: "Скопируйте нужный Data URI или готовое CSS-свойство.", en: "Copy the required Data URI or the ready-to-use CSS declaration." },
    ],
    supportedFeatures: [
      { ru: "Определение формата по сигнатуре байтов файла.", en: "Detect the format from the file's byte signature." },
      { ru: "Точное base64-кодирование всех байтов исходного файла.", en: "Exact base64 encoding of every source-file byte." },
      { ru: "PNG-заглушка с сохранением пропорций и стороной не более 24 пикселей.", en: "A PNG placeholder that keeps the aspect ratio, with no side larger than 24 pixels." },
    ],
    limitations: [
      { ru: "Строка Data URI занимает больше места, чем исходные байты файла. Преобразование не сжимает изображение.", en: "A Data URI string takes more space than the original file bytes. Conversion does not compress the image." },
      { ru: "Заглушка создаётся в PNG, без BlurHash. Способ её загрузки и отображения на сайте нужно выбрать самостоятельно.", en: "The placeholder is a PNG, without BlurHash. You choose how to load and display it on your site." },
    ],
    useCases: [
      { ru: "Встраивание небольшого локального изображения в CSS или HTML.", en: "Embedding a small local image in CSS or HTML." },
      { ru: "Подготовка миниатюрной заглушки для изображения на сайте.", en: "Preparing a tiny placeholder for an image on a site." },
      { ru: "Определение MIME-типа по содержимому файла.", en: "Identifying the MIME type from the file content." },
    ],
    technicalNotes: [
      { ru: "Исходный Data URI строится непосредственно из прочитанных байтов и показывается только как текст.", en: "The source Data URI is built directly from the read bytes and displayed only as text." },
      { ru: "Миниатюра создаётся из изображения с помощью Canvas в браузере.", en: "The thumbnail is created from the image using Canvas in your browser." },
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
    metaDescription: { ru: "Соберите srcset и разметку img из готовых адресов и ширины изображений. HTTPS и пути от корня сайта; файлы нужно подготовить заранее.", en: "Build srcset and img markup from existing HTTPS or site-relative image URLs and widths. The tool does not create image files." },
    h1: { ru: "Генератор srcset для адаптивных изображений", en: "Responsive Image Srcset Generator" },
    lead: { ru: "Укажите адреса и ширину до 20 готовых изображений. Получите srcset и разметку img для добавления на сайт.", en: "Enter addresses and widths for up to 20 existing images. Generate a srcset and img markup to add to your site." },
    quickFacts: [
      { ru: "1–20 URL", en: "1–20 URLs" },
      { ru: "Ширина в пикселях", en: "Widths in pixels" },
      { ru: "Экранирование HTML", en: "HTML escaping" },
    ],
    howToSteps: [
      { ru: "Введите адрес и фактическую ширину каждого файла, разделив их знаком |.", en: "Enter each file's address and actual width, separated by |." },
      { ru: "Укажите основной адрес src, значение sizes и описание изображения для alt.", en: "Enter a fallback src address, a sizes value, and alt text describing the image." },
      { ru: "Создайте и скопируйте srcset или HTML-разметку img.", en: "Generate and copy the srcset or img markup." },
    ],
    supportedFeatures: [
      { ru: "Адреса HTTPS и пути от корня сайта без логина, пароля и фрагмента после #.", en: "HTTPS URLs and paths relative to the site root, without embedded credentials or # fragments." },
      { ru: "Уникальные значения ширины от 1 до 8192 пикселей.", en: "Unique widths from 1 to 8192 pixels." },
      { ru: "Сортировка изображений по ширине и экранирование значений HTML-атрибутов.", en: "Sort images by width and escape HTML attribute values." },
    ],
    limitations: [
      { ru: "Инструмент не создаёт и не загружает изображения на сайт, не проверяет файлы и их размеры.", en: "The tool does not create image files, upload them, or verify their dimensions." },
      { ru: "Выбор разных композиций через picture, дескрипторы плотности пикселей и преобразования CDN не поддерживаются. Синтаксис условий в sizes не проверяется.", en: "Art direction with picture, pixel-density descriptors, and CDN transformations are not supported. The syntax of conditions in sizes is not validated." },
    ],
    useCases: [
      { ru: "Подготовка srcset для заранее созданных WebP-файлов.", en: "Preparing a srcset for pre-generated WebP files." },
      { ru: "Сортировка набора изображений по фактической ширине.", en: "Sorting an image set by intrinsic width." },
      { ru: "Подготовка разметки img с описанием изображения в alt.", en: "Preparing img markup with an image description in alt." },
    ],
    technicalNotes: [
      { ru: "Адреса с неэкранированными запятыми или пробельными символами отклоняются: они могут нарушить синтаксис srcset.", en: "URLs with unescaped commas or whitespace are rejected because they can break srcset syntax." },
      { ru: "Результат показывается как текст и не вставляется в страницу как разметка.", en: "The result is displayed as text and is not inserted into the page as markup." },
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
