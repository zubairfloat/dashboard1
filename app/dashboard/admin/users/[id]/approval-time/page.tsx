"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { useParams } from "next/navigation";
import { Clock3, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { LoadingCard, StatusBadge } from "@/components/dashboard/ui";

export default function ApprovalTimePage() {
  const params = useParams();
  const userId = params.id as string;

  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [username, setUsername] = useState("");
  const [deadline, setDeadline] = useState("");
  const [remainingTime, setRemainingTime] = useState("Not set");
  const [isApproved, setIsApproved] = useState(false);

  useEffect(() => {
    loadUser();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const loadUser = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("username, approval_deadline, is_approved")
      .eq("id", userId)
      .single();

    if (error) {
      setMessage(error.message);
      setLoading(false);
      return;
    }

    setUsername(data.username || "");
    setIsApproved(Boolean(data.is_approved));
    setDeadline(data.approval_deadline || "");
    setLoading(false);
  };

  useEffect(() => {
    if (!deadline) {
      setRemainingTime("Not set");
      return;
    }

    const updateRemaining = () => {
      const diff = new Date(deadline).getTime() - Date.now();

      if (Number.isNaN(diff)) {
        setRemainingTime("Invalid date");
        return;
      }

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
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (loading) {
    return <LoadingCard label="Loading approval status..." />;
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <StatusBadge
          status={isApproved ? "approved" : "pending"}
          label={isApproved ? "Approved" : "Pending approval"}
        />
        <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
          Approval Status
        </h1>
        <p className="mt-2 text-blue-100/70">
          View the stored approval countdown for this user.
        </p>
      </div>

      {message && (
        <div className="rounded-xl border border-rose-300/25 bg-rose-500/10 p-4 text-rose-100">
          {message}
        </div>
      )}

      <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="grid gap-5 md:grid-cols-3">
          <InfoCard icon={UserRound} label="Username" value={username || "User"} />
          <InfoCard icon={Clock3} label="Remaining Time" value={remainingTime} />
          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <p className="text-sm text-blue-100/60">Status</p>
            <div className="mt-3">
              <StatusBadge
                status={isApproved ? "approved" : "pending"}
                label={isApproved ? "Approved" : "Pending"}
              />
            </div>
          </div>
        </div>

        <div className="mt-6 rounded-xl border border-blue-300/20 bg-blue-400/10 p-4 text-sm text-blue-100">
          {isApproved
            ? "This user account has been approved."
            : "This user is currently waiting for approval."}
        </div>
      </section>
    </div>
  );
}

function InfoCard({
  icon: Icon,
  label,
  value,
}: {
  icon: ComponentType<LucideProps>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-center gap-3 text-blue-100">
        <Icon size={20} />
        <p className="text-sm text-blue-100/60">{label}</p>
      </div>
      <p className="mt-3 text-2xl font-bold text-white">{value}</p>
    </div>
  );
}
