"use client";

import Link from "next/link";

export default function LoginPage() {
  const handleLogin = () => {
    alert(
      "Your account is currently under review. Login will be available after the 72-hour activation period."
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

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
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

        {/* Activation Notice */}
        <div className="mb-6 rounded-2xl border border-amber-500/30 bg-amber-500/10 p-5 text-sm text-amber-100">
          <h3 className="mb-3 font-semibold text-white">
            Registration Received
          </h3>

          <p>
            Please note that your registration is subject
            to a <strong>72-hour cooling-off period</strong>,
            which begins once your email address has been
            successfully verified.
          </p>

          <ul className="mt-4 list-disc space-y-2 pl-5">
            <li>
              Your account information will be reviewed and
              validated.
            </li>

            <li>
              Certain platform features may remain
              unavailable until full activation.
            </li>
          </ul>

          <p className="mt-4">
            After the 72-hour cooling-off period concludes
            and your account is approved, you will receive
            a final confirmation email letting you know
            your Axnetix Network account is fully active.
          </p>

          <p className="mt-4">
            If you did not create an account with Axnetix
            Network, please ignore this notice.
          </p>
        </div>

        {/* Disabled Login Buttons */}
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
            Account Activation Pending
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