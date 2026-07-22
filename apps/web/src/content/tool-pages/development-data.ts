import { toolPage } from "./shared";

export const developmentDataToolPages = [
  toolPage({
    slug: "json-formatter-validator",
    seoTitle: { ru: "JSON Formatter и проверка JSON онлайн", en: "JSON Formatter & Validator Online" },
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
      { ru: "Проверка через стандартный JSON parser браузера.", en: "Validation with the browser's standard JSON parser." },
      { ru: "Форматирование объектов, массивов, строк, чисел, boolean и null.", en: "Formatting for objects, arrays, strings, numbers, booleans, and null." },
      { ru: "Сообщение об ошибке для некорректного синтаксиса.", en: "An error message for invalid syntax." },
    ],
    limitations: [
      { ru: "Инструмент не восстанавливает повреждённый JSON автоматически.", en: "The tool does not automatically repair malformed JSON." },
      { ru: "Нет tree view, minify и преобразования JSON5.", en: "Tree view, minification, and JSON5 conversion are not included." },
    ],
    useCases: [
      { ru: "Проверка ответа API перед отладкой.", en: "Checking an API response before debugging." },
      { ru: "Подготовка конфигурационного файла к просмотру.", en: "Making a configuration file easier to review." },
      { ru: "Поиск пропущенной запятой, кавычки или скобки.", en: "Finding a missing comma, quote, or bracket." },
    ],
    technicalNotes: [
      { ru: "Результат создаётся с помощью JSON.parse и JSON.stringify.", en: "Output is produced with JSON.parse and JSON.stringify." },
      { ru: "Порядок ключей сохраняется в пределах поведения JavaScript parser.", en: "Key order follows JavaScript parser behavior." },
    ],
    faq: [
      { question: { ru: "Поддерживается JSON5?", en: "Does it support JSON5?" }, answer: { ru: "Нет. Ввод должен соответствовать стандартному синтаксису JSON.", en: "No. Input must follow standard JSON syntax." } },
      { question: { ru: "Данные загружаются на сервер?", en: "Is the JSON uploaded?" }, answer: { ru: "Нет. Проверка и форматирование выполняются в браузере.", en: "No. Validation and formatting run in the browser." } },
    ],
    relatedToolSlugs: ["base64-converter", "url-encoder-decoder", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/JSON"],
  }),
  toolPage({
    slug: "url-encoder-decoder",
    seoTitle: { ru: "URL Encoder и Decoder онлайн", en: "URL Component Encoder & Decoder Online" },
    metaDescription: { ru: "Кодируйте и декодируйте текст для URL с помощью encodeURIComponent и decodeURIComponent прямо в браузере.", en: "Encode and decode text for URLs with encodeURIComponent and decodeURIComponent directly in your browser." },
    h1: { ru: "Кодирование и декодирование URL-компонентов", en: "URL Component Encoder & Decoder" },
    lead: { ru: "Преобразуйте текст в percent-encoded форму для query, path segment или другого компонента URL и восстановите исходное значение.", en: "Convert text to percent-encoded form for a query, path segment, or another URL component, and restore the original value." },
    quickFacts: [
      { ru: "UTF-8 текст", en: "UTF-8 text" },
      { ru: "Percent encoding", en: "Percent encoding" },
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
      { ru: "Некорректная percent-последовательность возвращает ошибку.", en: "Malformed percent sequences return an error." },
    ],
    useCases: [
      { ru: "Подготовка значения query parameter.", en: "Preparing a query-parameter value." },
      { ru: "Проверка закодированной строки из логов.", en: "Inspecting an encoded value from logs." },
      { ru: "Безопасная передача пробелов и специальных символов.", en: "Representing spaces and special characters safely." },
    ],
    technicalNotes: [
      { ru: "Пробел кодируется как %20, а не как плюс.", en: "A space is encoded as %20, not as a plus sign." },
      { ru: "Инструмент работает с компонентом URL, а не со всей строкой адреса целиком.", en: "The tool targets a URL component rather than a complete URL string." },
    ],
    faq: [
      { question: { ru: "Можно вставить полный URL?", en: "Can I paste a complete URL?" }, answer: { ru: "Можно, но будет закодирована вся строка как единый компонент. Для точной работы обычно кодируют только нужное значение.", en: "Yes, but the whole string will be encoded as one component. Usually only the intended value should be encoded." } },
      { question: { ru: "Чем это отличается от Base64?", en: "How is this different from Base64?" }, answer: { ru: "URL encoding экранирует символы для URL, а Base64 представляет байты в текстовом алфавите.", en: "URL encoding escapes characters for URLs, while Base64 represents bytes with a text alphabet." } },
    ],
    relatedToolSlugs: ["base64-converter", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/JavaScript/Reference/Global_Objects/encodeURIComponent"],
  }),
  toolPage({
    slug: "base64-converter",
    seoTitle: { ru: "Base64 Encoder и Decoder для текста", en: "Base64 Text Encoder & Decoder Online" },
    metaDescription: { ru: "Кодируйте UTF-8 текст в Base64 и декодируйте Base64 обратно в текст прямо в браузере.", en: "Encode UTF-8 text as Base64 and decode Base64 back to text directly in your browser." },
    h1: { ru: "Кодирование и декодирование Base64 для текста", en: "Base64 Text Encoder & Decoder" },
    lead: { ru: "Преобразуйте UTF-8 текст в Base64 или восстановите исходную строку из корректного Base64-значения.", en: "Convert UTF-8 text to Base64 or restore the original string from a valid Base64 value." },
    quickFacts: [
      { ru: "UTF-8 текст", en: "UTF-8 text" },
      { ru: "Encode и decode", en: "Encode and decode" },
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
      { ru: "Ошибка при некорректной Base64-строке или невалидном UTF-8 результате.", en: "Errors for invalid Base64 or invalid UTF-8 output." },
    ],
    limitations: [
      { ru: "Файлы и изображения не поддерживаются.", en: "Files and images are not supported." },
      { ru: "URL-safe Base64 без символов + и / не преобразуется автоматически.", en: "URL-safe Base64 using alternatives to + and / is not normalized automatically." },
    ],
    useCases: [
      { ru: "Просмотр текстового payload.", en: "Inspecting a text payload." },
      { ru: "Подготовка тестовых данных для API.", en: "Preparing test data for an API." },
      { ru: "Проверка сохранённого Base64-значения.", en: "Checking a stored Base64 value." },
    ],
    technicalNotes: [
      { ru: "Base64 увеличивает объём данных примерно на треть и не скрывает содержимое.", en: "Base64 typically increases data size by roughly one third and does not conceal content." },
      { ru: "Декодированный набор байтов должен быть корректным UTF-8 текстом.", en: "Decoded bytes must form valid UTF-8 text." },
    ],
    faq: [
      { question: { ru: "Base64 защищает пароль?", en: "Does Base64 protect a password?" }, answer: { ru: "Нет. Base64 легко декодируется и не должен использоваться как защита секретов.", en: "No. Base64 is easily decoded and should not be used to protect secrets." } },
      { question: { ru: "Можно кодировать изображение?", en: "Can it encode an image?" }, answer: { ru: "Текущая версия работает только с текстом.", en: "The current version works with text only." } },
    ],
    relatedToolSlugs: ["url-encoder-decoder", "json-formatter-validator", "hash-generator"],
    sourceUrls: ["https://developer.mozilla.org/docs/Glossary/Base64"],
  }),
  toolPage({
    slug: "hash-generator",
    seoTitle: { ru: "Генератор SHA-256, SHA-384 и SHA-512", en: "SHA-256, SHA-384 & SHA-512 Hash Generator" },
    metaDescription: { ru: "Вычислите SHA-256, SHA-384 или SHA-512 для введённого текста через Web Crypto API прямо в браузере.", en: "Calculate SHA-256, SHA-384, or SHA-512 for entered text with the Web Crypto API directly in your browser." },
    h1: { ru: "Генератор SHA-хешей для текста", en: "SHA Hash Generator for Text" },
    lead: { ru: "Получите шестнадцатеричный SHA-256, SHA-384 или SHA-512 digest для строки без отправки текста на сервер.", en: "Generate a hexadecimal SHA-256, SHA-384, or SHA-512 digest for a string without sending the text to a server." },
    quickFacts: [
      { ru: "SHA-256 / 384 / 512", en: "SHA-256 / 384 / 512" },
      { ru: "UTF-8 вход", en: "UTF-8 input" },
      { ru: "Web Crypto API", en: "Web Crypto API" },
    ],
    howToSteps: [
      { ru: "Введите текст.", en: "Enter text." },
      { ru: "Выберите SHA-алгоритм.", en: "Select a SHA algorithm." },
      { ru: "Сгенерируйте и скопируйте hex digest.", en: "Generate and copy the hexadecimal digest." },
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
      { ru: "Подготовка тестового digest для разработки.", en: "Preparing a test digest during development." },
      { ru: "Проверка, изменилось ли строковое значение.", en: "Checking whether a string value changed." },
    ],
    technicalNotes: [
      { ru: "Одинаковый текст и алгоритм дают одинаковый digest.", en: "The same text and algorithm produce the same digest." },
      { ru: "Даже небольшое изменение входа существенно меняет результат.", en: "Even a small input change substantially changes the output." },
    ],
    faq: [
      { question: { ru: "Можно восстановить текст из хеша?", en: "Can the text be recovered from the hash?" }, answer: { ru: "Нет. Криптографический hash рассчитан как одностороннее преобразование.", en: "No. A cryptographic hash is designed as a one-way transformation." } },
      { question: { ru: "Можно хешировать файл?", en: "Can it hash a file?" }, answer: { ru: "Нет. Текущая версия принимает только текст.", en: "No. The current version accepts text only." } },
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
      { ru: "Mock data и fixtures.", en: "Mock data and fixtures." },
      { ru: "Создание независимого client-side ID.", en: "Creating an independent client-side ID." },
    ],
    technicalNotes: [
      { ru: "UUID v4 не содержит временную метку и не сортируется по времени.", en: "UUID v4 does not contain a timestamp and is not time-sortable." },
      { ru: "Уникальность вероятностная, а не результат проверки общей базы.", en: "Uniqueness is probabilistic rather than checked against a global database." },
    ],
    faq: [
      { question: { ru: "UUID гарантированно уникален?", en: "Is a UUID guaranteed to be unique?" }, answer: { ru: "Абсолютной глобальной гарантии нет, но пространство UUID v4 делает случайное совпадение крайне маловероятным.", en: "There is no absolute global guarantee, but the UUID v4 space makes a random collision extremely unlikely." } },
      { question: { ru: "Чем UUID отличается от ULID?", en: "How does UUID differ from ULID?" }, answer: { ru: "UUID v4 полностью случайный, а ULID включает время и лексикографически сортируется.", en: "UUID v4 is random, while ULID includes time and sorts lexicographically." } },
    ],
    relatedToolSlugs: ["ulid-generator", "hash-generator", "unix-timestamp-converter"],
    sourceUrls: ["https://developer.mozilla.org/docs/Web/API/Crypto/randomUUID"],
  }),
  toolPage({
    slug: "unix-timestamp-converter",
    seoTitle: { ru: "Конвертер Unix timestamp и ISO 8601", en: "Unix Timestamp & ISO 8601 Converter" },
    metaDescription: { ru: "Преобразуйте Unix timestamp в секундах в UTC ISO 8601 и дату обратно в Unix seconds прямо в браузере.", en: "Convert a Unix timestamp in seconds to UTC ISO 8601 and a date back to Unix seconds directly in your browser." },
    h1: { ru: "Конвертер Unix timestamp и ISO 8601", en: "Unix Timestamp & ISO 8601 Converter" },
    lead: { ru: "Преобразуйте количество секунд от Unix epoch в UTC-дату ISO 8601 или выполните обратное преобразование.", en: "Convert seconds since the Unix epoch to a UTC ISO 8601 date or perform the reverse conversion." },
    quickFacts: [
      { ru: "Unix seconds", en: "Unix seconds" },
      { ru: "UTC ISO 8601", en: "UTC ISO 8601" },
      { ru: "Два направления", en: "Two-way conversion" },
    ],
    howToSteps: [
      { ru: "Введите Unix timestamp в секундах или дату.", en: "Enter Unix seconds or a date value." },
      { ru: "Выберите нужное направление.", en: "Choose the conversion direction." },
      { ru: "Скопируйте ISO-строку или целое число секунд.", en: "Copy the ISO string or integer number of seconds." },
    ],
    supportedFeatures: [
      { ru: "Unix timestamp в секундах.", en: "Unix timestamps in seconds." },
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
      { ru: "Unix epoch начинается 1 января 1970 года в UTC.", en: "The Unix epoch starts on January 1, 1970 UTC." },
      { ru: "При преобразовании даты дробные секунды отбрасываются вниз до целого Unix timestamp.", en: "When converting a date, fractional seconds are floored to an integer Unix timestamp." },
    ],
    faq: [
      { question: { ru: "Timestamp должен быть в секундах?", en: "Should the timestamp use seconds?" }, answer: { ru: "Да. Текущая версия ожидает секунды, а не миллисекунды.", en: "Yes. The current version expects seconds, not milliseconds." } },
      { question: { ru: "Можно выбрать часовой пояс?", en: "Can I select a timezone?" }, answer: { ru: "Нет. ISO-результат показывается в UTC.", en: "No. ISO output is displayed in UTC." } },
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
      { ru: "Генератор не реализует monotonic ULID для нескольких значений в одну миллисекунду.", en: "The generator does not implement monotonic ULIDs for multiple values within the same millisecond." },
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
      { question: { ru: "Чем ULID отличается от UUID v4?", en: "How does ULID differ from UUID v4?" }, answer: { ru: "ULID содержит временную часть и сортируется по времени, а UUID v4 состоит из случайных данных.", en: "ULID contains a time component and sorts by time, while UUID v4 is random." } },
      { question: { ru: "Можно извлечь дату из результата?", en: "Can the date be extracted?" }, answer: { ru: "В формате ULID временная часть присутствует, но текущий инструмент генерирует значение и не выполняет его разбор.", en: "ULID contains a timestamp component, but the current tool generates values and does not parse them." } },
    ],
    relatedToolSlugs: ["uuid-generator", "unix-timestamp-converter", "hash-generator"],
    sourceUrls: ["https://github.com/ulid/spec"],
  }),

  toolPage({
    slug: "json-schema-validator",
    seoTitle: { ru: "Проверка JSON по JSON Schema онлайн", en: "JSON Schema Validator Online" },
    metaDescription: { ru: "Проверьте JSON instance по документированному bounded subset JSON Schema 2020-12: типы, properties, required, arrays, combinators и локальные $ref.", en: "Validate a JSON instance against a documented bounded JSON Schema 2020-12 subset covering types, properties, required fields, arrays, combinators, and local $ref." },
    h1: { ru: "Проверка JSON по JSON Schema", en: "JSON Schema Validator" },
    lead: { ru: "Сопоставьте JSON-данные со schema и получите bounded список ошибок с instance path, keyword и объяснением.", en: "Check JSON data against a schema and receive a bounded list of issues with instance paths, keywords, and explanations." },
    quickFacts: [
      { ru: "Локально в браузере", en: "Runs locally" },
      { ru: "Local $ref", en: "Local $ref" },
      { ru: "До 10 000 узлов", en: "Up to 10,000 nodes" },
    ],
    howToSteps: [
      { ru: "Вставьте JSON instance.", en: "Paste the JSON instance." },
      { ru: "Вставьте JSON Schema.", en: "Paste the JSON Schema." },
      { ru: "Запустите проверку и изучите paths и keywords в отчёте.", en: "Run validation and review paths and keywords in the report." },
    ],
    supportedFeatures: [
      { ru: "type, enum, const, properties, required и additionalProperties.", en: "type, enum, const, properties, required, and additionalProperties." },
      { ru: "items, min/max items, uniqueItems и object/string/number constraints.", en: "items, min/max items, uniqueItems, and object/string/number constraints." },
      { ru: "allOf, anyOf, oneOf, not, $defs/definitions и локальные JSON Pointer $ref.", en: "allOf, anyOf, oneOf, not, $defs/definitions, and local JSON Pointer $ref." },
      { ru: "Ограниченная проверка форматов date, date-time, email, uri, uuid, IPv4, IPv6 и hostname.", en: "Bounded checks for date, date-time, email, uri, uuid, IPv4, IPv6, and hostname formats." },
    ],
    limitations: [
      { ru: "Это документированный subset, а не полная реализация JSON Schema 2020-12 meta-schema.", en: "This is a documented subset, not a complete JSON Schema 2020-12 meta-schema implementation." },
      { ru: "Remote $ref, dynamic references, unevaluated, conditional и content keywords не выполняются.", en: "Remote $ref, dynamic references, unevaluated, conditional, and content keywords are not executed." },
      { ru: "Проверка format является syntactic signal и не подтверждает существование email, URL или host.", en: "format checks are syntactic signals and do not confirm that an email, URL, or host exists." },
    ],
    useCases: [
      { ru: "Проверка API fixtures и конфигураций.", en: "Checking API fixtures and configurations." },
      { ru: "Диагностика required и additional properties.", en: "Diagnosing required and additional properties." },
      { ru: "Быстрая локальная проверка schema перед CI validator.", en: "Running a quick local check before a CI validator." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 10 000 узлов и глубиной 64.", en: "Input is limited to 500,000 characters, 10,000 nodes, and depth 64." },
      { ru: "Отчёт ограничен 100 validation issues; достижение лимита маркируется как truncated.", en: "The report is limited to 100 validation issues and marks truncation when the limit is reached." },
    ],
    faq: [
      { question: { ru: "Поддерживается remote $ref?", en: "Are remote $ref values supported?" }, answer: { ru: "Нет. Инструмент разрешает только local JSON Pointer references внутри введённой schema и не выполняет сетевые запросы.", en: "No. The tool resolves only local JSON Pointer references inside the supplied schema and makes no network requests." } },
      { question: { ru: "Это замена Ajv или официального validator?", en: "Does this replace Ajv or a standards-complete validator?" }, answer: { ru: "Нет. Используйте специализированный standards-complete validator в CI, если проект зависит от полного vocabulary JSON Schema.", en: "No. Use a standards-complete validator in CI when your project depends on the full JSON Schema vocabulary." } },
    ],
    relatedToolSlugs: ["json-formatter-validator", "yaml-json-converter", "xml-formatter-validator"],
    sourceUrls: ["https://json-schema.org/draft/2020-12/json-schema-core.html", "https://json-schema.org/draft/2020-12/json-schema-validation.html"],
  }),
  toolPage({
    slug: "yaml-json-converter",
    seoTitle: { ru: "YAML в JSON и JSON в YAML онлайн", en: "YAML to JSON & JSON to YAML Converter" },
    metaDescription: { ru: "Преобразуйте JSON и безопасный configuration subset YAML локально в браузере. Anchors, aliases, custom tags, merge keys и block scalars отклоняются.", en: "Convert JSON and a safe YAML configuration subset locally in the browser. Anchors, aliases, custom tags, merge keys, and block scalars are rejected." },
    h1: { ru: "YAML ↔ JSON Converter", en: "YAML ↔ JSON Converter" },
    lead: { ru: "Преобразуйте mappings, sequences и scalars между JSON и предсказуемым YAML configuration subset без загрузки данных на сервер.", en: "Convert mappings, sequences, and scalars between JSON and a predictable YAML configuration subset without uploading data." },
    quickFacts: [
      { ru: "Два направления", en: "Two-way conversion" },
      { ru: "Safe subset", en: "Safe subset" },
      { ru: "До 5 000 узлов", en: "Up to 5,000 nodes" },
    ],
    howToSteps: [
      { ru: "Выберите YAML → JSON или JSON → YAML.", en: "Choose YAML → JSON or JSON → YAML." },
      { ru: "Вставьте документ и запустите преобразование.", en: "Paste the document and run the conversion." },
      { ru: "Скопируйте результат и проверьте его в целевом приложении.", en: "Copy the result and verify it in the target application." },
    ],
    supportedFeatures: [
      { ru: "Indented mappings и sequences с шагом два пробела.", en: "Indented mappings and sequences using two-space indentation." },
      { ru: "Plain, single-quoted и double-quoted scalars, numbers, booleans и null.", en: "Plain, single-quoted, and double-quoted scalars, numbers, booleans, and null." },
      { ru: "Inline arrays и objects при использовании JSON syntax.", en: "Inline arrays and objects when written with JSON syntax." },
      { ru: "JSON → YAML для JSON-compatible values с безопасным quoting неоднозначных строк.", en: "JSON → YAML for JSON-compatible values with safe quoting of ambiguous strings." },
    ],
    limitations: [
      { ru: "Это безопасный configuration subset, а не полная реализация YAML 1.2.2.", en: "This is a safe configuration subset, not a complete YAML 1.2.2 implementation." },
      { ru: "Anchors, aliases, custom tags, merge keys, complex keys и block scalars |/> отклоняются.", en: "Anchors, aliases, custom tags, merge keys, complex keys, and |/> block scalars are rejected." },
      { ru: "Комментарии не сохраняются при преобразовании в JSON и обратно.", en: "Comments are not preserved through JSON conversion and back." },
    ],
    useCases: [
      { ru: "Подготовка простой CI/CD или application config.", en: "Preparing a simple CI/CD or application configuration." },
      { ru: "Проверка duplicate keys и indentation ошибок.", en: "Finding duplicate keys and indentation errors." },
      { ru: "Преобразование безопасного fixture между JSON и YAML.", en: "Converting a safe fixture between JSON and YAML." },
    ],
    technicalNotes: [
      { ru: "YAML indentation должна использовать кратное двум количество пробелов; tabs запрещены.", en: "YAML indentation must use multiples of two spaces; tabs are rejected." },
      { ru: "Ввод ограничен 500 000 символов, 5 000 узлов и глубиной 32.", en: "Input is limited to 500,000 characters, 5,000 nodes, and depth 32." },
    ],
    faq: [
      { question: { ru: "Почему anchors и aliases запрещены?", en: "Why are anchors and aliases rejected?" }, answer: { ru: "Инструмент сознательно исключает graph-like и tag-driven features, чтобы conversion contract оставался bounded и предсказуемым.", en: "The tool deliberately excludes graph-like and tag-driven features so the conversion contract remains bounded and predictable." } },
      { question: { ru: "Сохраняются комментарии?", en: "Are comments preserved?" }, answer: { ru: "Нет. JSON не имеет модели комментариев, поэтому round trip не может сохранить их без отдельного AST contract.", en: "No. JSON has no comment model, so a round trip cannot preserve them without a separate AST contract." } },
    ],
    relatedToolSlugs: ["json-formatter-validator", "json-schema-validator", "xml-formatter-validator"],
    sourceUrls: ["https://yaml.org/spec/1.2.2/", "https://www.json.org/json-en.html"],
  }),
  toolPage({
    slug: "xml-formatter-validator",
    seoTitle: { ru: "XML Formatter и проверка well-formed XML", en: "XML Formatter & Well-Formedness Validator" },
    metaDescription: { ru: "Проверьте well-formed XML и отформатируйте структуру с отступом 2 или 4 пробела. DTD, ENTITY, XSD и external entity resolution отключены.", en: "Check well-formed XML and format its structure with two- or four-space indentation. DTD, ENTITY, XSD, and external entity resolution are disabled." },
    h1: { ru: "XML Formatter и Validator", en: "XML Formatter and Validator" },
    lead: { ru: "Проверьте matching tags, quoted attributes, entities и единственный root element, затем получите bounded форматированный документ.", en: "Check matching tags, quoted attributes, entities, and a single root element, then produce a bounded formatted document." },
    quickFacts: [
      { ru: "Well-formedness", en: "Well-formedness" },
      { ru: "DTD/ENTITY отключены", en: "DTD/ENTITY disabled" },
      { ru: "Mixed content сохраняется", en: "Mixed content preserved" },
    ],
    howToSteps: [
      { ru: "Вставьте XML и выберите размер отступа.", en: "Paste XML and choose the indentation size." },
      { ru: "Запустите проверку и форматирование.", en: "Run validation and formatting." },
      { ru: "Исправьте structural errors или скопируйте результат.", en: "Fix structural errors or copy the result." },
    ],
    supportedFeatures: [
      { ru: "Start/end/self-closing tags, quoted attributes и duplicate attribute detection.", en: "Start/end/self-closing tags, quoted attributes, and duplicate-attribute detection." },
      { ru: "XML comments, CDATA и processing instructions.", en: "XML comments, CDATA, and processing instructions." },
      { ru: "Predefined и numeric entity references без custom entity expansion.", en: "Predefined and numeric entity references without custom entity expansion." },
      { ru: "Форматирование structural content; mixed content остаётся compact.", en: "Formatting of structural content while mixed content remains compact." },
    ],
    limitations: [
      { ru: "XSD, Relax NG, Schematron и semantic namespace validation не выполняются.", en: "XSD, Relax NG, Schematron, and semantic namespace validation are not performed." },
      { ru: "DTD и ENTITY declarations отклоняются, external entities никогда не разрешаются.", en: "DTD and ENTITY declarations are rejected, and external entities are never resolved." },
      { ru: "Parser использует bounded conservative XML name subset и не является canonical XML serializer.", en: "The parser uses a bounded conservative XML-name subset and is not a canonical XML serializer." },
    ],
    useCases: [
      { ru: "Проверка API payload, feed или configuration XML.", en: "Checking an API payload, feed, or configuration XML." },
      { ru: "Поиск mismatched tags и duplicate attributes.", en: "Finding mismatched tags and duplicate attributes." },
      { ru: "Подготовка читаемой копии небольшого XML документа.", en: "Preparing a readable copy of a small XML document." },
    ],
    technicalNotes: [
      { ru: "Ввод ограничен 500 000 символов, 10 000 nodes и глубиной 64.", en: "Input is limited to 500,000 characters, 10,000 nodes, and depth 64." },
      { ru: "Formatter не вставляет indentation внутрь mixed content, чтобы не менять значащий текст.", en: "The formatter does not inject indentation inside mixed content so significant text is not changed." },
    ],
    faq: [
      { question: { ru: "Проверяется XML по XSD?", en: "Is XML validated against XSD?" }, answer: { ru: "Нет. Инструмент проверяет bounded well-formedness и formatting, но не schema conformance.", en: "No. The tool checks bounded well-formedness and formatting, not schema conformance." } },
      { question: { ru: "Безопасны ли external entities?", en: "Are external entities resolved?" }, answer: { ru: "Нет. DTD и ENTITY declarations отклоняются до parsing, поэтому XXE-style resolution не выполняется.", en: "No. DTD and ENTITY declarations are rejected before parsing, so XXE-style resolution is not performed." } },
    ],
    relatedToolSlugs: ["json-formatter-validator", "json-schema-validator", "yaml-json-converter"],
    sourceUrls: ["https://www.w3.org/TR/xml/"],
  }),
] as const;
