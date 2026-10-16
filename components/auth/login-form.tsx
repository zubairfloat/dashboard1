"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { migrateLegacySession } from "@/lib/supabase/legacy-session";
import { supabase } from "@/lib/supabase/client";
import AuthField from "./auth-field";
import styles from "./auth.module.css";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => { void migrateLegacySession(); }, []);

  const handleLogin = async () => {
    setErrorMessage("");

    if (!email.trim() || !password) {
      setErrorMessage("Please enter your email and password.");
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (error) {
      setErrorMessage(error.message);
      return;
    }

    window.location.href = "/dashboard";
  };

  const handleGoogleLogin = async () => {
    setErrorMessage("");

    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) {
      setErrorMessage(error.message);
    }
  };

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void handleLogin(); }} aria-busy={loading}>
    <button type="button" onClick={handleGoogleLogin} disabled={loading} className={styles.google}><span aria-hidden="true" className="text-lg font-bold">G</span> Continue with Google</button>
    <div className={styles.divider}>or sign in with email</div>
    <AuthField id="email" label="Email address" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
    <AuthField id="password" label="Password" type="password" autoComplete="current-password" required placeholder="Enter your password" value={password} onChange={e => setPassword(e.target.value)} />
    <Link href="/forgot-password" className={styles.forgot}>Forgot password?</Link>
    {errorMessage && <div role="alert" className={styles.error}>{errorMessage}</div>}
    <button type="submit" disabled={loading} className={styles.primary}>{loading && <span aria-hidden="true" className={styles.spinner} />}<span>{loading ? "Signing in…" : "Sign in"}</span>{!loading && <span aria-hidden="true">→</span>}</button>
  </form>;
}
