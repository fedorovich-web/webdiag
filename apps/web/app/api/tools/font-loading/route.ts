import { createAssetDeliveryProxy } from "../../../../src/features/tools/asset-delivery-proxy";
import { isFontLoadingAnalyzerResponse } from "../../../../src/features/tools/asset-delivery-tool-contract";

export const POST = createAssetDeliveryProxy({
  upstreamPath: "/v1/tools/font-loading",
  validator: isFontLoadingAnalyzerResponse,
  invalidResponseMessage: "Font loading API returned an invalid response.",
});
