import { createNetworkIntelligenceProxy } from "../../../../src/features/tools/network-intelligence-proxy";
import { isDnsResolverComparisonResponse } from "../../../../src/features/tools/network-intelligence-tool-contract";

export const POST = createNetworkIntelligenceProxy({
  kind: "dns-comparison",
  upstreamPath: "/v1/tools/dns-resolver-comparison",
  validator: isDnsResolverComparisonResponse,
  invalidResponseMessage: "DNS resolver comparison API returned an invalid response contract.",
});
