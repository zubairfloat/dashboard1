"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import { sendApprovalEmail } from "@/lib/email/sendApprovalEmail";

export default function TokenPage() {
  const params = useParams();
  const router = useRouter();

  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [isApproved, setIsApproved] =
  useState(false);

  const [purchaseAmount, setPurchaseAmount] = useState<string>("");

  const [bonusTokens, setBonusTokens] = useState<string>("");

  const [currentRate, setCurrentRate] = useState<number>(0.1);

  const [assignedTokens, setAssignedTokens] = useState<number>(0);

  const [totalTokens, setTotalTokens] = useState<number>(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadUser();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const amount = Number(purchaseAmount || 0);

    const bonus = Number(bonusTokens || 0);

    const calculatedAssigned =
      amount > 0 ? Math.floor(amount / currentRate) : 0;

    const calculatedTotal = calculatedAssigned + bonus;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setAssignedTokens(calculatedAssigned);

    setTotalTokens(calculatedTotal);
  }, [purchaseAmount, bonusTokens, currentRate]);

  const loadUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

if (data) {
  setUsername(data.username || "");

  setIsApproved(
    data.is_approved || false
  );

  setPurchaseAmount(
    data.purchase_amount
      ? String(data.purchase_amount)
      : ""
  );

  setBonusTokens(
    data.bonus_tokens
      ? String(data.bonus_tokens)
      : ""
  );

  setCurrentRate(
    data.current_rate || 0.1
  );
}
    setLoading(false);
  };

  const saveTokens = async () => {
    if (currentRate <= 0) {
      alert("Current Rate must be greater than 0");
      return;
    }
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

    if (error) {
      alert(error.message);
      return;
    }

    alert("Tokens saved successfully");
  };

const approveUser = async () => {
  if (totalTokens <= 0) {
    alert(
      "Please assign tokens before approving the user."
    );
    return;
  }

  const { data: userProfile, error: profileError } =
    await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", userId)
      .single();

  if (profileError || !userProfile) {
    alert("User not found");
    return;
  }

  const { error } = await supabase
    .from("profiles")
    .update({
      is_approved: true,
      approved_at: new Date().toISOString(),
    })
    .eq("id", userId);

  if (error) {
    alert(error.message);
    return;
  }

  try {
    await sendApprovalEmail(
      userProfile.email,
      userProfile.username
    );
  } catch (err) {
    console.error(
      "Failed to send approval email:",
      err
    );
  }

  alert(
    `User approved successfully. Email sent to ${userProfile.email}`
  );
   setIsApproved(true);

  setTimeout(() => {
  router.push("/dashboard/admin");
}, 1000);
};

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="mb-2 text-4xl font-bold text-white">Assign Tokens</h1>

      <p className="mb-8 text-blue-100/70">User: {username}</p>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8">
        <div className="space-y-6">
          {/* Purchase Amount */}

          <div>
            <label className="mb-2 block text-white">Purchase Amount ($)</label>

            <input
              type="number"
              placeholder="Enter purchase amount"
              value={purchaseAmount}
              onChange={(e) => setPurchaseAmount(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-white/40"
            />
          </div>

          {/* Current Rate */}

          <div>
            <label className="mb-2 block text-white">Current Rate</label>

            <input
              type="number"
              step="0.01"
              min="0.01"
              value={currentRate}
              onChange={(e) => setCurrentRate(Number(e.target.value))}
              className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white"
            />
          </div>

          {/* Assigned Tokens */}

          <div>
            <label className="mb-2 block text-white">Assigned Tokens</label>

            <input
              value={assignedTokens}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
            />
          </div>

          {/* Bonus Tokens */}

          <div>
            <label className="mb-2 block text-white">Bonus Tokens</label>

            <input
              type="number"
              placeholder="Enter bonus tokens"
              value={bonusTokens}
              onChange={(e) => setBonusTokens(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-white/40"
            />
          </div>

          {/* Total Tokens */}

          <div>
            <label className="mb-2 block text-white">Total Tokens</label>

            <input
              value={totalTokens}
              readOnly
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white"
            />
          </div>

          {/* Actions */}

     <div className="flex gap-4">
  <button
    onClick={saveTokens}
    className="rounded-xl bg-blue-600 px-6 py-3 text-white transition hover:bg-blue-700"
  >
    Save Tokens
  </button>

  {!isApproved ? (
    <button
      onClick={approveUser}
      className="rounded-xl bg-green-600 px-6 py-3 text-white transition hover:bg-green-700"
    >
      Approve User
    </button>
  ) : (
    <div className="rounded-xl bg-emerald-700 px-6 py-3 text-white">
      ✓ User Already Approved
    </div>
  )}
</div>
        </div>
      </div>
    </div>
  );
}
