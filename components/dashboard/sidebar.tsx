"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import {
  Crown,
  LayoutDashboard,
  User,
  Package,
  Coins,
  Settings,
} from "lucide-react";
import { StatusBadge, UserAvatar } from "@/components/dashboard/ui";

interface UserData {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

interface ProfileData {
  is_admin?: boolean;
  is_approved?: boolean;
  package_name?: string | null;
  total_tokens?: number;
  remaining_tokens?: number;
}

export default function Sidebar() {
  const [user, setUser] = useState<UserData | null>(
    null
  );

  const [profile, setProfile] =
    useState<ProfileData | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      setUser(user as UserData);

      const { data: profileData } =
        await supabase
          .from("profiles")
          .select(
            `
            is_admin,
            is_approved,
            package_name,
            total_tokens,
            remaining_tokens
          `
          )
          .eq("id", user.id)
          .single();

      if (profileData) {
        setProfile(profileData);
      }
    }

    loadUser();
  }, []);

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
            A
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
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <LayoutDashboard size={18} />
          Dashboard
        </Link>

        {/* Profile */}
        <Link
          href="/dashboard/profile"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <User size={18} />
          Profile
        </Link>

        {/* Packages */}
        <div
          title={
            !hasPackage
              ? "No package assigned yet"
              : ""
          }
        >
          <Link
            href={
              hasPackage
                ? "/dashboard/packages"
                : "#"
            }
            className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 transition ${
              hasPackage
                ? "text-blue-100 hover:bg-white/10 hover:text-white"
                : "pointer-events-none cursor-not-allowed text-blue-100/40"
            }`}
          >
            <Package size={18} />
            Packages
          </Link>
        </div>

        {/* Tokens */}
        <div
          title={
            !hasTokens
              ? "No tokens assigned yet"
              : ""
          }
        >
          <Link
            href={
              hasTokens
                ? "/dashboard/tokens"
                : "#"
            }
            className={`flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 transition ${
              hasTokens
                ? "text-blue-100 hover:bg-white/10 hover:text-white"
                : "pointer-events-none cursor-not-allowed text-blue-100/40"
            }`}
          >
            <Coins size={18} />
            Tokens
          </Link>
        </div>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className="flex min-w-fit items-center gap-2 rounded-xl px-4 py-3 text-blue-100 transition hover:bg-white/10 hover:text-white"
        >
          <Settings size={18} />
          Settings
        </Link>

        {/* Super Admin */}
        {isAdmin && (
          <Link
            href="/dashboard/admin"
            className="flex min-w-fit items-center gap-2 rounded-xl bg-sky-500/10 px-4 py-3 text-sky-200 transition hover:bg-sky-500/20"
          >
            <Crown size={18} />
            Admin Panel
          </Link>
        )}
      </nav>

      {/* Desktop User Card */}
      <div className="hidden lg:block p-4">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
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
