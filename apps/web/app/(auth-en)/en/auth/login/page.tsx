import type { Metadata } from "next";

import { AuthForm } from "../../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      description="Sign in to save audit results and continue working with your website diagnostics."
      locale="en"
      title="Sign in"
    >
      <AuthForm locale="en" mode="login" />
    </AuthShell>
  );
}
