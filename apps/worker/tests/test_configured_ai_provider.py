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


def test_cloudflare_text_and_images_do_not_require_a_vercel_client(monkeypatch):
    from webdiag_worker import configured_ai_provider as module

    monkeypatch.setenv("WEBDIAG_AI_TEXT_PROVIDER", "cloudflare")
    monkeypatch.setenv("WEBDIAG_AI_IMAGE_PROVIDER", "cloudflare")
    text, images = object(), object()
    monkeypatch.setattr(module.CloudflareTextProvider, "from_env", lambda **kw: text)
    monkeypatch.setattr(module.CloudflareImageProvider, "from_env", lambda **kw: images)
    monkeypatch.setattr(
        module.VercelAIGatewayProvider,
        "from_env",
        lambda **kw: pytest.fail("Unexpected Vercel client"),
    )
    p = module.ConfiguredAIProvider.from_env()
    assert p._text is text
    assert p._images is images


def test_invalid_text_provider_fails_before_clients(monkeypatch):
    from webdiag_worker.configured_ai_provider import ConfiguredAIProvider

    monkeypatch.setenv("WEBDIAG_AI_TEXT_PROVIDER", "unapproved")
    with pytest.raises(RuntimeError, match="WEBDIAG_AI_TEXT_PROVIDER"):
        ConfiguredAIProvider.from_env()
