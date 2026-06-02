"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        router.push("/login");
      }
    };

    checkUser();
  }, [router]);

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Welcome Back 👋
        </h1>

        <p className="mt-2 text-blue-100/70">
          Here's an overview of your SaaS platform.
        </p>
      </div>

      {/* Stats */}
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Total Packages
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            12
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Active Packages
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            8
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Total Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            10,000
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <h3 className="text-sm font-medium text-blue-100/60">
            Remaining Tokens
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            7,250
          </p>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-4 text-2xl font-semibold text-white">
          Recent Activity
        </h2>

        <p className="text-blue-100/60">
          No recent activity found.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Packages
          </h2>

          <p className="mb-6 text-blue-100/60">
            Manage subscriptions and package assignments.
          </p>

          <button className="rounded-xl bg-white px-5 py-3 font-medium text-blue-900">
            View Packages
          </button>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Tokens
          </h2>

          <p className="mb-6 text-blue-100/60">
            Track usage and monitor token balances.
          </p>

          <button className="rounded-xl bg-white px-5 py-3 font-medium text-blue-900">
            View Tokens
          </button>
        </div>
      </div>
    </div>
  );
}