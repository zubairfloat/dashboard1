import type { ReactNode } from "react";
import { Landmark, Wallet, MapPin, ShieldCheck, LockKeyhole, Check, Minus, type LucideIcon } from "lucide-react";
import { getKycOptionalDetails, getKycDocument, type KycSubmission } from "@/lib/kyc";
import { formatDateTime } from "@/lib/format";
import { CRYPTO_NETWORKS } from "@/lib/kyc-optional";
import { KYC_COUNTRIES } from "@/lib/kyc-countries";

const countryName = (code?: string | null) => KYC_COUNTRIES.find(country => country.code === code)?.name || code || "Not provided";
function Field({ label, value, identifier = false }: { label: string; value?: string | null; identifier?: boolean }) {
  return <div className={identifier ? "min-w-0 sm:col-span-2" : "min-w-0"}>
    <dt className="text-xs leading-5 text-blue-100/65">{label}</dt>
    <dd className={`mt-1 leading-5 ${identifier ? "break-all select-all font-mono text-sm text-sky-100" : "break-words text-sm font-medium text-white"}`}>{value || "Not provided"}</dd>
  </div>;
}
function DetailCard({ title, subtitle, label, icon: Icon, status, provided, children }: { title: string; subtitle: string; label: string; icon: LucideIcon; status: string; provided: boolean; children: ReactNode }) {
  return <section aria-label={`${label}: ${status}`} className="flex min-w-0 flex-col rounded-2xl border border-white/10 bg-[#142035] p-5 transition-colors hover:border-sky-200/20 sm:p-6">
    <header className="mb-5 flex flex-wrap items-center gap-3">
      <span className={`flex size-10 shrink-0 items-center justify-center rounded-xl ${provided ? "bg-emerald-300/10 text-emerald-200" : "bg-sky-300/10 text-sky-200"}`}><Icon size={19} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><h2 className="text-base font-semibold text-white">{title}</h2><p className="mt-0.5 text-xs text-blue-100/65">{subtitle}</p></div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${provided ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-blue-100/75"}`}>{provided ? <Check size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}{status}</span>
    </header>
    <div className="flex-1">{children}</div>
  </section>;
}

export default function KycSavedDetails({ submission, cryptoAction, addressAction, adminView = false }: { adminView?: boolean; submission: KycSubmission | null; cryptoAction?: ReactNode; addressAction?: ReactNode }) {
  const bank = submission?.bank_supplement || submission;
  const { wallet, address } = submission ? getKycOptionalDetails(submission) : { wallet: null, address: null };
  const completeBank = Boolean(bank?.bank_name?.trim() && bank?.iban?.trim() && bank?.account_holder_name?.trim());
  const hasBank = Boolean(bank?.bank_name || bank?.iban || bank?.account_holder_name);
  const identityStatus = submission?.status === "verified" ? "Verified" : submission?.status === "pending" ? "Under review" : submission?.status === "rejected" ? "Action required" : "Not started";
  return <section aria-label="Account verification details" className="space-y-4">
    <div className="grid gap-4 md:grid-cols-2">
      <DetailCard title="Identity Verification" subtitle="Required · Identity documents" label="Identity" icon={ShieldCheck} status={identityStatus} provided={submission?.status === "verified"}>
        {submission ? <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Country" value={submission.country} />
          <Field label="Document type" value={getKycDocument(submission.document_type).label} />
          <Field label="Submitted" value={submission.created_at ? formatDateTime(submission.created_at) : undefined} />
          {submission.reviewed_at && <Field label="Reviewed" value={formatDateTime(submission.reviewed_at)} />}
        </dl> : <p className="text-sm leading-6 text-blue-100/75">Choose your country and upload your identity documents using the verification form below.</p>}
      </DetailCard>
      <DetailCard title="Bank Details" subtitle="Required · Receiving account" label="Bank" icon={Landmark} status={completeBank ? "Provided" : hasBank ? "Incomplete" : "Not provided"} provided={completeBank}>
        {hasBank && bank ? <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Bank" value={bank.bank_name} />
          <Field label="Account Holder Name" value={bank.account_holder_name} />
          <Field label="Bank country or region" value={countryName(bank.country_code)} />
          <Field label="IBAN" value={bank.iban} identifier />
        </dl> : <p className="text-sm leading-6 text-blue-100/75">Add your bank and account holder details in the form below. Bank details are required.</p>}
      </DetailCard>
      <DetailCard title="Crypto Wallet" subtitle="Optional · Receiving wallet" label="Crypto" icon={Wallet} status={wallet ? "Provided" : "Not provided"} provided={Boolean(wallet)}>
        {wallet ? <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-2">
          <Field label="Cryptocurrency" value={wallet.cryptocurrency} />
          <Field label="Blockchain network" value={CRYPTO_NETWORKS.find(network => network.value === wallet.network)?.label || wallet.network} />
          <Field label="Wallet address" value={wallet.address} identifier />
        </dl> : cryptoAction || <p className="text-sm leading-6 text-blue-100/75">{adminView ? "This user has not provided crypto wallet details." : "No crypto wallet added. You can add one after completing your required verification."}</p>}
      </DetailCard>
      <DetailCard title="Residential Address" subtitle="Optional · Contact information" label="Address" icon={MapPin} status={address ? "Provided" : "Not provided"} provided={Boolean(address)}>
        {address ? <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
          {[["Address Line 1", address.line1], ["Address Line 2", address.line2], ["City", address.city], ["State / Province", address.state], ["Postal / ZIP Code", address.postal_code], ["Country", countryName(address.country)]].filter(([, value]) => value).map(([label, value]) => <Field key={label} label={label!} value={value} />)}
        </dl> : addressAction || <p className="text-sm leading-6 text-blue-100/75">{adminView ? "This user has not provided a residential address." : "No residential address added. You can add one after completing your required verification."}</p>}
      </DetailCard>
    </div>
    <p className="flex items-start gap-2 text-xs leading-5 text-blue-100/65"><LockKeyhole size={14} aria-hidden="true" className="mt-0.5 shrink-0" />Saved details are read-only and visible only to you and authorized KYC reviewers. Identity approval does not verify bank or wallet ownership.</p>
  </section>;
}
