import type { Metadata } from "next";

import { AuthShell } from "../../../../src/features/auth/auth-shell";
import { AuthTokenForm } from "../../../../src/features/auth/auth-token-form";

export const metadata: Metadata = { title: "Новый пароль" };

type ResetPasswordPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function ResetPasswordPage({ searchParams }: ResetPasswordPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <AuthShell
      description="Задайте новый пароль. После изменения все предыдущие сессии аккаунта будут отозваны."
      locale="ru"
      title="Новый пароль"
    >
      <AuthTokenForm locale="ru" mode="reset-password" token={token} />
    </AuthShell>
  );
}
