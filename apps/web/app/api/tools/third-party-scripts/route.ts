import { isThirdPartyScriptAnalyzerResponse } from "../../../../src/features/tools/client-delivery-tool-contract";
import { createClientDeliveryProxy } from "../../../../src/features/tools/client-delivery-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createClientDeliveryProxy({
  upstreamPath: "/v1/tools/third-party-scripts",
  validator: isThirdPartyScriptAnalyzerResponse,
  invalidResponseMessage: "Tool API returned an invalid third-party script analyzer result.",
});
