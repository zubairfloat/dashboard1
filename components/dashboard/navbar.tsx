"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Bell, LogOut } from "lucide-react";

interface UserData {
  email?: string;
  user_metadata?: {
    full_name?: string;
    name?: string;
  };
}

export default function Navbar() {
  const [user, setUser] = useState<UserData | null>(null);

  useEffect(() => {
    async function loadUser() {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      setUser(user as UserData);
    }

    loadUser();
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const userName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    user?.email?.split("@")[0] ||
    "User";

  const firstLetter = userName.charAt(0).toUpperCase();

  return (
    <header className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
      <div className="flex flex-col gap-4 p-4 md:flex-row md:items-center md:justify-between">
        {/* Left */}
        <div>
          <h1 className="text-2xl font-bold text-white">
            Dashboard
          </h1>

          <p className="text-blue-100/60">
            Welcome back,
            <span className="ml-1 font-medium text-white">
              {userName}
            </span>
          </p>
        </div>

        {/* Right */}
        <div className="flex flex-wrap items-center gap-3">
          <button className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white">
            <Bell size={18} />
          </button>

          <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-white font-semibold text-blue-900">
              {firstLetter}
            </div>

            <div className="hidden sm:block">
              <p className="text-sm font-medium text-white">
                {userName}
              </p>

              <p className="text-xs text-blue-100/60">
                {user?.email}
              </p>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-2xl bg-red-500 px-4 py-3 text-white transition hover:bg-red-600"
          >
            <LogOut size={16} />

            <span className="hidden sm:inline">
              Logout
            </span>
          </button>
        </div>
      </div>
    </header>
  );
}