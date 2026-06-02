"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async () => {
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      alert(error.message);
      return;
    }

    if (data.user) {
      await supabase.from("profiles").insert({
        id: data.user.id,
        email,
        full_name: email.split("@")[0],
      });
    }

    alert("Account created successfully. Please check your email.");
  };

  return (
    <main className="relative flex min-h-screen items-center justify-center overflow-hidden bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 px-4">
      {/* Background Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(59,130,246,0.25),transparent_70%)]" />

      {/* Signup Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-900 shadow-lg">
            S
          </div>

          <h1 className="text-4xl font-bold text-white">
            Create Account
          </h1>

          <p className="mt-3 text-blue-100/70">
            Start your SaaS journey today
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
          />

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-white p-3 font-semibold text-blue-900 transition hover:scale-[1.01] disabled:opacity-50"
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm">
          <span className="text-blue-100/60">
            Already have an account?
          </span>{" "}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Login
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