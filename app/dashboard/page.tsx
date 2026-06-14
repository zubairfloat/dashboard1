"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState({
    username: "",
    assigned_tokens: 0,
    bonus_tokens: 0,
    total_tokens: 0,
    remaining_tokens: 0,
    current_rate: 0,
  });

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        router.push("/login");
        return;
      }

      const { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error || !profile) {
        router.push("/login");
        return;
      }

      // Super Admin
      if (profile.is_admin) {
        router.push("/dashboard/admin");
        return;
      }

      // Restricted User
      if (profile.is_deleted) {
        router.push("/dashboard/restricted");
        return;
      }

      // Pending User
      if (!profile.is_approved) {
        router.push("/dashboard/pending");
        return;
      }

      // Approved User
      setProfile({
        username: profile.username || "",
        assigned_tokens: profile.assigned_tokens || 0,
        bonus_tokens: profile.bonus_tokens || 0,
        total_tokens: profile.total_tokens || 0,
        remaining_tokens: profile.remaining_tokens || 0,
        current_rate: profile.current_rate || 0,
      });
      setLoading(false);
    };

    checkUser();
  }, [router]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="rounded-2xl border border-white/10 bg-white/5 px-8 py-6 text-white backdrop-blur-xl">
          Loading Dashboard...
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Welcome Back, {profile.username} 👋
        </h1>

        <p className="mt-2 text-blue-100/70">
          Here's an overview of your Axnetix platform.
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Assigned Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            {profile.assigned_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">Bonus Tokens</h3>

          <p className="mt-3 text-4xl font-bold text-white">
            {profile.bonus_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">Total Tokens</h3>

          <p className="mt-3 text-4xl font-bold text-white">
            {profile.total_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Remaining Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            {profile.remaining_tokens.toLocaleString()}
          </p>
        </div>
      </div>
      {/* Token Info */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          Token Information
        </h2>

        <div className="grid gap-6 md:grid-cols-2">
          <div>
            <p className="text-blue-100/60">Current Rate</p>

            <p className="mt-2 text-3xl font-bold text-white">
              {profile.current_rate}
            </p>
          </div>

          <div>
            <p className="text-blue-100/60">Available Balance</p>

            <p className="mt-2 text-3xl font-bold text-green-400">
              {profile.remaining_tokens.toLocaleString()}
            </p>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Recent Activity
        </h2>

        <p className="text-blue-100/60">No recent activity found.</p>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="mb-3 text-xl font-semibold text-white">Packages</h2>

          <p className="mb-6 text-blue-100/60">
            Manage subscriptions and package assignments.
          </p>

          <button className="rounded-xl bg-white px-5 py-3 font-medium text-blue-900">
            View Packages
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="mb-3 text-xl font-semibold text-white">Tokens</h2>

          <p className="mb-6 text-blue-100/60">
            Track usage and monitor token balances.
          </p>

          <button
            onClick={() => router.push("/dashboard/tokens")}
            className="cursor-pointer rounded-xl bg-white px-5 py-3 font-medium text-blue-900"
          >
            View Tokens
          </button>
        </div>
      </div>
    </div>
  );
}
