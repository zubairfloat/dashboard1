"use client";

import { useState } from "react";
import AuthField from "./auth-field";
import styles from "./auth.module.css";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const handleSignup = async () => {
    setErrorMessage("");
    setSuccessMessage("");

    if (!username.trim() || !email.trim() || !password || !confirmPassword) {
      setErrorMessage("Please fill all fields.");
      return;
    }

    if (username.length < 3) {
      setErrorMessage("Username must be at least 3 characters.");
      return;
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      setErrorMessage(
        "Username can only contain letters, numbers and underscore.",
      );
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      setErrorMessage("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);

    try {
      // Check username already exists
      const { data: existingUsername } = await supabase
        .from("profiles")
        .select("id")
        .eq("username", username)
        .maybeSingle();

      if (existingUsername) {
        setErrorMessage(
          "Username already exists. Please choose another username.",
        );
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
          },
          emailRedirectTo: `${window.location.origin}/auth/confirmed`,
        },
      });

      if (error) {
        setErrorMessage(error.message);
        setLoading(false);
        return;
      }

      // Existing email check
      if (
        data.user &&
        data.user.identities &&
        data.user.identities.length === 0
      ) {
        setErrorMessage(
          "An account with this email already exists. Please login instead.",
        );
        setLoading(false);
        return;
      }
      const approvalHours = 72;

      // Insert profile
      if (data.user) {
        const { error: profileError } = await supabase.from("profiles").upsert({
          id: data.user.id,
          username,
          email,

          is_approved: false,

          approval_deadline: new Date(
            Date.now() + approvalHours * 60 * 60 * 1000,
          ).toISOString(),
        });

        if (profileError) {
          console.error(profileError);
        }
      }

      setSuccessMessage(
        "Account created successfully. Please check your email and click the verification link.",
      );

      setUsername("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error(err);

      setErrorMessage("Something went wrong. Please try again.");
    }

    setLoading(false);
  };

  return <form className={styles.form} onSubmit={(event) => { event.preventDefault(); void handleSignup(); }} aria-busy={loading}>
    <AuthField id="username" label="Username" type="text" autoComplete="username" required minLength={3} placeholder="Choose a username" value={username} onChange={e => setUsername(e.target.value)} />
    <AuthField id="email" label="Email address" type="email" autoComplete="email" required placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
    <AuthField id="password" label="Password" type="password" autoComplete="new-password" required minLength={6} aria-describedby="password-hint" placeholder="Create a password" value={password} onChange={e => setPassword(e.target.value)} />
    <p id="password-hint" className={styles.hint}>Use at least 6 characters.</p>
    <AuthField id="confirm-password" label="Confirm password" type="password" autoComplete="new-password" required placeholder="Re-enter your password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
    {errorMessage && <div role="alert" className={styles.error}>{errorMessage}</div>}
    {successMessage && <div role="status" className={styles.success}>{successMessage}</div>}
    <button type="submit" disabled={loading} className={styles.primary}>{loading && <span aria-hidden="true" className={styles.spinner} />}<span>{loading ? "Creating account…" : "Create account"}</span>{!loading && <span aria-hidden="true">→</span>}</button>
  </form>;
}
