export type CryptoWallet = { cryptocurrency: string; network: string; address: string };
export type ResidentialAddress = { line1: string; line2: string; city: string; state: string; postal_code: string; country: string };
export const CRYPTO_NETWORKS = [
  { value: "bitcoin", label: "Bitcoin", currencies: ["BTC"] },
  { value: "ethereum", label: "Ethereum (ERC20)", currencies: ["ETH", "USDT"] },
  { value: "tron", label: "TRON (TRC20)", currencies: ["USDT"] },
  { value: "bsc", label: "BNB Smart Chain (BEP20)", currencies: ["ETH", "USDT"] },
];
export const emptyAddress: ResidentialAddress = { line1: "", line2: "", city: "", state: "", postal_code: "", country: "" };
export function normalizeAddress(value: ResidentialAddress): ResidentialAddress | null {
  const address = Object.fromEntries(Object.entries(value).map(([key, text]) => [key, text.trim()])) as ResidentialAddress;
  return Object.values(address).some(Boolean) ? address : null;
}
export function validateOptionalDetails(wallet: CryptoWallet | null, address: ResidentialAddress | null): string | null {
  if (wallet) {
    const network = CRYPTO_NETWORKS.find(option => option.value === wallet.network);
    if (!network || !network.currencies.includes(wallet.cryptocurrency)) return "Select a cryptocurrency and a compatible blockchain network.";
    const value = wallet.address.trim();
    const valid = wallet.network === "bitcoin"
      ? /^(?:[13][a-km-zA-HJ-NP-Z1-9]{25,34}|bc1[qp][ac-hj-np-z02-9]{38,58}|BC1[QP][AC-HJ-NP-Z02-9]{38,58})$/.test(value)
      : wallet.network === "tron" ? /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(value) : /^0x[0-9a-fA-F]{40}$/.test(value);
    if (!valid) return `Enter a wallet address in the correct format for ${network.label}.`;
  }
  if (address) {
    const fields = { line1: "Address Line 1", city: "City", country: "Country" } as const;
    for (const [key, label] of Object.entries(fields)) {
      if (!address[key as keyof ResidentialAddress].trim()) return `Enter ${label} or clear the residential address to skip it.`;
    }
    if (!/^[A-Z]{2}$/.test(address.country)) return "Select a residential country.";
    for (const [key, value] of Object.entries(address)) {
      const limit = key === "postal_code" ? 32 : 200;
      if (value.length > limit || /[\u0000-\u001f\u007f]/.test(value)) return "Residential address fields contain invalid characters or are too long.";
    }
  }
  return null;
}
