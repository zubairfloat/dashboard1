"use client";

import Link from "next/link";

export default function LoginPage() {
  const handleLogin = () => {
    alert(
      "Your account is currently under review. Login access will become available after the 120-hour activation period has been completed and your account has been approved."
    );
  };

  const handleGoogleLogin = () => {
    alert(
      "Google login is temporarily unavailable while account activation is being finalized."
    );
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_70%)]" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-900 shadow-lg">
            A
          </div>

          <h1 className="text-4xl font-bold text-white">
            Account Activation
          </h1>

          <p className="mt-3 text-blue-100/70">
            Axnetix Network
          </p>
        </div>

        {/* Notice */}
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <h3 className="mb-3 text-base font-semibold text-white">
            Registration Received
          </h3>

          <p>
            Thank you for registering with Axnetix
            Network. Your account is currently
            undergoing a mandatory
            <strong> 120-hour review and activation period</strong>.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              Your account information will be reviewed
              and validated.
            </li>

            <li>
              Certain platform features may remain
              unavailable until full activation.
            </li>

            <li>
              Login access will remain disabled during
              the review period.
            </li>
          </ul>

          <p className="mt-4">
            Once the 120-hour activation period has
            concluded and your account has been approved,
            you will receive a confirmation email
            notifying you that your Axnetix Network
            account is fully active and ready to use.
          </p>

          <p className="mt-4">
            If you did not create an account with
            Axnetix Network, please ignore this notice.
          </p>

          <div className="mt-5 border-t border-amber-500/20 pt-4">
            <p>
              For assistance, please contact our support
              team:
            </p>

            <p className="mt-2 font-medium">
              Email: info@axnetix.com
            </p>

            <p className="font-medium">
              Website: www.axnetix.com
            </p>
          </div>
        </div>

        {/* Disabled Actions */}
        <div className="space-y-4">
          <button
            onClick={handleGoogleLogin}
            className="flex w-full cursor-not-allowed items-center justify-center gap-3 rounded-xl border border-white/20 bg-white/5 p-3 text-white opacity-60"
          >
            Google Login Coming Soon
          </button>

          <button
            onClick={handleLogin}
            className="w-full cursor-not-allowed rounded-xl bg-gray-500 p-3 font-semibold text-white opacity-70"
          >
            Account Under Review
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <span className="text-blue-100/60">
            Need to create an account?
          </span>{" "}
          <Link
            href="/signup"
            className="font-semibold text-white hover:underline"
          >
            Sign Up
          </Link>
        </div>

        <div className="mt-4 text-center text-sm">
          <Link
            href="/"
            className="text-blue-100/60 hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}