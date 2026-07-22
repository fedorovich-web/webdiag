"use client";

import { type FormEvent, useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { CopyButton } from "../../components/copy-button";
import {
  generateBreadcrumbSchema,
  generateOrganizationSchema,
  generateProductSchema,
  validateBreadcrumbSchema,
  validateOrganizationSchema,
  validateProductSchema,
  type BreadcrumbSchemaInput,
  type OrganizationSchemaInput,
  type ProductSchemaInput,
} from "./structured-schema-generators";

const EMPTY_ORGANIZATION: OrganizationSchemaInput = {
  organizationType: "Organization",
  name: "",
  legalName: "",
  url: "",
  id: "",
  logo: "",
  description: "",
  email: "",
  telephone: "",
  sameAs: "",
  streetAddress: "",
  addressLocality: "",
  addressRegion: "",
  postalCode: "",
  addressCountry: "",
  contactType: "",
  contactTelephone: "",
  contactEmail: "",
  contactAreaServed: "",
  contactLanguages: "",
};

const EMPTY_BREADCRUMBS: BreadcrumbSchemaInput = { items: "" };

const EMPTY_PRODUCT: ProductSchemaInput = {
  name: "",
  description: "",
  url: "",
  id: "",
  images: "",
  sku: "",
  brand: "",
  gtin: "",
  mpn: "",
  price: "",
  priceCurrency: "",
  availability: "",
  itemCondition: "",
  sellerName: "",
  priceValidUntil: "",
};

const ERROR_COPY: Record<string, { readonly ru: string; readonly en: string }> = {
  "name-required": { ru: "Укажите название.", en: "Enter a name." },
  "url-invalid": { ru: "URL должен быть абсолютным HTTP(S)-адресом.", en: "URL must be an absolute HTTP(S) URL." },
  "logo-invalid": { ru: "Logo URL должен быть абсолютным HTTP(S)-адресом.", en: "Logo URL must be an absolute HTTP(S) URL." },
  "id-invalid": { ru: "@id должен быть HTTP(S)-URL или fragment, начинающийся с #.", en: "@id must be an HTTP(S) URL or a fragment beginning with #." },
  "email-invalid": { ru: "Проверьте email организации.", en: "Check the organization email." },
  "same-as-too-many": { ru: "Допускается не более 20 sameAs URL.", en: "No more than 20 sameAs URLs are allowed." },
  "same-as-invalid": { ru: "Все sameAs значения должны быть HTTP(S)-URL.", en: "Every sameAs value must be an HTTP(S) URL." },
  "contact-email-invalid": { ru: "Проверьте email contact point.", en: "Check the contact-point email." },
  "contact-channel-required": { ru: "Для contact point укажите телефон или email.", en: "Provide a telephone or email for the contact point." },
  "breadcrumbs-too-few": { ru: "Добавьте минимум два breadcrumb-пункта.", en: "Add at least two breadcrumb items." },
  "breadcrumbs-too-many": { ru: "Допускается не более 20 breadcrumb-пунктов.", en: "No more than 20 breadcrumb items are allowed." },
  "images-too-many": { ru: "Допускается не более 10 image URL.", en: "No more than 10 image URLs are allowed." },
  "image-invalid": { ru: "Все image значения должны быть HTTP(S)-URL.", en: "Every image value must be an HTTP(S) URL." },
  "gtin-invalid": { ru: "GTIN должен содержать 8, 12, 13 или 14 цифр.", en: "GTIN must contain 8, 12, 13, or 14 digits." },
  "offer-pair-required": { ru: "Price и priceCurrency должны быть заполнены вместе.", en: "Price and priceCurrency must be supplied together." },
  "price-invalid": { ru: "Price должен быть положительным числом.", en: "Price must be a positive number." },
  "currency-invalid": { ru: "Currency должен быть трёхбуквенным кодом, например EUR.", en: "Currency must be a three-letter code such as EUR." },
  "price-valid-until-invalid": { ru: "priceValidUntil должен иметь формат YYYY-MM-DD.", en: "priceValidUntil must use YYYY-MM-DD." },
  "offer-price-required": { ru: "Availability, condition, seller и priceValidUntil требуют price и currency.", en: "Availability, condition, seller, and priceValidUntil require price and currency." },
};

function errorLabel(code: string, locale: Locale): string {
  const exact = ERROR_COPY[code];
  if (exact) return exact[locale];
  if (code.startsWith("breadcrumb-line-invalid:")) {
    const line = code.split(":")[1];
    return locale === "ru" ? `Строка ${line}: ожидается Name | URL.` : `Line ${line}: expected Name | URL.`;
  }
  if (code.startsWith("breadcrumb-url-required:")) {
    const line = code.split(":")[1];
    return locale === "ru" ? `Строка ${line}: URL можно пропустить только у последнего пункта.` : `Line ${line}: URL may be omitted only for the final item.`;
  }
  if (code.startsWith("breadcrumb-url-invalid:")) {
    const line = code.split(":")[1];
    return locale === "ru" ? `Строка ${line}: URL должен быть HTTP(S).` : `Line ${line}: URL must be HTTP(S).`;
  }
  return locale === "ru" ? "Проверьте введённые данные." : "Review the input data.";
}

function Panel({ title, children }: { readonly title: string; readonly children: React.ReactNode }) {
  return <section className="tool-panel"><h2>{title}</h2>{children}</section>;
}

function ResultPanel({ locale, value, title }: { readonly locale: Locale; readonly value: string; readonly title: string }) {
  return <Panel title={title}>
    <div className="output-wrap">
      <pre className="output" aria-live="polite">{value || "—"}</pre>
      <CopyButton value={value} locale={locale} />
    </div>
    <p className="tool-muted">
      {locale === "ru"
        ? "Публикуйте только проверенные фактические данные. JSON-LD не гарантирует rich result или поисковую видимость."
        : "Publish only verified factual data. JSON-LD does not guarantee a rich result or search visibility."}
    </p>
  </Panel>;
}

function Errors({ errors, locale }: { readonly errors: readonly string[]; readonly locale: Locale }) {
  return errors.length ? <ul className="form-error" role="alert">{errors.map((error) => <li key={error}>{errorLabel(error, locale)}</li>)}</ul> : null;
}

export function OrganizationSchemaGeneratorTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState<OrganizationSchemaInput>(EMPTY_ORGANIZATION);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);
  const set = <K extends keyof OrganizationSchemaInput>(key: K, value: OrganizationSchemaInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateOrganizationSchema(input);
    setErrors(validation);
    setOutput(validation.length ? "" : generateOrganizationSchema(input));
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Данные организации" : "Organization data"}>
      <form onSubmit={submit}>
        <label className="field"><span>Schema type</span><select value={input.organizationType} onChange={(event) => set("organizationType", event.target.value as OrganizationSchemaInput["organizationType"])}><option>Organization</option><option>Corporation</option><option>NGO</option><option>LocalBusiness</option></select></label>
        <label className="field"><span>{locale === "ru" ? "Название *" : "Name *"}</span><input value={input.name} onChange={(event) => set("name", event.target.value)} /></label>
        <label className="field"><span>legalName</span><input value={input.legalName} onChange={(event) => set("legalName", event.target.value)} /></label>
        <label className="field"><span>url</span><input placeholder="https://example.com/" value={input.url} onChange={(event) => set("url", event.target.value)} /></label>
        <label className="field"><span>@id</span><input placeholder="https://example.com/#organization" value={input.id} onChange={(event) => set("id", event.target.value)} /></label>
        <label className="field"><span>logo</span><input value={input.logo} onChange={(event) => set("logo", event.target.value)} /></label>
        <label className="field"><span>description</span><textarea rows={4} value={input.description} onChange={(event) => set("description", event.target.value)} /></label>
        <label className="field"><span>email</span><input type="email" value={input.email} onChange={(event) => set("email", event.target.value)} /></label>
        <label className="field"><span>telephone</span><input value={input.telephone} onChange={(event) => set("telephone", event.target.value)} /></label>
        <label className="field"><span>sameAs — {locale === "ru" ? "по одному URL на строку" : "one URL per line"}</span><textarea rows={4} value={input.sameAs} onChange={(event) => set("sameAs", event.target.value)} /></label>
        <fieldset><legend>PostalAddress</legend>
          <label className="field"><span>streetAddress</span><input value={input.streetAddress} onChange={(event) => set("streetAddress", event.target.value)} /></label>
          <label className="field"><span>addressLocality</span><input value={input.addressLocality} onChange={(event) => set("addressLocality", event.target.value)} /></label>
          <label className="field"><span>addressRegion</span><input value={input.addressRegion} onChange={(event) => set("addressRegion", event.target.value)} /></label>
          <label className="field"><span>postalCode</span><input value={input.postalCode} onChange={(event) => set("postalCode", event.target.value)} /></label>
          <label className="field"><span>addressCountry</span><input placeholder="DE" value={input.addressCountry} onChange={(event) => set("addressCountry", event.target.value)} /></label>
        </fieldset>
        <fieldset><legend>ContactPoint</legend>
          <label className="field"><span>contactType</span><input placeholder="customer support" value={input.contactType} onChange={(event) => set("contactType", event.target.value)} /></label>
          <label className="field"><span>telephone</span><input value={input.contactTelephone} onChange={(event) => set("contactTelephone", event.target.value)} /></label>
          <label className="field"><span>email</span><input type="email" value={input.contactEmail} onChange={(event) => set("contactEmail", event.target.value)} /></label>
          <label className="field"><span>areaServed — {locale === "ru" ? "по одному на строку" : "one per line"}</span><textarea rows={3} value={input.contactAreaServed} onChange={(event) => set("contactAreaServed", event.target.value)} /></label>
          <label className="field"><span>availableLanguage — {locale === "ru" ? "по одному на строку" : "one per line"}</span><textarea rows={3} value={input.contactLanguages} onChange={(event) => set("contactLanguages", event.target.value)} /></label>
        </fieldset>
        <button className="button" type="submit">{locale === "ru" ? "Сгенерировать Organization JSON-LD" : "Generate Organization JSON-LD"}</button>
        <Errors errors={errors} locale={locale} />
      </form>
    </Panel>
    <ResultPanel locale={locale} value={output} title="Organization JSON-LD" />
  </div>;
}

export function BreadcrumbSchemaGeneratorTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState<BreadcrumbSchemaInput>(EMPTY_BREADCRUMBS);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateBreadcrumbSchema(input);
    setErrors(validation);
    setOutput(validation.length ? "" : generateBreadcrumbSchema(input));
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Цепочка breadcrumbs" : "Breadcrumb trail"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Name | URL, по одному пункту на строку" : "Name | URL, one item per line"}</span><textarea rows={12} placeholder={"Home | https://example.com/\nCatalog | https://example.com/catalog\nCurrent page |"} value={input.items} onChange={(event) => setInput({ items: event.target.value })} /></label>
        <p className="tool-muted">{locale === "ru" ? "URL можно пропустить только у последнего пункта. Позиции назначаются по порядку строк." : "URL may be omitted only for the final item. Positions follow line order."}</p>
        <button className="button" type="submit">{locale === "ru" ? "Сгенерировать BreadcrumbList JSON-LD" : "Generate BreadcrumbList JSON-LD"}</button>
        <Errors errors={errors} locale={locale} />
      </form>
    </Panel>
    <ResultPanel locale={locale} value={output} title="BreadcrumbList JSON-LD" />
  </div>;
}

export function ProductSchemaGeneratorTool({ locale }: { readonly locale: Locale }) {
  const [input, setInput] = useState<ProductSchemaInput>(EMPTY_PRODUCT);
  const [output, setOutput] = useState("");
  const [errors, setErrors] = useState<readonly string[]>([]);
  const set = <K extends keyof ProductSchemaInput>(key: K, value: ProductSchemaInput[K]) => setInput((current) => ({ ...current, [key]: value }));

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const validation = validateProductSchema(input);
    setErrors(validation);
    setOutput(validation.length ? "" : generateProductSchema(input));
  }

  return <div className="tool-grid">
    <Panel title={locale === "ru" ? "Данные товара" : "Product data"}>
      <form onSubmit={submit}>
        <label className="field"><span>{locale === "ru" ? "Название *" : "Name *"}</span><input value={input.name} onChange={(event) => set("name", event.target.value)} /></label>
        <label className="field"><span>description</span><textarea rows={4} value={input.description} onChange={(event) => set("description", event.target.value)} /></label>
        <label className="field"><span>url</span><input value={input.url} onChange={(event) => set("url", event.target.value)} /></label>
        <label className="field"><span>@id</span><input value={input.id} onChange={(event) => set("id", event.target.value)} /></label>
        <label className="field"><span>image — {locale === "ru" ? "по одному URL на строку" : "one URL per line"}</span><textarea rows={4} value={input.images} onChange={(event) => set("images", event.target.value)} /></label>
        <label className="field"><span>sku</span><input value={input.sku} onChange={(event) => set("sku", event.target.value)} /></label>
        <label className="field"><span>brand</span><input value={input.brand} onChange={(event) => set("brand", event.target.value)} /></label>
        <label className="field"><span>GTIN</span><input inputMode="numeric" value={input.gtin} onChange={(event) => set("gtin", event.target.value)} /></label>
        <label className="field"><span>mpn</span><input value={input.mpn} onChange={(event) => set("mpn", event.target.value)} /></label>
        <fieldset><legend>Offer</legend>
          <label className="field"><span>price</span><input inputMode="decimal" value={input.price} onChange={(event) => set("price", event.target.value)} /></label>
          <label className="field"><span>priceCurrency</span><input placeholder="EUR" value={input.priceCurrency} onChange={(event) => set("priceCurrency", event.target.value)} /></label>
          <label className="field"><span>availability</span><select value={input.availability} onChange={(event) => set("availability", event.target.value as ProductSchemaInput["availability"])}><option value="">—</option><option>InStock</option><option>OutOfStock</option><option>PreOrder</option><option>BackOrder</option><option>Discontinued</option></select></label>
          <label className="field"><span>itemCondition</span><select value={input.itemCondition} onChange={(event) => set("itemCondition", event.target.value as ProductSchemaInput["itemCondition"])}><option value="">—</option><option>NewCondition</option><option>UsedCondition</option><option>RefurbishedCondition</option><option>DamagedCondition</option></select></label>
          <label className="field"><span>seller.name</span><input value={input.sellerName} onChange={(event) => set("sellerName", event.target.value)} /></label>
          <label className="field"><span>priceValidUntil</span><input type="date" value={input.priceValidUntil} onChange={(event) => set("priceValidUntil", event.target.value)} /></label>
        </fieldset>
        <button className="button" type="submit">{locale === "ru" ? "Сгенерировать Product JSON-LD" : "Generate Product JSON-LD"}</button>
        <Errors errors={errors} locale={locale} />
      </form>
    </Panel>
    <ResultPanel locale={locale} value={output} title="Product JSON-LD" />
  </div>;
}
