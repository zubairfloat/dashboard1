"use client";
import { createContext, useContext, useEffect, useState } from "react";
import type { KycState } from "@/lib/dashboard-types";

const KycContext = createContext<KycState | null>(null);

export function KycProvider({ initialState, children }: { initialState: KycState; children: React.ReactNode }) {
  const [state, setState] = useState(initialState);
  useEffect(() => {
    let active = true;
    let controller: AbortController | null = null;
    async function refresh() {
      if (document.visibilityState !== "visible") return;
      controller?.abort();
      controller = new AbortController();
      try {
        const response = await fetch("/api/dashboard/status", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) { window.location.assign("/login"); return; }
        if (!response.ok) throw new Error("Status refresh failed");
        const next: KycState = await response.json();
        if (active) setState(next);
      } catch (error) {
        if (active && !(error instanceof DOMException && error.name === "AbortError")) setState(current => ({ ...current, error: "Could not refresh KYC status. Please check your connection." }));
      }
    }
    // Initial HTML already contains the server result. Do not refetch on hydration.
    const interval = setInterval(() => void refresh(), 15000);
    const update = () => void refresh();
    window.addEventListener("focus", update);
    window.addEventListener("kyc-updated", update);
    document.addEventListener("visibilitychange", update);
    return () => {
      active = false; controller?.abort(); clearInterval(interval);
      window.removeEventListener("focus", update);
      window.removeEventListener("kyc-updated", update);
      document.removeEventListener("visibilitychange", update);
    };
  }, []);
  return <KycContext.Provider value={state}>{children}</KycContext.Provider>;
}

export function useKycContext() {
  const state = useContext(KycContext);
  if (!state) throw new Error("KYC status requires the dashboard provider.");
  return state;
}
