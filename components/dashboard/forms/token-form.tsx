"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { sendApprovalEmail } from "@/lib/email/sendApprovalEmail";
import { supabase } from "@/lib/supabase/client";
import { ActionButton, StatCard, StatusBadge } from "@/components/dashboard/ui";
import { Calculator, Coins, Gift, Wallet } from "lucide-react";

import type { DashboardProfile } from "@/lib/dashboard-types";

export default function TokenForm({ initialProfile }: { initialProfile: DashboardProfile }) {
  const router = useRouter();
  const userId = initialProfile.id;

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const username = initialProfile.username || "";
  const email = initialProfile.email || "";
  const [isApproved, setIsApproved] = useState(Boolean(initialProfile.is_approved));
  const [purchaseAmount, setPurchaseAmount] = useState(String(initialProfile.purchase_amount || ""));
  const [bonusTokens, setBonusTokens] = useState(String(initialProfile.bonus_tokens || ""));
  const [currentRate, setCurrentRate] = useState(initialProfile.current_rate || 0.1);

  const assignedTokens =
    Number(purchaseAmount || 0) > 0 && currentRate > 0
      ? Math.floor(Number(purchaseAmount || 0) / currentRate)
      : 0;
  const totalTokens = assignedTokens + Number(bonusTokens || 0);

  const saveTokens = async () => {
    setMessage("");

    if (currentRate <= 0) {
      setMessage("Current rate must be greater than 0.");
      return false;
    }

    setSaving(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        purchase_amount: Number(purchaseAmount || 0),
        current_rate: currentRate,
        assigned_tokens: assignedTokens,
        bonus_tokens: Number(bonusTokens || 0),
        total_tokens: totalTokens,
        remaining_tokens: totalTokens,
      })
      .eq("id", userId);

    setSaving(false);

    if (error) {
      setMessage(error.message);
      return false;
    }

    setMessage("Tokens saved successfully.");
    return true;
  };

  const approveUser = async () => {
    setMessage("");

    if (assignedTokens <= 0 || totalTokens <= 0) {
      setMessage("Please assign tokens before approving the user.");
      return;
    }

    const saved = await saveTokens();
    if (!saved) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", userId);

    if (error) {
      setMessage(error.message);
      return;
    }

    try {
      await sendApprovalEmail(email, username || "User");
      setMessage(`User approved successfully. Email sent to ${email}.`);
    } catch (err) {
      console.error("Failed to send approval email:", err);
      setMessage("User approved, but the approval email could not be sent.");
    }

    setIsApproved(true);
    setTimeout(() => {
      router.push("/dashboard/admin");
    }, 1000);
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <StatusBadge
          status={isApproved ? "approved" : "pending"}
          label={isApproved ? "Approved user" : "Pending approval"}
        />
        <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
          Assign Tokens
        </h1>
        <p className="mt-2 text-blue-100/70">
          Configure purchase amount, current rate, and bonus tokens for{" "}
          <span className="font-semibold text-white">{username || email}</span>.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <StatCard
          title="Assigned Tokens"
          value={assignedTokens.toLocaleString("en-US")}
          icon={Coins}
        />
        <StatCard
          title="Bonus Tokens"
          value={Number(bonusTokens || 0).toLocaleString("en-US")}
          icon={Gift}
          tone="violet"
        />
        <StatCard
          title="Total Tokens"
          value={totalTokens.toLocaleString("en-US")}
          icon={Wallet}
          tone="green"
        />
      </div>

      <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-200">
            <Calculator size={20} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-white">
              Token Calculator
            </h2>
            <p className="text-sm text-blue-100/60">
              Assigned tokens are calculated as purchase amount divided by the
              current rate.
            </p>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Purchase Amount ($)">
            <input
              type="number"
              min="0"
              placeholder="Enter purchase amount"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
            />
          </Field>

          <Field label="Current Rate">
            <input
              type="number"
              step="0.01"
              min="0.01"
              value={currentRate}
              onChange={(e) => setCurrentRate(Number(e.target.value))}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white outline-none transition focus:border-blue-300/60 focus:bg-white/10"
            />
          </Field>

          <Field label="Assigned Tokens">
            <input
              value={assignedTokens}
              readOnly
              className="h-12 w-full rounded-xl border border-white/10 bg-white/[0.03] px-4 text-blue-100 outline-none"
            />
          </Field>

          <Field label="Bonus Tokens">
            <input
              type="number"
              min="0"
              placeholder="Enter bonus tokens"
              value={bonusTokens}
              onChange={(e) => setBonusTokens(e.target.value)}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
            />
          </Field>
        </div>

        {message && (
          <div className="mt-6 rounded-xl border border-blue-300/20 bg-blue-400/10 p-3 text-sm text-blue-100">
            {message}
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <ActionButton
            tone="primary"
            onClick={saveTokens}
            disabled={saving}
            className="sm:min-w-36"
          >
            {saving ? "Saving..." : "Save Tokens"}
          </ActionButton>

          {!isApproved ? (
            <ActionButton tone="success" onClick={approveUser}>
              Approve User
            </ActionButton>
          ) : (
            <StatusBadge status="approved" label="User already approved" />
          )}
        </div>
      </section>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-blue-100/70">
        {label}
      </span>
      {children}
    </label>
  );
}
