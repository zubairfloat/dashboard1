"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AuthField from "./auth-field";
import styles from "./auth.module.css";

export default function ForgotPasswordForm() {
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (error) {
        setError(error.status === 429 ? "Please wait a minute before requesting another reset link." : "Unable to send a reset link right now. Please try again later.");
        return;
      }
      setSent(true);
    } catch { setError("Unable to connect. Check your connection and try again."); }
    finally { setBusy(false); }
  }

  if (sent) return <div role="status" className={styles.success}>If an account exists for this email, you’ll receive a password reset link. Check your inbox and spam folder. Open the link in this browser, where you requested it.</div>;
  return <form className={styles.form} onSubmit={submit} aria-busy={busy}>
    <AuthField id="recovery-email" label="Email address" type="email" autoComplete="email" required disabled={busy} placeholder="you@example.com" value={email} onChange={event => setEmail(event.target.value)} />
    {error && <p role="alert" className={styles.error}>{error}</p>}
    <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Sending…" : "Send reset link"}</button>
  </form>;
}
