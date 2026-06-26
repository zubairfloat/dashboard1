"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { ActionButton, LoadingCard, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { ArrowRight, Coins, Gauge, Gift, Wallet } from "lucide-react";

interface DashboardProfile {
  username: string;
  assigned_tokens: number;
  bonus_tokens: number;
  total_tokens: number;
  remaining_tokens: number;
  current_rate: number;
}

export default function DashboardPage() {
  const router = useRouter();

  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState("");

  const [profile, setProfile] = useState<DashboardProfile>({
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

      let { data: profile, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      if (!profile) {
        const usernameBase =
          user.email?.split("@")[0] ||
          user.user_metadata?.full_name ||
          user.user_metadata?.name ||
          "user";
        const safeUsernameBase =
          usernameBase.replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24) || "user";
        const username = `${safeUsernameBase}_${user.id.slice(0, 6)}`;

        const approvalDeadline = new Date(
          Date.now() + 72 * 60 * 60 * 1000,
        ).toISOString();

        const { data: insertedProfile, error: insertError } = await supabase
          .from("profiles")
          .upsert({
            id: user.id,
            username,
            email: user.email || "",
            is_approved: false,
            approval_deadline: approvalDeadline,
          })
          .select("*")
          .single();

        if (insertError || !insertedProfile) {
          setErrorMessage(
            insertError?.message || "Unable to prepare your dashboard profile.",
          );
          setLoading(false);
          return;
        }

        profile = insertedProfile;
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
    return <LoadingCard label="Loading dashboard..." />;
  }

  if (errorMessage) {
    return (
      <div className="rounded-2xl border border-rose-400/25 bg-rose-500/10 p-6 text-rose-100">
        {errorMessage}
      </div>
    );
  }

  const usedTokens = Math.max(profile.total_tokens - profile.remaining_tokens, 0);
  const usage =
    profile.total_tokens > 0
      ? Math.min(100, Math.round((usedTokens / profile.total_tokens) * 100))
      : 0;

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
          <div>
            <StatusBadge status="active" label="Approved workspace" />
            <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
              Welcome back, {profile.username}
            </h1>
            <p className="mt-2 max-w-2xl text-blue-100/70">
              Your token balance, account capacity, and quick actions are ready
              from one clean workspace.
            </p>
          </div>

          <ActionButton href="/dashboard/tokens" tone="primary" className="gap-2">
            View Tokens <ArrowRight size={16} />
          </ActionButton>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="Assigned Tokens"
          value={profile.assigned_tokens.toLocaleString()}
          icon={Coins}
          tone="blue"
        />
        <StatCard
          title="Bonus Tokens"
          value={profile.bonus_tokens.toLocaleString()}
          icon={Gift}
          tone="violet"
        />
        <StatCard
          title="Total Tokens"
          value={profile.total_tokens.toLocaleString()}
          icon={Wallet}
          tone="green"
        />
        <StatCard
          title="Remaining Tokens"
          value={profile.remaining_tokens.toLocaleString()}
          icon={Gauge}
          tone="amber"
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Token Information
              </h2>
              <p className="mt-1 text-sm text-blue-100/60">
                Live values from your Supabase profile.
              </p>
            </div>
            <span className="rounded-full border border-white/10 bg-white/10 px-3 py-1 text-sm font-semibold text-blue-100">
              Rate {profile.current_rate || 0}
            </span>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            <InfoTile label="Current Rate" value={profile.current_rate || 0} />
            <InfoTile
              label="Used Tokens"
              value={usedTokens.toLocaleString()}
            />
            <InfoTile
              label="Available Balance"
              value={profile.remaining_tokens.toLocaleString()}
              valueClassName="text-emerald-300"
            />
          </div>

          <div className="mt-6">
            <div className="mb-2 flex justify-between text-sm">
              <span className="text-blue-100/65">Usage</span>
              <span className="font-semibold text-white">{usage}%</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-300"
                style={{ width: `${usage}%` }}
              />
            </div>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <h2 className="text-xl font-semibold text-white">Quick Actions</h2>
          <div className="mt-5 space-y-3">
            <ActionButton href="/dashboard/tokens" tone="neutral" className="w-full justify-between">
              Track token balance <ArrowRight size={16} />
            </ActionButton>
            <ActionButton href="/dashboard/profile" tone="neutral" className="w-full justify-between">
              Review profile <ArrowRight size={16} />
            </ActionButton>
            <ActionButton href="/dashboard/settings" tone="neutral" className="w-full justify-between">
              Account settings <ArrowRight size={16} />
            </ActionButton>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-blue-100/60">
              Activity history will appear here as token events are recorded.
            </p>
          </div>
          <StatusBadge status="pending" label="No activity yet" />
        </div>
      </section>
    </div>
  );
}

function InfoTile({
  label,
  value,
  valueClassName,
}: {
  label: string;
  value: string | number;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-4">
      <p className="text-sm text-blue-100/60">{label}</p>
      <p className={`mt-2 text-2xl font-bold text-white ${valueClassName || ""}`}>
        {value}
      </p>
    </div>
  );
}
