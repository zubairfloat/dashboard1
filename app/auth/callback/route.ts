import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const destination = url.searchParams.get("next");
  const next = destination === "/auth/reset-password" || destination === "/auth/confirmed" ? destination : "/dashboard";
  let recoveryError = "invalid_link";
  if (code) {
    const supabase = await createServerSupabase();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL(next, url.origin));
    if (error.code === "pkce_code_verifier_not_found") recoveryError = "missing_verifier";
    console.warn("Auth callback exchange failed", { code: error.code, status: error.status });
  }
  return NextResponse.redirect(new URL(next === "/auth/reset-password" ? `/auth/reset-password?error=${recoveryError}` : "/login?error=auth_callback", url.origin));
}
