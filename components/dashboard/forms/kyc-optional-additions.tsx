"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, CheckCircle2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { getKycOptionalDetails, needsKycBankDetails, type KycSubmission } from "@/lib/kyc";
import { emptyAddress, normalizeAddress, validateOptionalDetails, type CryptoWallet } from "@/lib/kyc-optional";
import KycSavedDetails from "../kyc-saved-details";
import { KycOptionalDetails } from "./kyc-optional-details";
import KycDetailsModal from "./kyc-details-modal";

const primary = "inline-flex min-h-11 w-full items-center justify-center gap-2 rounded-xl bg-cyan-200 px-5 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-200 disabled:opacity-50 sm:w-auto";
const secondary = "min-h-11 w-full rounded-xl border border-white/20 px-5 py-3 text-sm text-blue-100 hover:bg-white/5 focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-50 sm:w-auto";

export default function KycOptionalAdditions({ submission }: { submission: KycSubmission | null }) {
  const [saved, setSaved] = useState<NonNullable<KycSubmission["optional_additions"]>>([]);
  const current = submission ? { ...submission, optional_additions: [...(submission.optional_additions || []), ...saved] } : null;
  const existing = current ? getKycOptionalDetails(current) : { wallet: null, address: null };
  const [section, setSection] = useState<"crypto" | "address" | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [wallet, setWallet] = useState<CryptoWallet>({ cryptocurrency: "", network: "", address: "" });
  const [address, setAddress] = useState({ ...emptyAddress });
  const [busy, setBusy] = useState(false);
  const inFlight = useRef(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState("");
  const successRef = useRef<HTMLParagraphElement>(null);
  useEffect(() => { if (success) successRef.current?.focus(); }, [success]);
  const eligible = submission?.status === "verified" && !needsKycBankDetails(submission);
  const active = section && !(section === "crypto" ? existing.wallet : existing.address);
  function close() { if (!inFlight.current) { setSection(null); setConfirming(false); setMessage(""); } }
  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!section || !submission || !eligible || !active || inFlight.current) return;
    const crypto_wallet = section === "crypto" ? { ...wallet, address: wallet.address.trim() } : null;
    const residential_address = section === "address" ? normalizeAddress(address) : null;
    const error = validateOptionalDetails(crypto_wallet, residential_address);
    if (error || (!crypto_wallet && !residential_address)) { setMessage(error || "Enter the details before saving."); setConfirming(false); return; }
    if (!confirming) { setMessage(""); setConfirming(true); return; }
    inFlight.current = true; setBusy(true); setMessage("");
    try {
      const row = { submission_id: submission.id, section, crypto_wallet, residential_address };
      const { error } = await supabase.from("kyc_optional_additions").insert(row);
      if (error) {
        if (error.code === "23505") window.dispatchEvent(new Event("kyc-updated"));
        throw new Error(error.code === "23505" ? "These details have already been saved. Close this dialog and refresh your verification status." : "We couldn’t save your details. Your entries have been kept. Please check your connection and try again.");
      }
      setSaved(previous => [...previous, row]); setSection(null); setConfirming(false);
      setSuccess(`${section === "crypto" ? "Crypto wallet" : "Residential address"} saved successfully. Your details are now read-only.`);
      window.dispatchEvent(new Event("kyc-updated"));
    } catch (error) { setMessage(error instanceof Error ? error.message : "Unable to save details. Your entries have been kept. Please try again."); }
    finally { inFlight.current = false; setBusy(false); }
  }
  function action(target: "crypto" | "address") {
    if (!eligible) return undefined;
    return <div className="space-y-4">
      <p className="text-sm leading-6 text-blue-100/75">{target === "crypto" ? "Add your cryptocurrency, network and receiving wallet address." : "Add your residential address to your account information."} You can do this at any time.</p>
      <button type="button" className={primary} onClick={() => { setSection(target); setConfirming(false); setMessage(""); }}><Plus size={16} aria-hidden="true" />{target === "crypto" ? "Add Crypto Wallet" : "Add Residential Address"}</button>
      <p className="text-xs text-blue-100/65">Optional · One-time submission</p>
    </div>;
  }
  return <div className="space-y-4">
    {success && <p ref={successRef} tabIndex={-1} role="status" className="flex items-start gap-2 rounded-xl border border-emerald-300/20 bg-emerald-300/5 p-4 text-sm text-emerald-200"><CheckCircle2 size={18} className="shrink-0" />{success}</p>}
    <KycSavedDetails submission={current} cryptoAction={action("crypto")} addressAction={action("address")} />
    {active && <KycDetailsModal key={`${section}-${confirming}`} busy={busy} onClose={close}
      title={confirming ? "Review your information" : section === "crypto" ? "Add Crypto Wallet" : "Add Residential Address"}
      description={confirming ? "Please review your information carefully. Once saved, these details cannot be edited." : "Optional account information. Saving these details will not change your identity verification."}>
      <form onSubmit={save} className="space-y-5">
        {confirming ? <dl className="space-y-4 rounded-xl border border-white/10 p-4 text-sm">
          {(section === "crypto" ? [["Cryptocurrency", wallet.cryptocurrency], ["Network", wallet.network], ["Wallet address", wallet.address.trim()]] : Object.entries(normalizeAddress(address) || {}).map(([key, value]) => [{ line1: "Address Line 1", line2: "Address Line 2", city: "City", state: "State / Province", postal_code: "Postal / ZIP Code", country: "Country" }[key], value])).filter(([, value]) => value).map(([label, value]) => <div key={label}><dt className="text-blue-100/65">{label}</dt><dd className="mt-1 break-all text-white">{value}</dd></div>)}
        </dl> : <fieldset disabled={busy}><KycOptionalDetails section={section!} enabled={true} onEnabled={() => {}} wallet={wallet} onWallet={setWallet} address={address} onAddress={setAddress} error={null} /></fieldset>}
        {message && <p role="alert" className="rounded-xl border border-rose-300/20 bg-rose-300/5 p-3 text-sm text-rose-200">{message}</p>}
        <div className="flex flex-col-reverse gap-3 border-t border-white/10 pt-4 sm:flex-row sm:justify-end">
          <button disabled={busy} type="button" className={secondary} onClick={() => confirming ? setConfirming(false) : close()}>{confirming ? "Go Back" : "Cancel"}</button>
          <button disabled={busy} className={primary}>{busy ? "Saving…" : confirming ? "Confirm & Save" : "Review & Save"}</button>
        </div>
      </form>
    </KycDetailsModal>}
  </div>;
}
