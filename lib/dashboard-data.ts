import "server-only";
import { cache } from "react";
import { redirect, notFound } from "next/navigation";
import { createServerSupabase } from "@/lib/supabase/server";
import type { DashboardProfile, KycState } from "@/lib/dashboard-types";

export const getAccount = cache(async () => {
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) redirect("/login");
  const { data: initialProfile, error: profileError } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
  let profile = initialProfile;
  if (profileError) throw new Error("Unable to load your account. Please try again.");
  if (!profile) {
    // Compatibility for accounts predating the profile trigger. Never overwrite an existing account.
    const base = (user.email?.split("@")[0] || "user").replace(/[^a-zA-Z0-9_]/g, "_").slice(0, 24);
    const { error: insertError } = await supabase.from("profiles").upsert({
      id: user.id, username: `${base}_${user.id.slice(0, 6)}`, email: user.email || "",
      is_approved: false, approval_deadline: new Date(Date.now() + 72 * 3600000).toISOString(),
    }, { onConflict: "id", ignoreDuplicates: true });
    if (insertError) throw new Error("Unable to prepare your account.");
    const result = await supabase.from("profiles").select("*").eq("id", user.id).single();
    if (result.error) throw new Error("Unable to load your account.");
    profile = result.data;
  }
  return { user, profile: {
    ...profile,
    assigned_tokens: profile.assigned_tokens || 0, bonus_tokens: profile.bonus_tokens || 0,
    total_tokens: profile.total_tokens || 0, remaining_tokens: profile.remaining_tokens || 0,
    current_rate: profile.current_rate || 0, purchase_amount: profile.purchase_amount || 0,
  } as DashboardProfile };
});

export async function requireActiveAccount() {
  const account = await getAccount();
  if (account.profile.is_deleted) redirect("/dashboard/restricted");
  return account;
}

export async function requireAdmin() {
  const account = await requireActiveAccount();
  if (!account.profile.is_admin) redirect("/dashboard");
  return account;
}

export const getKycState = cache(async (): Promise<KycState> => {
  const { user, profile } = await getAccount();
  const supabase = await createServerSupabase();
  const [{ data: reviewer, error: reviewerError }, { data: submission, error }] = await Promise.all([
    supabase.rpc("is_kyc_reviewer"),
    profile.is_admin ? Promise.resolve({ data: null, error: null }) : supabase.from("kyc_submissions").select("*, bank_supplement:kyc_bank_supplements(*)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(1).maybeSingle(),
  ]);
  return {
    ready: !error && !reviewerError, admin: profile.is_admin, reviewer: Boolean(reviewer), submission,
    error: error || reviewerError ? "Unable to load KYC status. Please try again." : "",
  };
});

export async function requireReviewer() {
  await requireAdmin();
  const state = await getKycState();
  if (!state.ready) throw new Error(state.error);
  if (!state.reviewer) redirect("/dashboard/admin");
}

export async function getManagedProfile(id: string) {
  await requireAdmin();
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const supabase = await createServerSupabase();
  const { data, error } = await supabase.from("profiles").select("*").eq("id", id).maybeSingle();
  if (error) throw new Error("Unable to load user.");
  if (!data) notFound();
  return data as DashboardProfile;
}

export async function getAdminUsers(page: number, search: string, status: string) {
  await requireAdmin();
  const supabase = await createServerSupabase();
  let query = supabase.from("profiles").select("*", { count: "exact" });
  const safeSearch = search.replace(/[^a-zA-Z0-9@._ -]/g, "").slice(0, 100);
  if (safeSearch) query = query.or(`username.ilike.%${safeSearch}%,email.ilike.%${safeSearch}%`);
  if (status === "approved") query = query.eq("is_approved", true).eq("is_deleted", false);
  if (status === "pending") query = query.eq("is_approved", false).eq("is_deleted", false);
  if (status === "disabled") query = query.eq("is_deleted", true);
  const results = await Promise.all([
    query.order("created_at", { ascending: false }).range((page - 1) * 10, page * 10 - 1),
    supabase.from("profiles").select("id", { count: "exact", head: true }),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_approved", true).eq("is_deleted", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_approved", false).eq("is_deleted", false),
    supabase.from("profiles").select("id", { count: "exact", head: true }).eq("is_admin", true),
  ]);
  if (results.some(result => result.error)) throw new Error("Unable to load user management.");
  return {
    users: results[0].data || [], count: results[0].count || 0,
    stats: { total: results[1].count || 0, approved: results[2].count || 0, pending: results[3].count || 0, admins: results[4].count || 0 },
  };
}

export const getKycSummary = cache(async () => {
  await requireAdmin();
  const state = await getKycState();
  if (!state.reviewer) return null;
  const supabase = await createServerSupabase();
  const { data, error, count } = await supabase.from("kyc_submissions").select("*, bank_supplement:kyc_bank_supplements(*)", { count: "exact" }).eq("status", "pending").order("created_at", { ascending: true }).limit(5);
  if (error) throw new Error("Unable to load KYC requests.");
  return { items: data || [], count: count || 0 };
});

export const getRequestTime = cache(() => Date.now());
