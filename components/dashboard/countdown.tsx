"use client";
import { useEffect, useState } from "react";

export default function Countdown({ deadline, initialNow }: { deadline: string | null; initialNow: number }) {
  const [now, setNow] = useState(initialNow);
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, []);
  if (!deadline) return <>Not set</>;
  const diff = new Date(deadline).getTime() - now;
  if (!Number.isFinite(diff)) return <>Invalid date</>;
  if (diff <= 0) return <>Review window elapsed</>;
  const days = Math.floor(diff / 86400000);
  const hours = Math.floor(diff % 86400000 / 3600000);
  const minutes = Math.floor(diff % 3600000 / 60000);
  const seconds = Math.floor(diff % 60000 / 1000);
  return <>{days}d {hours}h {minutes}m {seconds}s</>;
}
