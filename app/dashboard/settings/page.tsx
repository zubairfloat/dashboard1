"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] =
    useState("");

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setLoading(false);
      return;
    }

    setEmail(user.email || "");

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (data) {
      setFullName(data.full_name || "");
    }

    setLoading(false);
  };

  const saveProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName,
      })
      .eq("id", user.id);

    if (error) {
      alert(error.message);
      return;
    }

    const { error: emailError } =
      await supabase.auth.updateUser({
        email,
      });

    if (emailError) {
      alert(emailError.message);
      return;
    }

    alert(
      "Profile updated successfully. Please verify your new email if changed."
    );
  };

  const updatePassword = async () => {
    if (!password) {
      alert("Please enter a password");
      return;
    }

    if (password.length < 6) {
      alert(
        "Password must be at least 6 characters"
      );
      return;
    }

    if (password !== confirmPassword) {
      alert("Passwords do not match");
      return;
    }

    const { error } =
      await supabase.auth.updateUser({
        password,
      });

    if (error) {
      alert(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");

    alert("Password updated successfully");
  };

  const deleteAccount = async () => {
    alert(
      "Account deletion functionality is not implemented yet."
    );
  };

  if (loading) {
    return (
      <div className="p-8 text-white">
        Loading Settings...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Settings
        </h1>

        <p className="mt-2 text-blue-100/70">
          Manage your account preferences and
          security settings.
        </p>
      </div>

      {/* Account Settings */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          Account Settings
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-2 block text-sm text-blue-100/70">
              Full Name
            </label>

            <input
              type="text"
              value={fullName}
              onChange={(e) =>
                setFullName(e.target.value)
              }
              placeholder="Your Name"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm text-blue-100/70">
              Email Address
            </label>

            <input
              type="email"
              value={email}
              onChange={(e) =>
                setEmail(e.target.value)
              }
              placeholder="your@email.com"
              className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
            />
          </div>

          <button
            onClick={saveProfile}
            className="rounded-xl bg-white px-6 py-3 font-medium text-blue-900 transition hover:bg-slate-200"
          >
            Save Changes
          </button>
        </div>
      </div>

      {/* Security */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          Security
        </h2>

        <div className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) =>
              setPassword(e.target.value)
            }
            placeholder="New Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
          />

          <input
            type="password"
            value={confirmPassword}
            onChange={(e) =>
              setConfirmPassword(e.target.value)
            }
            placeholder="Confirm Password"
            className="w-full rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40 outline-none focus:border-blue-400"
          />

          <button
            onClick={updatePassword}
            className="rounded-xl bg-white px-6 py-3 font-medium text-blue-900 transition hover:bg-slate-200"
          >
            Update Password
          </button>
        </div>
      </div>

      {/* Notifications */}
      <div className="mb-8 rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          Notifications
        </h2>

        <div className="space-y-4">
          <label className="flex items-center justify-between text-white">
            Email Notifications
            <input
              type="checkbox"
              defaultChecked
            />
          </label>

          <label className="flex items-center justify-between text-white">
            Product Updates
            <input
              type="checkbox"
              defaultChecked
            />
          </label>

          <label className="flex items-center justify-between text-white">
            Marketing Emails
            <input type="checkbox" />
          </label>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="rounded-3xl border border-red-500/20 bg-red-500/5 p-8 backdrop-blur-xl">
        <h2 className="mb-4 text-2xl font-semibold text-red-300">
          Danger Zone
        </h2>

        <p className="mb-6 text-red-200/70">
          Once you delete your account,
          there is no going back.
        </p>

        <button
          onClick={deleteAccount}
          className="rounded-xl bg-red-500 px-6 py-3 font-medium text-white transition hover:bg-red-600"
        >
          Delete Account
        </button>
      </div>
    </div>
  );
}