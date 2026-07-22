import { describe, expect, it } from "vitest";
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateProductSchema,
  parseBreadcrumbItems,
  validateBreadcrumbSchema,
  validateOrganizationSchema,
  validateProductSchema,
  type BreadcrumbSchemaInput,
  type OrganizationSchemaInput,
  type ProductSchemaInput,
} from "./structured-schema-generators";

const organization: OrganizationSchemaInput = {
  organizationType: "Organization",
  name: "WebDiag",
  legalName: "WebDiag GmbH",
  url: "https://example.com/",
  id: "",
  logo: "https://example.com/logo.png",
  description: "Technical diagnostics",
  email: "hello@example.com",
  telephone: "+49 30 000000",
  sameAs: "https://www.linkedin.com/company/example\nhttps://github.com/example",
  streetAddress: "Example Street 1",
  addressLocality: "Berlin",
  addressRegion: "Berlin",
  postalCode: "10115",
  addressCountry: "de",
  contactType: "support",
  contactTelephone: "+49 30 000001",
  contactEmail: "support@example.com",
  contactAreaServed: "DE\nAT",
  contactLanguages: "de\nen",
};

const product: ProductSchemaInput = {
  name: "Diagnostics plan",
  description: "One-off diagnostics plan",
  url: "https://example.com/product",
  id: "",
  images: "https://example.com/product.webp",
  sku: "WD-PLAN",
  brand: "WebDiag",
  gtin: "12345678",
  mpn: "PLAN-1",
  price: "49.00",
  priceCurrency: "eur",
  availability: "InStock",
  itemCondition: "NewCondition",
  sellerName: "WebDiag",
  priceValidUntil: "2026-12-31",
};

describe("specialized structured-data generators", () => {
  it("generates a structured organization without placeholder data", () => {
    expect(validateOrganizationSchema(organization)).toEqual([]);
    const output = generateOrganizationSchema(organization);
    expect(output).toContain('"@id": "https://example.com/#organization"');
    expect(output).toContain('"addressCountry": "DE"');
    expect(output).toContain('"availableLanguage"');
    expect(output).not.toContain("Example name");
  });

  it("rejects invalid organization URLs and contact metadata without a channel", () => {
    expect(validateOrganizationSchema({
      ...organization,
      url: "javascript:alert(1)",
      contactTelephone: "",
      contactEmail: "",
    })).toEqual(expect.arrayContaining(["url-invalid", "contact-channel-required"]));
  });

  it("parses ordered breadcrumb rows and permits an item-less final crumb", () => {
    const input: BreadcrumbSchemaInput = {
      items: "Home | https://example.com/\nCatalog\thttps://example.com/catalog\nCurrent page |",
    };
    expect(validateBreadcrumbSchema(input)).toEqual([]);
    expect(parseBreadcrumbItems(input.items).items).toHaveLength(3);
    const output = generateBreadcrumbSchema(input);
    expect(output).toContain('"position": 3');
    expect(output).not.toContain('"item": ""');
  });

  it("rejects malformed breadcrumb rows and non-final missing URLs", () => {
    expect(validateBreadcrumbSchema({ items: "Home |\nCurrent | https://example.com/current" })).toContain("breadcrumb-url-required:1");
  });

  it("generates Product and Offer only from explicit input", () => {
    expect(validateProductSchema(product)).toEqual([]);
    const output = generateProductSchema(product);
    expect(output).toContain('"gtin8": "12345678"');
    expect(output).toContain('"priceCurrency": "EUR"');
    expect(output).toContain('"availability": "https://schema.org/InStock"');
    expect(output).not.toContain("aggregateRating");
    expect(output).not.toContain("review");
  });

  it("requires a complete valid offer pair and supported GTIN length", () => {
    expect(validateProductSchema({ ...product, priceCurrency: "", gtin: "123" })).toEqual(
      expect.arrayContaining(["offer-pair-required", "offer-price-required", "gtin-invalid"]),
    );
  });

  it("rejects calendar-invalid priceValidUntil dates", () => {
    expect(validateProductSchema({ ...product, priceValidUntil: "2026-02-31" })).toContain("price-valid-until-invalid");
  });

  it("escapes less-than characters so user input cannot close the script element", () => {
    const output = generateProductSchema({ ...product, description: "</script><script>alert(1)</script>" });
    expect(output).not.toContain("</script><script>");
    expect(output).toContain("\\u003c/script>");
  });
});
