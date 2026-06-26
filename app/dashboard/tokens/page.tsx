"use client";

import { useEffect, useState } from "react";
import { Coins, Gauge, Gift, Wallet, Zap } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ActionButton, LoadingCard, StatCard, StatusBadge } from "@/components/dashboard/ui";

interface TokenData {
  assigned_tokens: number;
  bonus_tokens: number;
  total_tokens: number;
  remaining_tokens: number;
  current_rate: number;
  is_approved: boolean;
}

export default function TokensPage() {
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [tokenData, setTokenData] = useState<TokenData>({
    assigned_tokens: 0,
    bonus_tokens: 0,
    total_tokens: 0,
    remaining_tokens: 0,
    current_rate: 0,
    is_approved: false,
  });

  useEffect(() => {
    loadTokens();
  }, []);

  const loadTokens = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
        assigned_tokens,
        bonus_tokens,
        total_tokens,
        remaining_tokens,
        current_rate,
        is_approved
      `,
      )
      .eq("id", user.id)
      .single();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    if (data) {
      setTokenData({
        assigned_tokens: data.assigned_tokens || 0,
        bonus_tokens: data.bonus_tokens || 0,
        total_tokens: data.total_tokens || 0,
        remaining_tokens: data.remaining_tokens || 0,
        current_rate: data.current_rate || 0,
        is_approved: Boolean(data.is_approved),
      });
    }

    setLoading(false);
  };

  const usedTokens = Math.max(
    tokenData.total_tokens - tokenData.remaining_tokens,
    0,
  );
  const usagePercentage =
    tokenData.total_tokens > 0
      ? Math.min(100, (usedTokens / tokenData.total_tokens) * 100)
      : 0;

  if (loading) {
    return <LoadingCard label="Loading tokens..." />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <StatusBadge
          status={tokenData.is_approved ? "approved" : "pending"}
          label={tokenData.is_approved ? "Approved account" : "Pending approval"}
        />
        <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
          Tokens
        </h1>
        <p className="mt-2 max-w-2xl text-blue-100/70">
          Monitor assigned, bonus, total, and remaining token balances from your
          profile.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-rose-100">
          {message}
        </div>
      )}

      {!tokenData.is_approved && (
        <div className="rounded-2xl border border-amber-300/25 bg-amber-400/10 p-5 text-amber-100">
          <h3 className="font-semibold">Account Pending Approval</h3>
          <p className="mt-2 text-sm text-amber-100/80">
            Token features become available once an administrator approves your
            account.
          </p>
        </div>
      )}

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          title="Assigned"
          value={tokenData.assigned_tokens.toLocaleString()}
          icon={Coins}
        />
        <StatCard
          title="Bonus"
          value={tokenData.bonus_tokens.toLocaleString()}
          icon={Gift}
          tone="violet"
        />
        <StatCard
          title="Total"
          value={tokenData.total_tokens.toLocaleString()}
          icon={Wallet}
          tone="green"
        />
        <StatCard
          title="Remaining"
          value={tokenData.remaining_tokens.toLocaleString()}
          icon={Gauge}
          tone="amber"
        />
        <StatCard
          title="Current Rate"
          value={tokenData.current_rate || 0}
          icon={Zap}
          tone="blue"
        />
      </div>

      <section
        className={`rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl transition ${
          !tokenData.is_approved ? "opacity-60" : ""
        }`}
      >
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Token Usage</h2>
            <p className="mt-1 text-sm text-blue-100/60">
              {usedTokens.toLocaleString()} of{" "}
              {tokenData.total_tokens.toLocaleString()} tokens used.
            </p>
          </div>
          <span className="text-2xl font-bold text-white">
            {usagePercentage.toFixed(1)}%
          </span>
        </div>

        <div className="mt-5 h-4 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-sky-300 to-indigo-300"
            style={{ width: `${usagePercentage}%` }}
          />
        </div>
      </section>

      <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-semibold text-white">Recent Activity</h2>
            <p className="mt-1 text-sm text-blue-100/60">
              Token activity will appear here when usage records are available.
            </p>
          </div>
          <ActionButton disabled={!tokenData.is_approved} tone="primary">
            Buy Tokens
          </ActionButton>
        </div>

        <div className="mt-6 rounded-xl border border-white/10 bg-white/5 p-8 text-center text-blue-100/60">
          {!tokenData.is_approved
            ? "Your account is awaiting approval."
            : "No token activity found."}
        </div>
      </section>
    </div>
  );
}
