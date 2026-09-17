import type { KycSubmission } from "@/lib/kyc";

export type DashboardProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  email: string | null;
  is_admin: boolean;
  is_approved: boolean;
  is_deleted: boolean;
  package_name: string | null;
  assigned_tokens: number;
  bonus_tokens: number;
  total_tokens: number;
  remaining_tokens: number;
  current_rate: number;
  purchase_amount: number;
  approval_deadline: string | null;
  approved_at: string | null;
};

export type KycState = {
  ready: boolean;
  admin: boolean;
  reviewer: boolean;
  submission: KycSubmission | null;
  error: string;
};
