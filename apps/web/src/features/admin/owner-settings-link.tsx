
import { adminPath } from "./admin-routing";
import { ownerAccessStatus } from "./owner-access";

export async function OwnerSettingsLink({ locale }: { locale: "ru" | "en" }) {
  if (await ownerAccessStatus() !== 200) return null;
  return <a className="wd-button wd-button-secondary" href={adminPath(locale)}>
    {locale === "ru" ? "Кабинет владельца" : "Owner dashboard"}
  </a>;
}
