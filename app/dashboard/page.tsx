import { redirect } from "next/navigation";
import { requireActiveAccount } from "@/lib/dashboard-data";
import { ActionButton, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { ArrowRight, Coins, Gauge, Gift, Wallet } from "lucide-react";

export default async function DashboardPage() {
  const { profile } = await requireActiveAccount();
  if (profile.is_admin) redirect("/dashboard/admin");
  if (!profile.is_approved) redirect("/dashboard/pending");

  const usedTokens = Math.max(profile.total_tokens - profile.remaining_tokens, 0);
  const usage =
    profile.total_tokens > 0
      ? Math.min(100, Math.round((usedTokens / profile.total_tokens) * 100))
      : 0;

  return (
    <div className="space-y-8">
      <div className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
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
        <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold text-white">
                Token Information
              </h2>
              <p className="mt-1 text-sm text-blue-100/60">
                Your current balance and token usage.
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
                className="h-full rounded-full bg-gradient-to-r from-cyan-200 to-teal-400"
                style={{ width: `${usage}%` }}
              />
            </div>
          </div>
        </section>

        <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
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

      <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
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
