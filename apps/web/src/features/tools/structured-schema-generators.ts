export type OrganizationSchemaType = "Organization" | "Corporation" | "NGO" | "LocalBusiness";

export interface OrganizationSchemaInput {
  readonly organizationType: OrganizationSchemaType;
  readonly name: string;
  readonly legalName: string;
  readonly url: string;
  readonly id: string;
  readonly logo: string;
  readonly description: string;
  readonly email: string;
  readonly telephone: string;
  readonly sameAs: string;
  readonly streetAddress: string;
  readonly addressLocality: string;
  readonly addressRegion: string;
  readonly postalCode: string;
  readonly addressCountry: string;
  readonly contactType: string;
  readonly contactTelephone: string;
  readonly contactEmail: string;
  readonly contactAreaServed: string;
  readonly contactLanguages: string;
}

export interface BreadcrumbSchemaInput {
  readonly items: string;
}

export interface ProductSchemaInput {
  readonly name: string;
  readonly description: string;
  readonly url: string;
  readonly id: string;
  readonly images: string;
  readonly sku: string;
  readonly brand: string;
  readonly gtin: string;
  readonly mpn: string;
  readonly price: string;
  readonly priceCurrency: string;
  readonly availability: "" | "InStock" | "OutOfStock" | "PreOrder" | "BackOrder" | "Discontinued";
  readonly itemCondition: "" | "NewCondition" | "UsedCondition" | "RefurbishedCondition" | "DamagedCondition";
  readonly sellerName: string;
  readonly priceValidUntil: string;
}

export interface BreadcrumbItem {
  readonly name: string;
  readonly url: string | null;
}

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);
const GTIN_LENGTHS = new Set([8, 12, 13, 14]);

function trim(value: string): string {
  return value.trim();
}

function nonEmptyLines(value: string): string[] {
  return value.split(/\r?\n/).map(trim).filter(Boolean);
}

function isHttpUrl(value: string): boolean {
  try {
    const parsed = new URL(value);
    return HTTP_PROTOCOLS.has(parsed.protocol) && !parsed.username && !parsed.password;
  } catch {
    return false;
  }
}

function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}

function unique(values: readonly string[]): string[] {
  return [...new Set(values)];
}

function jsonLdScript(payload: unknown): string {
  const serialized = JSON.stringify(payload, null, 2)
    .replace(/</g, "\\u003c")
    .replace(/\u2028/g, "\\u2028")
    .replace(/\u2029/g, "\\u2029");
  return `<script type="application/ld+json">\n${serialized}\n</script>`;
}

function entityId(explicitId: string, url: string, suffix: string): string | null {
  const supplied = trim(explicitId);
  if (supplied) return supplied;
  const normalizedUrl = trim(url);
  return normalizedUrl ? `${normalizedUrl.replace(/#.*$/, "")}#${suffix}` : null;
}

export function validateOrganizationSchema(input: OrganizationSchemaInput): readonly string[] {
  const errors: string[] = [];
  if (!trim(input.name)) errors.push("name-required");
  if (trim(input.url) && !isHttpUrl(trim(input.url))) errors.push("url-invalid");
  if (trim(input.logo) && !isHttpUrl(trim(input.logo))) errors.push("logo-invalid");
  if (trim(input.id) && !isHttpUrl(trim(input.id)) && !trim(input.id).startsWith("#")) errors.push("id-invalid");
  if (trim(input.email) && !/^\S+@\S+\.\S+$/.test(trim(input.email))) errors.push("email-invalid");
  const sameAs = nonEmptyLines(input.sameAs);
  if (sameAs.length > 20) errors.push("same-as-too-many");
  if (sameAs.some((url) => !isHttpUrl(url))) errors.push("same-as-invalid");
  if (trim(input.contactEmail) && !/^\S+@\S+\.\S+$/.test(trim(input.contactEmail))) errors.push("contact-email-invalid");
  const contactMetadata = [input.contactType, input.contactAreaServed, input.contactLanguages].some((value) => trim(value));
  if (contactMetadata && !trim(input.contactTelephone) && !trim(input.contactEmail)) errors.push("contact-channel-required");
  return unique(errors);
}

export function generateOrganizationSchema(input: OrganizationSchemaInput): string {
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": input.organizationType,
    name: trim(input.name),
  };
  const id = entityId(input.id, input.url, "organization");
  if (id) payload["@id"] = id;
  if (trim(input.legalName)) payload.legalName = trim(input.legalName);
  if (trim(input.url)) payload.url = trim(input.url);
  if (trim(input.logo)) payload.logo = trim(input.logo);
  if (trim(input.description)) payload.description = trim(input.description);
  if (trim(input.email)) payload.email = trim(input.email);
  if (trim(input.telephone)) payload.telephone = trim(input.telephone);

  const sameAs = unique(nonEmptyLines(input.sameAs));
  if (sameAs.length) payload.sameAs = sameAs;

  const addressValues = [input.streetAddress, input.addressLocality, input.addressRegion, input.postalCode, input.addressCountry];
  if (addressValues.some((value) => trim(value))) {
    const address: Record<string, unknown> = { "@type": "PostalAddress" };
    if (trim(input.streetAddress)) address.streetAddress = trim(input.streetAddress);
    if (trim(input.addressLocality)) address.addressLocality = trim(input.addressLocality);
    if (trim(input.addressRegion)) address.addressRegion = trim(input.addressRegion);
    if (trim(input.postalCode)) address.postalCode = trim(input.postalCode);
    if (trim(input.addressCountry)) {
      const country = trim(input.addressCountry);
      address.addressCountry = /^[A-Za-z]{2}$/.test(country) ? country.toUpperCase() : country;
    }
    payload.address = address;
  }

  const contactValues = [input.contactTelephone, input.contactEmail, input.contactType, input.contactAreaServed, input.contactLanguages];
  if (contactValues.some((value) => trim(value))) {
    const contact: Record<string, unknown> = { "@type": "ContactPoint" };
    if (trim(input.contactTelephone)) contact.telephone = trim(input.contactTelephone);
    if (trim(input.contactEmail)) contact.email = trim(input.contactEmail);
    if (trim(input.contactType)) contact.contactType = trim(input.contactType);
    if (trim(input.contactAreaServed)) contact.areaServed = nonEmptyLines(input.contactAreaServed);
    if (trim(input.contactLanguages)) contact.availableLanguage = nonEmptyLines(input.contactLanguages);
    payload.contactPoint = [contact];
  }

  return jsonLdScript(payload);
}

