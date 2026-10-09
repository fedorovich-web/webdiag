from urllib.parse import parse_qs

import httpx
import pytest
from fastapi.testclient import TestClient
from test_provider_regressions import providers as providers

from webdiag_api.accounts.models import LoginRequest
from webdiag_api.accounts.security import hash_session_token
from webdiag_api.accounts.service import AccountServiceError
from webdiag_api.main import app


@pytest.fixture
def yandex(providers, monkeypatch):
    *_, config = providers
    config.yandex_client_id = "test-client"
    config.yandex_client_secret = "test-secret"
    profile = {
        "id": "yandex-subject-123",
        "default_email": "new@yandex.ru",
        "display_name": "Yandex User",
    }
    calls = []

    def respond(request):
        calls.append(request)
        if request.url.host == "oauth.yandex.ru":
            fields = parse_qs(request.content.decode())
            assert fields["code_verifier"] == ["v" * 43]
            assert fields["redirect_uri"] == ["https://app.webdiag.ru/api/account/yandex/callback"]
            return httpx.Response(200, json={"access_token": "provider-access-token"})
        assert request.headers["authorization"] == "OAuth provider-access-token"
        return httpx.Response(200, json=profile)

    original = httpx.Client
    monkeypatch.setattr(
        httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(respond), **kwargs)
    )
    return profile, calls


def exchange(client, **kwargs):
    return client.post(
        "/v1/account/oauth/yandex/exchange",
        json={
            "code": "provider-code",
            "code_verifier": "v" * 43,
            "redirect_uri": "https://app.webdiag.ru/api/account/yandex/callback",
            **kwargs,
        },
    )


def test_verified_yandex_registration_and_subject_login_grant_one_bonus(providers, yandex):
    _, _, credits, _, config = providers
    profile, _ = yandex
    with TestClient(app) as client:
        first = exchange(client)
        assert first.status_code == 200
        user = first.json()["user"]
        assert first.cookies.get("webdiag_session")
        profile["default_email"] = "changed@yandex.ru"
        second = exchange(client)
        assert second.status_code == 200
        assert second.json()["user"]["id"] == user["id"]
    assert (
        credits.get_credit_account(user_id=user["id"]).available == config.account_welcome_credits
    )


def test_email_match_requires_one_time_email_ownership_proof(providers, yandex):
    accounts, session, _, _, config = providers
    profile, _ = yandex
    profile["default_email"] = session.response.user.email
    config.account_internal_token = "recovery-bridge-test-token-" + "a" * 32
    with TestClient(app) as client:
        response = exchange(client)
        assert response.status_code == 409
        token = response.json()["link_token"]
        client.cookies.set("webdiag_session", session.token, domain="testserver.local", path="/")
        assert (
            client.post("/v1/account/oauth/yandex/link", json={"token": token}).status_code == 404
        )
        proof = client.post(
            "/v1/account/oauth/yandex/recovery",
            json={"token": token},
            headers={"authorization": f"Bearer {config.account_internal_token}"},
        ).json()
        args = {"token": token, "code": proof["code"]}
        assert client.post("/v1/account/oauth/yandex/recover", json=args).status_code == 200
        assert client.post("/v1/account/oauth/yandex/recover", json=args).status_code == 409
        current_token = client.cookies.get("webdiag_session")
        password_hash = accounts._store.get_user_by_id(session.response.user.id).password_hash
        assert exchange(client).json()["user"]["id"] == session.response.user.id
        assert accounts.get_session(current_token).authenticated
        assert (
            accounts._store.get_user_by_id(session.response.user.id).password_hash == password_hash
        )


def test_existing_local_session_cannot_bypass_email_ownership_proof(providers, yandex):
    _, session, _, _, _ = providers
    profile, _ = yandex
    profile["default_email"] = session.response.user.email
    with TestClient(app) as client:
        client.cookies.set("webdiag_session", session.token, domain="testserver.local", path="/")
        response = exchange(client)
    assert response.status_code == 409
    assert response.json()["detail"]["code"] == "account_link_required"


def test_pkce_and_exact_callback_are_required(providers, yandex):
    _, calls = yandex
    with TestClient(app) as client:
        assert exchange(client, code_verifier="short").status_code == 422
        assert exchange(client, redirect_uri="https://attacker.example/callback").status_code == 400
    assert not calls


def test_missing_subject_is_not_replaced_with_an_email_identity(providers, yandex):
    profile, _ = yandex
    profile.pop("id")
    with TestClient(app) as client:
        response = exchange(client)
    assert response.status_code == 502
    assert "webdiag_session" not in response.cookies


def test_provider_transport_error_does_not_expose_exception_details(providers, monkeypatch):
    *_, config = providers
    config.yandex_client_id = "test-client"
    config.yandex_client_secret = "test-secret"
    original = httpx.Client

    def fail(_request):
        raise httpx.ConnectError("secret-bearing-provider-error")

    monkeypatch.setattr(
        httpx, "Client", lambda **kwargs: original(transport=httpx.MockTransport(fail), **kwargs)
    )
    with TestClient(app) as client:
        response = exchange(client)
    assert response.status_code == 502
    assert "secret-bearing" not in response.text


