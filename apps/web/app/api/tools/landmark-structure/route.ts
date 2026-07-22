import { createAccessibilityStaticProxy } from "../../../../src/features/tools/accessibility-static-proxy";
import { isLandmarkStructureResponse } from "../../../../src/features/tools/accessibility-static-tool-contract";

export const POST = createAccessibilityStaticProxy({
  upstreamPath: "/v1/tools/landmark-structure",
  validator: isLandmarkStructureResponse,
  invalidResponseMessage: "Landmark analyzer API returned an invalid response contract.",
});
