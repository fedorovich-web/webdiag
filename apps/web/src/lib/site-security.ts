export interface SecurityHeader {
  readonly key: string;
  readonly value: string;
}

const baselineSecurityHeaders: readonly SecurityHeader[] = [
  {
    key: "Content-Security-Policy",
    value: "base-uri 'self'; form-action 'self'; frame-ancestors 'none'; object-src 'none'",
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()",
  },
];

const publicReleaseSecurityHeaders: readonly SecurityHeader[] = [
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

export function siteSecurityHeaders(publicRelease: boolean): readonly SecurityHeader[] {
  return publicRelease
    ? [...baselineSecurityHeaders, ...publicReleaseSecurityHeaders]
    : [...baselineSecurityHeaders];
}

export function overrideSecurityHeaders(
  base: readonly SecurityHeader[],
  overrides: readonly SecurityHeader[],
): readonly SecurityHeader[] {
  const overrideKeys = new Set(overrides.map(({ key }) => key.toLowerCase()));
  return [
    ...base.filter(({ key }) => !overrideKeys.has(key.toLowerCase())),
    ...overrides,
  ];
}
