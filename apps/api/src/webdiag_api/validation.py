from __future__ import annotations

from fastapi import Request, Response
from fastapi.exception_handlers import request_validation_exception_handler
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse


async def api_validation_exception_handler(
    request: Request,
    error: RequestValidationError,
) -> Response:
    contracts = (
        ("/v1/account/", "account_invalid_request", "Invalid account request."),
        ("/v1/audits", "audit_invalid_request", "Invalid audit request."),
    )
    for prefix, code, message in contracts:
        if request.url.path.startswith(prefix):
            return JSONResponse(
                status_code=422,
                content={"detail": {"code": code, "message": message}},
                headers={"Cache-Control": "no-store"},
            )
    return await request_validation_exception_handler(request, error)
