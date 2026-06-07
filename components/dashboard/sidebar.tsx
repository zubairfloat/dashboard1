"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  LayoutDashboard,
  User,
  Package,
  Coins,
  Settings,
} from "lucide-react";

interface UserData {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

export default function Sidebar() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user as UserData);
    }

    loadUser();
  }, []);

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <aside
      className="
        w-full
        border-b border-white/10
        bg-white/5
        backdrop-blur-xl

        lg:h-screen
        lg:w-72
        lg:border-b-0
        lg:border-r
        lg:sticky
        lg:top-0
        lg:flex
        lg:flex-col
      "
    >
      {/* Logo */}
      <div className="border-b border-white/10 p-4 lg:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white font-bold text-blue-900">
            S
          </div>

          <div>
            <h2 className="font-bold text-white">
              Axnetix Dashboard
            </h2>

            <p className="text-xs text-blue-100/60">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav
        className="
          flex
          gap-2
          overflow-x-auto
          p-3

          lg:flex-1
          lg:flex-col
          lg:overflow-visible
          lg:p-4
        "
      >
        <Link
          href="/dashboard"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        <Link
          href="/dashboard/profile"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <User size={18} />
          Profile
        </Link>

        <Link
          href="/dashboard/packages"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <Package size={18} />
          Packages
        </Link>

        <Link
          href="/dashboard/tokens"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <Coins size={18} />
          Tokens
        </Link>

        <Link
          href="/dashboard/settings"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </Link>
      </nav>

      {/* Desktop User Card */}
      <div className="hidden lg:block p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-semibold text-blue-900">
              {firstLetter}
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-white">
                {userName}
              </p>

              <p className="truncate text-xs text-blue-100/60">
                {user?.email}
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}