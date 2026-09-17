"use client";
import { useState } from "react";
import { LogOut } from "lucide-react";
import { supabase } from "@/lib/supabase/client";

export default function LogoutButton() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  async function logout() {
    setBusy(true);
    const { error } = await supabase.auth.signOut();
    if (error) { setError("Sign out failed. Please retry."); setBusy(false); return; }
    window.location.assign("/login");
  }
  return <div><button aria-label={busy ? "Signing out" : "Sign out"} onClick={() => void logout()} disabled={busy} className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white transition hover:bg-rose-400/15 hover:text-rose-200 disabled:opacity-50"><LogOut size={16} /><span className="hidden sm:inline">{busy ? "Signing out…" : "Logout"}</span></button>{error && <p role="alert" className="text-xs text-rose-200">{error}</p>}</div>;
}
