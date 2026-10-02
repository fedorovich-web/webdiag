import { createAccountProxy } from "../../../../src/features/account/account-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const POST = createAccountProxy({ method: "POST", path: "/v1/account/register", body: true });
