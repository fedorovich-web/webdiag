import { createAccessibilityStaticProxy } from "../../../../src/features/tools/accessibility-static-proxy";
import { isInteractiveAccessibleNameResponse } from "../../../../src/features/tools/accessibility-static-tool-contract";

export const POST = createAccessibilityStaticProxy({
  upstreamPath: "/v1/tools/interactive-accessible-names",
  validator: isInteractiveAccessibleNameResponse,
  invalidResponseMessage: "Accessible-name analyzer API returned an invalid response contract.",
});
