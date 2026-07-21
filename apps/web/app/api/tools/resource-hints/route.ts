import { isResourceHintsAnalyzerResponse } from "../../../../src/features/tools/client-delivery-tool-contract";
import { createClientDeliveryProxy } from "../../../../src/features/tools/client-delivery-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const POST = createClientDeliveryProxy({
  upstreamPath: "/v1/tools/resource-hints",
  validator: isResourceHintsAnalyzerResponse,
  invalidResponseMessage: "Tool API returned an invalid resource hints analyzer result.",
});
