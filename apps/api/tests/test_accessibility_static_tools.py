from __future__ import annotations

import asyncio

import httpx

from webdiag_api.audit.fetcher import SafeFetchConfig, SafeHttpFetcher
from webdiag_api.main import app
from webdiag_api.tools.accessibility_static import get_accessibility_static_fetcher

SAFE_IP = "93.184.216.34"


async def post(path: str, payload: dict[str, object]) -> httpx.Response:
    transport = httpx.ASGITransport(app=app)
    async with httpx.AsyncClient(transport=transport, base_url="http://test") as client:
        return await client.post(path, json=payload)


def streaming_response(
    status_code: int,
    *,
    request: httpx.Request,
    headers: dict[str, str] | None = None,
    content: bytes = b"",
) -> httpx.Response:
    return httpx.Response(
        status_code,
        headers=headers,
        stream=httpx.ByteStream(content),
        request=request,
    )


def build_fetcher(handler: httpx.MockTransport) -> SafeHttpFetcher:
    return SafeHttpFetcher(
        config=SafeFetchConfig(max_body_bytes=1_000_000),
        resolver=lambda _host, _port: [SAFE_IP],
        peer_address_provider=lambda _response: [SAFE_IP],
        transport=handler,
    )


def override_fetcher(handler: httpx.MockTransport) -> None:
    app.dependency_overrides[get_accessibility_static_fetcher] = lambda: build_fetcher(handler)


def clear_overrides() -> None:
    app.dependency_overrides.clear()


def html_handler(body: str, *, content_type: str = "text/html") -> httpx.MockTransport:
    def handler(request: httpx.Request) -> httpx.Response:
        return streaming_response(
            200,
            request=request,
            headers={"content-type": content_type},
            content=body.encode(),
        )

    return httpx.MockTransport(handler)


