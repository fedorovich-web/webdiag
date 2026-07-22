import { createNetworkIntelligenceProxy } from "../../../../src/features/tools/network-intelligence-proxy";
import { isDomainRdapResponse } from "../../../../src/features/tools/network-intelligence-tool-contract";

export const POST = createNetworkIntelligenceProxy({
  kind: "domain",
  upstreamPath: "/v1/tools/domain-rdap",
  validator: isDomainRdapResponse,
  invalidResponseMessage: "Domain RDAP API returned an invalid response contract.",
});
