"use client";

import Link from "next/link";
import {
  LayoutDashboard,
  User,
  Package,
  Coins,
  Settings,
} from "lucide-react";

export default function Sidebar() {
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
              SaaS Dashboard
            </h2>

            <p className="text-xs text-blue-100/60">
              Admin Portal
            </p>
          </div>
        </div>
      </div>

      {/* Mobile Navigation */}
      <nav
        className="
          flex
          gap-2
          overflow-x-auto
          p-3

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
      <div className="hidden lg:block">
        <div className="absolute bottom-4 left-4 right-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-semibold text-blue-900">
              Z
            </div>

            <div>
              <p className="text-sm font-medium text-white">
                Zubair
              </p>

              <p className="text-xs text-blue-100/60">
                Administrator
              </p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}