import Link from "next/link";
import type { ReactNode } from "react";
import styles from "./auth.module.css";

export default function AuthShell({ children, signup = false }: { children: ReactNode; signup?: boolean }) {
  return <main className={styles.page}>
    <div className={styles.glow} aria-hidden="true" />
    <div className={styles.layout}>
      <section className={styles.intro}>
        <Link href="/" className={styles.brand}><span className={styles.logo}>A</span> Axnetix<span className={styles.brandDot}>.</span></Link>
        <div className={styles.eyebrow}>YOUR WORKSPACE, CONNECTED</div>
        <h2>One place.<br />More possibilities<span className={styles.brandDot}>.</span></h2>
        <p>Your account, packages and activity — together in a dashboard that keeps things simple.</p>
        <div className={styles.feature}><span aria-hidden="true">↗</span><div><strong>Everything within reach</strong><p>Less searching. More getting things done.</p></div></div>
      </section>
      <section className={styles.card} aria-labelledby="auth-title">
        <header className={styles.header}><span className={styles.eyebrow}>{signup ? "GET STARTED" : "GOOD TO SEE YOU AGAIN"}</span><h1 id="auth-title">{signup ? "Create your account" : "Welcome back"}</h1><p>{signup ? "Make room for your next big idea." : "Sign in to your Axnetix workspace."}</p></header>
        {children}
        <p className={styles.footer}>{signup ? "Already have an account?" : "New to Axnetix?"} <Link href={signup ? "/login" : "/signup"}>{signup ? "Sign in" : "Create an account"} <span aria-hidden="true">↗</span></Link></p>
        <Link href="/" className={styles.back}>← Back to home</Link>
      </section>
    </div>
  </main>;
}
