import type { Locale } from "@webdiag/tool-registry";

export type ToolErrorCode =
  | "tool_request_failed"
  | "invalid_input"
  | "image_open_failed"
  | "image_process_failed"
  | "image_generate_failed"
  | "image_read_failed"
  | "image_metadata_failed"
  | "css_parse_failed"
  | "sql_format_failed"
  | "graphql_format_failed"
  | "regex_failed"
  | "qr_generate_failed"
  | "json_validate_failed"
  | "data_convert_failed"
  | "jsonpath_failed"
  | "toml_convert_failed"
  | "csv_process_failed"
  | "redirect_map_failed"
  | "srcset_generate_failed";

type MessageKey =
  | ToolErrorCode
  | "invalid_url"
  | "request_timeout"
  | "service_unavailable"
  | "invalid_response"
  | "rate_limited"
  | "too_many_urls";

const messages: Readonly<Record<Locale, Readonly<Record<MessageKey, string>>>> = {
  ru: {
    tool_request_failed: "Инструмент не смог выполнить запрос. Проверьте данные и повторите попытку.",
    invalid_input: "Проверьте введённые данные и повторите попытку.",
    invalid_url: "Введите корректный публичный URL.",
    request_timeout: "Проверка заняла слишком много времени. Повторите попытку.",
    service_unavailable: "Сервис проверки временно недоступен. Повторите попытку позже.",
    invalid_response: "Сервис проверки вернул некорректный ответ. Повторите попытку позже.",
    rate_limited: "Слишком много запросов. Подождите и повторите попытку.",
    too_many_urls: "Список содержит слишком много URL. Сократите его и повторите попытку.",
    image_open_failed: "Не удалось открыть изображение. Проверьте файл и повторите попытку.",
    image_process_failed: "Не удалось обработать изображение. Проверьте файл и параметры.",
    image_generate_failed: "Не удалось создать изображение. Проверьте параметры.",
    image_read_failed: "Не удалось прочитать изображение. Проверьте формат файла.",
    image_metadata_failed: "Не удалось обработать метаданные изображения.",
    css_parse_failed: "Не удалось обработать CSS. Проверьте синтаксис.",
    sql_format_failed: "Не удалось отформатировать SQL. Проверьте синтаксис.",
    graphql_format_failed: "Не удалось отформатировать GraphQL. Проверьте синтаксис.",
    regex_failed: "Не удалось выполнить регулярное выражение. Проверьте шаблон.",
    qr_generate_failed: "Не удалось создать QR-код. Проверьте данные и повторите попытку.",
    json_validate_failed: "Не удалось проверить JSON. Проверьте синтаксис.",
    data_convert_failed: "Не удалось преобразовать данные. Проверьте формат.",
    jsonpath_failed: "Не удалось выполнить JSONPath. Проверьте выражение.",
    toml_convert_failed: "Не удалось преобразовать TOML. Проверьте синтаксис.",
    csv_process_failed: "Не удалось обработать CSV. Проверьте формат данных.",
    redirect_map_failed: "Не удалось обработать карту перенаправлений. Проверьте данные.",
    srcset_generate_failed: "Не удалось создать srcset. Проверьте изображение и размеры.",
  },
  en: {
    tool_request_failed: "The tool could not complete the request. Check the input and try again.",
    invalid_input: "Check the input and try again.",
    invalid_url: "Enter a valid public URL.",
    request_timeout: "The check took too long. Try again.",
    service_unavailable: "The checking service is temporarily unavailable. Try again later.",
    invalid_response: "The checking service returned an invalid response. Try again later.",
    rate_limited: "Too many requests. Wait and try again.",
    too_many_urls: "The list contains too many URLs. Shorten it and try again.",
    image_open_failed: "Could not open the image. Check the file and try again.",
    image_process_failed: "Could not process the image. Check the file and settings.",
    image_generate_failed: "Could not generate the image. Check the settings.",
    image_read_failed: "Could not read the image. Check the file format.",
    image_metadata_failed: "Could not process the image metadata.",
    css_parse_failed: "Could not process the CSS. Check the syntax.",
    sql_format_failed: "Could not format SQL. Check the syntax.",
    graphql_format_failed: "Could not format GraphQL. Check the syntax.",
    regex_failed: "Could not run the regular expression. Check the pattern.",
    qr_generate_failed: "Could not generate the QR code. Check the input and try again.",
    json_validate_failed: "Could not validate JSON. Check the syntax.",
    data_convert_failed: "Could not convert the data. Check the format.",
    jsonpath_failed: "Could not run JSONPath. Check the expression.",
    toml_convert_failed: "Could not convert TOML. Check the syntax.",
    csv_process_failed: "Could not process CSV. Check the data format.",
    redirect_map_failed: "Could not process the redirect map. Check the input.",
    srcset_generate_failed: "Could not generate srcset. Check the image and sizes.",
  },
};

const apiCodes: Readonly<Record<string, MessageKey>> = {
  invalid_url: "invalid_url",
  tool_api_timeout: "request_timeout",
  audit_rate_limited: "rate_limited",
  tool_api_unavailable: "service_unavailable",
  audit_capacity_unavailable: "service_unavailable",
  tool_fetch_failed: "service_unavailable",
  tool_api_invalid_response: "invalid_response",
  tool_invalid_response: "invalid_response",
  invalid_response: "invalid_response",
  too_many_urls: "too_many_urls",
};

export class ToolUserError extends Error {
  readonly code: ToolErrorCode;

  constructor(code: ToolErrorCode) {
    super(code);
    this.name = "ToolUserError";
    this.code = code;
  }
}

function stableCode(value: unknown): string | null {
  if (!value || typeof value !== "object" || !("code" in value)) return null;
  const code = (value as { readonly code?: unknown }).code;
  return typeof code === "string" && /^[a-z][a-z0-9_]{1,79}$/u.test(code) ? code : null;
}

export function toolErrorMessage(
  locale: Locale,
  caught: unknown,
  fallback: ToolErrorCode = "tool_request_failed",
): string {
  const code = stableCode(caught);
  const apiKey = code ? apiCodes[code] : undefined;
  const key: MessageKey = apiKey
    ?? (caught instanceof ToolUserError ? caught.code : fallback);
  return messages[locale][key];
}
