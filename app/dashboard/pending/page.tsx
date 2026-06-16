"use client";

import { supabase } from "@/lib/supabase/client";
import { useEffect, useState } from "react";

export default function PendingPage() {
  const [timeLeft, setTimeLeft] =
    useState("");

  const [deadline, setDeadline] =
    useState("");

  useEffect(() => {
    const loadCountdown = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data: profile } =
        await supabase
          .from("profiles")
          .select(`
            is_deleted,
            approval_deadline
          `)
          .eq("id", user.id)
          .single();

      if (!profile) return;

      if (profile.is_deleted) {
        window.location.href =
          "/dashboard/restricted";
        return;
      }

      if (
        profile.approval_deadline
      ) {
        setDeadline(
          profile.approval_deadline
        );
      }
    };

    loadCountdown();
  }, []);

  useEffect(() => {
    if (!deadline) return;

    const interval =
      setInterval(() => {
        const cycleDuration =
          72 * 60 * 60 * 1000; // 72 Hours

        const originalDeadline =
          new Date(
            deadline
          ).getTime();

        let nextDeadline =
          originalDeadline;

        while (
          nextDeadline <
          Date.now()
        ) {
          nextDeadline +=
            cycleDuration;
        }

        const diff =
          nextDeadline -
          Date.now();

        const days =
          Math.floor(
            diff /
              (1000 *
                60 *
                60 *
                24)
          );

        const hours =
          Math.floor(
            (diff %
              (1000 *
                60 *
                60 *
                24)) /
              (1000 *
                60 *
                60)
          );

        const minutes =
          Math.floor(
            (diff %
              (1000 *
                60 *
                60)) /
              (1000 * 60)
          );

        const seconds =
          Math.floor(
            (diff %
              (1000 * 60)) /
              1000
          );

        setTimeLeft(
          `${days}d ${hours}h ${minutes}m ${seconds}s`
        );
      }, 1000);

    return () =>
      clearInterval(interval);
  }, [deadline]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4">
      <div className="w-full max-w-2xl rounded-3xl border border-white/10 bg-white/5 p-8 text-center backdrop-blur-xl">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-white text-2xl font-bold text-blue-900">
          A
        </div>

        <h1 className="mb-4 text-4xl font-bold text-white">
          Account Under Review
        </h1>

        <p className="mb-8 text-blue-100/70">
          Your Axnetix account is
          currently undergoing
          verification and
          approval.
        </p>

        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Approval Countdown
          </h2>

          <div className="text-4xl font-bold text-amber-300">
            {timeLeft}
          </div>
        </div>

        <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 p-5 text-sm text-blue-100">
          Your account is waiting
          for administrator
          approval.
          <br />
          <br />
          Once approved, you will
          receive a confirmation
          email and gain access
          to all platform
          features.
        </div>

        <div className="mt-8 space-y-3 text-left text-blue-100/80">
          <p>
            • Your account
            information is being
            reviewed.
          </p>

          <p>
            • Platform access
            remains restricted
            until approval.
          </p>

          <p>
            • Token allocation
            and package setup
            will be completed
            after approval.
          </p>

          <p>
            • You will receive an
            email notification
            once your account is
            approved.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          If your account remains
          pending for an extended
          period, please contact
          Axnetix Support.
        </div>
      </div>
    </main>
  );
}