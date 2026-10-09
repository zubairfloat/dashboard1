export const KYC_BUCKET = "kyc-documents";
export const MAX_KYC_FILE_BYTES = 5 * 1024 * 1024;
export const KYC_FILE_ACCEPT = ".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf";
export const KYC_FILE_HELP = "JPG, JPEG, PNG or PDF · Maximum 5 MB per file";

export const KYC_DOCUMENT_TYPES = {
  national_id: { label: "National ID Card", uploads: [{ key: "front", label: "Front of ID card" }, { key: "back", label: "Back of ID card" }] },
  passport: { label: "Passport", uploads: [{ key: "front", label: "Passport photo / details page" }] },
  driving_license: { label: "Driving License", uploads: [{ key: "front", label: "Front of driving license" }, { key: "back", label: "Back of driving license" }] },
} as const;
export type KycDocumentType = keyof typeof KYC_DOCUMENT_TYPES;
export function isKycDocumentType(value: string): value is KycDocumentType {
  return Object.hasOwn(KYC_DOCUMENT_TYPES, value);
}
export function getKycDocument(type: KycDocumentType | undefined) {
  return KYC_DOCUMENT_TYPES[type || "national_id"];
}
export type KycSubmission = {
  id: string; user_id: string; full_name: string; country: string;
  country_code: string | null;
  bank_name: string | null;
  iban: string | null;
  document_type: KycDocumentType;
  status: "pending" | "verified" | "rejected";
  rejection_reason: string | null; created_at: string; reviewed_at: string | null;
};

export async function validateKycFile(file: File): Promise<string> {
  if (!(file instanceof File) || !file.size) throw new Error("Choose a non-empty file for each required document page.");
  if (file.size > MAX_KYC_FILE_BYTES) throw new Error("Each file must be 5 MB or smaller.");
  const extension = file.name.split(".").pop()?.toLowerCase();
  const expected = extension === "jpg" || extension === "jpeg" ? "image/jpeg" : extension === "png" ? "image/png" : extension === "pdf" ? "application/pdf" : null;
  if (!expected || (file.type && file.type !== expected)) throw new Error("Supported file formats: JPG, JPEG, PNG and PDF.");
  const bytes = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = [137, 80, 78, 71, 13, 10, 26, 10].every((value, i) => bytes[i] === value);
  const pdf = [37, 80, 68, 70, 45].every((value, i) => bytes[i] === value);
  if (!(expected === "image/jpeg" ? jpeg : expected === "image/png" ? png : pdf)) throw new Error("The file contents do not match its format. Upload a valid JPG, JPEG, PNG or PDF.");
  return expected;
}