def test_landmark_analyzer_reports_main_names_and_duplicates() -> None:
    html = """
    <html><body>
      <header><nav aria-label="Primary"><a href="/">Home</a></nav></header>
      <nav aria-label="Primary"><a href="/help">Help</a></nav>
      <main id="main"><h1>Title</h1></main>
      <footer></footer>
    </body></html>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post("/v1/tools/landmark-structure", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.landmark_structure_analyzer.v1"
    assert payload["landmark_count"] == 5
    assert payload["main_count"] == 1
    assert payload["navigation_count"] == 2
    assert payload["duplicate_role_name_count"] == 1
    assert any(item["accessible_name"] == "Primary" for item in payload["landmarks"])
    assert any(item["id"] == "duplicate-landmark-role-names" for item in payload["findings"])
    assert payload["status"] == "warning"


def test_landmark_analyzer_fails_for_missing_and_nested_main() -> None:
    override_fetcher(html_handler("<html><body><nav>Menu</nav></body></html>"))
    try:
        missing = asyncio.run(
            post("/v1/tools/landmark-structure", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()
    assert missing.json()["status"] == "fail"
    assert missing.json()["findings"][0]["id"] == "missing-main-landmark"

    override_fetcher(html_handler("<section><main>Content</main></section>"))
    try:
        nested = asyncio.run(
            post("/v1/tools/landmark-structure", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()
    assert any(item["id"] == "nested-main-landmark" for item in nested.json()["findings"])


def test_form_analyzer_resolves_label_relationships_and_grouping() -> None:
    html = """
    <html><body>
      <form aria-label="Signup">
        <label for="email">Email address</label>
        <input id="email" name="email" type="email" required aria-describedby="email-help">
        <p id="email-help">Use a work email.</p>
        <label>Name <input name="name"></label>
        <fieldset><legend>Plan</legend>
          <label><input type="radio" name="plan" value="a">A</label>
          <label><input type="radio" name="plan" value="b">B</label>
        </fieldset>
        <button>Create account</button>
      </form>
    </body></html>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post("/v1/tools/form-accessibility", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["contract_version"] == "webdiag.tool.form_accessibility_analyzer.v1"
    assert payload["form_count"] == 1
    assert payload["control_count"] == 5
    assert payload["labeled_control_count"] == 5
    assert payload["unlabeled_control_count"] == 0
    assert payload["fieldset_count"] == 1
    assert payload["fieldset_without_legend_count"] == 0
    assert payload["ungrouped_choice_set_count"] == 0
    assert payload["status"] == "pass"


def test_form_analyzer_reports_unlabeled_broken_and_placeholder_only_controls() -> None:
    html = """
    <form>
      <label for="missing">Broken label</label>
      <input id="email" placeholder="Email">
      <input id="duplicate">
      <input id="duplicate" aria-describedby="missing-help">
      <fieldset><input type="radio" name="choice"><input type="radio" name="choice"></fieldset>
    </form>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post("/v1/tools/form-accessibility", {"url": "https://example.com/"})
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert payload["unlabeled_control_count"] == 5
    assert payload["placeholder_only_count"] == 1
    assert payload["broken_label_reference_count"] == 1
    assert payload["broken_description_reference_count"] == 1
    assert payload["fieldset_without_legend_count"] == 1
    assert payload["ungrouped_choice_set_count"] == 1
    assert payload["status"] == "fail"
    ids = {item["id"] for item in payload["findings"]}
    assert {
        "unlabeled-form-controls",
        "broken-label-for-references",
        "duplicate-control-ids",
    } <= ids


def test_interactive_name_analyzer_handles_text_alt_aria_and_role_signals() -> None:
    html = """
    <main>
      <a href="/docs">Documentation</a>
      <a href="/logo"><img alt="Company home" src="logo.svg"></a>
      <button aria-label="Close"><svg></svg></button>
      <div role="button" tabindex="0" aria-labelledby="save-label"></div>
      <span id="save-label">Save changes</span>
    </main>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/interactive-accessible-names",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert response.status_code == 200
    assert payload["interactive_count"] == 4
    assert payload["link_count"] == 2
    assert payload["button_count"] == 1
    assert payload["role_button_count"] == 1
    assert payload["named_count"] == 4
    assert payload["unnamed_count"] == 0
    assert payload["role_without_keyboard_signal_count"] == 0
    assert payload["status"] == "pass"


def test_interactive_name_analyzer_reports_unnamed_generic_nested_and_custom_role() -> None:
    html = """
    <main>
      <a href="/one"></a>
      <a href="/two">Read more</a>
      <button><a href="/nested">Nested link</a></button>
      <div role="button">Custom action</div>
      <a href="javascript:void(0)">Run</a>
    </main>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/interactive-accessible-names",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert payload["unnamed_count"] == 1
    assert payload["generic_name_count"] == 1
    assert payload["nested_interactive_count"] == 1
    assert payload["role_without_keyboard_signal_count"] == 1
    assert payload["status"] == "fail"
    ids = {item["id"] for item in payload["findings"]}
    assert {
        "unnamed-interactive-elements",
        "generic-interactive-names",
        "nested-interactive-elements",
        "role-without-keyboard-signal",
        "javascript-link-targets",
    } <= ids



def test_explicit_interactive_roles_override_native_tag_semantics() -> None:
    html = """
    <main>
      <a href="/action" role="button">Run action</a>
      <button role="link">Open destination</button>
    </main>
    """
    override_fetcher(html_handler(html))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/interactive-accessible-names",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    payload = response.json()
    assert payload["role_button_count"] == 1
    assert payload["role_link_count"] == 1
    assert payload["link_count"] == 0
    assert payload["button_count"] == 0


def test_accessibility_analyzers_reject_private_targets() -> None:
    response = asyncio.run(
        post("/v1/tools/landmark-structure", {"url": "http://127.0.0.1/"})
    )
    assert response.status_code == 400
    assert response.json()["detail"]["code"] == "tool_url_rejected"


def test_accessibility_analyzers_fail_honestly_for_non_html() -> None:
    override_fetcher(html_handler("{}", content_type="application/json"))
    try:
        response = asyncio.run(
            post("/v1/tools/form-accessibility", {"url": "https://example.com/data"})
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert response.status_code == 200
    assert payload["control_count"] == 0
    assert payload["status"] == "fail"



def test_accessibility_output_caps_untrusted_attribute_lengths() -> None:
    long_id = "x" * 500
    long_role = "button" + ("y" * 100)
    long_href = "https://example.com/" + ("z" * 3_000)
    html = (
        f'<main id="{long_id}">'
        f'<a href="{long_href}" role="{long_role}">Action</a>'
        f'<input id="{long_id}" type="{"t" * 120}" aria-label="Field">'
        "</main>"
    )
    override_fetcher(html_handler(html))
    try:
        landmark = asyncio.run(
            post("/v1/tools/landmark-structure", {"url": "https://example.com/"})
        )
        form = asyncio.run(
            post("/v1/tools/form-accessibility", {"url": "https://example.com/"})
        )
        interactive = asyncio.run(
            post(
                "/v1/tools/interactive-accessible-names",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()

    assert landmark.status_code == 200
    assert len(landmark.json()["landmarks"][0]["id_value"]) == 300
    assert form.status_code == 200
    assert len(form.json()["controls"][0]["id_value"]) == 300
    assert len(form.json()["controls"][0]["input_type"]) == 80
    assert interactive.status_code == 200
    assert len(interactive.json()["items"][0]["role"]) == 80
    assert len(interactive.json()["items"][0]["href"]) == 2_048


def test_accessibility_analyzers_cap_items_but_keep_counts() -> None:
    body = "<main>" + "".join(
        f'<a href="/{index}">Link {index}</a>' for index in range(170)
    ) + "</main>"
    override_fetcher(html_handler(body))
    try:
        response = asyncio.run(
            post(
                "/v1/tools/interactive-accessible-names",
                {"url": "https://example.com/"},
            )
        )
    finally:
        clear_overrides()
    payload = response.json()
    assert payload["interactive_count"] == 170
    assert len(payload["items"]) == 150
    assert payload["truncated"] is True
