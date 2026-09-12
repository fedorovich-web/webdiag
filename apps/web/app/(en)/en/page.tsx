import "../../home-v11.css";
import "../../home-fidelity.css";
import "../../home-polish.css";
import "../../home-approved-fidelity.css";
import type { Metadata } from "next";
import { HomePage } from "../../../src/features/home/home-page";
import { JsonLd } from "../../../src/components/json-ld";
import { pageMetadata } from "../../../src/lib/seo";
import { websiteJsonLd } from "../../../src/lib/structured-data";
import { homeContent } from "../../../src/content/home";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: homeContent.seoTitle.en,
  description: homeContent.description.en,
  canonical: "/en",
  ruPath: "/",
  enPath: "/en",
});

export default function Page() {
  return <><JsonLd data={websiteJsonLd("en")} /><HomePage locale="en" /></>;
}
