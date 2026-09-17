"use client";

import Link from "next/link";
import { Skeleton } from "../skeleton";
import { useState } from "react";
import { ShieldCheck, Upload, RefreshCw } from "lucide-react";
import { formatDateTime } from "@/lib/format";
import { supabase } from "@/lib/supabase/client";
import { KYC_BUCKET, KYC_DOCUMENT_TYPES, KYC_FILE_ACCEPT, KYC_FILE_HELP, getKycDocument, isKycDocumentType, validateKycFile, type KycSubmission } from "@/lib/kyc";
import { KYC_COUNTRIES } from "@/lib/kyc-countries";
import { notifyKyc } from "@/lib/email/notifyKyc";
import { useKycStatus } from "@/hooks/use-kyc-status";

const inputClass = "mt-2 block w-full rounded-xl border border-white/15 bg-blue-950 p-3 text-white disabled:opacity-50";
const labels = { pending: "Documents submitted · Under admin review", verified: "KYC Verified", rejected: "Rejected / Action Required" };

export default function PersonalKycForm() {
  const { submission: remoteSubmission, ready, error } = useKycStatus();
  const [submitted, setSubmitted] = useState<KycSubmission | null>(null);
  const submission = submitted && remoteSubmission?.id !== submitted.id ? submitted : remoteSubmission;
  const [countryCode, setCountryCode] = useState("");
  const [documentType, setDocumentType] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const selectedDocument = isKycDocumentType(documentType) ? getKycDocument(documentType) : null;
  const canSubmit = ready && (!submission || submission.status === "rejected");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    const values = new FormData(event.currentTarget);
    setBusy(true);
    setMessage("");
    try {
      const country = KYC_COUNTRIES.find(option => option.code === countryCode);
      if (!country || !isKycDocumentType(documentType)) throw new Error("Select a country and document type first.");
      const fullName = String(values.get("full_name") || "").trim();
      if (fullName.length < 2 || fullName.length > 150) throw new Error("Enter your full name as shown on the document.");
      const files = await Promise.all(getKycDocument(documentType).uploads.map(async slot => {
        const file = values.get(slot.key);
        if (!(file instanceof File)) throw new Error(`Choose a file for: ${slot.label}.`);
        try { return { slot: slot.key, file, mime: await validateKycFile(file) }; }
        catch (error) { throw new Error(`${slot.label}: ${error instanceof Error ? error.message : "Invalid file."}`); }
      }));
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      if (!user || authError) throw new Error("Please sign in again before submitting.");
      const id = crypto.randomUUID();
      for (const { slot, file, mime } of files) {
        const { error } = await supabase.storage.from(KYC_BUCKET).upload(`${user.id}/${id}/${slot}`, file, { contentType: mime, upsert: false });
        if (error) throw new Error("Document upload failed. Check your connection and try again.");
      }
      const { data, error } = await supabase.from("kyc_submissions").insert({
        id, user_id: user.id, full_name: fullName, country: country.name, country_code: country.code, document_type: documentType,
      }).select("*").single();
      if (error || !data) throw new Error("Submission could not be confirmed. Refresh your status before trying again.");
      setSubmitted(data);
      window.dispatchEvent(new Event("kyc-updated"));
      setMessage("Your documents were submitted and are now under admin review.");
      if (!await notifyKyc(id)) setMessage("Your documents are saved and visible to admins. The admin email notification is queued for delivery.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Submission failed. Please try again.");
    } finally { setBusy(false); }
  }

  return <div className="mx-auto max-w-4xl space-y-6">
    <header>
      <p className="mb-2 text-sm text-sky-300">ACCOUNT SECURITY</p>
      <h1 className="text-3xl font-bold text-white md:text-4xl">Identity verification</h1>
      <p className="mt-3 text-blue-100/70">Choose your document’s issuing country and the document you want to submit for review.</p>
    </header>
    <section className="workspace-panel rounded-3xl border border-white/10 bg-white/5 p-6" aria-busy={!ready}>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h2 className="flex items-center gap-3 text-xl font-semibold text-white"><ShieldCheck className="text-sky-300" /> Verification status</h2>
        <button disabled={busy} onClick={() => window.dispatchEvent(new Event("kyc-updated"))} className="flex items-center gap-2 rounded-xl border border-white/15 px-4 py-2 text-blue-100 disabled:opacity-50"><RefreshCw size={16} /> Refresh</button>
      </div>
      <div aria-live="polite" className="mt-5 text-blue-100">
        {!ready ? <div role="status" aria-label="Loading verification" className="space-y-3"><Skeleton className="h-8 w-32" /><Skeleton className="h-4 w-64 max-w-full" /></div> : <>
          <span className={`inline-block rounded-full px-4 py-2 text-sm ${submission?.status === "verified" ? "bg-emerald-400/10 text-emerald-200" : "bg-amber-400/10 text-amber-200"}`}>{submission ? labels[submission.status] : "KYC Pending"}</span>
          {submission && <p className="mt-3 text-sm text-blue-100/70">{submission.country} · {getKycDocument(submission.document_type).label} · Submitted {formatDateTime(submission.created_at)}</p>}
          {submission?.status === "pending" && <p className="mt-4">Your documents are awaiting review. No further upload is needed.</p>}
          {submission?.status === "verified" && <p className="mt-4">An administrator has approved your identity verification.</p>}
          {submission?.status === "rejected" && <div className="mt-4"><p className="font-medium">Reviewer feedback</p><p className="mt-1 whitespace-pre-wrap">{submission.rejection_reason}</p><p className="mt-3 text-sm">Address this feedback and submit new documents below.</p></div>}
        </>}
      </div>
      <p className="mt-5 border-t border-white/10 pt-4 text-sm text-blue-100/60">Identity verification is separate from account approval.</p>
    </section>
    {(message || error) && <p role="status" className="rounded-xl border border-sky-300/20 bg-sky-300/10 p-4 text-blue-100">{message || error}</p>}
    {canSubmit && <form onSubmit={submit} className="workspace-panel rounded-3xl border border-white/10 bg-white/5 p-6 md:p-8">
      <h2 className="text-xl font-semibold text-white">{submission ? "Resubmit your documents" : "Verify your identity"}</h2>
      <fieldset disabled={busy} className="mt-6 space-y-6 disabled:opacity-60">
        <label className="block text-sm text-blue-100">1. Document issuing country
          <select name="country_code" required value={countryCode} onChange={event => { setCountryCode(event.target.value); setDocumentType(""); setMessage(""); }} className={inputClass}>
            <option value="">Select a country or region</option>
            {KYC_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}
          </select>
        </label>
        <label className="block text-sm text-blue-100">2. Document type
          <select name="document_type" required disabled={!countryCode} value={documentType} onChange={event => { setDocumentType(event.target.value); setMessage(""); }} className={inputClass}>
            <option value="">{countryCode ? "Select a document type" : "Select a country first"}</option>
            {Object.entries(KYC_DOCUMENT_TYPES).map(([value, document]) => <option key={value} value={value}>{document.label}</option>)}
          </select>
        </label>
        {selectedDocument && <div key={`${countryCode}-${documentType}`} className="space-y-5">
          <label className="block text-sm text-blue-100">Full name as shown on the document<input name="full_name" autoComplete="name" required minLength={2} maxLength={150} className={inputClass} /></label>
          <div><h3 className="font-medium text-white">3. Upload your {selectedDocument.label.toLowerCase()}</h3><p id="kyc-upload-help" className="mt-2 text-sm text-blue-100/70">{KYC_FILE_HELP}. Include all corners and keep the text readable. {documentType === "passport" ? "Upload the page with your photo and personal details." : "Upload a separate file for each side."}</p></div>
          <div className="grid gap-5 sm:grid-cols-2">{selectedDocument.uploads.map(slot => <label key={slot.key} className="rounded-2xl border border-dashed border-sky-300/30 bg-sky-300/5 p-5 text-sm text-blue-100">
            <Upload className="mb-3 text-sky-300" /><span>{slot.label}</span>
            <input type="file" name={slot.key} required accept={KYC_FILE_ACCEPT} aria-describedby="kyc-upload-help" className="mt-4 block w-full text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-white/10 file:p-2 file:text-white" />
          </label>)}</div>
          <label className="flex items-start gap-3 text-sm leading-6 text-blue-100/80"><input type="checkbox" required name="consent" className="mt-1" />I confirm this is my document and agree to have these files stored privately and reviewed by authorized administrators for identity verification.</label>
        </div>}
        <button type="submit" disabled={!selectedDocument || !countryCode} className="workspace-action rounded-xl bg-[#a9e8ed] px-6 py-3 font-semibold text-blue-950 disabled:cursor-not-allowed disabled:opacity-50">{busy ? "Uploading and submitting…" : "Submit for review"}</button>
      </fieldset>
      <p className="mt-5 text-xs leading-5 text-blue-100/60">Your documents are stored privately. Only you and authorized KYC reviewers can access them. Contact your administrator to request deletion.</p>
    </form>}
    <Link href="/dashboard/profile" className="inline-block text-sm text-sky-300 hover:underline">Back to profile</Link>
  </div>;
}
