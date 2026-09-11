import type { Metadata } from "next";

import { AuthForm } from "../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Регистрация" };

export default function RegisterPage() {
  return (
    <AuthShell
      description="Создайте аккаунт по email и подтвердите адрес, чтобы сохранять аудиты и историю проверок."
      locale="ru"
      title="Создать аккаунт"
    >
      <AuthForm locale="ru" mode="register" />
    </AuthShell>
  );
}
