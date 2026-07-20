"use client";

import { useState } from "react";
import type { Locale } from "@webdiag/tool-registry";
import { dictionary } from "../lib/i18n";

export function CopyButton({ value, locale }: { value: string; locale: Locale }) {
  const [copied, setCopied] = useState(false);
  const text = dictionary[locale];

  async function copy() {
    await navigator.clipboard.writeText(value);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1200);
  }

  return <button className="button button-secondary" type="button" onClick={copy} disabled={!value}>{copied ? text.copied : text.copy}</button>;
}
