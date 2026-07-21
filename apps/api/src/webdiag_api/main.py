from fastapi import FastAPI

from webdiag_api import __version__
from webdiag_api.audit.api import router as audit_router
from webdiag_api.registry import public_tools
from webdiag_api.tools.http_status import router as http_status_tool_router
from webdiag_api.tools.robots_txt import router as robots_txt_tool_router

app = FastAPI(title="WebDiag API", version=__version__)
app.include_router(audit_router)
app.include_router(http_status_tool_router)
app.include_router(robots_txt_tool_router)

@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "webdiag-api", "version": __version__}

@app.get("/v1/tools", tags=["tools"])
def list_tools() -> dict[str, object]:
    tools = public_tools()
    return {"count": len(tools), "items": tools}
