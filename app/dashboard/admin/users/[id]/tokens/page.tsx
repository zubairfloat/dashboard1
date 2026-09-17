import TokenForm from "@/components/dashboard/forms/token-form";
import { getManagedProfile } from "@/lib/dashboard-data";
export default async function TokenPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <TokenForm initialProfile={await getManagedProfile(id)} />;
}
