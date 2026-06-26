"use client";

import { useEffect, useState } from "react";
import type { ComponentType } from "react";
import type { LucideProps } from "lucide-react";
import { KeyRound, Mail, Save, UserRound } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { ActionButton, LoadingCard, StatusBadge } from "@/components/dashboard/ui";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [securityMessage, setSecurityMessage] = useState("");

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

    const { data, error } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", user.id)
      .single();

    if (error) {
      setProfileMessage(error.message);
    }

    if (data) {
      setFullName(data.full_name || "");
    }

    setLoading(false);
  };

  const saveProfile = async () => {
    setProfileMessage("");

    if (!email.trim() || !email.includes("@")) {
      setProfileMessage("Please enter a valid email address.");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return;

    setSavingProfile(true);

    const { error } = await supabase
      .from("profiles")
      .update({
        full_name: fullName.trim(),
      })
      .eq("id", user.id);

    if (error) {
      setSavingProfile(false);
      setProfileMessage(error.message);
      return;
    }

    const { error: emailError } = await supabase.auth.updateUser({
      email,
    });

    setSavingProfile(false);

    if (emailError) {
      setProfileMessage(emailError.message);
      return;
    }

    setProfileMessage(
      "Profile updated successfully. Please verify your new email if changed.",
    );
  };

  const updatePassword = async () => {
    setSecurityMessage("");

    if (!password) {
      setSecurityMessage("Please enter a new password.");
      return;
    }

    if (password.length < 6) {
      setSecurityMessage("Password must be at least 6 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setSecurityMessage("Passwords do not match.");
      return;
    }

    setSavingPassword(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    setSavingPassword(false);

    if (error) {
      setSecurityMessage(error.message);
      return;
    }

    setPassword("");
    setConfirmPassword("");
    setSecurityMessage("Password updated successfully.");
  };

  if (loading) {
    return <LoadingCard label="Loading settings..." />;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8">
        <StatusBadge status="active" label="Account settings" />
        <h1 className="mt-4 text-3xl font-bold text-white md:text-4xl">
          Settings
        </h1>
        <p className="mt-2 max-w-2xl text-blue-100/70">
          Manage profile details and security credentials for your Axnetix
          account.
        </p>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <SectionHeader icon={UserRound} title="Profile" />
          <div className="mt-6 space-y-5">
            <Field label="Full Name">
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your name"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
              />
            </Field>

            <Field label="Email Address">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
              />
            </Field>

            {profileMessage && <Message>{profileMessage}</Message>}

            <ActionButton
              tone="primary"
              onClick={saveProfile}
              disabled={savingProfile}
              className="gap-2 mt-6"
            >
              <Save size={16} />
              {savingProfile ? "Saving..." : "Save Changes"}
            </ActionButton>
          </div>
        </section>

        <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
          <SectionHeader icon={KeyRound} title="Security" />
          <div className="mt-6 space-y-5">
            <Field label="New Password">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
              />
            </Field>

            <Field label="Confirm Password">
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Repeat password"
                className="h-12 w-full rounded-xl border border-white/10 bg-white/5 px-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
              />
            </Field>

            {securityMessage && <Message>{securityMessage}</Message>}

            <ActionButton
              tone="primary"
              onClick={updatePassword}
              disabled={savingPassword}
              className="gap-2 mt-6"
            >
              <KeyRound size={16} />
              {savingPassword ? "Updating..." : "Update Password"}
            </ActionButton>
          </div>
        </section>
      </div>

      <section className="rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <SectionHeader icon={Mail} title="Notifications" />
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          {["Email Notifications", "Product Updates", "Marketing Emails"].map(
            (label, index) => (
              <label
                key={label}
                className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-4 text-white"
              >
                <span className="text-sm">{label}</span>
                <input type="checkbox" defaultChecked={index < 2} />
              </label>
            ),
          )}
        </div>
      </section>
    </div>
  );
}

function SectionHeader({
  icon: Icon,
  title,
}: {
  icon: ComponentType<LucideProps>;
  title: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-400/10 text-blue-100">
        <Icon size={20} />
      </div>
      <h2 className="text-xl font-semibold text-white">{title}</h2>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm font-medium text-blue-100/70">
        {label}
      </span>
      {children}
    </label>
  );
}

function Message({ children }: { children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-blue-300/20 bg-blue-400/10 p-3 text-sm text-blue-100">
      {children}
    </div>
  );
}
