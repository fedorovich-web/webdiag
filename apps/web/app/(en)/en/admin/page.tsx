
import type { Metadata } from "next";
import { OwnerPage, ownerMetadata } from "../../../../src/features/admin/owner-page";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { ...ownerMetadata, title: "Owner dashboard" };

export default function Page() {
  return <OwnerPage locale="en" />;
}
