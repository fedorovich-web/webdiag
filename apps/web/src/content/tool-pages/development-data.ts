import { toolPage } from "./shared";

export const developmentDataToolPages = [
  toolPage({
    slug: "json-formatter-validator",
    seoTitle: { ru: "Форматирование и проверка JSON онлайн", en: "JSON Formatter & Validator Online" },
    metaDescription: { ru: "Проверьте синтаксис JSON и отформатируйте корректные данные с отступом в 2 пробела. Обработка выполняется локально в браузере.", en: "Validate JSON syntax and format valid data with two-space indentation. Processing runs locally in your browser." },
    h1: { ru: "Форматирование и проверка JSON онлайн", en: "JSON Formatter & Validator Online" },
    lead: { ru: "Вставьте JSON, чтобы проверить синтаксис и получить читаемую структуру с отступами.", en: "Paste JSON to validate its syntax and produce a readable, indented structure." },
    quickFacts: [
      { ru: "Стандартный JSON", en: "Standard JSON" },
      { ru: "Отступ в 2 пробела", en: "Two-space indentation" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Вставьте JSON в поле ввода.", en: "Paste JSON into the input field." },
      { ru: "Нажмите кнопку форматирования.", en: "Select the format action." },
      { ru: "Скопируйте результат или исправьте указанную синтаксическую ошибку.", en: "Copy the result or correct the reported syntax error." },
    ],
    supportedFeatures: [
      { ru: "Проверка стандартным средством разбора JSON в браузере.", en: "Validation with the browser's standard JSON parser." },
      { ru: "Форматирование объектов, массивов, строк, чисел, логических значений и null.", en: "Formatting for objects, arrays, strings, numbers, booleans, and null." },
      { ru: "Сообщение об ошибке для некорректного синтаксиса.", en: "An error message for invalid syntax." },
    ],
    limitations: [
      { ru: "Инструмент не восстанавливает повреждённый JSON автоматически.", en: "The tool does not automatically repair malformed JSON." },
      { ru: "Просмотр в виде дерева, минификация и преобразование JSON5 не поддерживаются.", en: "Tree view, minification, and JSON5 conversion are not included." },
    ],
    useCases: [
      { ru: "Проверка ответа API перед отладкой.", en: "Checking an API response before debugging." },
      { ru: "Подготовка конфигурационного файла к просмотру.", en: "Making a configuration file easier to review." },
      { ru: "Поиск пропущенной запятой, кавычки или скобки.", en: "Finding a missing comma, quote, or bracket." },
    ],
    technicalNotes: [
      { ru: "Результат создаётся с помощью JSON.parse и JSON.stringify.", en: "Output is produced with JSON.parse and JSON.stringify." },
      { ru: "Порядок ключей определяется правилами разбора JSON в JavaScript.", en: "Key order follows JavaScript parser behavior." },
    ],
    faq: [
      { question: { ru: "Как сделать JSON удобным для чтения?", en: "How can I make JSON easier to read?" }, answer: { ru: "Вставьте данные и нажмите «Проверить и форматировать». Корректный JSON появится с отступами; при ошибке исправьте ввод и повторите проверку. Ключи и строки должны быть в двойных кавычках, комментарии не допускаются.", en: "Paste the data and choose Validate and format. Valid JSON is displayed with indentation. If an error appears, correct the input and try again. Keys and strings require double quotes; comments are not allowed." } },
      { question: { ru: "Изменяет ли форматирование значения данных?", en: "Does formatting change the meaning of the data?" }, answer: { ru: "Форматирование меняет представление корректного JSON, а не исправляет его смысл. Проверьте значения перед использованием результата. Данные обрабатываются в текущем браузере и не отправляются на сервер для форматирования.", en: "Formatting changes the presentation of valid JSON; it does not correct its meaning. Review the values before using the result. Formatting runs in the current browser without sending the data to a server." } }
    ],
    relatedToolSlugs: ["base64-converter", "url-encoder-decoder", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON"],
  }),
  toolPage({
    slug: "url-encoder-decoder",
    seoTitle: { ru: "Кодирование и декодирование URL-компонентов онлайн", en: "URL Component Encoder & Decoder Online" },
    metaDescription: { ru: "Кодируйте и декодируйте текст для URL с помощью encodeURIComponent и decodeURIComponent прямо в браузере.", en: "Encode and decode text for URLs with encodeURIComponent and decodeURIComponent directly in your browser." },
    h1: { ru: "Кодирование и декодирование URL-компонентов", en: "URL Component Encoder & Decoder" },
    lead: { ru: "Закодируйте текст для параметра запроса, сегмента пути или другого компонента URL либо восстановите исходное значение.", en: "Convert text to percent-encoded form for a query, path segment, or another URL component, and restore the original value." },
    quickFacts: [
      { ru: "UTF-8 текст", en: "UTF-8 text" },
      { ru: "Процентное кодирование", en: "Percent encoding" },
      { ru: "Локально в браузере", en: "Runs locally" },
    ],
    howToSteps: [
      { ru: "Введите текст или закодированную строку.", en: "Enter plain text or an encoded string." },
      { ru: "Выберите кодирование или декодирование.", en: "Choose encode or decode." },
      { ru: "Скопируйте преобразованное значение.", en: "Copy the transformed value." },
    ],
    supportedFeatures: [
      { ru: "Кодирование через encodeURIComponent.", en: "Encoding with encodeURIComponent." },
      { ru: "Декодирование через decodeURIComponent.", en: "Decoding with decodeURIComponent." },
      { ru: "Поддержка Unicode-текста.", en: "Unicode text support." },
    ],
    limitations: [
      { ru: "Это не анализатор полного URL и не проверка доступности адреса.", en: "This is not a full URL parser or availability checker." },
      { ru: "При некорректной последовательности вида %XX появится ошибка.", en: "Malformed percent sequences return an error." },
    ],
    useCases: [
      { ru: "Подготовка значения параметра запроса.", en: "Preparing a query-parameter value." },
      { ru: "Проверка закодированной строки из логов.", en: "Inspecting an encoded value from logs." },
      { ru: "Безопасная передача пробелов и специальных символов.", en: "Representing spaces and special characters safely." },
    ],
    technicalNotes: [
      { ru: "Пробел кодируется как %20, а не как плюс.", en: "A space is encoded as %20, not as a plus sign." },
      { ru: "Инструмент работает с компонентом URL, а не со всей строкой адреса целиком.", en: "The tool targets a URL component rather than a complete URL string." },
    ],
    faq: [
      { question: { ru: "Что нужно кодировать: всю ссылку или отдельное значение?", en: "Should I encode the whole link or a single value?" }, answer: { ru: "Обычно кодируют значение параметра, например текст поискового запроса. Инструмент обрабатывает всю введённую строку как один компонент. Если вставить полный адрес, его служебные символы тоже будут закодированы.", en: "Usually you encode a parameter value, such as search text. This tool processes the entire input as one component. If you paste a complete address, its structural characters will also be encoded." } },
      { question: { ru: "Почему после декодирования выводится ошибка?", en: "Why does decoding show an error?" }, answer: { ru: "Проверьте, что строка содержит корректные последовательности вида %XX и не была обрезана. Не декодируйте значение повторно без необходимости: результат может отличаться от ожидаемого. Инструмент не открывает полученные ссылки.", en: "Check that the input contains valid %XX sequences and has not been truncated. Avoid decoding again unless needed, as that can change the result. The tool does not open decoded links." } }
    ],
    relatedToolSlugs: ["base64-converter", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"],
  }),
  toolPage({
    slug: "base64-converter",
    seoTitle: { ru: "Кодирование и декодирование текста в Base64", en: "Base64 Text Encoder & Decoder Online" },
    metaDescription: { ru: "Кодируйте UTF-8 текст в Base64 и декодируйте Base64 обратно в текст прямо в браузере.", en: "Encode UTF-8 text as Base64 and decode Base64 back to text directly in your browser." },
    h1: { ru: "Кодирование и декодирование Base64 для текста", en: "Base64 Text Encoder & Decoder" },
    lead: { ru: "Преобразуйте UTF-8 текст в Base64 или восстановите исходную строку из корректного Base64-значения.", en: "Convert UTF-8 text to Base64 or restore the original string from a valid Base64 value." },
    quickFacts: [
      { ru: "UTF-8 текст", en: "UTF-8 text" },
      { ru: "Кодирование и декодирование", en: "Encode and decode" },
      { ru: "Не является шифрованием", en: "Not encryption" },
    ],
    howToSteps: [
      { ru: "Введите обычный текст или Base64-строку.", en: "Enter plain text or a Base64 string." },
      { ru: "Выберите нужное направление преобразования.", en: "Choose the conversion direction." },
      { ru: "Скопируйте результат.", en: "Copy the result." },
    ],
    supportedFeatures: [
      { ru: "Кодирование Unicode-текста через UTF-8 байты.", en: "Unicode text encoding through UTF-8 bytes." },
      { ru: "Игнорирование пробельных символов при декодировании.", en: "Whitespace is ignored during decoding." },
      { ru: "Ошибка при некорректной строке Base64 или результате, который нельзя прочитать как UTF-8.", en: "Errors for invalid Base64 or invalid UTF-8 output." },
    ],
    limitations: [
      { ru: "Файлы и изображения не поддерживаются.", en: "Files and images are not supported." },
      { ru: "Вариант Base64 для URL с заменой символов + и / не приводится к обычному Base64 автоматически.", en: "URL-safe Base64 using alternatives to + and / is not normalized automatically." },
    ],
    useCases: [
      { ru: "Просмотр закодированных текстовых данных.", en: "Inspecting a text payload." },
      { ru: "Подготовка тестовых данных для API.", en: "Preparing test data for an API." },
      { ru: "Проверка сохранённого Base64-значения.", en: "Checking a stored Base64 value." },
    ],
    technicalNotes: [
      { ru: "Base64 увеличивает объём данных примерно на треть и не скрывает содержимое.", en: "Base64 typically increases data size by roughly one third and does not conceal content." },
      { ru: "Декодированный набор байтов должен быть корректным UTF-8 текстом.", en: "Decoded bytes must form valid UTF-8 text." },
    ],
    faq: [
      { question: { ru: "Как преобразовать текст в Base64 и обратно?", en: "How do I convert text to Base64 and back?" }, answer: { ru: "Вставьте обычный текст и выберите кодирование. Чтобы получить исходный текст из корректной Base64-строки, выберите декодирование. Этот инструмент работает с текстом; для изображений есть отдельный конвертер Data URI.", en: "Paste plain text and choose Encode. Choose Decode to recover text from a valid Base64 string. This tool handles text; use the separate Data URI converter for images." } },
      { question: { ru: "Можно ли скрывать пароли с помощью Base64?", en: "Can Base64 be used to hide passwords?" }, answer: { ru: "Нет: это способ записи данных, а не шифрование. Любой, кто получил строку, может декодировать её. Не используйте Base64 как защиту паролей или других секретов.", en: "No. It represents data rather than encrypting it. Anyone with the string can decode it. Do not use Base64 to protect passwords or other secrets." } }
    ],
    relatedToolSlugs: ["url-encoder-decoder", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Glossary/Base64"],
  }),
  toolPage({
    slug: "html-entities-converter",
    seoTitle: { ru: "Кодирование и декодирование HTML-сущностей онлайн", en: "HTML Entities Encoder & Decoder Online" },
    metaDescription: { ru: "Кодируйте HTML-значимые символы и декодируйте именованные, десятичные и шестнадцатеричные HTML-сущности локально в браузере.", en: "Encode HTML-significant characters and decode named, decimal, and hexadecimal HTML entities locally in your browser." },
    h1: { ru: "Кодирование и декодирование HTML-сущностей", en: "HTML Entity Encoder and Decoder" },
    lead: { ru: "Закодируйте специальные символы для показа текста в HTML или восстановите их из поддерживаемых HTML-сущностей. Полученная разметка не выполняется.", en: "Encode special characters for displaying text in HTML, or decode supported entity references. The resulting markup is not executed." },
    quickFacts: [
      { ru: "Именованные и числовые сущности", en: "Named and numeric entities" },
      { ru: "Лимит 200 000 символов", en: "200,000-character limit" },
      { ru: "Локальная обработка", en: "Local processing" },
    ],
    howToSteps: [
      { ru: "Введите обычный текст или строку с HTML-сущностями.", en: "Enter plain text or a string containing HTML entities." },
      { ru: "Для кодирования выберите обработку кавычек и символов за пределами ASCII.", en: "For encoding, choose whether to process quotation marks and non-ASCII characters." },
      { ru: "Запустите кодирование или декодирование и скопируйте результат.", en: "Run encode or decode and copy the result." },
    ],
    supportedFeatures: [
      { ru: "Кодирование &, <, > и опционально кавычек.", en: "Encoding for &, <, >, and optional quotation marks." },
      { ru: "Декодирование распространённых именованных сущностей и числовых ссылок в десятичном или шестнадцатеричном формате.", en: "Decoding for common named entities and decimal or hexadecimal numeric references." },
      { ru: "Поддержка кодовых точек Unicode, включая символы вне основной многоязычной плоскости.", en: "Unicode code point support, including characters outside the Basic Multilingual Plane." },
    ],
    limitations: [
      { ru: "Именованные сущности ограничены документированным набором; неизвестные имена сохраняются без изменения.", en: "Named entities are limited to the documented set; unknown names remain unchanged." },
      { ru: "Декодирование требует завершающей точки с запятой; U+0000, суррогатные кодовые точки и значения выше U+10FFFF отклоняются.", en: "Decoding requires a terminating semicolon and rejects U+0000, surrogates, and values above U+10FFFF." },
    ],
    useCases: [
      { ru: "Подготовка фрагмента текста для показа внутри HTML.", en: "Preparing a text fragment for display inside HTML." },
      { ru: "Проверка HTML-сущностей в шаблоне или содержимом CMS.", en: "Inspecting entity references in a template or CMS content." },
      { ru: "Восстановление читаемого текста из тестовых HTML-данных.", en: "Restoring readable text from a test HTML payload." },
    ],
    technicalNotes: [
      { ru: "Результат выводится как обычный текст через React и не передаётся в dangerouslySetInnerHTML.", en: "Output is rendered as plain React text and is never passed to dangerouslySetInnerHTML." },
      { ru: "Символы за пределами ASCII можно оставить без изменения либо записать числовыми ссылками: десятичными или шестнадцатеричными с буквами в верхнем регистре.", en: "Non-ASCII characters can remain unchanged or be emitted as decimal or uppercase hexadecimal references." },
    ],
    faq: [
      { question: { ru: "Как показать HTML-теги на странице обычным текстом?", en: "How can I display HTML tags as plain text?" }, answer: { ru: "Закодируйте специальные символы, например < и >, через этот инструмент. Скопируйте результат туда, где нужно вывести пример HTML. Декодирование выполняет обратное преобразование, но полученные теги здесь не запускаются.", en: "Encode special characters such as < and > with this tool, then copy the result where you need to display an HTML example. Decoding reverses the conversion, but the resulting tags are not executed here." } },
      { question: { ru: "Почему часть HTML-сущностей остаётся без изменения?", en: "Why do some HTML entities remain unchanged?" }, answer: { ru: "Инструмент декодирует поддерживаемые записи с завершающей точкой с запятой. Проверьте написание и окончание сущности, например &amp;. Неизвестная или незавершённая запись может не преобразоваться.", en: "The tool decodes supported entities ending in a semicolon. Check the spelling and ending, such as &amp;. Unknown or incomplete entities may not be converted." } }
    ],
    relatedToolSlugs: ["url-encoder-decoder", "base64-converter", "diff-checker", "json-formatter-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Glossary/Character_reference"],
  }),
  toolPage({
    slug: "diff-checker",
    seoTitle: { ru: "Сравнение текста и кода построчно онлайн", en: "Line-by-Line Text & Code Diff Checker" },
    metaDescription: { ru: "Сравните два текста построчно, найдите добавления, удаления и замены и получите результат в формате unified diff локально в браузере.", en: "Compare two texts line by line, find additions, deletions, and replacements, and generate a unified diff locally in your browser." },
    h1: { ru: "Построчное сравнение текста и кода", en: "Line-by-Line Text and Code Diff Checker" },
    lead: { ru: "Сравните исходный и изменённый текст, просмотрите сводку и скопируйте unified diff. Тексты не отправляются на сервер, изменения не применяются к файлам.", en: "Compare the original and changed text, review the summary, and copy a unified diff. Text is not uploaded and changes are not applied to files." },
    quickFacts: [
      { ru: "Построчное сравнение", en: "Line-level diff" },
      { ru: "До 5 000 строк на сторону", en: "Up to 5,000 lines per side" },
      { ru: "Без применения изменений к файлам", en: "No patch application" },
    ],
    howToSteps: [
      { ru: "Вставьте исходный текст в первое поле.", en: "Paste the original text into the first field." },
      { ru: "Вставьте изменённую версию и при необходимости включите игнорирование пробелов и табуляции в конце строк.", en: "Paste the changed version and optionally enable trailing-whitespace ignoring." },
      { ru: "Запустите сравнение, проверьте сводку и скопируйте список изменений.", en: "Run the comparison, review the summary, and copy the diff." },
    ],
    supportedFeatures: [
      { ru: "Построчное сравнение с добавлениями, удалениями и группами замен.", en: "Deterministic line comparison with additions, deletions, and replacement groups." },
      { ru: "Нормализация CRLF и CR в LF перед сравнением.", en: "CRLF and CR normalization to LF before comparison." },
      { ru: "Опциональное игнорирование пробелов и табуляции только в конце строки.", en: "Optional ignoring of spaces and tabs only at the end of each line." },
    ],
    limitations: [
      { ru: "Сравнение выполняется по строкам: без подсветки отдельных слов, разбора синтаксиса и автоматического слияния.", en: "This is a line-level diff without word-level highlighting, syntax parsing, or automatic merge." },
      { ru: "Каждая сторона ограничена 200 000 символов и 5 000 строк; матрица сравнения ограничена 2 000 000 операций.", en: "Each side is limited to 200,000 characters and 5,000 lines; the comparison matrix is capped at 2,000,000 operations." },
    ],
    useCases: [
      { ru: "Проверка изменений конфигурации перед согласованием.", en: "Reviewing configuration changes before approval." },
      { ru: "Сравнение двух версий текстового ответа API.", en: "Comparing two versions of a text API response." },
      { ru: "Поиск добавленных и удалённых строк в небольшом фрагменте кода.", en: "Finding added and removed lines in a small code fragment." },
    ],
    technicalNotes: [
      { ru: "Алгоритм использует матрицу наибольшей общей подпоследовательности (LCS) с ограничением размера. При равных вариантах выбор всегда одинаков.", en: "The algorithm uses a size-limited longest common subsequence (LCS) matrix. Equal alternatives are resolved consistently for reproducible output." },
      { ru: "Unified diff содержит один блок изменений для всего введённого текста и отображается обычным текстом.", en: "The unified diff contains one change block for the full input and is displayed as plain text." },
    ],
    faq: [
      { question: { ru: "Как сравнить старую и новую версии текста?", en: "How can I compare old and new text versions?" }, answer: { ru: "Вставьте исходную и изменённую версии в соответствующие поля. Результат покажет добавленные и удалённые фрагменты. При необходимости сначала выровняйте переносы строк, чтобы сравнение было удобнее читать.", en: "Paste the original and changed versions into their respective fields. The result shows additions and removals. Normalise line breaks first if needed to make the comparison easier to read." } },
      { question: { ru: "Изменит ли результат сравнения мои файлы?", en: "Will the comparison modify my files?" }, answer: { ru: "Сервис только показывает различия и формирует текст результата. Он не открывает ваши файлы и не применяет изменения к репозиторию. Если сравнение превышает допустимый объём, разделите текст на меньшие части.", en: "The tool only displays differences and produces text output. It does not open your files or apply changes to a repository. Split large input into smaller parts if it exceeds the supported size." } }
    ],
    relatedToolSlugs: ["html-entities-converter", "json-formatter-validator", "regex-tester", "base64-converter"],
    sourceUrls: ["https://www.gnu.org/software/diffutils/manual/html_node/Unified-Format.html"],
  }),
  toolPage({
    slug: "hash-generator",
    seoTitle: { ru: "Генератор SHA-256, SHA-384 и SHA-512", en: "SHA-256, SHA-384 & SHA-512 Hash Generator" },
    metaDescription: { ru: "Вычислите SHA-256, SHA-384 или SHA-512 для введённого текста через Web Crypto API прямо в браузере.", en: "Calculate SHA-256, SHA-384, or SHA-512 for entered text with the Web Crypto API directly in your browser." },
    h1: { ru: "Генератор SHA-хешей для текста", en: "SHA Hash Generator for Text" },
    lead: { ru: "Вычислите SHA-256, SHA-384 или SHA-512 для строки и получите хеш в шестнадцатеричном виде без отправки текста на сервер.", en: "Generate a hexadecimal SHA-256, SHA-384, or SHA-512 digest for a string without sending the text to a server." },
    quickFacts: [
      { ru: "SHA-256 / 384 / 512", en: "SHA-256 / 384 / 512" },
      { ru: "Ввод в UTF-8", en: "UTF-8 input" },
      { ru: "Web Crypto API", en: "Web Crypto API" },
    ],
    howToSteps: [
      { ru: "Введите текст.", en: "Enter text." },
      { ru: "Выберите SHA-алгоритм.", en: "Select a SHA algorithm." },
      { ru: "Вычислите и скопируйте хеш в шестнадцатеричном виде.", en: "Generate and copy the hexadecimal digest." },
    ],
    supportedFeatures: [
      { ru: "SHA-256, SHA-384 и SHA-512.", en: "SHA-256, SHA-384, and SHA-512." },
      { ru: "Кодирование входной строки как UTF-8.", en: "UTF-8 encoding for the input string." },
      { ru: "Нижний регистр шестнадцатеричного результата.", en: "Lowercase hexadecimal output." },
    ],
    limitations: [
      { ru: "Нет MD5, SHA-1, HMAC и хеширования файлов.", en: "MD5, SHA-1, HMAC, and file hashing are not included." },
      { ru: "Хеш необратим и не является шифрованием.", en: "A hash is one-way and is not encryption." },
    ],
    useCases: [
      { ru: "Сравнение контрольных значений текста.", en: "Comparing checksums for text." },
      { ru: "Подготовка тестового хеша для разработки.", en: "Preparing a test digest during development." },
      { ru: "Проверка, изменилось ли строковое значение.", en: "Checking whether a string value changed." },
    ],
    technicalNotes: [
      { ru: "Одинаковый текст и алгоритм дают одинаковый хеш.", en: "The same text and algorithm produce the same digest." },
      { ru: "Даже небольшое изменение входа существенно меняет результат.", en: "Even a small input change substantially changes the output." },
    ],
    faq: [
      { question: { ru: "Почему одинаковый на вид текст даёт разные хеши?", en: "Why can similar-looking text produce different hashes?" }, answer: { ru: "Результат зависит от каждого символа: пробелов, переносов строк и регистра. Для сравнения используйте одинаковый алгоритм и точно совпадающие входные данные. Здесь рассчитываются SHA-256, SHA-384 и SHA-512 для текста.", en: "Every character matters, including spaces, line breaks, and letter case. Compare exactly matching input using the same algorithm. This tool calculates SHA-256, SHA-384, and SHA-512 for text." } },
      { question: { ru: "Можно ли получить исходный текст из хеша?", en: "Can a hash be decoded back into its original text?" }, answer: { ru: "Обратного декодирования у хеша нет. При этом короткий или известный текст можно угадать и сравнить его хеш, поэтому сам по себе такой расчёт не заменяет безопасное хранение паролей.", en: "A hash has no reverse decoding operation. However, short or predictable text can be guessed and its hash compared. This calculation alone is not a substitute for secure password storage." } }
    ],
    relatedToolSlugs: ["base64-converter", "uuid-generator", "ulid-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/SubtleCrypto/digest"],
  }),
  toolPage({
    slug: "uuid-generator",
    seoTitle: { ru: "Генератор UUID v4 онлайн", en: "UUID v4 Generator Online" },
    metaDescription: { ru: "Создайте случайный UUID версии 4 через криптографический генератор браузера. Один новый идентификатор за действие.", en: "Generate a random UUID version 4 with the browser cryptographic generator. One new identifier per action." },
    h1: { ru: "Генератор UUID v4 онлайн", en: "UUID v4 Generator Online" },
    lead: { ru: "Создайте стандартный UUID версии 4 для тестовых данных, записей и распределённых идентификаторов.", en: "Create a standard UUID version 4 for test data, records, and distributed identifiers." },
    quickFacts: [
      { ru: "UUID v4", en: "UUID v4" },
      { ru: "Криптографическая случайность", en: "Cryptographic randomness" },
      { ru: "Один идентификатор", en: "One identifier" },
    ],
    howToSteps: [
      { ru: "Нажмите кнопку генерации.", en: "Select the generate action." },
      { ru: "Скопируйте полученный UUID.", en: "Copy the generated UUID." },
      { ru: "Повторите действие, если нужен новый идентификатор.", en: "Repeat the action when you need another identifier." },
    ],
    supportedFeatures: [
      { ru: "Стандартный формат 8-4-4-4-12.", en: "Standard 8-4-4-4-12 format." },
      { ru: "Генерация через crypto.randomUUID.", en: "Generation through crypto.randomUUID." },
      { ru: "Быстрое копирование результата.", en: "Quick result copying." },
    ],
    limitations: [
      { ru: "Нет пакетной генерации и проверки UUID.", en: "Bulk generation and UUID validation are not included." },
      { ru: "Другие версии UUID, включая v1 и v7, не поддерживаются.", en: "Other UUID versions, including v1 and v7, are not supported." },
    ],
    useCases: [
      { ru: "Идентификаторы тестовых записей.", en: "Identifiers for test records." },
      { ru: "Подготовка тестовых данных и заготовок.", en: "Mock data and fixtures." },
      { ru: "Создание идентификатора на стороне браузера.", en: "Creating an independent client-side ID." },
    ],
    technicalNotes: [
      { ru: "UUID v4 не содержит временную метку и не сортируется по времени.", en: "UUID v4 does not contain a timestamp and is not time-sortable." },
      { ru: "Уникальность вероятностная, а не результат проверки общей базы.", en: "Uniqueness is probabilistic rather than checked against a global database." },
    ],
    faq: [
      { question: { ru: "Для чего можно использовать сгенерированный UUID?", en: "What can I use a generated UUID for?" }, answer: { ru: "UUID v4 подходит как случайный идентификатор записи, объекта или тестовых данных. Скопируйте полученное значение в нужную систему. Правила хранения и проверки уникальности в этой системе нужно настроить отдельно.", en: "A UUID v4 can serve as a random identifier for a record, object, or test data. Copy the value into your system. Configure that system's storage and uniqueness checks separately." } },
      { question: { ru: "Будут ли UUID упорядочены по времени создания?", en: "Will UUIDs sort by creation time?" }, answer: { ru: "UUID v4 содержит случайные данные и не задаёт хронологический порядок. Если нужна строка с временной частью, посмотрите генератор ULID. Ни один из этих генераторов сам не создаёт записи в вашей базе.", en: "UUID v4 contains random data and does not provide chronological ordering. Consider the ULID generator if you need an identifier with a time component. Neither generator creates records in your database." } }
    ],
    relatedToolSlugs: ["ulid-generator", "hash-generator", "unix-timestamp-converter"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/Crypto/randomUUID"],
  }),
  toolPage({
    slug: "unix-timestamp-converter",
    seoTitle: { ru: "Конвертер времени Unix и ISO 8601", en: "Unix Timestamp & ISO 8601 Converter" },
    metaDescription: { ru: "Переведите время Unix в секундах в дату ISO 8601 в UTC или преобразуйте дату обратно в секунды прямо в браузере.", en: "Convert a Unix timestamp in seconds to UTC ISO 8601 and a date back to Unix seconds directly in your browser." },
    h1: { ru: "Конвертер времени Unix и ISO 8601", en: "Unix Timestamp & ISO 8601 Converter" },
    lead: { ru: "Преобразуйте число секунд с начала эпохи Unix в дату ISO 8601 в UTC или выполните обратное преобразование.", en: "Convert seconds since the Unix epoch to a UTC ISO 8601 date or perform the reverse conversion." },
    quickFacts: [
      { ru: "Время Unix в секундах", en: "Unix seconds" },
      { ru: "UTC ISO 8601", en: "UTC ISO 8601" },
      { ru: "Два направления", en: "Two-way conversion" },
    ],
    howToSteps: [
      { ru: "Введите временную метку Unix в секундах или дату.", en: "Enter Unix seconds or a date value." },
      { ru: "Выберите нужное направление.", en: "Choose the conversion direction." },
      { ru: "Скопируйте ISO-строку или целое число секунд.", en: "Copy the ISO string or integer number of seconds." },
    ],
    supportedFeatures: [
      { ru: "Временная метка Unix в секундах.", en: "Unix timestamps in seconds." },
      { ru: "Результат даты в UTC через toISOString.", en: "UTC date output through toISOString." },
      { ru: "Разбор корректных значений даты, поддерживаемых браузером.", en: "Parsing of valid date values supported by the browser." },
    ],
    limitations: [
      { ru: "Миллисекунды не определяются автоматически.", en: "Milliseconds are not detected automatically." },
      { ru: "Нет выбора часового пояса или форматирования локального времени.", en: "Timezone selection and localized display are not included." },
    ],
    useCases: [
      { ru: "Чтение временной метки из API или лога.", en: "Reading a timestamp from an API or log." },
      { ru: "Подготовка секунд Unix для теста.", en: "Preparing Unix seconds for a test." },
      { ru: "Проверка UTC-момента события.", en: "Checking the UTC instant of an event." },
    ],
    technicalNotes: [
      { ru: "Эпоха Unix начинается 1 января 1970 года в UTC.", en: "The Unix epoch starts on January 1, 1970 UTC." },
      { ru: "При преобразовании даты число секунд Unix округляется вниз до целого.", en: "When converting a date, fractional seconds are floored to an integer Unix timestamp." },
    ],
    faq: [
      { question: { ru: "Почему вместо нужной даты получился неверный год?", en: "Why did I get an unexpected year instead of the date I wanted?" }, answer: { ru: "Проверьте единицы измерения: поле ожидает Unix-время в секундах. Многие программы возвращают миллисекунды — такое число перед вводом нужно разделить на 1000. Затем сравните полученную дату с ожидаемой.", en: "Check the units: the field expects Unix time in seconds. Many programs return milliseconds, which need to be divided by 1000 before entry. Then compare the resulting date with your expectation." } },
      { question: { ru: "В каком часовом поясе показывается дата?", en: "Which time zone is used for the displayed date?" }, answer: { ru: "Результат выводится в UTC — всемирном времени. Он может отличаться от часов на устройстве на величину вашего часового пояса. Выбор другого пояса в этом инструменте не предусмотрен.", en: "The result uses UTC. It may differ from your device clock by your time zone's offset. This tool does not offer a separate time zone selector." } }
    ],
    relatedToolSlugs: ["ulid-generator", "uuid-generator", "json-formatter-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/Date"],
  }),
  toolPage({
    slug: "ulid-generator",
    seoTitle: { ru: "Генератор ULID онлайн", en: "ULID Generator Online" },
    metaDescription: { ru: "Создайте стандартный 26-символьный ULID с временной и криптографически случайной частью прямо в браузере.", en: "Generate a standard 26-character ULID with time and cryptographically random components directly in your browser." },
    h1: { ru: "Генератор ULID онлайн", en: "ULID Generator Online" },
    lead: { ru: "Создайте лексикографически сортируемый идентификатор, состоящий из временной метки и случайной части Crockford Base32.", en: "Create a lexicographically sortable identifier built from a timestamp and Crockford Base32 randomness." },
    quickFacts: [
      { ru: "26 символов", en: "26 characters" },
      { ru: "Сортировка по времени", en: "Time-sortable" },
      { ru: "Crockford Base32", en: "Crockford Base32" },
    ],
    howToSteps: [
      { ru: "Нажмите кнопку генерации.", en: "Select the generate action." },
      { ru: "Скопируйте 26-символьный ULID.", en: "Copy the 26-character ULID." },
      { ru: "Повторите для следующего значения.", en: "Repeat for another value." },
    ],
    supportedFeatures: [
      { ru: "48-битная временная часть в миллисекундах.", en: "A 48-bit millisecond timestamp component." },
      { ru: "80 бит случайных данных из crypto.getRandomValues.", en: "80 bits of randomness from crypto.getRandomValues." },
      { ru: "Алфавит Crockford Base32 без неоднозначных символов.", en: "Crockford Base32 without ambiguous characters." },
    ],
    limitations: [
      { ru: "Нет пакетной генерации и разбора ULID.", en: "Bulk generation and ULID parsing are not included." },
      { ru: "Для нескольких ULID в одну миллисекунду порядок создания не гарантируется: монотонная генерация не реализована.", en: "The generator does not implement monotonic ULIDs for multiple values within the same millisecond." },
    ],
    useCases: [
      { ru: "Сортируемые идентификаторы записей.", en: "Sortable record identifiers." },
      { ru: "Логи и события, где полезен временной порядок.", en: "Logs and events where time ordering is useful." },
      { ru: "Тестовые данные для систем с ULID.", en: "Test data for systems that use ULIDs." },
    ],
    technicalNotes: [
      { ru: "Первые десять символов кодируют время, оставшиеся шестнадцать — случайность.", en: "The first ten characters encode time and the remaining sixteen encode randomness." },
      { ru: "ULID можно сортировать как строку при одинаковом регистре.", en: "ULIDs can be sorted as strings when casing is consistent." },
    ],
    faq: [
      { question: { ru: "Когда удобнее использовать ULID?", en: "When is a ULID useful?" }, answer: { ru: "ULID содержит временную и случайную части, поэтому его строковое представление удобно сортировать по времени. Он может пригодиться для идентификаторов событий или записей. Проверьте совместимость формата с вашей системой.", en: "A ULID includes time and random components, making its text representation useful for time-based sorting. It can identify events or records. Check that your system supports the format." } },
      { question: { ru: "Можно ли использовать генератор для чтения даты из чужого ULID?", en: "Can this generator read the date from an existing ULID?" }, answer: { ru: "Здесь создаются новые значения. Разбор готового ULID и извлечение его времени не выполняются. Для этой задачи нужен отдельный разбор формата в вашей программе или подходящий декодер.", en: "This tool creates new values. It does not parse existing ULIDs or extract their time component. Use format-parsing code or an appropriate decoder for that task." } }
    ],
    relatedToolSlugs: ["uuid-generator", "unix-timestamp-converter", "hash-generator"],
    sourceUrls: ["https://github.com/ulid/spec"],
  }),

  toolPage({
    slug: "jsonpath-tester",
    seoTitle: { ru: "Проверка JSONPath-запросов онлайн", en: "JSONPath Tester & Query Lab Online" },
    metaDescription: { ru: "Проверяйте JSONPath-запросы по локальному JSON: выбор полей, индексы, подстановки, рекурсивный поиск, объединения, срезы и простые фильтры без eval.", en: "Test JSONPath queries against local JSON with properties, indices, wildcards, recursive descent, unions, slices, and simple filters without eval." },
    h1: { ru: "Проверка JSONPath-запросов", en: "JSONPath Query Lab" },
    lead: { ru: "Проверьте выражение JSONPath и получите до 500 совпадений с путями JSON Pointer без выполнения JavaScript-кода.", en: "Test JSONPath expressions and receive up to 500 matches with JSON Pointer paths without executing JavaScript code." },
    quickFacts: [
      { ru: "Локальный JSON", en: "Local JSON" },
      { ru: "Без eval", en: "No eval" },
      { ru: "До 500 совпадений", en: "Up to 500 matches" },
    ],
    howToSteps: [
      { ru: "Вставьте JSON-документ.", en: "Paste a JSON document." },
      { ru: "Введите JSONPath, начинающийся с $.", en: "Enter a JSONPath expression starting with $." },
      { ru: "Запустите запрос и изучите пути и значения совпадений.", en: "Run the query and inspect match paths and values." },
    ],
    supportedFeatures: [
      { ru: "Выбор полей через точку или скобки, индексы массивов, включая отрицательные.", en: "Dot and bracket properties, array indices, and negative indices." },
      { ru: "Подстановки, рекурсивный поиск, объединения и срезы массивов.", en: "Wildcards, recursive descent, unions, and array slices." },
      { ru: "Фильтры наличия и сравнения со строками, числами, логическими значениями и null.", en: "Existence and comparison filters using string, number, boolean, and null literals." },
      { ru: "Пути JSON Pointer для каждого совпадения с сохранением повторных выборов одного узла.", en: "JSON Pointer paths for every match while preserving repeated node selections." },
    ],
    limitations: [
      { ru: "Поддерживается описанный набор операций JSONPath; расширения отдельных реализаций могут быть недоступны.", en: "A documented JSONPath subset is supported rather than every vendor-specific extension." },
      { ru: "Скриптовые выражения, функции, арифметика, регулярные выражения и eval не выполняются.", en: "Script expressions, functions, arithmetic, regular expressions, and eval are not executed." },
      { ru: "Ввод ограничен 500 000 символов, 10 000 узлов и глубиной 64; результат — 500 совпадений.", en: "Input is limited to 500,000 characters, 10,000 nodes, and depth 64; output is limited to 500 matches." },
    ],
    useCases: [
      { ru: "Проверка пути в ответе API или тестовых данных.", en: "Testing a path against an API response or fixture." },
      { ru: "Поиск вложенных полей без написания скрипта.", en: "Finding nested properties without writing a script." },
      { ru: "Подготовка JSONPath-выражения для интеграции в пределах поддерживаемых операций.", en: "Preparing a JSONPath expression for an integration within the supported operations." },
    ],
    technicalNotes: [
      { ru: "При разборе не используются Function, eval и выполнение выражений JavaScript.", en: "The parser does not use Function, eval, or JavaScript expression execution." },
      { ru: "Обход ограничен 10 000 посещёнными узлами. При превышении лимита появится ошибка.", en: "Traversal stops with an error if it exceeds 10,000 visited nodes." },
    ],
    faq: [
      { question: { ru: "Как выбрать нужное поле из JSON?", en: "How do I select a field from JSON?" }, answer: { ru: "Вставьте JSON и выражение JSONPath. Например, $.name выбирает поле name в корне объекта. Запустите проверку и сравните найденные значения со структурой исходных данных.", en: "Paste JSON and a JSONPath expression. For example, $.name selects the name field at the object root. Run the query and compare returned values with the source structure." } },
      { question: { ru: "Почему выражение не принимается или ничего не находит?", en: "Why is an expression rejected or returning nothing?" }, answer: { ru: "Проверьте имена полей, путь и типы значений. Поддерживаются только описанные в инструменте операции и простые сравнения; произвольный JavaScript и регулярные выражения в фильтрах не выполняются. Пустой результат может означать, что совпадений нет.", en: "Check field names, paths, and value types. Only the documented operations and simple comparisons are supported; filters do not execute arbitrary JavaScript or regular expressions. An empty result may simply mean there are no matches." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "json-schema-validator", "yaml-json-converter"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc9535.html"],
  }),
  toolPage({
    slug: "toml-json-converter",
    seoTitle: { ru: "TOML в JSON и JSON в TOML онлайн", en: "TOML to JSON & JSON to TOML Converter" },
    metaDescription: { ru: "Преобразуйте TOML и JSON локально: поддерживаются таблицы, массивы таблиц, составные ключи, массивы и встроенные таблицы с ограничениями типов.", en: "Convert supported TOML configurations and JSON locally, including tables, array tables, dotted keys, arrays, and inline tables, with type limits." },
    h1: { ru: "Конвертер TOML ↔ JSON", en: "TOML ↔ JSON Converter" },
    lead: { ru: "Преобразуйте конфигурацию из поддерживаемого набора TOML в JSON и обратно без внешних запросов и выполнения кода из документа.", en: "Convert supported TOML configurations to JSON and back without external requests or executing code from the document." },
    quickFacts: [
      { ru: "Два направления", en: "Two-way conversion" },
      { ru: "Таблицы TOML", en: "TOML tables" },
      { ru: "До 5 000 узлов", en: "Up to 5,000 nodes" },
    ],
    howToSteps: [
      { ru: "Выберите TOML → JSON или JSON → TOML.", en: "Choose TOML → JSON or JSON → TOML." },
      { ru: "Вставьте документ с конфигурацией.", en: "Paste the configuration document." },
      { ru: "Запустите преобразование, проверьте предупреждения и результат.", en: "Run conversion and review warnings and output." },
    ],
    supportedFeatures: [
      { ru: "Обычные и литеральные строки, логические значения, точно представимые целые числа, конечные дробные числа и массивы.", en: "Basic and literal strings, booleans, safe integers, finite floats, and arrays." },
      { ru: "Таблицы, составные ключи через точку, массивы таблиц и встроенные таблицы.", en: "Tables, dotted keys, array tables, and inline tables." },
      { ru: "Шестнадцатеричные, восьмеричные и двоичные целые числа с проверкой диапазона точного представления в JSON.", en: "Hexadecimal, octal, and binary integers checked against the JSON safe-integer range." },
      { ru: "Даты и время TOML сохраняются как строки с предупреждением.", en: "TOML date/time values are preserved as strings with an explicit warning." },
    ],
    limitations: [
      { ru: "Поддерживается ограниченный набор конструкций конфигурации, а не весь стандарт TOML 1.0.", en: "A limited set of configuration constructs is supported; the full TOML 1.0 standard is not implemented." },
      { ru: "Многострочные строки не поддерживаются; inf и nan отклоняются, поскольку их нельзя представить в JSON.", en: "Multiline strings are not supported; inf and nan are rejected because JSON cannot represent them." },
      { ru: "JSON null не имеет TOML 1.0 эквивалента и отклоняется при JSON → TOML.", en: "JSON null has no TOML 1.0 equivalent and is rejected during JSON → TOML conversion." },
    ],
    useCases: [
      { ru: "Преобразование конфигурации приложения для API или тестов.", en: "Converting application configuration for an API or tests." },
      { ru: "Поиск повторяющихся ключей и конфликтов типов.", en: "Finding duplicate keys and type conflicts." },
      { ru: "Подготовка читаемого TOML из объекта JSON.", en: "Preparing readable TOML from a JSON-compatible object." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 5 000 узлов и глубиной 32.", en: "Input is limited to 500,000 characters, 5,000 nodes, and depth 32." },
      { ru: "Для JSON → TOML нужен объект в корне документа. Массивы объектов выводятся как массивы таблиц.", en: "JSON → TOML accepts a root object; arrays of objects are emitted as array tables." },
    ],
    faq: [
      { question: { ru: "Почему дата из TOML стала строкой в JSON?", en: "Why did a TOML date become a JSON string?" }, answer: { ru: "В JSON нет отдельного типа для даты и времени. Конвертер сохраняет такое значение текстом и показывает предупреждение. Убедитесь, что программа, которая получит результат, ожидает именно такое представление.", en: "JSON has no separate date or time type. The converter preserves that value as text and shows a warning. Check that the program receiving the result expects this representation." } },
      { question: { ru: "Что делать, если JSON содержит null?", en: "What should I do if my JSON contains null?" }, answer: { ru: "TOML не поддерживает такое значение. Решите, что оно означает в ваших данных: пропуск поля, пустой текст или другое допустимое значение. Конвертер не выбирает такую замену за вас, чтобы не изменить смысл данных.", en: "TOML does not support that value. Decide whether it means an omitted field, empty text, or another valid value in your data. The converter does not make that substitution for you because it could change the meaning." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "yaml-json-converter", "csv-json-converter"],
    sourceUrls: ["https://toml.io/en/v1.0.0"],
  }),
  toolPage({
    slug: "csv-json-converter",
    seoTitle: { ru: "Проверка CSV и конвертер CSV ↔ JSON", en: "CSV Data Workbench: Validation & CSV ↔ JSON" },
    metaDescription: { ru: "Проверяйте и преобразуйте CSV и JSON локально: определение разделителя, поля в кавычках и с переносами строк, проверка столбцов, заголовков и значений, похожих на формулы.", en: "Validate and convert CSV/JSON locally with delimiter detection, quoted and multiline fields, inconsistent rows, headers, and formula-like signals." },
    h1: { ru: "Проверка и преобразование CSV", en: "CSV Data Workbench" },
    lead: { ru: "Проверьте структуру CSV и преобразуйте данные в JSON или обратно в одном инструменте.", en: "Validate CSV structure and convert data to JSON or back in one tool." },
    quickFacts: [
      { ru: "CSV ↔ JSON", en: "CSV ↔ JSON" },
      { ru: "Многострочные поля в кавычках", en: "Quoted multiline fields" },
      { ru: "До 10 000 строк", en: "Up to 10,000 rows" },
    ],
    howToSteps: [
      { ru: "Выберите направление преобразования, разделитель и режим заголовков.", en: "Choose direction, delimiter, and header mode." },
      { ru: "Вставьте CSV или JSON и запустите проверку.", en: "Paste CSV or JSON and run validation." },
      { ru: "Исправьте найденные ошибки или скопируйте результат преобразования.", en: "Fix diagnostics or copy the converted output." },
    ],
    supportedFeatures: [
      { ru: "Разделители: запятая, точка с запятой, табуляция и вертикальная черта; доступно автоматическое определение.", en: "Comma, semicolon, tab, and pipe delimiters with optional auto-detection." },
      { ru: "Поля в кавычках, экранирование двойных кавычек, переносы CRLF/LF и многострочные значения в кавычках.", en: "Quoted fields, escaped double quotes, CRLF/LF, and multiline quoted values." },
      { ru: "Поиск строк с разным числом столбцов, пустых и повторяющихся заголовков, значений, похожих на формулы.", en: "Inconsistent-row, duplicate/empty-header, and formula-like-field diagnostics." },
      { ru: "Массивы объектов или массивов в JSON; при экспорте CSV можно добавить апостроф перед значениями, похожими на формулы.", en: "JSON arrays of objects or arrays; optional apostrophe prefix for formula-like CSV values." },
    ],
    limitations: [
      { ru: "Автоматическое определение разделителя может ошибаться: проверяйте результат для неоднозначных данных.", en: "Auto-detection is heuristic and should be reviewed for ambiguous files." },
      { ru: "При преобразовании JSON → CSV ячейки могут содержать только строки, числа, логические значения и null; вложенные объекты и массивы отклоняются.", en: "JSON → CSV accepts only scalar values and null; nested objects and arrays are rejected." },
      { ru: "Апостроф перед значением не гарантирует защиту от формул во всех табличных редакторах.", en: "An apostrophe prefix is not a universal protection for every spreadsheet application." },
    ],
    useCases: [
      { ru: "Проверка выгрузки CSV перед импортом.", en: "Checking a CSV export before import." },
      { ru: "Преобразование небольшого набора данных в тестовые данные JSON.", en: "Converting a small dataset into JSON fixtures." },
      { ru: "Поиск строк с разным числом столбцов и ячеек, которые могут быть приняты за формулы.", en: "Finding inconsistent columns and risky formula-like cells." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 10 000 строк, 200 столбцов и 500 000 ячеек.", en: "Input is limited to 500,000 characters, 10,000 rows, 200 columns, and 500,000 cells." },
      { ru: "Проверка структуры CSV и преобразование доступны в одной форме.", en: "CSV structure checks and conversion are available in the same form." },
    ],
    faq: [
      { question: { ru: "Как сохранить запятые и переносы строк внутри ячейки CSV?", en: "How do I preserve commas and line breaks inside a CSV cell?" }, answer: { ru: "Такие значения должны быть заключены в двойные кавычки; кавычка внутри значения записывается двумя кавычками. Проверьте предпросмотр после преобразования, чтобы убедиться, что данные не разделились на лишние столбцы или строки.", en: "Enclose such values in double quotes and represent an inner double quote with two double quotes. Check the conversion preview to ensure values did not split into extra columns or rows." } },
      { question: { ru: "Зачем при экспорте предлагается защита от формул?", en: "Why does export offer formula protection?" }, answer: { ru: "Табличный редактор может принять ячейку, начинающуюся с =, +, - или @, за формулу. Защитный режим добавляет апостроф к отмеченным значениям. Учитывайте это изменение, если файл будет читать другая программа.", en: "A spreadsheet may interpret cells beginning with =, +, -, or @ as formulas. Protection adds an apostrophe to flagged values. Account for this change if another program will read the file." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "jsonpath-tester", "toml-json-converter"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc4180.html", "https://owasp.org/www-community/attacks/CSV_Injection"],
  }),

  toolPage({
    slug: "json-schema-validator",
    seoTitle: { ru: "Проверка JSON по JSON Schema онлайн", en: "JSON Schema Validator Online" },
    metaDescription: { ru: "Проверьте JSON по поддерживаемым правилам JSON Schema 2020-12: типы, поля, обязательные значения, массивы, комбинации условий и локальные $ref.", en: "Validate JSON against supported JSON Schema 2020-12 rules for types, properties, required fields, arrays, combinators, and local $ref." },
    h1: { ru: "Проверка JSON по JSON Schema", en: "JSON Schema Validator" },
    lead: { ru: "Проверьте JSON-данные по схеме и получите до 100 ошибок с путём к значению, ключевым словом правила и объяснением.", en: "Check JSON data against a schema and receive up to 100 issues with instance paths, keywords, and explanations." },
    quickFacts: [
      { ru: "Локально в браузере", en: "Runs locally" },
      { ru: "Локальные $ref", en: "Local $ref" },
      { ru: "До 10 000 узлов", en: "Up to 10,000 nodes" },
    ],
    howToSteps: [
      { ru: "Вставьте проверяемый JSON.", en: "Paste the JSON instance." },
      { ru: "Вставьте JSON Schema.", en: "Paste the JSON Schema." },
      { ru: "Запустите проверку и изучите пути и нарушенные правила в отчёте.", en: "Run validation and review paths and keywords in the report." },
    ],
    supportedFeatures: [
      { ru: "type, enum, const, properties, required и additionalProperties.", en: "type, enum, const, properties, required, and additionalProperties." },
      { ru: "items, minItems, maxItems, uniqueItems и ограничения для объектов, строк и чисел.", en: "items, minItems, maxItems, uniqueItems, and object, string, and number constraints." },
      { ru: "allOf, anyOf, oneOf, not, $defs/definitions и локальные JSON Pointer $ref.", en: "allOf, anyOf, oneOf, not, $defs/definitions, and local JSON Pointer $ref." },
      { ru: "Ограниченная проверка форматов date, date-time, email, uri, uuid, IPv4, IPv6 и hostname.", en: "Limited checks for date, date-time, email, uri, uuid, IPv4, IPv6, and hostname formats." },
    ],
    limitations: [
      { ru: "Поддерживается описанный набор правил; полная проверка метасхемы JSON Schema 2020-12 не реализована.", en: "This is a documented subset, not a complete JSON Schema 2020-12 meta-schema implementation." },
      { ru: "Внешние $ref, динамические ссылки и ключевые слова для непроверенных значений, условных схем и содержимого не обрабатываются.", en: "Remote $ref, dynamic references, unevaluated, conditional, and content keywords are not executed." },
      { ru: "Проверка format оценивает синтаксис и не подтверждает существование почтового адреса, URL или узла.", en: "format checks are syntactic signals and do not confirm that an email, URL, or host exists." },
    ],
    useCases: [
      { ru: "Проверка тестовых данных API и конфигураций.", en: "Checking API fixtures and configurations." },
      { ru: "Поиск отсутствующих обязательных и лишних полей.", en: "Diagnosing required and additional properties." },
      { ru: "Предварительная локальная проверка перед проверкой в CI.", en: "Running a quick local check before a CI validator." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 10 000 узлов и глубиной 64.", en: "Input is limited to 500,000 characters, 10,000 nodes, and depth 64." },
      { ru: "Отчёт содержит до 100 ошибок. При достижении лимита появляется отметка о сокращении отчёта.", en: "The report is limited to 100 validation issues and marks truncation when the limit is reached." },
    ],
    faq: [
      { question: { ru: "Чем проверка по схеме отличается от проверки обычного JSON?", en: "How is schema validation different from checking ordinary JSON?" }, answer: { ru: "Обычная проверка находит ошибки записи JSON. Схема дополнительно описывает ожидаемые поля, типы и ограничения значений. Вставьте данные и схему, чтобы проверить поддерживаемые правила соответствия.", en: "An ordinary check finds JSON syntax errors. A schema additionally describes expected fields, types, and value constraints. Paste both data and schema to check the supported validation rules." } },
      { question: { ru: "Можно ли сослаться на схему по внешней ссылке?", en: "Can I reference a schema through an external URL?" }, answer: { ru: "Внешние схемы не загружаются. Ссылки $ref должны вести внутрь введённой схемы. Если ваша схема использует возможности за пределами поддерживаемого набора, проверьте её валидатором, который применяется в вашем проекте.", en: "External schemas are not fetched. $ref references must point within the supplied schema. If you need features outside the supported set, use the validator employed by your project." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "yaml-json-converter", "xml-formatter-validator"],
    sourceUrls: ["https://json-schema.org/draft/2020-12/json-schema-core.html", "https://json-schema.org/draft/2020-12/json-schema-validation.html"],
  }),
  toolPage({
    slug: "yaml-json-converter",
    seoTitle: { ru: "YAML в JSON и JSON в YAML онлайн", en: "YAML to JSON & JSON to YAML Converter" },
    metaDescription: { ru: "Преобразуйте JSON и поддерживаемые конфигурации YAML локально. Якоря, псевдонимы, пользовательские теги, ключи слияния и блочные строки отклоняются.", en: "Convert JSON and supported YAML configurations locally in the browser. Anchors, aliases, custom tags, merge keys, and block scalars are rejected." },
    h1: { ru: "Конвертер YAML ↔ JSON", en: "YAML ↔ JSON Converter" },
    lead: { ru: "Преобразуйте словари, последовательности и скалярные значения между JSON и поддерживаемым набором YAML без отправки данных на сервер.", en: "Convert mappings, sequences, and scalars between JSON and supported YAML without uploading data." },
    quickFacts: [
      { ru: "Два направления", en: "Two-way conversion" },
      { ru: "Ограниченный набор YAML", en: "Limited YAML support" },
      { ru: "До 5 000 узлов", en: "Up to 5,000 nodes" },
    ],
    howToSteps: [
      { ru: "Выберите YAML → JSON или JSON → YAML.", en: "Choose YAML → JSON or JSON → YAML." },
      { ru: "Вставьте документ и запустите преобразование.", en: "Paste the document and run the conversion." },
      { ru: "Скопируйте результат и проверьте его в целевом приложении.", en: "Copy the result and verify it in the target application." },
    ],
    supportedFeatures: [
      { ru: "Словари и последовательности с отступами по два пробела.", en: "Indented mappings and sequences using two-space indentation." },
      { ru: "Строки без кавычек, в одинарных и двойных кавычках, числа, логические значения и null.", en: "Plain, single-quoted, and double-quoted scalars, numbers, booleans, and null." },
      { ru: "Встроенные массивы и объекты в синтаксисе JSON.", en: "Inline arrays and objects when written with JSON syntax." },
      { ru: "JSON → YAML для значений JSON; неоднозначные строки заключаются в кавычки.", en: "JSON → YAML for JSON-compatible values with safe quoting of ambiguous strings." },
    ],
    limitations: [
      { ru: "Поддерживается ограниченный набор конструкций конфигурации, а не весь стандарт YAML 1.2.2.", en: "A limited set of configuration constructs is supported; the full YAML 1.2.2 standard is not implemented." },
      { ru: "Якоря, псевдонимы, пользовательские теги, ключи слияния, сложные ключи и блочные строки |/> отклоняются.", en: "Anchors, aliases, custom tags, merge keys, complex keys, and |/> block scalars are rejected." },
      { ru: "Комментарии не сохраняются при преобразовании в JSON и обратно.", en: "Comments are not preserved through JSON conversion and back." },
    ],
    useCases: [
      { ru: "Подготовка простой конфигурации CI/CD или приложения.", en: "Preparing a simple CI/CD or application configuration." },
      { ru: "Поиск повторяющихся ключей и ошибок отступов.", en: "Finding duplicate keys and indentation errors." },
      { ru: "Преобразование тестовых данных между JSON и YAML.", en: "Converting test data between JSON and YAML." },
    ],
    technicalNotes: [
      { ru: "Отступы YAML должны содержать число пробелов, кратное двум; табуляция запрещена.", en: "YAML indentation must use multiples of two spaces; tabs are rejected." },
      { ru: "Ввод ограничен 500 000 символов, 5 000 узлов и глубиной 32.", en: "Input is limited to 500,000 characters, 5,000 nodes, and depth 32." },
    ],
    faq: [
      { question: { ru: "Сохранятся ли комментарии при переводе YAML в JSON?", en: "Will YAML comments survive conversion to JSON?" }, answer: { ru: "JSON не поддерживает комментарии, поэтому они не попадут в результат. Сохраните исходный YAML отдельно, если пояснения важны. Преобразование предназначено для данных, а не для сохранения оформления документа.", en: "JSON does not support comments, so they will not appear in the result. Keep the source YAML separately if the notes matter. Conversion preserves data rather than document formatting." } },
      { question: { ru: "Почему конвертер отклоняет некоторые YAML-файлы?", en: "Why are some YAML files rejected?" }, answer: { ru: "Поддерживается ограниченный набор YAML. Ссылки на повторно используемые блоки и специальные теги не обрабатываются. Проверьте сообщение об ошибке и используйте отдельный YAML-парсер, если файл зависит от этих возможностей.", en: "The tool supports a limited YAML subset. Reusable block references and special tags are not processed. Read the error and use a dedicated YAML parser if your file relies on those features." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "json-schema-validator", "xml-formatter-validator"],
    sourceUrls: ["https://yaml.org/spec/1.2.2/", "https://www.json.org/json-en.html"],
  }),
  toolPage({
    slug: "xml-formatter-validator",
    seoTitle: { ru: "Форматирование и проверка структуры XML", en: "XML Formatter & Well-Formedness Validator" },
    metaDescription: { ru: "Проверьте структуру XML и отформатируйте её с отступом 2 или 4 пробела. DTD, ENTITY, XSD и загрузка внешних сущностей не поддерживаются.", en: "Check well-formed XML and format its structure with two- or four-space indentation. DTD, ENTITY, XSD, and external entity resolution are disabled." },
    h1: { ru: "Форматирование и проверка XML", en: "XML Formatter and Validator" },
    lead: { ru: "Проверьте парность тегов, кавычки атрибутов, сущности и наличие одного корневого элемента, затем отформатируйте XML.", en: "Check matching tags, quoted attributes, entities, and a single root element, then format the XML." },
    quickFacts: [
      { ru: "Проверка структуры XML", en: "Well-formedness" },
      { ru: "DTD/ENTITY отключены", en: "DTD/ENTITY disabled" },
      { ru: "Смешанное содержимое сохраняется", en: "Mixed content preserved" },
    ],
    howToSteps: [
      { ru: "Вставьте XML и выберите размер отступа.", en: "Paste XML and choose the indentation size." },
      { ru: "Запустите проверку и форматирование.", en: "Run validation and formatting." },
      { ru: "Исправьте ошибки структуры или скопируйте результат.", en: "Fix structural errors or copy the result." },
    ],
    supportedFeatures: [
      { ru: "Открывающие, закрывающие и самозакрывающиеся теги, атрибуты в кавычках и поиск повторяющихся атрибутов.", en: "Start/end/self-closing tags, quoted attributes, and duplicate-attribute detection." },
      { ru: "Комментарии XML, CDATA и инструкции обработки.", en: "XML comments, CDATA, and processing instructions." },
      { ru: "Предопределённые и числовые ссылки на сущности без раскрытия пользовательских сущностей.", en: "Predefined and numeric entity references without custom entity expansion." },
      { ru: "Отступы добавляются между элементами; смешанное содержимое остаётся без дополнительных пробелов.", en: "Formatting of structural content while mixed content remains compact." },
    ],
    limitations: [
      { ru: "Проверка по XSD, Relax NG, Schematron и проверка семантики пространств имён не выполняются.", en: "XSD, Relax NG, Schematron, and semantic namespace validation are not performed." },
      { ru: "Объявления DTD и ENTITY отклоняются; внешние сущности не загружаются.", en: "DTD and ENTITY declarations are rejected, and external entities are never resolved." },
      { ru: "Поддерживается ограниченный набор имён XML. Результат не является каноническим представлением XML.", en: "A limited set of XML names is supported. The output is not canonical XML." },
    ],
    useCases: [
      { ru: "Проверка XML из ответа API, ленты или конфигурации.", en: "Checking an API payload, feed, or configuration XML." },
      { ru: "Поиск непарных тегов и повторяющихся атрибутов.", en: "Finding mismatched tags and duplicate attributes." },
      { ru: "Подготовка читаемой копии небольшого XML документа.", en: "Preparing a readable copy of a small XML document." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 10 000 узлов и глубиной 64.", en: "Input is limited to 500,000 characters, 10,000 nodes, and depth 64." },
      { ru: "Форматирование не добавляет отступы внутри смешанного содержимого, чтобы не менять значащий текст.", en: "The formatter does not inject indentation inside mixed content so significant text is not changed." },
    ],
    faq: [
      { question: { ru: "Что означает успешная проверка XML?", en: "What does a successful XML check mean?" }, answer: { ru: "Инструмент проверил поддерживаемые правила записи и структуру документа, например закрытие тегов. Это не подтверждает соответствие вашей предметной схеме XSD или требованиям принимающего сервиса. Их нужно проверить отдельно.", en: "The tool checked supported syntax and document structure rules, such as tag closure. It does not confirm compliance with your XSD schema or a receiving service's requirements. Check those separately." } },
      { question: { ru: "Почему документ с DTD или ENTITY не принимается?", en: "Why are documents with DTD or ENTITY declarations rejected?" }, answer: { ru: "Эти объявления не поддерживаются и отклоняются до разбора. Внешние данные по ним не загружаются. Если они обязательны для вашего формата, используйте специализированный XML-инструмент с нужными настройками.", en: "Those declarations are unsupported and rejected before parsing. No external data is fetched through them. If your format requires them, use a dedicated XML tool with the appropriate settings." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "json-schema-validator", "yaml-json-converter"],
    sourceUrls: ["https://www.w3.org/TR/xml/"],
  }),
  toolPage({
    slug: "sql-formatter",
    seoTitle: { ru: "Форматирование SQL онлайн без выполнения запроса", en: "SQL Formatter Online — Format Queries Locally" },
    metaDescription: { ru: "Отформатируйте SQL локально: секции запроса, объединения таблиц, списки, вложенные запросы, строки и комментарии. SQL не отправляется на сервер и не выполняется.", en: "Format SQL locally with readable clauses, joins, lists, nested subqueries, strings, and comments. Queries are neither uploaded nor executed." },
    h1: { ru: "Форматирование SQL-запросов", en: "SQL Formatter for Readable Queries" },
    lead: { ru: "Сделайте SQL-запрос удобным для чтения, сохранив значения в кавычках и комментарии, без подключения к базе данных.", en: "Turn SQL into a consistent, reviewable layout while preserving quoted values and comments, with no database connection." },
    quickFacts: [
      { ru: "Локально в браузере", en: "Runs locally" },
      { ru: "Запрос не выполняется", en: "No query execution" },
      { ru: "Ограничение размера и вложенности", en: "Size and nesting limits" },
    ],
    howToSteps: [
      { ru: "Вставьте SQL и выберите регистр ключевых слов.", en: "Paste SQL and choose the keyword casing." },
      { ru: "Выберите отступ в 2 или 4 пробела и запустите форматирование.", en: "Choose two- or four-space indentation and run the formatter." },
      { ru: "Проверьте предупреждения об особенностях диалекта SQL и скопируйте результат.", en: "Review any dialect warnings and copy the result." },
    ],
    supportedFeatures: [
      { ru: "Основные конструкции SELECT, INSERT, UPDATE, DELETE, WITH, UNION, JOIN, сортировка и группировка.", en: "Common SELECT, INSERT, UPDATE, DELETE, WITH, UNION, JOIN, ordering, and grouping clauses." },
      { ru: "Строки с экранированными кавычками, однострочные и блочные комментарии, идентификаторы в кавычках.", en: "Strings with escaped quotes, line and block comments, and quoted identifiers." },
      { ru: "Вложенные запросы с ограничением глубины и отступами.", en: "Nested subqueries with a depth limit and indentation." },
      { ru: "Верхний, нижний или исходный регистр ключевых слов.", en: "Uppercase, lowercase, or preserved keyword casing." },
    ],
    limitations: [
      { ru: "Поддерживается базовое форматирование без полного разбора диалектов PostgreSQL, MySQL, SQL Server, Oracle или SQLite.", en: "This is a conservative formatter, not a complete PostgreSQL, MySQL, SQL Server, Oracle, or SQLite parser." },
      { ru: "Смысл запроса, схема базы и план выполнения не проверяются; SQL не выполняется.", en: "Semantic validation, schema resolution, query planning, and SQL execution are not performed." },
      { ru: "Редкие конструкции отдельных СУБД могут сохраняться без корректного форматирования.", en: "Uncommon vendor-specific constructs may be preserved without receiving ideal layout." },
    ],
    useCases: [
      { ru: "Подготовка запроса к проверке кода.", en: "Preparing a query for code review." },
      { ru: "Чтение SQL из логов или миграций.", en: "Reading SQL copied from logs or migrations." },
      { ru: "Подготовка примера для документации или описания ошибки.", en: "Normalizing an example for documentation or an issue." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 20 000 токенов и глубиной 64.", en: "Input is limited to 500,000 characters, 20,000 tokens, and depth 64." },
      { ru: "Форматирование не требует подключения к СУБД и не передаёт SQL на сервер WebDiag.", en: "The formatter does not connect to a database or send SQL to the WebDiag backend." },
    ],
    faq: [
      { question: { ru: "Изменяет ли форматирование SQL данные в базе?", en: "Does formatting SQL change database data?" }, answer: { ru: "Нет. Запрос обрабатывается как текст в браузере и не выполняется. Инструмент расставляет отступы и переносы строк, чтобы код было удобнее читать. Подключение к базе не требуется.", en: "No. The query is handled as text in the browser and is not executed. The tool adds indentation and line breaks for readability. No database connection is required." } },
      { question: { ru: "Означает ли отсутствие ошибки, что запрос выполнится?", en: "Does an error-free result mean the query will run?" }, answer: { ru: "Форматирование не проверяет таблицы, права доступа и все правила вашей СУБД. Выберите подходящий диалект и проверьте запрос в безопасной среде проекта. Для выполнения нужен отдельный доступ к базе.", en: "Formatting does not check tables, permissions, or every rule of your database engine. Choose the appropriate dialect and test the query in a safe project environment. Execution requires separate database access." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "graphql-formatter", "regex-tester"],
    sourceUrls: ["https://www.postgresql.org/docs/current/sql-syntax-lexical.html"],
  }),
  toolPage({
    slug: "graphql-formatter",
    seoTitle: { ru: "Форматирование запросов и фрагментов GraphQL", en: "GraphQL Formatter for Queries and Fragments" },
    metaDescription: { ru: "Отформатируйте запросы, мутации, переменные, директивы и фрагменты GraphQL локально. Проверяются запись и парность скобок без проверки по схеме.", en: "Format GraphQL queries, mutations, variables, directives, and fragments locally. Checks cover lexical structure and balanced delimiters, not schema validity." },
    h1: { ru: "Форматирование документов и операций GraphQL", en: "GraphQL Formatter for Documents and Operations" },
    lead: { ru: "Сделайте GraphQL-документ удобным для чтения, сохранив комментарии, обычные и многострочные строки, включения фрагментов.", en: "Make a GraphQL document easier to review while preserving comments, strings, block strings, and fragment spreads." },
    quickFacts: [
      { ru: "Запросы и мутации", en: "Queries and mutations" },
      { ru: "Фрагменты и директивы", en: "Fragments and directives" },
      { ru: "Без загрузки схемы", en: "No schema fetch" },
    ],
    howToSteps: [
      { ru: "Вставьте GraphQL-документ.", en: "Paste a GraphQL document." },
      { ru: "Выберите размер отступа и запустите форматирование.", en: "Choose the indentation size and run the formatter." },
      { ru: "Проверьте структуру и скопируйте результат.", en: "Review the structure and copy the formatted document." },
    ],
    supportedFeatures: [
      { ru: "Определения операций, переменные, аргументы и директивы.", en: "Operation definitions, variables, arguments, and directives." },
      { ru: "Наборы выбираемых полей, псевдонимы, фрагменты, встроенные фрагменты и условия типов.", en: "Selection sets, aliases, fragments, inline fragments, and type conditions." },
      { ru: "Комментарии, строки с экранированием и многострочные строки в тройных кавычках.", en: "Comments, escaped strings, and triple-quoted block strings." },
      { ru: "Проверка парности фигурных, круглых и квадратных скобок.", en: "Checks for matching braces, parentheses, and brackets." },
    ],
    limitations: [
      { ru: "Инструмент не загружает схему и не проверяет поля, аргументы, типы переменных или устаревшие элементы схемы.", en: "The tool does not load a schema or validate fields, arguments, variable types, or deprecations." },
      { ru: "Операция не отправляется на сервер GraphQL и не выполняется.", en: "The operation is not sent to a GraphQL endpoint or executed." },
      { ru: "Проверяются запись и структура документа с ограничением размера и вложенности. Полная проверка по правилам GraphQL не выполняется.", en: "Document tokens and structure are checked within size and nesting limits. Full GraphQL validation is not performed." },
    ],
    useCases: [
      { ru: "Подготовка запроса для проверки изменений или документации.", en: "Preparing a query for a pull request or documentation." },
      { ru: "Чтение компактно записанного GraphQL-запроса из логов.", en: "Reviewing a compact GraphQL payload copied from logs." },
      { ru: "Поиск непарных скобок перед отладкой.", en: "Catching obviously unbalanced delimiters before debugging." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 20 000 токенов и глубиной 64.", en: "Input is limited to 500,000 characters, 20,000 tokens, and depth 64." },
      { ru: "Запятые не влияют на смысл GraphQL-документа и не требуются в результате.", en: "Commas are treated as insignificant GraphQL tokens and are not required in the output." },
    ],
    faq: [
      { question: { ru: "Отправляется ли GraphQL-запрос на мой сервер?", en: "Is the GraphQL query sent to my server?" }, answer: { ru: "Здесь запрос только форматируется как текст в браузере. Адрес сервера и токен доступа не нужны. Инструмент не выполняет запрос и не получает данные вашего приложения.", en: "The query is only formatted as text in the browser. No server address or access token is required. The tool does not execute it or retrieve application data." } },
      { question: { ru: "Как проверить, существуют ли запрошенные поля?", en: "How can I check whether the requested fields exist?" }, answer: { ru: "Сверьте запрос со схемой вашего GraphQL-сервиса или используйте его среду разработки. Этот форматировщик не загружает схему и не проверяет существование полей. Он помогает читать код, включая фрагменты и многострочные строки.", en: "Compare the query with your service's schema or use its development environment. This formatter does not load a schema or verify field existence. It helps present code, including fragments and multiline strings." } }
    ],
    relatedToolSlugs: ["json-formatter-validator", "sql-formatter", "regex-tester"],
    sourceUrls: ["https://spec.graphql.org/October2021/"],
  }),
  toolPage({
    slug: "regex-tester",
    seoTitle: { ru: "Проверка регулярных выражений с ограничением времени", en: "Safe Regex Lab with an Isolated Worker Timeout" },
    metaDescription: { ru: "Проверьте регулярное выражение JavaScript в отдельном Web Worker с ограничением времени и числа совпадений, группами захвата и предупреждениями ReDoS. Выражение не выполняется на сервере.", en: "Test JavaScript regex in a dedicated Web Worker with a hard timeout, match caps, captures, and heuristic ReDoS signals. Patterns never run on the server." },
    h1: { ru: "Проверка регулярных выражений JavaScript", en: "Safe Regex Lab with Isolated Execution" },
    lead: { ru: "Проверьте регулярное выражение JavaScript на тестовом тексте и изучите группы захвата. Если поиск затянется, он будет остановлен по выбранному лимиту времени.", en: "Test a JavaScript regular expression on sample text and inspect captures. Matching is stopped if it exceeds the selected time limit." },
    quickFacts: [
      { ru: "Отдельный Web Worker", en: "Dedicated Web Worker" },
      { ru: "Принудительное ограничение времени", en: "Hard timeout" },
      { ru: "До 500 совпадений", en: "Up to 500 matches" },
    ],
    howToSteps: [
      { ru: "Введите выражение без разделителей / и укажите флаги JavaScript.", en: "Enter a pattern without slash delimiters and provide JavaScript flags." },
      { ru: "Вставьте тестовый текст и выберите лимит времени.", en: "Paste test input and choose a timeout." },
      { ru: "Запустите проверку, изучите совпадения, группы захвата и предупреждения о рисках.", en: "Run the worker, then review matches, captures, and risk signals." },
    ],
    supportedFeatures: [
      { ru: "Флаги JavaScript d, g, i, m, s, u, v и y с проверкой повторов и конфликтов.", en: "JavaScript flags d, g, i, m, s, u, v, and y with duplicate and conflict validation." },
      { ru: "Диапазоны совпадений, нумерованные и именованные группы захвата, индексы при соответствующем флаге.", en: "Match ranges, numbered captures, named captures, and optional indices." },
      { ru: "Продолжение поиска после пустых совпадений при флагах g и y.", en: "Correct advancement for zero-length global or sticky matches." },
      { ru: "Эвристический поиск вложенных и больших квантификаторов, широких подстановок, повторяемых альтернатив и обратных ссылок.", en: "Heuristic review for nested quantifiers, broad wildcards, quantified alternation, backreferences, and large quantifiers." },
    ],
    limitations: [
      { ru: "Лимит времени останавливает проверку в браузере, но не гарантирует безопасность выражения в других средах и на любых данных.", en: "The timeout bounds the browser worker but does not prove that a pattern is safe in every runtime or against every input." },
      { ru: "Эвристические предупреждения ReDoS могут ошибаться и пропускать опасные выражения.", en: "Heuristic ReDoS signals can produce both false positives and false negatives." },
      { ru: "Используются правила JavaScript RegExp; диалекты PCRE, RE2, .NET и Python не поддерживаются.", en: "The lab uses JavaScript RegExp semantics rather than PCRE, RE2, .NET, or Python regex dialects." },
    ],
    useCases: [
      { ru: "Проверка выражения и групп захвата перед использованием в интерфейсе.", en: "Checking a pattern and capture groups before frontend use." },
      { ru: "Сравнение флагов и поведения при пустых совпадениях.", en: "Comparing flags and zero-length behavior." },
      { ru: "Предварительная проверка медленного выражения перед измерением производительности на сервере.", en: "Performing an initial review of a potentially expensive pattern before server-side benchmarking." },
    ],
    technicalNotes: [
      { ru: "Выражение ограничено 2 000 символов, текст — 100 000 символов, результат — 500 совпадениями с сокращённым предпросмотром.", en: "Patterns are limited to 2,000 characters, input text to 100,000 characters, and output to 500 matches with shortened previews." },
      { ru: "Для каждого запуска создаётся отдельный Web Worker. Он завершается после получения результата или по лимиту времени; eval и Function не используются.", en: "A fresh worker is created for each run, terminated after completion or timeout, and never uses eval or Function construction." },
    ],
    faq: [
      { question: { ru: "Как проверить, что регулярное выражение находит нужный текст?", en: "How do I test whether a regular expression matches the right text?" }, answer: { ru: "Введите выражение, флаги и примеры текста. Сравните найденные совпадения с ожидаемыми и добавьте примеры, которые совпадать не должны. Проверка использует правила JavaScript, которые могут отличаться от правил других языков.", en: "Enter the expression, flags, and sample text. Compare matches with your expectations and include examples that should not match. The check uses JavaScript rules, which may differ from other languages." } },
      { question: { ru: "Что делать, если проверка остановилась по времени?", en: "What should I do if the check times out?" }, answer: { ru: "Упростите выражение или уменьшите объём примера. Остановка защищает вкладку от слишком долгого вычисления. Даже успешный запуск и отсутствие предупреждений не гарантируют безопасность выражения на любых данных в вашей программе.", en: "Simplify the expression or reduce the sample size. The time limit prevents a computation from running too long in the tab. A successful run without warnings does not guarantee safety on every input in your application." } }
    ],
    relatedToolSlugs: ["sql-formatter", "graphql-formatter", "json-formatter-validator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Guide/Regular_expressions", "https://developer.mozilla.org/docs/Web/API/Web_Workers_API"],
  }),
  toolPage({
    slug: "cron-expression-workbench",
    seoTitle: { ru: "Генератор и проверка cron: следующие запуски", en: "Cron Expression Workbench: Build, Validate & Preview" },
    metaDescription: { ru: "Соберите или проверьте cron-выражение Unix из пяти полей, прочитайте пояснение и посмотрите до 10 следующих запусков в UTC прямо в браузере.", en: "Build or validate a five-field Unix cron expression, read field explanations, and preview up to 10 next UTC occurrences in your browser." },
    h1: { ru: "Проверка cron-расписаний из пяти полей", en: "Cron Expression Workbench for Five-Field Schedules" },
    lead: { ru: "Соберите расписание из пяти полей, проверьте списки, диапазоны и шаги, прочитайте пояснение и посмотрите до десяти следующих запусков в UTC.", en: "Build a five-field schedule, validate lists, ranges, and steps, inspect the normalized expression, and preview up to ten next UTC occurrences." },
    quickFacts: [
      { ru: "5-польный Unix cron", en: "Five-field Unix cron" },
      { ru: "Следующие запуски в UTC", en: "UTC-only preview" },
      { ru: "Web Worker с ограничением времени", en: "Web Worker with a time limit" },
    ],
    howToSteps: [
      { ru: "Заполните отдельные поля или вставьте готовое cron-выражение.", en: "Fill the individual fields or paste an existing cron expression." },
      { ru: "Запустите проверку синтаксиса и диапазонов.", en: "Run syntax and range validation." },
      { ru: "Проверьте объяснение и следующие моменты запуска в UTC.", en: "Review the explanation and the next UTC occurrence timestamps." },
    ],
    supportedFeatures: [
      { ru: "Подстановки, числа, списки, диапазоны и шаги.", en: "Wildcards, numeric values, lists, ranges, and steps." },
      { ru: "Названия месяцев JAN–DEC и дней недели SUN–SAT.", en: "JAN–DEC month names and SUN–SAT weekday names." },
      { ru: "Если заданы и день месяца, и день недели, достаточно совпадения одного из них — по правилам Vixie cron.", en: "Vixie-style OR semantics when both day-of-month and day-of-week are restricted." },
      { ru: "До 10 будущих запусков на 366 дней вперёд с принудительным ограничением времени расчёта.", en: "Up to 10 future occurrences with a 366-day horizon and a hard timeout." },
    ],
    limitations: [
      { ru: "Секунды, год, обозначения Quartz ?, L, W и #, макросы и таймеры systemd не поддерживаются.", en: "Seconds, year, Quartz tokens ?, L, W, and #, macros, and systemd timers are not supported." },
      { ru: "Расчёт выполняется в UTC без учёта часовых поясов IANA и переходов на летнее время.", en: "Preview uses UTC and does not model IANA timezones or DST transitions." },
      { ru: "Инструмент не создаёт и не выполняет задания планировщика.", en: "The tool does not create or execute real scheduler jobs." },
    ],
    useCases: [
      { ru: "Проверка расписания перед добавлением в crontab или задание CI.", en: "Checking a schedule before adding it to crontab or a CI job." },
      { ru: "Поиск ошибки в диапазоне, списке или шаге.", en: "Finding an error in a range, list, or step." },
      { ru: "Проверка того, когда расписание сработает в UTC.", en: "Checking when a schedule will run in UTC." },
    ],
    technicalNotes: [
      { ru: "Выражение ограничено 256 символами, расчёт — 10 результатами, 366 днями и фиксированным числом итераций.", en: "Expressions are limited to 256 characters, while preview is capped at 10 results, 366 days, and a fixed iteration limit." },
      { ru: "Расчёт следующих запусков выполняется в отдельном Web Worker с того же сайта. Он завершается по лимиту времени, при сбросе или уходе со страницы.", en: "Next-occurrence calculation runs in a dedicated same-origin Web Worker that is terminated on timeout, reset, or component unmount." },
    ],
    faq: [
      { question: { ru: "Какой формат расписания принимает инструмент?", en: "Which schedule format does this tool accept?" }, answer: { ru: "Введите пять полей Unix cron: минуты, часы, день месяца, месяц и день недели. Поле секунд не поддерживается. Инструмент покажет пояснение и следующие даты для поддерживаемого выражения.", en: "Enter five Unix cron fields: minute, hour, day of month, month, and day of week. Seconds are not supported. The tool explains a supported expression and previews its next dates." } },
      { question: { ru: "Совпадут ли показанные даты с расписанием моего сервера?", en: "Will the preview dates match my server's schedule?" }, answer: { ru: "Предпросмотр рассчитан в UTC. Сверьте часовой пояс и правила cron в системе, где будет работать задача. Инструмент не подключается к серверу и не создаёт задания по этому расписанию.", en: "The preview uses UTC. Check the time zone and cron rules in the system that will run the job. The tool does not connect to your server or create scheduled tasks." } }
    ],
    relatedToolSlugs: ["unix-timestamp-converter", "sql-formatter", "graphql-formatter"],
    sourceUrls: ["https://man7.org/linux/man-pages/man5/crontab.5.html"],
  }),
  toolPage({
    slug: "jwt-inspection-lab",
    seoTitle: { ru: "Локальный просмотр заголовка и содержимого JWT", en: "JWT Inspection Lab: Decode Header, Payload & Claims" },
    metaDescription: { ru: "Разберите JWT/JWS локально: просмотрите заголовок, содержимое, поля exp, nbf, iat, iss и aud и предупреждения безопасности без отправки токена на сервер.", en: "Strictly decode compact JWT/JWS locally, inspect header, payload, exp, nbf, iat, iss, and aud, and review security warnings without uploading the token." },
    h1: { ru: "Локальный просмотр JWT", en: "JWT Inspection Lab for Local Token Review" },
    lead: { ru: "Разберите три сегмента JWT/JWS, просмотрите JSON, стандартные поля, alg и временные значения. Наличие подписи отображается, её подлинность не проверяется.", en: "Inspect the three JWT/JWS segments, JSON, registered claims, alg, and timing values. Signature presence is shown; authenticity is not verified." },
    quickFacts: [
      { ru: "Только локальная обработка", en: "Local processing only" },
      { ru: "Строгий Base64URL и UTF-8", en: "Strict Base64URL and UTF-8" },
      { ru: "Без проверки подписи", en: "Decode is not verify" },
    ],
    howToSteps: [
      { ru: "Вставьте JWT/JWS в компактной записи из трёх сегментов.", en: "Paste a three-segment compact JWT/JWS." },
      { ru: "При необходимости укажите допустимое расхождение часов.", en: "Select an allowed clock skew when needed." },
      { ru: "Просмотрите заголовок, содержимое, временные поля и предупреждения безопасности.", en: "Review the header, payload, temporal claims, and security warnings." },
    ],
    supportedFeatures: [
      { ru: "Строгая проверка Base64URL, UTF-8 и объектов JSON в заголовке и содержимом.", en: "Strict Base64URL, UTF-8, and JSON-object parsing for header and payload." },
      { ru: "Проверка exp, nbf и iat относительно часов браузера с настраиваемым допустимым расхождением.", en: "Inspection of exp, nbf, and iat against the browser clock with configurable clock skew." },
      { ru: "Просмотр полей iss, sub, aud и jti; предупреждения при alg=none, отсутствии alg и пустой подписи.", en: "Review of iss, sub, aud, and jti claims plus warnings for alg=none, missing alg, and an empty signature." },
    ],
    limitations: [
      { ru: "Подпись не проверяется; подлинность токена и возможность его принять не подтверждаются.", en: "The signature is not verified, and token authenticity or acceptability is not confirmed." },
      { ru: "JWE, загрузка JWKS, обнаружение настроек OAuth/OIDC, обмен токенами и закрытые ключи не поддерживаются.", en: "JWE, remote JWKS, OAuth/OIDC discovery, token exchange, and private keys are not supported." },
      { ru: "Временные статусы зависят от часов браузера и не заменяют проверку на принимающем сервере.", en: "Timing statuses depend on the browser clock and do not replace validation by the accepting server." },
    ],
    useCases: [
      { ru: "Просмотр полей тестового токена доступа или ID-токена во время разработки.", en: "Reviewing claims in a test access or ID token during development." },
      { ru: "Поиск ошибок в Base64URL, JSON или значениях NumericDate.", en: "Finding malformed Base64URL, JSON, or NumericDate values." },
      { ru: "Проверка того, почему exp или nbf выглядит некорректно.", en: "Investigating why exp or nbf appears incorrect." },
    ],
    technicalNotes: [
      { ru: "JWT ограничен 64 KiB, JSON — глубиной 64 и 5 000 узлов; токен не сохраняется, не записывается в логи и не отправляется по сети.", en: "JWT input is capped at 64 KiB and JSON at depth 64 and 5,000 nodes; the token is not stored, logged, or sent over the network." },
      { ru: "Декодированные значения выводятся как текст или JSON без вставки динамической HTML-разметки.", en: "Decoded values are rendered as text/JSON and are not inserted through dynamic HTML markup." },
    ],
    faq: [
      { question: { ru: "Что можно узнать после вставки JWT?", en: "What can I learn by pasting a JWT?" }, answer: { ru: "Инструмент показывает читаемые части токена и проверяет поддерживаемые поля, включая временные ограничения, если они заданы. Декодирование само по себе не подтверждает подлинность токена или право на вход.", en: "The tool displays the token's readable parts and checks supported claims, including time constraints when supplied. Decoding alone does not prove authenticity or grant sign-in access." } },
      { question: { ru: "Как убедиться, что подпись JWT правильная?", en: "How can I confirm that a JWT signature is valid?" }, answer: { ru: "Подпись должна проверяться принимающим приложением с доверенным ключом и разрешённым алгоритмом. Здесь такая проверка не выполняется. Токен разбирается в браузере без запроса ключей по сети.", en: "The receiving application must verify the signature with a trusted key and an allowed algorithm. This tool does not perform that verification. It inspects the token in the browser without fetching keys over the network." } }
    ],
    relatedToolSlugs: ["base64-converter", "json-formatter-validator", "unix-timestamp-converter"],
    sourceUrls: ["https://www.rfc-editor.org/rfc/rfc7519", "https://www.rfc-editor.org/rfc/rfc7515"],
  }),
] as const;
