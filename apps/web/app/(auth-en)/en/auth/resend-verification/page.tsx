import type { Metadata } from "next";

import { AuthForm } from "../../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Resend verification email" };

export default function ResendVerificationPage() {
  return (
    <AuthShell
      description="Enter the account email. The response does not reveal whether the address exists or still needs verification."
      locale="en"
      title="Resend verification email"
    >
      <AuthForm locale="en" mode="resend-verification" />
    </AuthShell>
  );
}
