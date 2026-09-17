import { getKycState } from "@/lib/dashboard-data";
import { isRedirectError } from "next/dist/client/components/redirect-error";

export async function GET() {
  try {
    return Response.json(await getKycState(), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({ error: "Unable to refresh account." }, { status: isRedirectError(error) ? 401 : 503, headers: { "Cache-Control": "private, no-store" } });
  }
}
