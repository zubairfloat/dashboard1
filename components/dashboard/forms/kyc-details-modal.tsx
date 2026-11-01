"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";
import { X } from "lucide-react";

export default function KycDetailsModal({ title, description, busy, onClose, children }: { title: string; description: string; busy: boolean; onClose: () => void; children: ReactNode }) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    element?.showModal();
    return () => { element?.close(); document.body.style.overflow = overflow; if (previous?.isConnected) previous.focus(); };
  }, []);
  return <dialog ref={dialog} aria-labelledby={titleId} aria-describedby={descriptionId} aria-busy={busy}
    onCancel={event => { event.preventDefault(); if (!busy) onClose(); }}
    className="fixed inset-0 m-auto max-h-[90dvh] w-[calc(100%_-_2rem)] max-w-2xl overflow-y-auto overscroll-contain rounded-2xl border border-white/15 bg-[#111d32] p-0 text-white shadow-2xl backdrop:bg-black/70">
    <header className="sticky top-0 z-10 flex items-start justify-between gap-4 border-b border-white/10 bg-[#111d32] p-5 sm:p-6">
      <div><h2 id={titleId} className="text-xl font-semibold" tabIndex={-1}>{title}</h2><p id={descriptionId} className="mt-2 text-sm leading-6 text-blue-100/75">{description}</p></div>
      <button autoFocus disabled={busy} type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg p-2 text-blue-100 hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-cyan-200 disabled:opacity-40"><X size={20} /></button>
    </header>
    <div className="p-5 sm:p-6">{children}</div>
  </dialog>;
}
