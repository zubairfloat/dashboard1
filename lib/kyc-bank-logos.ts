import sources from "@/public/banks/sources.json";

// Key by country as different institutions can share a display name (e.g. Ahli Bank).
const logos = new Map(sources.filter(source => source.path).map(source => [`${source.country}:${source.bank}`, source.path!]));

export function getKycBankLogo(country: string, bank: string): string | undefined {
  return logos.get(`${country}:${bank}`);
}
