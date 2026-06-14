"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

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

  const [tokenData, setTokenData] = useState<TokenData>({
    assigned_tokens: 0,
    bonus_tokens: 0,
    total_tokens: 0,
    remaining_tokens: 0,
    current_rate: 0,
    is_approved: false,
  });

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
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
      console.error(error);
      setLoading(false);
      return;
    }

    if (data) {
      setTokenData(data);
    }

    setLoading(false);
  };

  const usedTokens = tokenData.total_tokens - tokenData.remaining_tokens;

  const usagePercentage =
    tokenData.total_tokens > 0
      ? ((usedTokens / tokenData.total_tokens) * 100).toFixed(1)
      : "0";

  if (loading) {
    return <div className="p-8 text-white">Loading Tokens...</div>;
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">Tokens</h1>

        <p className="mt-2 text-blue-100/70">
          Monitor token usage, balances and consumption.
        </p>
      </div>
      {!tokenData.is_approved && (
        <div className="mb-8 rounded-2xl border border-yellow-500/30 bg-yellow-500/10 p-5">
          <h3 className="text-lg font-semibold text-yellow-300">
            Account Pending Approval
          </h3>

          <p className="mt-2 text-yellow-100/80">
            Your account is currently under review by the administrator. Token
            features will become available once your account has been approved.
          </p>
        </div>
      )}

      {/* Token Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-6">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Assigned Tokens</h3>

          <p className="mt-3 text-3xl font-bold text-white">
            {tokenData.assigned_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Bonus Tokens</h3>

          <p className="mt-3 text-3xl font-bold text-white">
            {tokenData.bonus_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Total Tokens</h3>

          <p className="mt-3 text-3xl font-bold text-white">
            {tokenData.total_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Remaining Tokens</h3>

          <p className="mt-3 text-3xl font-bold text-white">
            {tokenData.remaining_tokens.toLocaleString()}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Current Rate</h3>

          <p className="mt-3 text-3xl font-bold text-white">
            {tokenData.current_rate}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-sm text-blue-100/60">Account Status</h3>

          <p
            className={`mt-3 text-3xl font-bold ${
              tokenData.is_approved ? "text-green-400" : "text-yellow-400"
            }`}
          >
            {tokenData.is_approved ? "Approved" : "Pending"}
          </p>
        </div>
      </div>

      {/* Usage */}
      <div
        className={`mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 transition ${
          !tokenData.is_approved ? "pointer-events-none opacity-50" : ""
        }`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Token Usage</h2>

          <span className="text-blue-100/70">{usagePercentage}%</span>
        </div>

        <div className="h-4 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-white transition-all"
            style={{
              width: `${usagePercentage}%`,
            }}
          />
        </div>

        <p className="mt-4 text-sm text-blue-100/60">
          {usedTokens.toLocaleString()} of{" "}
          {tokenData.total_tokens.toLocaleString()} tokens have been used.
        </p>
      </div>

      {/* Activity */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Recent Activity</h2>

          <button
            disabled={!tokenData.is_approved}
            className={`rounded-xl px-5 py-2 font-medium transition ${
              tokenData.is_approved
                ? "bg-white text-blue-900 hover:bg-slate-200"
                : "cursor-not-allowed bg-gray-500 text-gray-300"
            }`}
          >
            Buy Tokens
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/10 text-left">
                <th className="pb-4 text-blue-100/60">Date</th>

                <th className="pb-4 text-blue-100/60">Activity</th>

                <th className="pb-4 text-blue-100/60">Tokens</th>

                <th className="pb-4 text-blue-100/60">Status</th>
              </tr>
            </thead>

            <tbody>
              <tr>
                <td colSpan={4} className="py-8 text-center text-blue-100/60">
                  {!tokenData.is_approved
                    ? "Your account is awaiting approval."
                    : "No token activity found."}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
