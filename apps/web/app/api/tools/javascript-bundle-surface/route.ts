import { createAssetDeliveryProxy } from "../../../../src/features/tools/asset-delivery-proxy";
import { isJavaScriptBundleSurfaceResponse } from "../../../../src/features/tools/asset-delivery-tool-contract";

export const POST = createAssetDeliveryProxy({
  upstreamPath: "/v1/tools/javascript-bundle-surface",
  validator: isJavaScriptBundleSurfaceResponse,
  invalidResponseMessage: "JavaScript bundle surface API returned an invalid response.",
});
