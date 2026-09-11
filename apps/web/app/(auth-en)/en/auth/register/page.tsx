import type { Metadata } from "next";

import { AuthForm } from "../../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Create account" };

export default function RegisterPage() {
  return (
    <AuthShell
      description="Create an account with email and verify your address to save audits and diagnostic history."
      locale="en"
      title="Create account"
    >
      <AuthForm locale="en" mode="register" />
    </AuthShell>
  );
}
