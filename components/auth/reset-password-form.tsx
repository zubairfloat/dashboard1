"use client";

import Link from "next/link";
import { useState } from "react";
import { supabase } from "@/lib/supabase/client";
import AuthField from "./auth-field";
import styles from "./auth.module.css";

export default function ResetPasswordForm() {
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setError("");
    if (password.length < 6) { setError("Use at least 6 characters."); return; }
    if (password !== confirmation) { setError("Passwords do not match."); return; }
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) { setError(error.message); return; }
      setPassword(""); setConfirmation(""); setDone(true);
      // End this recovery session after the password is successfully changed.
      await supabase.auth.signOut({ scope: "local" });
    } catch { setError("Unable to connect. Please check your connection and try again."); }
    finally { setBusy(false); }
  }

  if (done) return <div className={styles.form}><p role="status" className={styles.success}>Your password has been updated. You can now sign in with your new password.</p><Link href="/login" className={styles.primary}>Sign in</Link></div>;
  return <form onSubmit={submit} className={styles.form} aria-busy={busy}>
    <AuthField id="new-password" label="New password" type="password" autoComplete="new-password" required minLength={6} disabled={busy} aria-describedby="reset-password-hint" value={password} onChange={event => setPassword(event.target.value)} />
    <p id="reset-password-hint" className={styles.hint}>Use at least 6 characters.</p>
    <AuthField id="confirm-password" label="Confirm new password" type="password" autoComplete="new-password" required disabled={busy} value={confirmation} onChange={event => setConfirmation(event.target.value)} />
    {error && <p role="alert" className={styles.error}>{error} <Link href="/forgot-password">Request a new reset link</Link></p>}
    <button type="submit" disabled={busy} className={styles.primary}>{busy ? "Updating…" : "Update password"}</button>
  </form>;
}
