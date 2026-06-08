"use client";

import { useEffect, useState } from "react";

export default function PendingPage() {
  const TOTAL_HOURS = 120;

  const [timeLeft, setTimeLeft] = useState("");

  useEffect(() => {
    const createdAt =
      localStorage.getItem("signupTime") ||
      new Date().toISOString();

    localStorage.setItem("signupTime", createdAt);

    const interval = setInterval(() => {
      const signupDate = new Date(createdAt);
      const now = new Date();

      const endDate = new Date(
        signupDate.getTime() +
          TOTAL_HOURS * 60 * 60 * 1000
      );

      const diff =
        endDate.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft("Review period completed");
        clearInterval(interval);
        return;
      }

      const days = Math.floor(
        diff / (1000 * 60 * 60 * 24)
      );

      const hours = Math.floor(
        (diff % (1000 * 60 * 60 * 24)) /
          (1000 * 60 * 60)
      );

      const minutes = Math.floor(
        (diff % (1000 * 60 * 60)) /
          (1000 * 60)
      );

      const seconds = Math.floor(
        (diff % (1000 * 60)) / 1000
      );

      setTimeLeft(
        `${days}d ${hours}h ${minutes}m ${seconds}s`
      );
    }, 1000);

    return () => clearInterval(interval);
  }, []);

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
          Your Axnetix Network account is
          currently undergoing validation and
          approval.
        </p>

        <div className="mb-8 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-6">
          <h2 className="mb-3 text-xl font-semibold text-white">
            Time Remaining
          </h2>

          <div className="text-4xl font-bold text-amber-300">
            {timeLeft}
          </div>
        </div>

        <div className="space-y-3 text-left text-blue-100/80">
          <p>
            • Your account information is being
            reviewed.
          </p>

          <p>
            • Platform access remains restricted
            until approval.
          </p>

          <p>
            • Once approved, you will receive a
            confirmation email.
          </p>
        </div>

        <div className="mt-8 rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-100">
          If the countdown reaches zero and your
          account is still not activated, please
          contact the Axnetix support team.
        </div>
      </div>
    </main>
  );
}