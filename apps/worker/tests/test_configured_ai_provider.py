from dataclasses import replace

import pytest

from test_vercel_gateway_images import _request


def test_routes_images_and_text_to_the_explicit_provider_without_fallback():
    from webdiag_worker.configured_ai_provider import ConfiguredAIProvider

    seen = []

    class Provider:
        def __init__(self, name):
            self.name = name

        def prepare(self, request):
            seen.append((self.name, "prepare", request.model_policy))
            return request

        def execute(self, request):
            seen.append((self.name, "execute", request.model_policy))
            return self.name

        def __exit__(self, *_args):
            seen.append((self.name, "close"))

    text, images = Provider("vercel"), Provider("cloudflare")
    with ConfiguredAIProvider(text, images) as provider:
        image = _request(model_policy="@cf/black-forest-labs/flux-2-klein-4b")
        assert provider.execute(provider.prepare(image)) == "cloudflare"
        request = replace(
            image, tool_id="ai_faq_studio", model_policy="openai/gpt-6-luna"
        )
        assert provider.execute(provider.prepare(request)) == "vercel"
    assert [item[0] for item in seen] == [
        "cloudflare",
        "cloudflare",
        "vercel",
        "vercel",
        "cloudflare",
        "vercel",
    ]


def test_invalid_image_provider_is_rejected_before_creating_clients(monkeypatch):
    from webdiag_worker.configured_ai_provider import ConfiguredAIProvider

    monkeypatch.setenv("WEBDIAG_AI_IMAGE_PROVIDER", "unapproved")
    with pytest.raises(RuntimeError, match="WEBDIAG_AI_IMAGE_PROVIDER"):
        ConfiguredAIProvider.from_env()
