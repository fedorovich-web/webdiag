import { createAccountProxy } from "../../../../src/features/account/account-proxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const GET = createAccountProxy({ method: "GET", path: "/v1/account/sessions", body: false });
