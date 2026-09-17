"use client";

import Link from "next/link";
import { formatDateTime } from "@/lib/format";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { getKycDocument, type KycSubmission } from "@/lib/kyc";

export default function KycAdminSummary({ initialItems, initialCount }: { initialItems: KycSubmission[]; initialCount: number }) {
  const [items, setItems] = useState<KycSubmission[]>(initialItems);
  const [count, setCount] = useState(initialCount);
  const allowed = true;
  const [error, setError] = useState("");
  const loading = false;
  useEffect(() => {
    let active = true;
    async function refresh() {
      try {
        const { data, count, error } = await supabase.from("kyc_submissions").select("*", { count: "exact" }).eq("status", "pending").order("created_at", { ascending: true }).limit(5);
        if (error) throw new Error("Could not load KYC submissions.");
        if (active) { setItems(data || []); setCount(count || 0); setError(""); }
      } catch (error) { if (active) setError(error instanceof Error ? error.message : "Could not load KYC submissions."); }
    }
    const refreshVisible = () => { if (document.visibilityState === "visible") void refresh(); };
    const interval = setInterval(refreshVisible, 15000);
    window.addEventListener("focus", refreshVisible);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", refreshVisible); };
  }, []);
  if (!loading && !allowed && !error) return null;
  return <section className="rounded-2xl border border-sky-300/20 bg-white/5 p-6">
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h2 className="text-xl font-semibold text-white">KYC Verification</h2><p className="mt-1 text-sm text-blue-100/70">{loading ? "Loading requests…" : `${count} submitted request${count === 1 ? "" : "s"} awaiting verification`}</p></div>
      <Link href="/dashboard/admin/kyc" className="rounded-xl bg-sky-300 px-4 py-2 text-sm font-semibold text-blue-950">Review KYC requests</Link>
    </div>
    {error && <p role="alert" className="mt-4 text-rose-200">{error}</p>}
    {!loading && allowed && <div className="mt-4 divide-y divide-white/10">
      {items.length === 0 ? <p className="py-3 text-sm text-blue-100/60">No documents are waiting for review.</p> : items.map(item => <div key={item.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
        <div><p className="font-medium text-white">{item.full_name}</p><p className="text-sm text-blue-100/60">{item.country} · {getKycDocument(item.document_type).label} · Submitted {formatDateTime(item.created_at)}</p></div>
        <Link href={`/dashboard/admin/kyc?request=${item.id}`} className="text-sm font-medium text-sky-300 hover:underline">Open request →</Link>
      </div>)}
    </div>}
  </section>;
}
