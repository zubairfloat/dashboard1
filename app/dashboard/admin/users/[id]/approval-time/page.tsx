"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase/client";

export default function ApprovalTimePage() {
  const params = useParams();

  const userId = params.id as string;

  const [loading, setLoading] = useState(true);

  const [username, setUsername] = useState("");

  const [deadline, setDeadline] = useState("");

  const [remainingTime, setRemainingTime] = useState("");

  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    loadUser();
  }, []);

  const loadUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select(`
        username,
        approval_deadline,
        is_approved
      `)
      .eq("id", userId)
      .single();

    if (error) {
      alert(error.message);
      return;
    }

    if (data) {
      setUsername(data.username || "");

      setIsApproved(data.is_approved);

      if (data.approval_deadline) {
        setDeadline(data.approval_deadline);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    if (!deadline) return;

    const interval = setInterval(() => {
      const diff =
        new Date(deadline).getTime() -
        Date.now();

      if (diff <= 0) {
        setRemainingTime("Expired");
        return;
      }

      const days = Math.floor(
        diff / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (diff %
          (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (diff %
          (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
      );

      setRemainingTime(
        `${days}d ${hours}h ${minutes}m ${seconds}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading...
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-white">
          Approval Status
        </h1>

        <p className="mt-2 text-blue-100/70">
          View user approval countdown.
        </p>
      </div>

      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="space-y-6">
          <div>
            <p className="text-sm text-blue-100/60">
              Username
            </p>

            <h2 className="mt-2 text-2xl font-bold text-white">
              {username}
            </h2>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-blue-100/60">
                Remaining Time
              </p>

              <h3 className="mt-3 text-3xl font-bold text-white">
                {remainingTime || "Not Set"}
              </h3>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
              <p className="text-sm text-blue-100/60">
                Status
              </p>

              <h3
                className={`mt-3 text-3xl font-bold ${
                  isApproved
                    ? "text-green-400"
                    : "text-yellow-400"
                }`}
              >
                {isApproved
                  ? "Approved"
                  : "Pending"}
              </h3>
            </div>
          </div>

          {!isApproved && (
            <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-200">
              This user is currently waiting
              for approval.
            </div>
          )}

          {isApproved && (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-4 text-green-200">
              This user account has been
              approved.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}