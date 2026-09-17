"use client";
import { useState, type InputHTMLAttributes } from "react";
import styles from "./auth.module.css";

export default function AuthField({ label, ...props }: InputHTMLAttributes<HTMLInputElement> & { label: string; id: string }) {
  const [visible, setVisible] = useState(false);
  const password = props.type === "password";
  return <div className={styles.field}>
    <label htmlFor={props.id}>{label}</label>
    <div className={styles.inputWrap}>
      <input {...props} type={password && visible ? "text" : props.type} className={password ? styles.password : undefined} />
      {password && <button type="button" className={styles.reveal} onClick={() => setVisible(!visible)} aria-label={`${visible ? "Hide" : "Show"} ${label.toLowerCase()}`} aria-pressed={visible}>{visible ? "Hide" : "Show"}</button>}
    </div>
  </div>;
}
