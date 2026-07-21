from fastapi import FastAPI

from webdiag_api import __version__
from webdiag_api.audit.api import router as audit_router
from webdiag_api.registry import public_tools
from webdiag_api.tools.canonical import router as canonical_tool_router
from webdiag_api.tools.http_status import router as http_status_tool_router
from webdiag_api.tools.image_audit import router as image_audit_tool_router
from webdiag_api.tools.link_health import router as link_health_tool_router
from webdiag_api.tools.markup import router as markup_tool_router
from webdiag_api.tools.page_metadata import router as page_metadata_tool_router
from webdiag_api.tools.performance import router as performance_tool_router
from webdiag_api.tools.robots_txt import router as robots_txt_tool_router
from webdiag_api.tools.security_headers import router as security_headers_tool_router
from webdiag_api.tools.sitemap_xml import router as sitemap_xml_tool_router

app = FastAPI(title="WebDiag API", version=__version__)
app.include_router(audit_router)
app.include_router(canonical_tool_router)
app.include_router(http_status_tool_router)
app.include_router(image_audit_tool_router)
app.include_router(link_health_tool_router)
app.include_router(markup_tool_router)
app.include_router(page_metadata_tool_router)
app.include_router(performance_tool_router)
app.include_router(robots_txt_tool_router)
app.include_router(security_headers_tool_router)
app.include_router(sitemap_xml_tool_router)

@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "webdiag-api", "version": __version__}

@app.get("/v1/tools", tags=["tools"])
def list_tools() -> dict[str, object]:
    tools = public_tools()
    return {"count": len(tools), "items": tools}
