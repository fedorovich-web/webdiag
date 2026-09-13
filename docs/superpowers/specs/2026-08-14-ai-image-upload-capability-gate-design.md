# AI image upload capability gate

## Problem

The authenticated image upload endpoint accepted and stored files while every
public AI tool was unavailable. Those objects could not be bound to a public AI
run, so the endpoint exposed a bounded but unnecessary storage-write surface.

## Boundary

Image uploads are available only when the runtime catalog contains at least one
`ready` tool whose input contract accepts an uploaded image:

- `ai_alt_text_studio`
- `ai_image_edit_studio`

`ai_image_studio` generates an image from text and does not enable uploads.
Internal tools and tools without a fixed credit price remain unavailable through
the existing catalog rules.

## Request order and errors

Authentication is evaluated first. The upload capability is then checked before
artifact storage is required. A disabled capability returns the stable
`ai_image_tools_unavailable` error; a ready upload tool without configured
storage returns `ai_upload_storage_unavailable`. Both responses are non-cacheable.

The service repeats the capability check before normalization or persistence so
non-HTTP callers cannot bypass the API dependency.

## Security properties

- Disabled AI tooling cannot create orphan upload objects.
- A generation-only image tool cannot widen the accepted input surface.
- Missing storage configuration is not disclosed to unauthenticated callers.
- Existing byte, dimension, pixel, quota, TTL, ownership, and format checks stay
  unchanged.
