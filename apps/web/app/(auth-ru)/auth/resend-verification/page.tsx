import type { Metadata } from "next";

import { AuthForm } from "../../../../src/features/auth/auth-form";
import { AuthShell } from "../../../../src/features/auth/auth-shell";

export const metadata: Metadata = { title: "Повторная отправка письма" };

export default function ResendVerificationPage() {
  return (
    <AuthShell
      description="Укажите email аккаунта. Ответ не раскрывает, существует ли адрес и требуется ли ему подтверждение."
      locale="ru"
      title="Отправить письмо повторно"
    >
      <AuthForm locale="ru" mode="resend-verification" />
    </AuthShell>
  );
}
