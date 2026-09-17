import KycReview from "@/components/dashboard/kyc-review";
import { requireReviewer } from "@/lib/dashboard-data";
import { createServerSupabase } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
export default async function KycReviewPage({ searchParams }: { searchParams: Promise<{ request?: string }> }) {
  await requireReviewer();
  const { request } = await searchParams;
  if (request && !/^[0-9a-f-]{36}$/i.test(request)) notFound();
  const supabase = await createServerSupabase();
  let query = supabase.from("kyc_submissions").select("*", { count: "exact" });
  query = request ? query.eq("id", request) : query.eq("status", "pending");
  const { data, count, error } = await query.order("created_at", { ascending: true }).limit(request ? 1 : 10);
  if (error) throw new Error("Unable to load KYC reviews.");
  if (request && !data?.length) notFound();
  return <KycReview key={request || "all"} initialItems={data || []} initialCount={count || 0} requestId={request || null} />;
}
