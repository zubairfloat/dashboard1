import { supabase } from "@/lib/supabase/client";

export async function notifyKyc(submissionId?: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return false;
    const response = await fetch("/api/kyc/notify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ submissionId }),
    });
    if (!response.ok) return false;
    const result = await response.json();
    return result.state === "sent";
  } catch { return false; }
}
