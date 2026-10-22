import { expect, it } from "vitest";
import { AI_TOOL_IDS } from "../account/account-ai-contract";
import { getAICatalogTools } from "./ai-tools-data";

it("advertises only AI workflows with a supported public runtime contract", () => {
  const tools = getAICatalogTools("en");
  expect(tools.map((tool) => tool.slug.replaceAll("-", "_")).sort()).toEqual(
    AI_TOOL_IDS.filter((id) => id !== "ai_faq_studio").sort(),
  );
  expect(tools).toHaveLength(14);
});
