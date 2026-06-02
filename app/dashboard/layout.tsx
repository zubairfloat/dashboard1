import Sidebar from "@/components/dashboard/sidebar";
import Navbar from "@/components/dashboard/navbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-950">
      <div className="flex flex-col lg:flex-row">
        <Sidebar />

        <div className="flex min-w-0 flex-1 flex-col">
          <Navbar />

          <main className="p-4 md:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}