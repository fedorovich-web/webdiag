
import { headers } from "next/headers";
import { readAdminUpstream } from "./admin-upstream";

export async function ownerAccessStatus(): Promise<number> {
  const access = await readAdminUpstream("access", await headers());
  await access.body?.cancel().catch(() => {});
  return access.status;
}
