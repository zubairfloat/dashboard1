import { createHmac } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

export const runtime = "nodejs";

// The capability is scoped to KYC notifications; the Resend API key never enters the database.
function notificationSecret(key: string) {
  return createHmac("sha256", key).update("kyc-admin-notifications-v1").digest("hex");
}

export async function POST(request: Request) {
  const authorization = request.headers.get("authorization");
  if (!authorization?.startsWith("Bearer ")) return Response.json({ error: "Sign in required." }, { status: 401 });
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return Response.json({ error: "Email notifications are not configured." }, { status: 503 });
  const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user }, error: authError } = await client.auth.getUser(authorization.slice(7));
  if (authError || !user) return Response.json({ error: "Sign in required." }, { status: 401 });

  let id: string | null;
  try {
    const body = await request.json();
    id = body.submissionId ?? null;
    if (id !== null && (typeof id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id))) throw new Error();
  } catch { return Response.json({ error: "Invalid submission." }, { status: 400 }); }

  const secret = notificationSecret(apiKey);
  const { data: job, error: claimError } = await client.rpc("kyc_email_job", { p_secret: secret, p_submission: id });
  if (claimError) return Response.json({ error: "Notification could not be queued for delivery." }, { status: claimError.code === "42501" ? 403 : 503 });
  if (job.state !== "claimed") return Response.json({ state: job.state });

  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://axnetix-dashboard.vercel.app";
    const reviewUrl = new URL(`/dashboard/admin/kyc?request=${job.id}`, appUrl).href;
    const { data, error } = await new Resend(apiKey).emails.send({
      from: process.env.KYC_EMAIL_FROM || "Axnetix <noreply@linkedupai.xyz>",
      to: job.payload.recipients,
      subject: "New KYC verification request submitted",
      text: [
        "A user has submitted identity documents for KYC verification.",
        `Name: ${job.payload.full_name}`,
        `Issuing country: ${job.payload.country}`,
        `Account ID: ${job.payload.user_id}`,
        `Submitted: ${job.payload.submitted_at}`,
        "Status: Documents submitted — under admin review.",
        `Open the request to review the private documents and approve or reject it: ${reviewUrl}`,
      ].join("\n\n"),
    }, { idempotencyKey: `kyc-submission/${job.id}` });
    if (error || !data?.id) throw new Error("Email provider did not accept the notification.");
    const { error: completionError } = await client.rpc("kyc_email_job", {
      p_secret: secret, p_submission: job.id, p_lease: job.lease, p_provider_id: data.id, p_complete: true,
    });
    if (completionError) return Response.json({ error: "Delivery confirmation is pending; it will be retried safely." }, { status: 503 });
    return Response.json({ state: "sent" });
  } catch {
    await client.rpc("kyc_email_job", { p_secret: secret, p_submission: job.id, p_lease: job.lease, p_complete: true });
    return Response.json({ error: "The request is saved. Email delivery will be retried." }, { status: 503 });
  }
}
