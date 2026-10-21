// Curated country directory, not an exhaustive registry. Sources are in docs/kyc.md.
export const KYC_BANKS: Record<string, readonly string[]> = {
  "PK": [
    "Al Baraka Bank Pakistan",
    "Allied Bank",
    "Askari Bank",
    "Bank AL Habib",
    "Bank Alfalah",
    "BankIslami Pakistan",
    "Dubai Islamic Bank Pakistan",
    "Faysal Bank",
    "Habib Bank Limited (HBL)",
    "Habib Metropolitan Bank",
    "JS Bank",
    "MCB Bank",
    "MCB Islamic Bank",
    "Meezan Bank",
    "National Bank of Pakistan",
    "Sindh Bank",
    "Soneri Bank",
    "Standard Chartered Pakistan",
    "The Bank of Khyber",
    "The Bank of Punjab",
    "United Bank Limited (UBL)"
  ],
  "AE": [
    "Abu Dhabi Commercial Bank",
    "Abu Dhabi Islamic Bank",
    "Ajman Bank",
    "Al Hilal Bank",
    "Dubai Islamic Bank",
    "Emirates Islamic",
    "Emirates NBD",
    "First Abu Dhabi Bank",
    "Mashreq Bank",
    "Sharjah Islamic Bank"
  ],
  "SA": [
    "Al Rajhi Bank",
    "Alinma Bank",
    "Arab National Bank",
    "Bank Albilad",
    "Bank AlJazira",
    "Banque Saudi Fransi",
    "Gulf International Bank - Saudi Arabia",
    "Riyad Bank",
    "Saudi Awwal Bank (SAB)",
    "Saudi Investment Bank",
    "Saudi National Bank"
  ],
  "GB": [
    "Bank of Scotland",
    "Barclays",
    "HSBC UK",
    "Lloyds Bank",
    "Metro Bank",
    "Monzo Bank",
    "NatWest",
    "Royal Bank of Scotland",
    "Santander UK",
    "Starling Bank",
    "The Co-operative Bank",
    "TSB Bank"
  ],
  "QA": [
    "Ahli Bank",
    "Commercial Bank of Qatar",
    "Doha Bank",
    "Dukhan Bank",
    "HSBC Qatar",
    "Masraf Al Rayan",
    "Qatar International Islamic Bank",
    "Qatar Islamic Bank",
    "Qatar National Bank (QNB)"
  ],
  "OM": [
    "Ahli Bank",
    "Al Izz Islamic Bank",
    "Bank Dhofar",
    "Bank Muscat",
    "Bank Nizwa",
    "National Bank of Oman",
    "Oman Arab Bank",
    "Sohar International"
  ],
  "KW": [
    "Al Ahli Bank of Kuwait",
    "Burgan Bank",
    "Commercial Bank of Kuwait",
    "Gulf Bank",
    "National Bank of Kuwait"
  ],
  "FR": [
    "BNP Paribas",
    "Banque Populaire",
    "Caisse d’Epargne",
    "Crédit Agricole",
    "Crédit Mutuel",
    "LCL",
    "La Banque Postale",
    "Société Générale"
  ],
  "ES": [
    "BBVA",
    "Banco Sabadell",
    "Banco Santander",
    "Bankinter",
    "CaixaBank"
  ]
};

export function getKycBanks(country: string): readonly string[] {
  return Object.hasOwn(KYC_BANKS, country) ? KYC_BANKS[country] : [];
}

// Illustrative examples only; never use these as a submitted field value.
const IBAN_EXAMPLES: Record<string, string> = {
  PK: "PK36 SCBL 0000 0011 2345 6702",
  AE: "AE07 0331 2345 6789 0123 456",
  SA: "SA03 8000 0000 6080 1016 7519",
  GB: "GB82 WEST 1234 5698 7654 32",
  QA: "QA58 DOHB 0000 1234 5678 90AB CDEFG",
  OM: "OM04 0280 0000 1234 5678 901",
  KW: "KW81 CBKU 0000 0000 0000 1234 5601 01",
  FR: "FR14 2004 1010 0505 0001 3M02 606",
  ES: "ES91 2100 0418 4502 0005 1332",
};

export function getKycIbanExample(country: string): string | null {
  return Object.hasOwn(IBAN_EXAMPLES, country) ? IBAN_EXAMPLES[country] : null;
}

export function normalizeIban(value: string): string {
  return value.replace(/\s/g, "").toUpperCase();
}

// Format/checksum validation only; it does not prove ownership or account existence.
export function validateKycBank(country: string, bank: string, otherBank: string, value: string): string | null {
  if (!/^[A-Z]{2}$/.test(country)) return "Select a country first.";
  if (bank !== "other" && !getKycBanks(country).includes(bank)) return "Select a bank for your country.";
  if (bank === "other" && (otherBank.trim().length < 2 || otherBank.trim().length > 150)) return "Enter your bank’s name (2–150 characters).";
  const iban = normalizeIban(value);
  if (country === "PK" && iban.length !== 24) return `Pakistan IBAN must contain exactly 24 characters (letters and numbers). You entered ${iban.length}; spaces do not count.`;
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]{11,30}$/.test(iban)) return "Enter a valid IBAN, including its country code and check digits.";
  if (!iban.startsWith(country)) return "The IBAN must belong to the selected country. Check your country and IBAN.";
  const lengths: Record<string, number> = { PK: 24, AE: 23, SA: 24, GB: 22 };
  if (lengths[country] && iban.length !== lengths[country]) return `The IBAN for this country must contain ${lengths[country]} characters.`;
  // Pakistan intentionally checks format only, regardless of the selected bank.
  if (country === "PK") return /^PK[0-9]{2}[A-Z]{4}[A-Z0-9]{16}$/.test(iban)
    ? null : "Use Pakistan IBAN format: PK, 2 digits, 4 bank-code letters and 16 account characters.";
  const rearranged = iban.slice(4) + iban.slice(0, 4);
  let remainder = 0;
  for (const character of rearranged) {
    const digits = /[A-Z]/.test(character) ? String(character.charCodeAt(0) - 55) : character;
    for (const digit of digits) remainder = (remainder * 10 + Number(digit)) % 97;
  }
  return remainder === 1 ? null : "The IBAN checksum is invalid. Check the number on your bank statement.";
}
