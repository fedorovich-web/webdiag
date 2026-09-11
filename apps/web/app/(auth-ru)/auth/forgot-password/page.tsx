import type { Metadata } from "next";

import { AuthForm } from "../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Восстановление пароля" };

export default function ForgotPasswordPage() {
  return (
    <AuthShell
      description="Укажите email аккаунта. Если он существует, мы отправим одноразовую ссылку для сброса пароля."
      locale="ru"
      title="Восстановить пароль"
    >
      <AuthForm locale="ru" mode="forgot-password" />
    </AuthShell>
  );
}
