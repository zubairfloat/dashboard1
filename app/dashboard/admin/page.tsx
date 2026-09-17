import AdminUsers from "@/components/dashboard/admin-users";
import KycAdminSummary from "@/components/dashboard/kyc-admin-summary";
import { getAdminUsers, getKycSummary, getRequestTime } from "@/lib/dashboard-data";
export default async function AdminPage({ searchParams }: { searchParams: Promise<{ page?: string; search?: string; status?: string }> }) {
  const params = await searchParams;
  const page = Math.max(1, Math.min(100000, Math.floor(Number(params.page) || 1)));
  const search = (params.search || "").slice(0, 100);
  const status = ["all", "approved", "pending", "disabled"].includes(params.status || "") ? params.status! : "all";
  const [data, summary] = await Promise.all([getAdminUsers(page, search, status), getKycSummary()]);
  return <div className="space-y-8">{summary && <KycAdminSummary initialItems={summary.items} initialCount={summary.count} />}<AdminUsers users={data.users} stats={data.stats} totalCount={data.count} page={page} statusFilter={status} initialSearch={search} initialNow={getRequestTime()} /></div>;
}
