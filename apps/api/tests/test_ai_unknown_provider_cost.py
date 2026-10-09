import sqlite3
from pathlib import Path

from webdiag_worker.ai import ProviderResult

from webdiag_api.accounts.storage import SqliteAccountStore
from webdiag_api.ai.catalog import build_production_ai_catalog
from webdiag_api.ai.models import AIRunCreateRequest, AIWorkerCompleteRequest
from webdiag_api.ai.service import AIService
from webdiag_api.ai.storage import SqliteAIStore


def test_unknown_cost_preserves_a_verified_result_and_idempotent_credit_capture(tmp_path: Path):
    path = str(tmp_path / "accounts.sqlite3")
    user = SqliteAccountStore(path).create_user(
        email="cost@example.com", display_name="Cost test", password_hash="test-password"
    )
    store = SqliteAIStore(path)
    service = AIService(store, catalog=build_production_ai_catalog(), input_max_bytes=4096)
    service.grant_beta_credits(user_id=user.id, quantity=1, reason="test", correlation_id="cost")
    run, _ = service.create_run(
        user_id=user.id,
        request=AIRunCreateRequest(
            tool_id="ai_schema_studio",
            input={
                "locale": "en",
                "schema_type": "Organization",
                "page_url": "https://example.com/about",
                "facts": ["WebDiag"],
            },
        ),
        idempotency_key="unknown-provider-cost",
    )
    claim = service.claim_pending()
    service.mark_submitted(run_id=run.id, lease_token=claim.lease_token)
    output = {
        "json_ld": {
            "@context": "https://schema.org",
            "@type": "Organization",
            "url": "https://example.com/about",
            "name": "WebDiag",
        },
        "property_sources": {"/name": [0]},
        "warnings": [],
    }
    result = ProviderResult(
        output=output, input_units=10, output_units=20, provider_cost_nano_usd=None
    )
    payload = AIWorkerCompleteRequest(
        lease_token=claim.lease_token,
        **{
            "output": result.output,
            "input_units": result.input_units,
            "output_units": result.output_units,
            "provider_cost_nano_usd": None,
        },
    )
    for _ in range(2):
        completed = service.complete_run(
            run_id=run.id,
            lease_token=payload.lease_token,
            output=payload.output,
            provider_request_id=None,
            input_units=payload.input_units,
            output_units=payload.output_units,
            provider_cost_nano_usd=None,
        )
        assert completed.state == "succeeded"
    balance = store.get_credit_account(user_id=user.id)
    assert balance.available == balance.reserved == 0
    with sqlite3.connect(path) as connection:
        assert connection.execute(
            "SELECT provider_cost_nano_usd FROM ai_run_attempts"
        ).fetchone() == (None,)
