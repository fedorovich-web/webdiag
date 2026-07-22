import { createAssetDeliveryProxy } from "../../../../src/features/tools/asset-delivery-proxy";
import { isCssDeliveryAnalyzerResponse } from "../../../../src/features/tools/asset-delivery-tool-contract";

export const POST = createAssetDeliveryProxy({
  upstreamPath: "/v1/tools/css-delivery",
  validator: isCssDeliveryAnalyzerResponse,
  invalidResponseMessage: "CSS delivery API returned an invalid response.",
});
