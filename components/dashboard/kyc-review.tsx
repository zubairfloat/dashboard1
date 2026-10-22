"use client";
import Link from "next/link";
import KycSavedDetails from "./kyc-saved-details";
import { ReviewSkeleton, DocumentsSkeleton } from "./skeleton";
import { ActionButton } from "./ui";
import { formatDateTime } from "@/lib/format";
import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { KYC_BUCKET, getKycDocument, type KycSubmission } from "@/lib/kyc";

export default function KycReviewContent({ initialItems, initialCount, requestId, userId = null }: { initialItems: KycSubmission[]; initialCount: number; requestId: string | null; userId?: string | null }) {
  const initial = useRef(true);
  const [items, setItems] = useState<KycSubmission[]>(initialItems);
  const [allowed, setAllowed] = useState(true);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [filter, setFilter] = useState(userId ? "all" : "pending");
  const [page, setPage] = useState(0);
  const [count, setCount] = useState(initialCount);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let active = true;
    async function load() {
      const { data: permitted, error: permissionError } = await supabase.rpc("is_kyc_reviewer");
      if (permissionError || !permitted) throw new Error("Access is limited to authorized KYC reviewers.");
      let query = supabase.from("kyc_submissions").select("*, bank_supplement:kyc_bank_supplements(*)", { count: "exact" });
      if (requestId) query = query.eq("id", requestId);
      else {
        if (userId) query = query.eq("user_id", userId);
        if (filter !== "all") query = query.eq("status", filter);
      }
      const { data, error, count } = await query.order("created_at", { ascending: !userId }).range(requestId ? 0 : page * 10, requestId ? 0 : page * 10 + 9);
      if (error) throw new Error("Could not load submissions. Please try again.");
      if (active) { setAllowed(true); setItems(data || []); setCount(count || 0); }
    }
    const update = () => { void load().catch((error: Error) => { if (active) setMessage(error.message); }).finally(() => { if (active) setLoading(false); }); };
    const refreshVisible = () => { if (document.visibilityState === "visible") update(); };
    if (initial.current) initial.current = false;
    else update();
    const interval = setInterval(refreshVisible, 15000);
    window.addEventListener("focus", refreshVisible);
    return () => { active = false; clearInterval(interval); window.removeEventListener("focus", refreshVisible); };
  }, [filter, page, revision, requestId, userId]);
  return <div className="space-y-6 text-white">
    <header><Link href="/dashboard/admin" className="text-sm text-sky-300">Back to user management</Link><h1 className="mt-4 text-3xl font-bold">KYC review</h1><p className="mt-2 text-blue-100/70">Review submitted documents, then approve or give a clear reason for resubmission.</p></header>
    {userId && <p className="break-all text-sm text-blue-100/70">KYC history for account: {userId}. Each record shows its own status and saved details.</p>}
    {message && <p role="alert" className="rounded-xl bg-amber-400/10 p-4 text-amber-100">{message}</p>}
    {requestId ? <Link href="/dashboard/admin/kyc" className="inline-block text-sky-300">View all KYC requests</Link> : allowed && <label className="block text-sm text-blue-100">Submission status<select value={filter} onChange={e => { setLoading(true); setMessage(""); setFilter(e.target.value); setPage(0); }} className="ml-3 rounded-xl border border-white/15 bg-blue-950 p-3"><option value="all">All KYC submissions</option><option value="pending">Documents submitted / Under review</option><option value="verified">Approved / Verified</option><option value="rejected">Rejected / Action required</option></select></label>}
    {loading ? <ReviewSkeleton /> : allowed && <>
      {!items.length && <p className="workspace-panel rounded-2xl border border-white/10 bg-white/5 p-8 text-blue-100/70">{userId && filter === "all" ? "This user has not submitted KYC." : `No ${filter === "all" ? "KYC" : filter} submissions.`}</p>}
      {items.map(item => <ReviewCard key={item.id} item={item} onReviewed={() => { setLoading(true); setPage(0); setRevision(value => value + 1); }} />)}
      <div className="flex items-center gap-4"><ActionButton className="workspace-pagination" disabled={page === 0} onClick={() => { setLoading(true); setPage(p => p - 1); }}>Previous</ActionButton><span>Page {page + 1}</span><ActionButton className="workspace-pagination" disabled={(page + 1) * 10 >= count} onClick={() => { setLoading(true); setPage(p => p + 1); }}>Next</ActionButton></div>
    </>}
  </div>;
}
function ReviewCard({ item, onReviewed }: { item: KycSubmission; onReviewed: () => void }) {
  const [photos, setPhotos] = useState<{ url: string; mime: string; label: string }[]>([]);
  const document = getKycDocument(item.document_type);
  const requiredCount = document.uploads.length;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reason, setReason] = useState("");
  const [checked, setChecked] = useState(false);
  useEffect(() => () => { photos.forEach(file => URL.revokeObjectURL(file.url)); }, [photos]);
  const [loadingDocuments, setLoadingDocuments] = useState(false);
  async function viewPhotos() {
    setLoadingDocuments(true);
    setBusy(true); setError("");
    const urls: { url: string; mime: string; label: string }[] = [];
    try {
      // Authenticated downloads; no persistent public or shareable signed URL.
      for (const slot of document.uploads) {
        const { data, error } = await supabase.storage.from(KYC_BUCKET).download(`${item.user_id}/${item.id}/${slot.key}`);
        if (error || !data) throw new Error("Could not load documents. Please retry.");
        if (!["image/jpeg", "image/png", "application/pdf"].includes(data.type)) throw new Error("Unsupported document format.");
        urls.push({ url: URL.createObjectURL(data), mime: data.type, label: slot.label });
      }
      setPhotos(urls);
    } catch (error) { urls.forEach(file => URL.revokeObjectURL(file.url)); setError(error instanceof Error ? error.message : "Could not load documents."); }
    finally { setBusy(false); setLoadingDocuments(false); }
  }
  async function review(status: "verified" | "rejected") {
    if (status === "rejected" && reason.trim().length < 3) { setError("Enter a reason so the user can correct their submission."); return; }
    setBusy(true); setError("");
    try {
      const { data, error } = await supabase.from("kyc_submissions").update({ status, rejection_reason: status === "rejected" ? reason.trim() : null }).eq("id", item.id).eq("status", "pending").select("id");
      if (error || !data?.length) throw new Error("Review could not be saved. It may already have been reviewed, or this may be your own submission. Refresh the page.");
      window.dispatchEvent(new Event("kyc-updated"));
      onReviewed();
    } catch (error) { setError(error instanceof Error ? error.message : "Review failed."); }
    finally { setBusy(false); }
  }
  return <article className="space-y-4 workspace-panel rounded-3xl border border-white/10 bg-white/5 p-6">
    <div><h2 className="text-xl font-semibold">{item.full_name}</h2><p className="mt-1 text-sm text-blue-100/70">{item.country} · {document.label} · {formatDateTime(item.created_at)}</p><p className="mt-1 break-all text-xs text-blue-100/50">Account: {item.user_id}</p><p className="mt-3 text-sm font-medium text-sky-200">{item.status === "pending" ? "Documents submitted — Under admin review" : item.status === "verified" ? "Approved — KYC Verified" : "Rejected — Action Required"}</p></div>
    {item.bank_supplement && <p className="text-sm text-sky-200">Bank details added {formatDateTime(item.bank_supplement.created_at)} · Bank country: {item.bank_supplement.country_code}. Identity approval is unchanged; bank ownership has not been verified.</p>}
    <KycSavedDetails submission={item} />
    <button disabled={busy} onClick={() => photos.length ? setPhotos([]) : void viewPhotos()} className="rounded-xl border border-white/15 px-4 py-2 disabled:opacity-40">{photos.length ? "Hide documents" : busy ? "Loading…" : "View documents"}</button>
    {loadingDocuments && <DocumentsSkeleton count={requiredCount} />}
    {photos.length > 0 && <div className="grid gap-4 md:grid-cols-2">{photos.map(file => <figure key={file.url}>
      <figcaption className="mb-2 text-sm text-blue-100">{file.label}</figcaption>
      {file.mime === "application/pdf" ? <div className="rounded-xl border border-white/10 bg-blue-950 p-5">
        <p className="mb-3 text-sm text-blue-100">PDF document — download and review all pages before approving.</p>
        <a href={file.url} download={`${item.id}-${file.label.replaceAll(" ", "-")}.pdf`} className="text-sky-300 underline">Download PDF for review</a>
      </div> : (
        // Private browser blob; never send identity documents through the image optimizer.
        // eslint-disable-next-line @next/next/no-img-element
        <img src={file.url} alt={file.label} className="max-h-[32rem] w-full rounded-xl bg-blue-950 object-contain" />
      )}
    </figure>)}</div>}
    {item.status === "pending" ? <div className="space-y-4 border-t border-white/10 pt-4">
      <label className="flex gap-3 text-sm text-blue-100"><input type="checkbox" checked={checked} onChange={e => setChecked(e.target.checked)} disabled={busy || photos.length !== requiredCount} />I reviewed every required file for readability and consistency with the submitted name, country, and document type.</label>
      <label className="block text-sm text-blue-100">Reason for rejection (required to reject)<textarea value={reason} onChange={e => setReason(e.target.value)} maxLength={1000} disabled={busy} placeholder="e.g. The back of the card is blurry. Please upload a clearer photo." className="mt-2 block w-full rounded-xl border border-white/15 bg-blue-950/50 p-3" /></label>
      <div className="flex gap-3"><button disabled={busy || !checked || photos.length !== requiredCount} onClick={() => void review("verified")} className="rounded-xl bg-emerald-300 px-5 py-2 font-semibold text-blue-950 disabled:opacity-40">Approve KYC</button><button disabled={busy || reason.trim().length < 3} onClick={() => void review("rejected")} className="rounded-xl bg-rose-300 px-5 py-2 font-semibold text-blue-950 disabled:opacity-40">Reject</button></div>
    </div> : <p className="text-sm text-blue-100/70">{item.status === "verified" ? "Approved" : `Rejected: ${item.rejection_reason}`} {item.reviewed_at && `· ${formatDateTime(item.reviewed_at)}`}</p>}
    {error && <p role="alert" className="text-rose-200">{error}</p>}
  </article>;
}
