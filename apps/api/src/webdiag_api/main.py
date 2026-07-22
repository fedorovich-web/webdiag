from fastapi import FastAPI

from webdiag_api import __version__
from webdiag_api.audit.api import router as audit_router
from webdiag_api.registry import public_tools
from webdiag_api.tools.accessibility_static import router as accessibility_static_tool_router
from webdiag_api.tools.asset_delivery import router as asset_delivery_tool_router
from webdiag_api.tools.canonical import router as canonical_tool_router
from webdiag_api.tools.client_delivery import router as client_delivery_tool_router
from webdiag_api.tools.content_analysis import router as content_analysis_tool_router
from webdiag_api.tools.http_status import router as http_status_tool_router
from webdiag_api.tools.image_audit import router as image_audit_tool_router
from webdiag_api.tools.link_health import router as link_health_tool_router
from webdiag_api.tools.markup import router as markup_tool_router
from webdiag_api.tools.network_dns import router as network_dns_tool_router
from webdiag_api.tools.page_metadata import router as page_metadata_tool_router
from webdiag_api.tools.performance import router as performance_tool_router
from webdiag_api.tools.protocol_security import router as protocol_security_tool_router
from webdiag_api.tools.robots_txt import router as robots_txt_tool_router
from webdiag_api.tools.security_headers import router as security_headers_tool_router
from webdiag_api.tools.sitemap_xml import router as sitemap_xml_tool_router
from webdiag_api.tools.technical_seo import router as technical_seo_tool_router
from webdiag_api.tools.url_management import router as url_management_tool_router

app = FastAPI(title="WebDiag API", version=__version__)
app.include_router(audit_router)
app.include_router(accessibility_static_tool_router)
app.include_router(asset_delivery_tool_router)
app.include_router(canonical_tool_router)
app.include_router(client_delivery_tool_router)
app.include_router(content_analysis_tool_router)
app.include_router(http_status_tool_router)
app.include_router(image_audit_tool_router)
app.include_router(link_health_tool_router)
app.include_router(markup_tool_router)
app.include_router(network_dns_tool_router)
app.include_router(page_metadata_tool_router)
app.include_router(performance_tool_router)
app.include_router(protocol_security_tool_router)
app.include_router(robots_txt_tool_router)
app.include_router(security_headers_tool_router)
app.include_router(sitemap_xml_tool_router)
app.include_router(technical_seo_tool_router)
app.include_router(url_management_tool_router)

@app.get("/health", tags=["system"])
def health() -> dict[str, str]:
    return {"status": "ok", "service": "webdiag-api", "version": __version__}

@app.get("/v1/tools", tags=["tools"])
def list_tools() -> dict[str, object]:
    tools = public_tools()
    return {"count": len(tools), "items": tools}
