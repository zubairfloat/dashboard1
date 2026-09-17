import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/dashboard-data";
import PersonalKycForm from "@/components/dashboard/forms/kyc-form";
export default async function KycPage() {
  const { profile } = await requireActiveAccount();
  if (profile.is_admin) redirect("/dashboard/admin");
  return <PersonalKycForm />;
}
