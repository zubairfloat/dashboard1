"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { Clock3, MailCheck, ShieldCheck } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { LoadingCard, StatusBadge } from "@/components/dashboard/ui";

interface CountdownState {
  label: string;
  expired: boolean;
}

export default function PendingPage() {
  const [loading, setLoading] = useState(true);
  const [deadline, setDeadline] = useState("");
  const [timeLeft, setTimeLeft] = useState<CountdownState>({
    label: "Preparing review window...",
    expired: false,
  });

  useEffect(() => {
    const loadCountdown = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        window.location.href = "/login";
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("is_deleted, is_approved, approval_deadline")
        .eq("id", user.id)
        .single();

      if (!profile) {
        setLoading(false);
        return;
      }

      if (profile.is_deleted) {
        window.location.href = "/dashboard/restricted";
        return;
      }

      if (profile.is_approved) {
        window.location.href = "/dashboard";
        return;
      }

      setDeadline(profile.approval_deadline || "");
      setLoading(false);
    };

    loadCountdown();
  }, []);

  useEffect(() => {
    if (!deadline) {
      setTimeLeft({
        label: "Review deadline is not set yet",
        expired: false,
      });
      return;
    }

    const updateCountdown = () => {
      const diff = new Date(deadline).getTime() - Date.now();

      if (Number.isNaN(diff)) {
        setTimeLeft({ label: "Review deadline unavailable", expired: false });
        return;
      }

      if (diff <= 0) {
        setTimeLeft({ label: "Review window elapsed", expired: true });
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({
        label: `${days}d ${hours}h ${minutes}m ${seconds}s`,
        expired: false,
      });
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [deadline]);

  if (loading) {
    return <LoadingCard label="Loading review status..." />;
  }

  return (
    <main className="flex min-h-[85vh] items-center justify-center px-4 py-10">
      <div className="w-full max-w-4xl overflow-hidden rounded-2xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-blue-950/30 backdrop-blur-xl">
        <div className="border-b border-white/10 p-6 md:p-8">
          <StatusBadge
            status={timeLeft.expired ? "pending" : "active"}
            label={timeLeft.expired ? "Review in progress" : "Account review"}
          />
          <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">
            Account Under Review
          </h1>
          <p className="mt-3 max-w-2xl text-blue-100/70">
            Your Axnetix account is waiting for administrator approval. You will
            receive an email as soon as access is enabled.
          </p>
        </div>

        <div className="grid gap-5 p-6 md:grid-cols-[1fr_0.8fr] md:p-8">
          <section className="rounded-2xl border border-amber-300/20 bg-amber-300/10 p-6">
            <div className="flex items-center gap-3 text-amber-100">
              <Clock3 size={22} />
              <h2 className="text-lg font-semibold">Approval Countdown</h2>
            </div>
            <p className="mt-5 text-4xl font-bold text-amber-200 md:text-5xl">
              {timeLeft.label}
            </p>
            <p className="mt-4 text-sm text-amber-100/75">
              {timeLeft.expired
                ? "The original review window has passed. Your account remains in the approval queue."
                : "This countdown is based on the approval deadline stored on your profile."}
            </p>
          </section>

          <section className="space-y-3">
            <ReviewStep
              icon={ShieldCheck}
              title="Profile review"
              text="Your account details are being checked by the admin team."
            />
            <ReviewStep
              icon={MailCheck}
              title="Email notification"
              text="Approval sends a confirmation email and unlocks your dashboard."
            />
          </section>
        </div>

        <div className="border-t border-white/10 bg-blue-400/10 p-5 text-sm text-blue-100">
          If your account remains pending longer than expected, contact Axnetix
          Support at info@axnetix.com.
        </div>
      </div>
    </main>
  );
}

function ReviewStep({
  icon: Icon,
  title,
  text,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10 text-blue-100">
          <Icon size={19} />
        </div>
        <div>
          <h3 className="font-semibold text-white">{title}</h3>
          <p className="mt-1 text-sm text-blue-100/65">{text}</p>
        </div>
      </div>
    </div>
  );
}
