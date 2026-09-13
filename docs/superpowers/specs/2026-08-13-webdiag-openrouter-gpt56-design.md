# WebDiag OpenRouter GPT-5.6 provider design

Date: 2026-08-13

Status: approved

## Objective

Replace the direct OpenAI SDK integration with one private OpenRouter boundary.
All text-generation and vision-analysis tools use the fixed model slug
`openai/gpt-5.6-luna`. No client, account, or run input can select a provider or
model. `ai_image_studio` and `ai_image_edit_studio` remain disabled because the
OpenRouter model advertises text output, not image output; they cannot be
represented as working GPT-5.6 tools.

## Request boundary

The worker uses the already pinned HTTPX client to send one non-streaming
`POST https://openrouter.ai/api/v1/chat/completions` request. It does not use an
OpenAI or unofficial OpenRouter SDK. Production configuration accepts only an
OpenRouter API key and bounded timeout values; the API origin is a source
constant and cannot be redirected through environment variables.

Every request contains:

- the exact model `openai/gpt-5.6-luna`;
- server-owned system instructions;
- one JSON-serialized user input;
- strict JSON Schema output with `additionalProperties: false`;
- `provider.require_parameters = true`;
- `provider.zdr = true`;
- `provider.data_collection = "deny"`;
- `provider.allow_fallbacks = false`;
- the existing opaque HMAC safety identifier in `user`;
- no referer, account ID, email, project ID, audit ID, or session data.

The worker performs no automatic retry. HTTP 400, 401, 402, 403, 404, 413, and
422 are known pre-completion rejections. Timeout, connection failure, 408, 409,
429, and 5xx are ambiguous and become `provider_unknown`.

## Response boundary

The adapter accepts exactly one assistant choice containing JSON text, validates
it with the existing per-tool Pydantic output model, and then applies the
existing deterministic grounding checks in FastAPI. It persists the OpenRouter
generation ID and reported prompt/completion token counts. Provider messages,
headers, API keys, and raw response bodies never enter user-visible errors or
logs.

Missing choices, malformed JSON, unsupported finish states, invalid usage, and
contract violations are treated as an unknown provider outcome after a 200
response. A typed refusal is a known-safe provider refusal.

## Model and pricing policy

The active model policy uses only `openai/gpt-5.6-luna`. Terra, Gemini,
Ministral, model aliases, automatic routing, and automatic fallback are
excluded. Image-generation tools use the explicit non-executable policy
`none`. Tools remain internal or disabled with no credit price because current
public OpenRouter price surfaces are inconsistent. A real RU/EN eval and
billed-usage smoke test are required before assigning a public credit price.

## Security verification

Tests must prove exact endpoint and headers, model pinning, ZDR, denied data
collection, disabled fallbacks, strict schema, bounded input, secret redaction,
no retry, error classification, response validation, usage mapping, and lazy
actor construction. A separate API integration test must submit SQL metacharacter
payloads through account-owned resources and prove stored values remain data,
ownership remains enforced, and the account tables remain intact.

## References

- https://openrouter.ai/docs/api/api-reference/chat/send-chat-completion-request
- https://openrouter.ai/docs/guides/features/structured-outputs
- https://openrouter.ai/docs/guides/routing/provider-selection
- https://openrouter.ai/docs/cookbook/administration/usage-accounting
- https://openrouter.ai/openai/gpt-5.6-luna-20260709
