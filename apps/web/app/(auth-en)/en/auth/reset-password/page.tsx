import type { Metadata } from "next";

import { AuthShell } from "../../../../../src/features/auth/auth-shell";
import { AuthTokenForm } from "../../../../../src/features/auth/auth-token-form";

export const metadata: Metadata = { title: "New password" };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <AuthShell
      description="Set a new password. All previous account sessions will be revoked after the change."
      locale="en"
      title="New password"
    >
      <AuthTokenForm locale="en" mode="reset-password" token={token} />
    </AuthShell>
  );
}
