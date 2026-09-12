import type { Metadata } from "next";

import { AuthShell } from "../../../../src/features/auth/auth-shell";
import { AuthTokenForm } from "../../../../src/features/auth/auth-token-form";

export const metadata: Metadata = { title: "Подтверждение email" };

type VerifyEmailPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function VerifyEmailPage({ searchParams }: VerifyEmailPageProps) {
  const params = await searchParams;
  const token = typeof params.token === "string" ? params.token : undefined;

  return (
    <AuthShell
      description="Подтвердите адрес из письма. После подтверждения WebDiag создаст безопасную сессию для вашего аккаунта."
      locale="ru"
      title="Подтвердить email"
    >
      <AuthTokenForm locale="ru" mode="verify-email" token={token} />
    </AuthShell>
  );
}
