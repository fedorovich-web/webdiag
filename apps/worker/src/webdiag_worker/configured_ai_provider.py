from __future__ import annotations

import os

from webdiag_worker.ai import KnownSafeProviderError, ProviderRequest, ProviderResult
from webdiag_worker.artifact_storage import ArtifactStorage
from webdiag_worker.cloudflare_image_provider import CloudflareImageProvider
from webdiag_worker.cloudflare_text_provider import CloudflareTextProvider
from webdiag_worker.image_requests import IMAGE_TOOLS
from webdiag_worker.vercel_gateway_provider import VercelAIGatewayProvider


class ConfiguredAIProvider:
    def __init__(
        self,
        text: VercelAIGatewayProvider | CloudflareTextProvider,
        images: CloudflareImageProvider | VercelAIGatewayProvider | None = None,
    ):
        self._text = text
        self._images = images

    @classmethod
    def from_env(
        cls, *, artifact_storage: ArtifactStorage | None = None
    ) -> ConfiguredAIProvider:
        selected = os.getenv("WEBDIAG_AI_IMAGE_PROVIDER", "vercel").strip()
        text_selected = os.getenv("WEBDIAG_AI_TEXT_PROVIDER", "vercel").strip()
        if text_selected not in {"vercel", "cloudflare"}:
            raise RuntimeError("WEBDIAG_AI_TEXT_PROVIDER must be vercel or cloudflare")
        if selected not in {"vercel", "cloudflare"}:
            raise RuntimeError("WEBDIAG_AI_IMAGE_PROVIDER must be vercel or cloudflare")
        images = (
            CloudflareImageProvider.from_env(artifact_storage=artifact_storage)
            if selected == "cloudflare"
            else (
                VercelAIGatewayProvider.from_env(artifact_storage=artifact_storage)
                if text_selected == "cloudflare"
                else None
            )
        )
        try:
            text = (
                CloudflareTextProvider
                if text_selected == "cloudflare"
                else VercelAIGatewayProvider
            ).from_env(artifact_storage=artifact_storage)
        except Exception:
            if images is not None:
                images.__exit__()
            raise
        return cls(text, images)

    def __enter__(self) -> ConfiguredAIProvider:
        return self

    def __exit__(self, *_args: object) -> None:
        try:
            if self._images is not None:
                self._images.__exit__()
        finally:
            self._text.__exit__()

    def prepare(self, request: ProviderRequest) -> ProviderRequest:
        if request.tool_id in IMAGE_TOOLS:
            return self._image_provider().prepare(request)
        return self._text.prepare(request)

    def execute(self, request: ProviderRequest) -> ProviderResult:
        if request.tool_id in IMAGE_TOOLS:
            return self._image_provider().execute(request)
        return self._text.execute(request)

    def _image_provider(self) -> VercelAIGatewayProvider | CloudflareImageProvider:
        if self._images is not None:
            return self._images
        if not isinstance(self._text, VercelAIGatewayProvider):
            raise KnownSafeProviderError("AI image provider is unavailable")
        return self._text
