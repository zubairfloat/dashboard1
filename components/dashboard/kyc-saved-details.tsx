import type { ReactNode } from "react";
import { Landmark, Wallet, MapPin, ShieldCheck, LockKeyhole, Check, Minus, type LucideIcon } from "lucide-react";
import type { KycSubmission } from "@/lib/kyc";
import { CRYPTO_NETWORKS } from "@/lib/kyc-optional";
import { KYC_COUNTRIES } from "@/lib/kyc-countries";

const countryName = (code: string | null | undefined) => KYC_COUNTRIES.find(country => country.code === code)?.name || code || "Not provided";

function Field({ label, value, identifier = false }: { label: string; value?: string | null; identifier?: boolean }) {
  return <div className={identifier ? "min-w-0 rounded-xl border border-sky-200/10 bg-[#091426]/70 p-4 sm:col-span-2" : "min-w-0"}>
    <dt className="text-xs font-medium leading-5 text-blue-100/55">{label}</dt>
    <dd className={`mt-1.5 leading-6 ${identifier ? "break-all font-mono text-sm tracking-wide text-sky-100 select-all" : "break-words text-sm font-medium text-white"}`}>{value || <span className="font-normal text-blue-100/40">Not provided</span>}</dd>
  </div>;
}
function DetailCard({ title, subtitle, icon: Icon, provided, children, className = "" }: { title: string; subtitle: string; icon: LucideIcon; provided: boolean; children: ReactNode; className?: string }) {
  return <section className={`min-w-0 overflow-hidden rounded-2xl border border-white/10 bg-[#0c172b]/55 ${className}`}>
    <header className="flex flex-wrap items-center gap-3 border-b border-white/[0.07] px-5 py-4">
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl border border-sky-200/10 bg-sky-300/[0.08] text-sky-200"><Icon size={19} aria-hidden="true" /></span>
      <div className="min-w-0 flex-1"><h4 className="text-sm font-semibold text-white">{title}</h4><p className="mt-0.5 text-xs text-blue-100/45">{subtitle}</p></div>
      <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium ${provided ? "bg-emerald-300/10 text-emerald-200" : "bg-white/5 text-blue-100/55"}`}>{provided ? <Check size={12} aria-hidden="true" /> : <Minus size={12} aria-hidden="true" />}{provided ? "Provided" : "Not provided"}</span>
    </header>
    <div className="p-5">{children}</div>
  </section>;
}

export default function KycSavedDetails({ submission }: { submission: KycSubmission }) {
  const bank = submission.bank_supplement || submission;
  const wallet = bank.crypto_wallet ?? submission.crypto_wallet;
  const address = bank.residential_address ?? submission.residential_address;
  const completeBank = Boolean(bank.bank_name?.trim() && bank.iban?.trim() && bank.account_holder_name?.trim());
  const hasBank = Boolean(bank.bank_name || bank.iban || bank.account_holder_name);
  const overview = [
    { label: "Identity", value: submission.status === "verified" ? "Verified" : submission.status === "pending" ? "Under review" : "Rejected", complete: submission.status === "verified", icon: ShieldCheck },
    { label: "Bank", value: completeBank ? "Provided" : hasBank ? "Incomplete" : "Not provided", complete: completeBank, icon: Landmark },
    { label: "Crypto", value: wallet ? "Provided" : "Not provided (optional)", complete: Boolean(wallet), icon: Wallet },
    { label: "Address", value: address ? "Provided" : "Not provided (optional)", complete: Boolean(address), icon: MapPin },
  ];
  return <section aria-label="Saved KYC details" className="space-y-6">
    <header className="flex flex-wrap items-start justify-between gap-3">
      <div><p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-sky-200/65">Your information</p><h3 className="mt-1.5 text-xl font-semibold tracking-tight text-white">Saved details</h3><p className="mt-2 text-sm leading-6 text-blue-100/60">Your submitted account and contact information, in one place.</p></div>
      <span className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 px-2.5 py-1.5 text-xs text-blue-100/60"><LockKeyhole size={12} aria-hidden="true" />Read-only</span>
    </header>
    <ul aria-label="Details completion" className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      {overview.map(({ label, value, complete, icon: Icon }) => <li key={label} aria-label={`${label}: ${value}`} className="min-w-0 rounded-xl border border-white/[0.07] bg-white/[0.025] px-3.5 py-3">
        <div className="flex items-center gap-2 text-xs text-blue-100/55"><Icon size={14} aria-hidden="true" />{label}</div>
        <p className={`mt-2 flex items-start gap-1.5 text-xs font-medium leading-5 ${complete ? "text-emerald-200" : "text-blue-100/65"}`}><span className={`mt-1.5 size-1.5 shrink-0 rounded-full ${complete ? "bg-emerald-300" : "bg-blue-100/30"}`} />{value}</p>
      </li>)}
    </ul>
    <div className="grid items-start gap-4 lg:grid-cols-2">
      <DetailCard title="Bank details" subtitle="Receiving bank account" icon={Landmark} provided={completeBank}>
        {hasBank ? <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Bank" value={bank.bank_name} />
          <Field label="Account Holder Name" value={bank.account_holder_name} />
          <Field label="Bank country or region" value={countryName(bank.country_code)} />
          <Field label="IBAN" value={bank.iban} identifier />
        </dl> : <p className="py-3 text-sm leading-6 text-blue-100/50">Bank details have not been provided.</p>}
      </DetailCard>
      <DetailCard title="Crypto wallet details" subtitle="Optional receiving wallet" icon={Wallet} provided={Boolean(wallet)}>
        {wallet ? <dl className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
          <Field label="Cryptocurrency" value={wallet.cryptocurrency} />
          <Field label="Blockchain network" value={CRYPTO_NETWORKS.find(network => network.value === wallet.network)?.label || wallet.network} />
          <Field label="Wallet address" value={wallet.address} identifier />
        </dl> : <p className="py-3 text-sm leading-6 text-blue-100/50">Optional crypto wallet details have not been provided.</p>}
      </DetailCard>
      <DetailCard title="Residential address" subtitle="Optional contact information" icon={MapPin} provided={Boolean(address)} className="lg:col-span-2">
        {address ? <dl className="grid gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-3">
          {[["Address Line 1", address.line1], ["Address Line 2", address.line2], ["City", address.city], ["State / Province", address.state], ["Postal / ZIP Code", address.postal_code], ["Country", countryName(address.country)]].map(([label, value]) => <Field key={label} label={label} value={value} />)}
        </dl> : <p className="py-3 text-sm leading-6 text-blue-100/50">Optional residential address details have not been provided.</p>}
      </DetailCard>
    </div>
    <p className="flex items-start gap-2 border-t border-white/[0.07] pt-4 text-xs leading-5 text-blue-100/45"><ShieldCheck size={15} aria-hidden="true" className="mt-0.5 shrink-0" />Identity approval does not verify bank or wallet ownership. These details are read-only and visible only to you and authorized KYC reviewers.</p>
  </section>;
}