export function parseBreadcrumbItems(value: string): { readonly items: readonly BreadcrumbItem[]; readonly errors: readonly string[] } {
  const errors: string[] = [];
  const lines = nonEmptyLines(value);
  if (lines.length < 2) errors.push("breadcrumbs-too-few");
  if (lines.length > 20) errors.push("breadcrumbs-too-many");
  const items: BreadcrumbItem[] = [];

  lines.forEach((line, index) => {
    const delimiter = line.includes("\t") ? "\t" : "|";
    const parts = line.split(delimiter).map(trim);
    if (parts.length !== 2 || !parts[0]) {
      errors.push(`breadcrumb-line-invalid:${index + 1}`);
      return;
    }
    const url = parts[1] || null;
    const isLast = index === lines.length - 1;
    if (!url && !isLast) errors.push(`breadcrumb-url-required:${index + 1}`);
    if (url && !isHttpUrl(url)) errors.push(`breadcrumb-url-invalid:${index + 1}`);
    items.push({ name: parts[0], url });
  });

  return { items, errors: unique(errors) };
}

export function validateBreadcrumbSchema(input: BreadcrumbSchemaInput): readonly string[] {
  return parseBreadcrumbItems(input.items).errors;
}

export function generateBreadcrumbSchema(input: BreadcrumbSchemaInput): string {
  const { items } = parseBreadcrumbItems(input.items);
  return jsonLdScript({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => {
      const listItem: Record<string, unknown> = {
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
      };
      if (item.url) listItem.item = item.url;
      return listItem;
    }),
  });
}

export function validateProductSchema(input: ProductSchemaInput): readonly string[] {
  const errors: string[] = [];
  if (!trim(input.name)) errors.push("name-required");
  if (trim(input.url) && !isHttpUrl(trim(input.url))) errors.push("url-invalid");
  if (trim(input.id) && !isHttpUrl(trim(input.id)) && !trim(input.id).startsWith("#")) errors.push("id-invalid");
  const images = nonEmptyLines(input.images);
  if (images.length > 10) errors.push("images-too-many");
  if (images.some((url) => !isHttpUrl(url))) errors.push("image-invalid");
  const gtin = trim(input.gtin);
  if (gtin && (!/^\d+$/.test(gtin) || !GTIN_LENGTHS.has(gtin.length))) errors.push("gtin-invalid");
  const price = trim(input.price);
  const currency = trim(input.priceCurrency);
  if ((price && !currency) || (!price && currency)) errors.push("offer-pair-required");
  if (price && (!Number.isFinite(Number(price)) || Number(price) <= 0)) errors.push("price-invalid");
  if (currency && !/^[A-Za-z]{3}$/.test(currency)) errors.push("currency-invalid");
  if (trim(input.priceValidUntil) && !isIsoDate(trim(input.priceValidUntil))) errors.push("price-valid-until-invalid");
  if ((input.availability || input.itemCondition || trim(input.sellerName) || trim(input.priceValidUntil)) && (!price || !currency)) {
    errors.push("offer-price-required");
  }
  return unique(errors);
}

export function generateProductSchema(input: ProductSchemaInput): string {
  const payload: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: trim(input.name),
  };
  const id = entityId(input.id, input.url, "product");
  if (id) payload["@id"] = id;
  if (trim(input.description)) payload.description = trim(input.description);
  if (trim(input.url)) payload.url = trim(input.url);
  const images = unique(nonEmptyLines(input.images));
  if (images.length === 1) payload.image = images[0];
  if (images.length > 1) payload.image = images;
  if (trim(input.sku)) payload.sku = trim(input.sku);
  if (trim(input.brand)) payload.brand = { "@type": "Brand", name: trim(input.brand) };
  if (trim(input.gtin)) payload[`gtin${trim(input.gtin).length}`] = trim(input.gtin);
  if (trim(input.mpn)) payload.mpn = trim(input.mpn);

  if (trim(input.price) && trim(input.priceCurrency)) {
    const offer: Record<string, unknown> = {
      "@type": "Offer",
      price: trim(input.price),
      priceCurrency: trim(input.priceCurrency).toUpperCase(),
    };
    if (trim(input.url)) offer.url = trim(input.url);
    if (input.availability) offer.availability = `https://schema.org/${input.availability}`;
    if (input.itemCondition) offer.itemCondition = `https://schema.org/${input.itemCondition}`;
    if (trim(input.sellerName)) offer.seller = { "@type": "Organization", name: trim(input.sellerName) };
    if (trim(input.priceValidUntil)) offer.priceValidUntil = trim(input.priceValidUntil);
    payload.offers = offer;
  }

  return jsonLdScript(payload);
}
