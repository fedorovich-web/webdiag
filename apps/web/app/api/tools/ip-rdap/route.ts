import { createNetworkIntelligenceProxy } from "../../../../src/features/tools/network-intelligence-proxy";
import { isIpRdapResponse } from "../../../../src/features/tools/network-intelligence-tool-contract";

export const POST = createNetworkIntelligenceProxy({
  kind: "ip",
  upstreamPath: "/v1/tools/ip-rdap",
  validator: isIpRdapResponse,
  invalidResponseMessage: "IP RDAP API returned an invalid response contract.",
});
