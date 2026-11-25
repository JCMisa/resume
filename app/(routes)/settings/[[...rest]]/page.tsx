import { getUserBillingStatus } from "@/lib/actions/billing";
import SettingsClientLayout from "./_components/SettingsClientLayout";

export const metadata = {
  title: "Settings",
};

export default async function SettingsPage() {
  // 🚀 Fetch live count analytics completely on the server thread before rendering
  const billingData = await getUserBillingStatus();

  return <SettingsClientLayout billingData={billingData} />;
}
