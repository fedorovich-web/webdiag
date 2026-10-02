import type { Metadata } from "next";
import { PricingHubPage } from "../../../../src/features/pricing/pricing-hub-page";
import { pageMetadata } from "../../../../src/lib/seo";

export const metadata: Metadata = pageMetadata({
  locale: "en",
  title: "WebDiag Pricing — Plans for SEO Audit, Web Tools & AI Workflows",
  description: "WebDiag pricing plans: Starter (free), Pro, and Team. Deep site crawling, AI fix action plans, automated monitoring, and downloadable PDF reports.",
  canonical: "/en/pricing",
  ruPath: "/pricing",
  enPath: "/en/pricing",
});

export default function Page() {
  return <PricingHubPage locale="en" />;
}
