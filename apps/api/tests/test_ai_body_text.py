from webdiag_api.ai.input_resolver import _body_text


def test_void_elements_in_head_do_not_hide_the_actual_page_content() -> None:
    html = (
        '<html><head><meta name="description" content="Not body" />'
        '<link rel="stylesheet" href="/style.css" /></head>'
        "<body><h1>Product page</h1><p>Actual product details for the AI.</p></body></html>"
    )
    assert _body_text(html) == "Product page Actual product details for the AI."


def test_inline_markup_does_not_split_words_in_ai_evidence() -> None:
    assert _body_text("<body><p>Web<strong>Diag</strong> checks sites.</p><p>Next.</p></body>") == (
        "WebDiag checks sites. Next."
    )


def test_faq_headings_and_answers_remain_separate_in_ai_evidence() -> None:
    assert (
        _body_text(
            "<details><summary>Shipping</summary>Orders arrive in two days.</details>"
            "<details><summary>Returns</summary>Return within 30 days.</details>"
        )
        == "Shipping Orders arrive in two days. Returns Return within 30 days."
    )
