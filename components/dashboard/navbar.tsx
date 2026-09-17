import { getAccount } from "@/lib/dashboard-data";
import LogoutButton from "@/components/dashboard/logout-button";
import Link from "next/link";
import { UserAvatar } from "@/components/dashboard/ui";

export default async function Navbar() {
  const { user } = await getAccount();

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  return (
    <header className="workspace-header">
      <div className="flex flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
        {/* Left */}
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-[.18em] text-cyan-100/65">Workspace</p>

          <p className="mt-1 truncate text-sm text-slate-400">
            Welcome back,
            <span className="ml-1 font-medium text-white">
              {userName}
            </span>
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-wrap items-center gap-3">
          <Link href="/dashboard/profile" aria-label="View your profile" className="workspace-account flex items-center gap-3 rounded-xl px-2 py-1">
            <UserAvatar name={userName} className="h-10 w-10" />

            <div className="hidden max-w-48 sm:block">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>

              <p className="truncate text-xs text-slate-400">
                {user?.email}
              </p>
            </div>
          </Link>

          <LogoutButton />
        </div>
      </div>
    </header>
  );
}