def test_legacy_yandex_user_recovers_through_email_without_an_unknown_password(providers, yandex):
    _, session, _, _, config = providers
    profile, _ = yandex
    profile["default_email"] = session.response.user.email
    config.account_internal_token = "recovery-bridge-test-token-" + "a" * 32
    with TestClient(app) as client:
        pending = exchange(client).json()["link_token"]
        args = {"token": pending}
        assert client.post("/v1/account/oauth/yandex/recovery", json=args).status_code == 401
        proof = client.post(
            "/v1/account/oauth/yandex/recovery",
            json=args,
            headers={"authorization": f"Bearer {config.account_internal_token}"},
        )
        assert proof.status_code == 200
        assert proof.json()["email"] == session.response.user.email
        recovered = client.post(
            "/v1/account/oauth/yandex/recover", json={**args, "code": proof.json()["code"]}
        )
        assert recovered.status_code == 200
        assert recovered.json()["user"]["id"] == session.response.user.id
        assert (
            client.post(
                "/v1/account/oauth/yandex/recover", json={**args, "code": proof.json()["code"]}
            ).status_code
            == 409
        )
        client.cookies.clear()
        assert exchange(client).status_code == 200


def test_recovery_attempts_are_bounded_and_code_resend_cannot_reset_the_user_throttle(
    providers, yandex
):
    _, session, _, _, config = providers
    profile, _ = yandex
    profile["default_email"] = session.response.user.email
    config.account_internal_token = "recovery-bridge-test-token-" + "a" * 32
    headers = {"authorization": f"Bearer {config.account_internal_token}"}
    with TestClient(app) as client:
        token = exchange(client).json()["link_token"]
        proof = client.post(
            "/v1/account/oauth/yandex/recovery", json={"token": token}, headers=headers
        ).json()
        wrong = "000000" if proof["code"] != "000000" else "000001"
        for _ in range(5):
            assert (
                client.post(
                    "/v1/account/oauth/yandex/recover", json={"token": token, "code": wrong}
                ).status_code
                == 409
            )
        assert (
            client.post(
                "/v1/account/oauth/yandex/recover", json={"token": token, "code": proof["code"]}
            ).status_code
            == 409
        )
        replacement = exchange(client).json()["link_token"]
        assert (
            client.post(
                "/v1/account/oauth/yandex/recovery", json={"token": replacement}, headers=headers
            ).status_code
            == 429
        )


def test_another_yandex_subject_cannot_replace_an_existing_identity(providers, yandex, monkeypatch):
    _, session, _, _, config = providers
    profile, _ = yandex
    profile["default_email"] = session.response.user.email
    config.account_internal_token = "recovery-bridge-test-token-" + "a" * 32
    headers = {"authorization": f"Bearer {config.account_internal_token}"}
    with TestClient(app) as client:
        token = exchange(client).json()["link_token"]
        proof = client.post(
            "/v1/account/oauth/yandex/recovery", json={"token": token}, headers=headers
        ).json()
        assert (
            client.post(
                "/v1/account/oauth/yandex/recover", json={"token": token, "code": proof["code"]}
            ).status_code
            == 200
        )
        profile["id"] = "second-yandex-subject"
        token = exchange(client).json()["link_token"]
        import time

        later = int(time.time()) + 61
        monkeypatch.setattr("webdiag_api.accounts.storage.time.time", lambda: later)
        proof = client.post(
            "/v1/account/oauth/yandex/recovery", json={"token": token}, headers=headers
        ).json()
        assert (
            client.post(
                "/v1/account/oauth/yandex/recover", json={"token": token, "code": proof["code"]}
            ).status_code
            == 409
        )


def test_email_proof_removes_a_preclaimed_password_and_all_prior_sessions(providers, yandex):
    accounts, original, _, _, config = providers
    profile, _ = yandex
    profile["default_email"] = original.response.user.email
    old_user = accounts._store.get_user_by_id(original.response.user.id)
    config.account_internal_token = "recovery-bridge-test-token-" + "a" * 32
    with TestClient(app) as client:
        token = exchange(client).json()["link_token"]
        proof = client.post(
            "/v1/account/oauth/yandex/recovery",
            json={"token": token},
            headers={"authorization": f"Bearer {config.account_internal_token}"},
        ).json()
        assert (
            client.post(
                "/v1/account/oauth/yandex/recover", json={"token": token, "code": proof["code"]}
            ).status_code
            == 200
        )
        assert client.get("/v1/account/me").status_code == 200
    with pytest.raises(AccountServiceError):
        accounts.get_session(original.token)
    with pytest.raises(AccountServiceError):
        accounts.login(LoginRequest(email=old_user.email, password="correct password"))
    assert not accounts._store.create_session_if_password_hash(
        token_hash=hash_session_token("stale-in-flight-login"),
        user_id=old_user.id,
        expected_password_hash=old_user.password_hash,
        replacement_password_hash=None,
        expires_at=old_user.created_at + 999999,
        active_session_limit=10,
    )
