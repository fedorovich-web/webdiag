import type { Metadata } from "next";

import { AuthShell } from "../../../../../src/features/auth/auth-shell";
import { AuthTokenForm } from "../../../../../src/features/auth/auth-token-form";

export const metadata: Metadata = { title: "Verify email" };

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <AuthShell
      description="Confirm the address from your email. WebDiag will create a secure account session after verification."
      locale="en"
      title="Verify email"
    >
      <AuthTokenForm locale="en" mode="verify-email" token={token} />
    </AuthShell>
  );
}
