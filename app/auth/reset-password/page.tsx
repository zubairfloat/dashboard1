import Link from "next/link";
import AuthShell from "@/components/auth/auth-shell";
import ResetPasswordForm from "@/components/auth/reset-password-form";
import { createServerSupabase } from "@/lib/supabase/server";
import styles from "@/components/auth/auth.module.css";

export default async function Page({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const params = await searchParams;
  const supabase = await createServerSupabase();
  const { data: { user }, error } = await supabase.auth.getUser();
  return <AuthShell recovery="reset">
    {params.error || error || !user ? <div className={styles.form}>
      <p role="alert" className={styles.error}>{params.error === "missing_verifier" ? "The browser session for this reset request is missing. Request a new link in this browser and open only the latest email link here." : "This reset link is invalid or has expired. Request a new link and open it in the same browser where you requested it."}</p>
      <Link href="/forgot-password" className={styles.primary}>Request a new reset link</Link>
    </div> : <ResetPasswordForm />}
  </AuthShell>;
}
