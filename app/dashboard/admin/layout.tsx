import { requireAdmin } from "@/lib/dashboard-data";
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAdmin();
  return children;
}
