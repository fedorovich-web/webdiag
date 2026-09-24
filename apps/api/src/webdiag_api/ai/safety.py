import base64
import hashlib
import hmac


def derive_safety_identifier(secret: str, user_id: str) -> str:
    if len(secret) < 32 or not user_id:
        raise ValueError("AI safety identifier inputs are invalid")
    digest = hmac.new(secret.encode("utf-8"), user_id.encode("utf-8"), hashlib.sha256).digest()
    return base64.urlsafe_b64encode(digest).rstrip(b"=").decode("ascii")
