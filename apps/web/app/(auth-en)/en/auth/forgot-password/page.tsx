import type { Metadata } from "next";

import { AuthForm } from "../../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Reset password" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Enter your account email. If the account exists, we will send a one-time password reset link."
      locale="en"
      title="Reset password"
    >
      <AuthForm locale="en" mode="forgot-password" />
    </AuthShell>
  );
}
