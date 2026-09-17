import SettingsForm from "@/components/dashboard/forms/settings-form";
import { requireActiveAccount } from "@/lib/dashboard-data";
export default async function SettingsPage() {
  const { user, profile } = await requireActiveAccount();
  return <SettingsForm initialName={profile.full_name || ""} initialEmail={user.email || ""} />;
}
