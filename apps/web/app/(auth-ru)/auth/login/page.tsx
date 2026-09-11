import type { Metadata } from "next";

import { AuthForm } from "../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Вход" };

export default function LoginPage() {
  return (
    <AuthShell
      description="Войдите, чтобы сохранять результаты проверок и продолжать работу с аудитами."
      locale="ru"
      title="Вход"
    >
      <AuthForm locale="ru" mode="login" />
    </AuthShell>
  );
}
