import { supabase } from "@/lib/supabase/client";

let migration: Promise<void> | undefined;

// One-time bridge for users signed in before cookie-based SSR was introduced.
export function migrateLegacySession() {
  migration ??= (async () => {
    const key = `sb-${new URL(process.env.NEXT_PUBLIC_SUPABASE_URL!).hostname.split(".")[0]}-auth-token`;
    try {
      const stored = localStorage.getItem(key);
      if (!stored) return;
      const session = JSON.parse(stored);
      if (typeof session.access_token !== "string" || typeof session.refresh_token !== "string") return;
      const { error } = await supabase.auth.setSession({ access_token: session.access_token, refresh_token: session.refresh_token });
      if (error) return;
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError || !user) return;
      localStorage.removeItem(key);
      window.location.replace("/dashboard");
    } catch {
      // Invalid or unavailable legacy storage falls back to normal sign-in.
    }
  })();
  return migration;
}
