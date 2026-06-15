"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ApprovalTimePage() {
  const params = useParams();
  const router = useRouter();

  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [username, setUsername] = useState("");
  const [approvalDeadline, setApprovalDeadline] = useState("");

  const [deadline, setDeadline] = useState("");
  const [remainingTime, setRemainingTime] = useState("");

  useEffect(() => {
    loadUser();
  }, []);

  const calculateRemainingTime = (deadline: string) => {
    const diff = new Date(deadline).getTime() - Date.now();

    if (diff <= 0) {
      return "Expired";
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));

    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    return `${days}d ${hours}h ${minutes}m`;
  };

  const loadUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(
        `
      username,
      approval_deadline,
      is_approved
    `,
      )
      .eq("id", userId)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setUsername(data.username || "");

      if (data.approval_deadline) {
        setDeadline(data.approval_deadline);

        setApprovalDeadline(
          new Date(data.approval_deadline).toISOString().slice(0, 16),
        );
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const diff = new Date(deadline).getTime() - Date.now();

      if (diff <= 0) {
        setRemainingTime("Expired");
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));

      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );

      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setRemainingTime(`${days}d ${hours}h ${minutes}m ${seconds}s`);
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  const updateDeadline = async () => {
    if (!approvalDeadline) {
      alert("Please select a date and time.");
      return;
    }

    const newDeadline = new Date(approvalDeadline).toISOString();

    const { error } = await supabase
      .from("profiles")
      .update({
        approval_deadline: newDeadline,
      })
      .eq("id", userId);

    if (error) {
      alert(error.message);
      return;
    }

    setDeadline(newDeadline);

    alert("Approval deadline updated successfully");
  };

  const addHours = (hours: number) => {
    const current = approvalDeadline ? new Date(approvalDeadline) : new Date();

    current.setHours(current.getHours() + hours);

    setApprovalDeadline(current.toISOString().slice(0, 16));
  };

  if (loading) {
    return <div className="p-8 text-white">Loading...</div>;
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">Approval Deadline</h1>

        <p className="mt-2 text-blue-100/70">Manage user approval countdown.</p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="space-y-8">
          <div>
            <h2 className="text-xl font-semibold text-white">User</h2>

            <p className="mt-2 text-blue-100/70">{username}</p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm text-blue-100/60">Current Remaining</h3>

              <p className="mt-3 text-3xl font-bold text-white">
                {remainingTime || "Not Set"}
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <h3 className="text-sm text-blue-100/60">Status</h3>

              <p className="mt-3 text-3xl font-bold text-yellow-400">Pending</p>
            </div>
          </div>

          <div>
            <label className="mb-3 block text-white">Approval Deadline</label>

            <input
              type="datetime-local"
              value={approvalDeadline}
              onChange={(e) => setApprovalDeadline(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/10 p-4 text-white outline-none"
            />
          </div>

          <div>
            <p className="mb-4 text-white">Quick Actions</p>

            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => addHours(24)}
                className="rounded-xl bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700"
              >
                +24 Hours
              </button>

              <button
                onClick={() => addHours(72)}
                className="rounded-xl bg-indigo-600 px-4 py-2 text-white transition hover:bg-indigo-700"
              >
                +3 Days
              </button>

              <button
                onClick={() => addHours(168)}
                className="rounded-xl bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700"
              >
                +7 Days
              </button>

              <button
                onClick={() => addHours(720)}
                className="rounded-xl bg-pink-600 px-4 py-2 text-white transition hover:bg-pink-700"
              >
                +30 Days
              </button>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              onClick={updateDeadline}
              disabled={saving}
              className="rounded-xl bg-green-600 px-6 py-3 text-white transition hover:bg-green-700 disabled:opacity-50"
            >
              {saving ? "Saving..." : "Update Deadline"}
            </button>

            <button
              onClick={() => router.push("/dashboard/admin")}
              className="rounded-xl bg-white/10 px-6 py-3 text-white transition hover:bg-white/20"
            >
              Back
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
