import { createAccessibilityStaticProxy } from "../../../../src/features/tools/accessibility-static-proxy";
import { isFormAccessibilityResponse } from "../../../../src/features/tools/accessibility-static-tool-contract";

export const POST = createAccessibilityStaticProxy({
  upstreamPath: "/v1/tools/form-accessibility",
  validator: isFormAccessibilityResponse,
  invalidResponseMessage: "Form accessibility API returned an invalid response contract.",
});
