import type { ReactNode } from "react";
import styles from "./skeleton.module.css";

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden="true" className={`${styles.block} ${className}`} />;
}

function LoadingRegion({ label, children }: { label: string; children: ReactNode }) {
  return <div role="status" aria-label={label} className="space-y-6"><span className="sr-only">{label}</span><div aria-hidden="true" className="space-y-6">{children}</div></div>;
}

export function RowsSkeleton({ label = "Loading accounts…" }: { label?: string }) {
  return <LoadingRegion label={label}><div className="divide-y divide-white/10">{Array.from({ length: 5 }, (_, i) => <div key={i} className="flex items-center gap-4 p-5">
    <Skeleton className="h-10 w-10 shrink-0 !rounded-full" /><div className="flex-1 space-y-2"><Skeleton className="h-4 w-36 max-w-full" /><Skeleton className="h-3 w-48 max-w-full" /></div><Skeleton className="hidden h-7 w-20 sm:block" /><Skeleton className="hidden h-9 w-28 md:block" />
  </div>)}</div></LoadingRegion>;
}

export function DocumentsSkeleton({ count = 2 }: { count?: number }) {
  return <LoadingRegion label="Loading documents…"><div className="grid gap-4 md:grid-cols-2">{Array.from({ length: count }, (_, i) => <Skeleton key={i} className="h-72 w-full" />)}</div></LoadingRegion>;
}

export function ReviewSkeleton() {
  return <LoadingRegion label="Loading KYC requests…">{[0, 1, 2].map(i => <div key={i} className="workspace-panel space-y-4 rounded-2xl border border-white/10 p-6"><Skeleton className="h-5 w-40" /><Skeleton className="h-4 w-64 max-w-full" /><Skeleton className="h-4 w-48 max-w-full" /><Skeleton className="h-10 w-36" /></div>)}</LoadingRegion>;
}

export function PageSkeleton({ variant = "overview" }: { variant?: "overview" | "form" | "table" | "profile" | "review" }) {
  return <LoadingRegion label="Loading page…">
    <div className="space-y-3 py-2"><Skeleton className="h-9 w-56 max-w-full" /><Skeleton className="h-4 w-80 max-w-full" /></div>
    {variant === "review" ? <ReviewSkeleton /> : variant === "form" ? <div className="workspace-panel space-y-6 rounded-2xl border border-white/10 p-6"><Skeleton className="h-6 w-44" /><div className="grid gap-6 sm:grid-cols-2">{[0, 1, 2, 3].map(i => <div key={i} className="space-y-3"><Skeleton className="h-4 w-28" /><Skeleton className="h-12 w-full" /></div>)}</div><Skeleton className="h-11 w-36" /></div> : <>
      <div className={`grid gap-5 ${variant === "profile" ? "md:grid-cols-2" : "sm:grid-cols-2 xl:grid-cols-4"}`}>{[0, 1, 2, 3].map(i => <div key={i} className="workspace-panel space-y-4 rounded-2xl border border-white/10 p-6"><Skeleton className="h-4 w-28" /><Skeleton className="h-9 w-24" /><Skeleton className="h-3 w-36 max-w-full" /></div>)}</div>
      <div className="workspace-panel rounded-2xl border border-white/10"><RowsSkeleton label={variant === "table" ? "Loading accounts…" : "Loading details…"} /></div>
    </>}
  </LoadingRegion>;
}

export function ShellSkeleton() {
  return <div className="workspace min-h-screen p-4 md:p-8"><div className="mx-auto max-w-7xl"><div className="mb-10 flex items-center justify-between"><Skeleton className="h-11 w-40" /><Skeleton className="h-11 w-11 !rounded-full" /></div><PageSkeleton /></div></div>;
}
