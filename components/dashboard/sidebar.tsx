import Link from "next/link";
import { getAccount } from "@/lib/dashboard-data";
import Navigation from "./navigation";
import { StatusBadge, UserAvatar } from "@/components/dashboard/ui";

export default async function Sidebar() {
  const { user, profile } = await getAccount();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const isAdmin =
    profile?.is_admin ?? false;

  const hasPackage =
    isAdmin ||
    !!profile?.package_name;

  const hasTokens =
    isAdmin ||
    (profile?.remaining_tokens ?? 0) > 0;

  return (
    <aside className="workspace-sidebar">
      <Link href={isAdmin ? "/dashboard/admin" : "/dashboard"} className="workspace-brand"><span>A</span><div>Axnetix<span className="workspace-brand-dot">.</span><p>{isAdmin ? "ADMIN WORKSPACE" : "YOUR WORKSPACE"}</p></div></Link>
      <p className="workspace-nav-caption">WORKSPACE</p>
      <Navigation isAdmin={isAdmin} hasPackage={hasPackage} hasTokens={hasTokens} />

      {/* Desktop User Card */}
      <div className="hidden lg:block p-4">
        <div className="workspace-panel rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <UserAvatar name={userName} className="h-10 w-10" />

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>

              <p className="truncate text-xs text-blue-100/60">
                {user?.email}
              </p>

              {isAdmin ? (
                <div className="mt-2">
                  <StatusBadge status="admin" label="Super Admin" />
                </div>
              ) : profile?.is_approved ? (
                <div className="mt-2">
                  <StatusBadge status="approved" label="Approved" />
                </div>
              ) : (
                <div className="mt-2">
                  <StatusBadge status="pending" label="Pending" />
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
