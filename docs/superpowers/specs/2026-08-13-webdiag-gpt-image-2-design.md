# WebDiag GPT Image 2 Design

## Decision

Keep all thirteen text and vision-analysis tools pinned to
openai/gpt-5.6-luna. Use OpenRouter openai/gpt-image-2 only for
ai_image_studio and ai_image_edit_studio. Both image tools move from disabled
to internal; public availability and credit pricing remain gated.

The model and API shape were verified on 2026-08-13 against OpenRouter's
dedicated Image API documentation and live model discovery endpoints. The
provider endpoint is POST https://openrouter.ai/api/v1/images. GPT Image 2
accepts text and image inputs, supports one to sixteen input references, and
returns base64 image bytes with a media type.

## Contracts

Image Studio accepts a bounded prompt, locale, aspect ratio, quality, and
background. One request creates exactly one image. Image Edit Studio accepts
the same generation controls plus one owned upload ID. The existing upload
pipeline normalizes JPEG, PNG, and WebP, strips metadata, applies pixel and byte
limits, binds one upload to one run, and stores no raw bytes in SQLite.

The browser cannot select a model, provider, image count, arbitrary object URL,
or object key. Image editing sends the normalized private upload as a base64
data URL directly to OpenRouter. Provider fallback is disabled and the OpenAI
endpoint is pinned.

## Output artifacts

OpenRouter base64 is decoded with strict validation and capped at 4 MiB. The
worker stores the binary in the configured private local or S3-compatible
artifact store. Completion sends only bounded artifact metadata to the internal
API. The API verifies object bytes, size, digest, and media type before atomically
recording the artifact with the successful run.

Public run output contains an opaque artifact ID and non-secret metadata, never
the object key or base64. An authenticated download endpoint enforces run and
artifact ownership, verifies stored bytes against the persisted SHA-256, and
returns no-store content. There are no public or presigned object URLs.

## Failure rules

Provider 400/401/402/403/404/413/422 responses are known-safe failures. Network
errors, rate limits, other statuses, malformed success payloads, and incomplete
artifact persistence are provider-unknown outcomes. No provider retry occurs
after submission because image generation is billable and the result may have
been created even when the response is lost.

## Verified sources

- https://openrouter.ai/docs/guides/overview/multimodal/image-generation
- https://openrouter.ai/api/v1/images/models
- https://openrouter.ai/api/v1/images/models/openai/gpt-image-2/endpoints
