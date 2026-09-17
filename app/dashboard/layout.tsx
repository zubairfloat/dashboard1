import "./workspace.css";
import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";
import KycNotice from "@/components/dashboard/kyc-notice";
import { KycProvider } from "@/components/dashboard/kyc-provider";
import { getKycState } from "@/lib/dashboard-data";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const state = await getKycState();
  return (
    <KycProvider initialState={state}>
      <div className="workspace min-h-screen">
        <div className="flex flex-col lg:flex-row">
          <Sidebar />
          <div className="flex min-w-0 flex-1 flex-col">
            <Navbar />
            <main className="workspace-content p-4 md:p-6 lg:p-8"><KycNotice />{children}</main>
          </div>
        </div>
      </div>
    </KycProvider>
  );
}
