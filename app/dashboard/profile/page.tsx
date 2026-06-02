"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";
import {
  Mail,
  User as UserIcon,
  Calendar,
  Shield,
} from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user);
    }

    loadUser();
  }, []);

  const fullName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    "User";

  const avatar =
    user?.user_metadata?.avatar_url;

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Profile
        </h1>

        <p className="mt-2 text-blue-100/70">
          Manage your account information.
        </p>
      </div>

      {/* Profile Card */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-xl">
        <div className="flex flex-col gap-6 md:flex-row md:items-center">
          {/* Avatar */}
          <div>
            {avatar ? (
              <img
                src={avatar}
                alt="Profile"
                className="h-28 w-28 rounded-full border-4 border-white/10"
              />
            ) : (
              <div className="flex h-28 w-28 items-center justify-center rounded-full bg-white text-4xl font-bold text-blue-900">
                {fullName.charAt(0)}
              </div>
            )}
          </div>

          {/* User Info */}
          <div>
            <h2 className="text-3xl font-bold text-white">
              {fullName}
            </h2>

            <p className="mt-2 text-blue-100/70">
              {user?.email}
            </p>

            <div className="mt-4 inline-flex rounded-full border border-green-500/20 bg-green-500/10 px-4 py-1 text-sm text-green-300">
              Active Account
            </div>
          </div>
        </div>
      </div>

      {/* Details */}
      <div className="mt-8 grid gap-6 md:grid-cols-2">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <UserIcon
              size={20}
              className="text-blue-300"
            />
            <h3 className="font-semibold text-white">
              Full Name
            </h3>
          </div>

          <p className="text-blue-100/80">
            {fullName}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <Mail
              size={20}
              className="text-blue-300"
            />
            <h3 className="font-semibold text-white">
              Email Address
            </h3>
          </div>

          <p className="text-blue-100/80">
            {user?.email}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <Shield
              size={20}
              className="text-blue-300"
            />
            <h3 className="font-semibold text-white">
              Provider
            </h3>
          </div>

          <p className="capitalize text-blue-100/80">
            {user?.app_metadata?.provider}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
          <div className="mb-4 flex items-center gap-3">
            <Calendar
              size={20}
              className="text-blue-300"
            />
            <h3 className="font-semibold text-white">
              Member Since
            </h3>
          </div>

          <p className="text-blue-100/80">
            {user?.created_at
              ? new Date(
                  user.created_at
                ).toLocaleDateString()
              : "-"}
          </p>
        </div>
      </div>

      {/* User ID */}
      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-xl">
        <h3 className="mb-3 font-semibold text-white">
          User ID
        </h3>

        <code className="break-all text-sm text-blue-100/70">
          {user?.id}
        </code>
      </div>
    </div>
  );
}