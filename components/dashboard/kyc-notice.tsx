"use client";

import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import { useKycStatus } from "@/hooks/use-kyc-status";
import { useEffect } from "react";
import { notifyKyc } from "@/lib/email/notifyKyc";

export default function KycNotice() {
  const { ready, reviewer, admin, submission, error } = useKycStatus();
  const pendingId = submission?.status === "pending" ? submission.id : undefined;
  useEffect(() => {
    if (!ready || (!reviewer && !pendingId)) return;
    const deliver = () => { if (document.visibilityState === "visible") void notifyKyc(reviewer ? undefined : pendingId); };
    deliver();
    const interval = setInterval(deliver, 60000);
    return () => clearInterval(interval);
  }, [ready, reviewer, pendingId]);
  if (!ready || admin || reviewer || submission?.status === "verified") return null;
  const rejected = submission?.status === "rejected";
  const submitted = submission?.status === "pending";

  return <aside role="status" aria-live="polite" className={`mb-6 rounded-2xl border p-4 md:p-5 ${rejected ? "border-rose-300/30 bg-rose-400/10" : "border-amber-300/30 bg-amber-400/10"}`}>
    <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <ShieldAlert className={`shrink-0 ${rejected ? "text-rose-200" : "text-amber-200"}`} aria-hidden="true" />
      <div className="flex-1 text-blue-50">
        <p className="font-semibold">{rejected ? "KYC rejected — action required" : submitted ? "Documents submitted — under admin review" : "KYC verification pending"}</p>
        <p className="mt-1 text-sm">{rejected ? "Your KYC verification was rejected. Please correct your information or documents and resubmit for review." : "Your KYC verification is pending. Please complete the verification process as soon as possible."}</p>
        {submitted && <p className="mt-2 text-sm text-blue-100/80">Your documents have been received. No further upload is needed while the admin reviews them.</p>}
        {rejected && submission.rejection_reason && <p className="mt-2 whitespace-pre-wrap text-sm text-rose-100">Reviewer feedback: {submission.rejection_reason}</p>}
        {error && <p className="mt-2 text-xs text-blue-100/70">{error}</p>}
      </div>
      <Link href="/dashboard/kyc" className="shrink-0 rounded-xl bg-white/10 px-4 py-2 text-sm font-semibold text-white hover:bg-white/20">{rejected ? "Correct and resubmit" : submitted ? "View KYC status" : "Complete verification"}</Link>
    </div>
  </aside>;
}
