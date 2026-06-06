"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  const handleSignup = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (
      !username.trim() ||
      !email.trim() ||
      !password ||
      !confirmPassword
    ) {
      setErrorMessage("Please fill all fields.");
      return;
    }

    if (username.length < 3) {
      setErrorMessage(
        "Username must be at least 3 characters."
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage(
        "Password must be at least 6 characters."
      );
      return;
    }

    setLoading(true);

    try {
      // Check if username already exists
      const { data: existingUsername } =
        await supabase
          .from("profiles")
          .select("id")
          .eq("username", username)
          .maybeSingle();

      if (existingUsername) {
        setErrorMessage(
          "Username already exists. Please choose another username."
        );
        setLoading(false);
        return;
      }

      const { error } =
        await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            },
          },
        });

      if (error) {
        if (
          error.message
            .toLowerCase()
            .includes("already")
        ) {
          setErrorMessage(
            "An account with this email already exists. Please login."
          );
        } else {
          setErrorMessage(error.message);
        }

        setLoading(false);
        return;
      }

      setSuccessMessage(
        "Account created successfully. Please check your email and verify your account."
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);

      setErrorMessage(
        "Something went wrong. Please try again."
      );
    }

    setLoading(false);
  };

  return (
    <main className="flex min-h-screen items-center justify-center bg-gradient-to-br from-[#10246e] via-[#2546b3] to-[#3d5afe] px-4">
      <div className="w-full max-w-md rounded-3xl border border-white/10 bg-white/10 p-8 backdrop-blur-xl">
        {/* Header */}
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-white text-xl font-bold text-blue-900">
            S
          </div>

          <h1 className="text-4xl font-bold text-white">
            Create Account
          </h1>

          <p className="mt-2 text-blue-100/70">
            Start your SaaS journey today
          </p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) =>
              setUsername(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-blue-100/50 outline-none"
          />

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) =>
              setEmail(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-blue-100/50 outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-blue-100/50 outline-none"
          />

          <input
            type="password"
            placeholder="Confirm Password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            className="w-full rounded-xl border border-white/10 bg-white/10 p-3 text-white placeholder:text-blue-100/50 outline-none"
          />

          {errorMessage && (
            <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
              {errorMessage}
            </div>
          )}

          {successMessage && (
            <div className="rounded-xl border border-green-500/30 bg-green-500/10 p-3 text-sm text-green-200">
              {successMessage}
            </div>
          )}

          <button
            onClick={handleSignup}
            disabled={loading}
            className="w-full rounded-xl bg-white py-3 font-semibold text-blue-900 transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading
              ? "Creating Account..."
              : "Create Account"}
          </button>
        </div>

        {/* Footer */}
        <div className="mt-6 text-center text-sm text-blue-100/70">
          Already have an account?{" "}
          <Link
            href="/login"
            className="font-semibold text-white hover:underline"
          >
            Login
          </Link>
        </div>

        <div className="mt-3 text-center text-sm">
          <Link
            href="/"
            className="text-blue-100/70 hover:text-white"
          >
            ← Back to Home
          </Link>
        </div>
      </div>
    </main>
  );
}