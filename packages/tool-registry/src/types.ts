export type Locale = "ru" | "en";
export type ToolState = "ready" | "internal";
export type ExecutorClass = "browser" | "safe_fetch" | "dns_tls" | "crawler" | "chromium" | "composite";

export interface LocalizedText {
  readonly ru: string;
  readonly en: string;
}

export interface ToolDefinition {
  readonly id: string;
  readonly slug: string;
  readonly title: LocalizedText;
  readonly category: string;
  readonly executorClass: ExecutorClass;
  readonly riskTier: string;
  readonly access: string;
  readonly implementationWave: string;
  readonly state: ToolState;
  readonly description?: LocalizedText | null;
}
