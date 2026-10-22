import KycReview from "@/components/dashboard/kyc-review";
import { requireReviewer } from "@/lib/dashboard-data";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
export default async function KycReviewPage({ searchParams }: { searchParams: Promise<{ request?: string; user?: string }> }) {
  await requireReviewer();
  const { request, user } = await searchParams;
  if (request && !/^[0-9a-f-]{36}$/i.test(request)) notFound();
  if (user && !/^[0-9a-f-]{36}$/i.test(user)) notFound();
  const supabase = await createServerSupabase();
  let query = supabase.from("kyc_submissions").select("*, bank_supplement:kyc_bank_supplements(*)", { count: "exact" });
  query = request ? query.eq("id", request) : user ? query.eq("user_id", user) : query.eq("status", "pending");
  const { data, count, error } = await query.order("created_at", { ascending: !user }).limit(request ? 1 : 10);
  if (error) throw new Error("Unable to load KYC reviews.");
  if (request && !data?.length) notFound();
  return <KycReview key={request || user || "all"} initialItems={data || []} initialCount={count || 0} requestId={request || null} userId={user || null} />;
}
