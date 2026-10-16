"use client";

import { KYC_COUNTRIES } from "@/lib/kyc-countries";
import { CRYPTO_NETWORKS, emptyAddress, type CryptoWallet, type ResidentialAddress } from "@/lib/kyc-optional";

const inputClass = "mt-2 block w-full rounded-xl border border-white/15 bg-[#0c162a] p-3.5 text-white focus:border-sky-300/60 focus:outline-none focus:ring-2 focus:ring-sky-300/15";
const sectionClass = "rounded-2xl border border-white/10 bg-white/[0.03] p-4 sm:p-5";
export function KycOptionalDetails({ enabled, onEnabled, wallet, onWallet, address, onAddress, error }: {
  enabled: boolean; onEnabled: (value: boolean) => void;
  wallet: CryptoWallet; onWallet: (value: CryptoWallet) => void;
  address: ResidentialAddress; onAddress: (value: ResidentialAddress) => void;
  error: string | null;
}) {
  return <div className="space-y-4">
    <details className={sectionClass}>
      <summary className="cursor-pointer font-medium text-blue-100">Crypto Wallet Details (Optional)</summary>
      <div className="mt-4 space-y-4">
        <label className="flex items-center gap-3 text-sm text-blue-100"><input type="checkbox" checked={enabled} onChange={event => onEnabled(event.target.checked)} aria-controls="kyc-wallet-fields" />I would like to add my crypto wallet details.</label>
        {enabled && <div id="kyc-wallet-fields" className="grid gap-4 sm:grid-cols-2">
          <label className="text-sm text-blue-100">Cryptocurrency<select value={wallet.cryptocurrency} onChange={event => onWallet({ cryptocurrency: event.target.value, network: "", address: "" })} className={inputClass}><option value="">Select cryptocurrency</option>{["BTC", "ETH", "USDT"].map(value => <option key={value}>{value}</option>)}</select></label>
          <label className="text-sm text-blue-100">Blockchain Network<select value={wallet.network} onChange={event => onWallet({ ...wallet, network: event.target.value, address: "" })} className={inputClass}><option value="">Select network</option>{CRYPTO_NETWORKS.filter(network => network.currencies.includes(wallet.cryptocurrency)).map(network => <option key={network.value} value={network.value}>{network.label}</option>)}</select></label>
          <label className="text-sm text-blue-100 sm:col-span-2">Wallet Address<input value={wallet.address} onChange={event => onWallet({ ...wallet, address: event.target.value })} maxLength={128} spellCheck={false} autoCapitalize="none" autoComplete="off" aria-describedby="kyc-wallet-help kyc-wallet-format" className={`${inputClass} font-mono`} /></label>
          <p id="kyc-wallet-format" className="text-xs text-blue-100/60 sm:col-span-2">Address format checks only; checksum, ownership and network activity are not verified.</p>
        </div>}
        <p id="kyc-wallet-help" className="text-xs leading-5 text-blue-100/60">Crypto wallet details are optional. Please ensure the wallet address and selected network are correct.</p>
      </div>
    </details>
    <details className={sectionClass}>
      <summary className="cursor-pointer font-medium text-blue-100">Residential Address (Optional)</summary>
      <p className="mt-4 text-xs leading-5 text-blue-100/60">Leave this section blank to skip it. If provided, enter Address Line 1, City and Country. State / Province and Postal / ZIP Code can be left blank where not applicable.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        {([
          ["line1", "Address Line 1", "address-line1"], ["line2", "Address Line 2 (Optional)", "address-line2"],
          ["city", "City", "address-level2"], ["state", "State / Province", "address-level1"], ["postal_code", "Postal / ZIP Code", "postal-code"],
        ] as const).map(([key, label, autoComplete]) => <label key={key} className="text-sm text-blue-100">{label}<input value={address[key]} onChange={event => onAddress({ ...address, [key]: event.target.value })} maxLength={key === "postal_code" ? 32 : 200} autoComplete={autoComplete} className={inputClass} /></label>)}
        <label className="text-sm text-blue-100">Country<select value={address.country} onChange={event => onAddress({ ...address, country: event.target.value })} autoComplete="country" className={inputClass}><option value="">Select country</option>{KYC_COUNTRIES.map(country => <option key={country.code} value={country.code}>{country.name}</option>)}</select></label>
      </div>
      <button type="button" onClick={() => onAddress({ ...emptyAddress })} className="mt-4 text-sm text-sky-300 underline">Clear residential address</button>
    </details>
    {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
  </div>;
}
