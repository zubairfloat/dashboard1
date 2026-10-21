"use client";

import { useId, useRef, useState } from "react";
import { Popover } from "radix-ui";
import { Check, ChevronsUpDown, Globe2, Landmark, Search, Plus, type LucideIcon } from "lucide-react";

export type KycPickerOption = { value: string; label: string; detail?: string; logo?: string };

function BankLogo({ src }: { src: string }) {
  const [failed, setFailed] = useState(false);
  if (failed) return <Landmark size={18} aria-hidden="true" />;
  // Local bank-site assets are already icon-sized; preserve ICO support.
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" width={28} height={28} loading="lazy" onError={() => setFailed(true)} className="size-7 rounded-sm object-contain" />;
}

export function KycPicker({ label, placeholder, searchPlaceholder, options, value, onChange, kind, disabled = false }: {
  label: string;
  placeholder: string;
  searchPlaceholder: string;
  options: readonly KycPickerOption[];
  value: string;
  onChange: (value: string) => void;
  kind: "country" | "bank";
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const labelId = useId();
  const valueId = useId();
  const selected = options.find(option => option.value === value);
  const filtered = options.filter(option => option.value === "other" || `${option.label} ${option.value}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase()));
  const Icon: LucideIcon = kind === "country" ? Globe2 : Landmark;

  return <div className="space-y-2">
    <p id={labelId} className="text-sm font-medium text-blue-100">{label}</p>
    <Popover.Root open={open} onOpenChange={next => { setOpen(next); setQuery(""); }}>
      <Popover.Trigger asChild>
        <button type="button" disabled={disabled} aria-labelledby={`${labelId} ${valueId}`} className="group flex min-h-16 w-full items-center gap-3 rounded-2xl border border-white/15 bg-[#0c162a] px-4 py-3 text-left transition hover:border-sky-300/40 hover:bg-[#101e35] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300 disabled:cursor-not-allowed disabled:opacity-50">
          <span aria-hidden="true" className={`flex size-10 shrink-0 items-center justify-center rounded-xl border ${selected?.logo ? "border-white/15 bg-white text-slate-500" : "border-sky-300/10 bg-sky-300/10 text-sky-200"}`}>{selected?.logo ? <BankLogo key={selected.logo} src={selected.logo} /> : <Icon size={19} />}</span>
          <span id={valueId} className={`min-w-0 flex-1 break-words text-sm ${selected ? "font-medium text-white" : "text-blue-100/50"}`}>{selected?.label || placeholder}</span>
          <ChevronsUpDown aria-hidden="true" size={16} className="shrink-0 text-blue-100/40" />
        </button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content ref={contentRef} align="start" sideOffset={8} collisionPadding={16} aria-label={label} onOpenAutoFocus={event => { event.preventDefault(); searchRef.current?.focus(); }} onKeyDown={event => {
          if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
          const buttons = Array.from(contentRef.current?.querySelectorAll<HTMLButtonElement>("button[data-option]") || []);
          if (!buttons.length) return;
          event.preventDefault();
          const index = buttons.indexOf(document.activeElement as HTMLButtonElement);
          const next = index < 0 ? (event.key === "ArrowDown" ? 0 : buttons.length - 1) : (index + (event.key === "ArrowDown" ? 1 : -1) + buttons.length) % buttons.length;
          buttons[next].focus();
        }} className="z-50 flex max-h-[min(420px,var(--radix-popover-content-available-height))] w-[var(--radix-popover-trigger-width)] flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#101b2e] text-slate-100 shadow-2xl shadow-black/40 outline-none">
          <div className="flex shrink-0 items-center gap-3 border-b border-white/10 px-4 py-3">
            <Search size={17} aria-hidden="true" className="shrink-0 text-sky-300" />
            <input ref={searchRef} value={query} onChange={event => setQuery(event.target.value)} onKeyDown={event => { if (event.key === "Enter") event.preventDefault(); }} aria-label={searchPlaceholder} placeholder={searchPlaceholder} className="min-w-0 flex-1 bg-transparent py-1 text-sm text-white outline-none placeholder:text-slate-500" />
          </div>
          <div className="min-h-0 overflow-y-auto overscroll-contain p-2">
            <p className="px-3 py-2 text-[10px] font-semibold tracking-[0.16em] text-slate-400">{kind === "bank" ? "SELECT YOUR BANK" : "COUNTRIES & REGIONS"}</p>
            {!filtered.some(option => option.value !== "other") && <p role="status" className="px-3 py-5 text-sm text-slate-400">No matches found.{kind === "bank" ? " You can enter your bank below." : " Try another search."}</p>}
            {filtered.map(option => <button key={option.value} type="button" data-option aria-pressed={value === option.value} onClick={() => { onChange(option.value); setOpen(false); setQuery(""); }} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition hover:bg-white/5 focus-visible:bg-sky-300/10 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-sky-300/60 ${value === option.value ? "bg-sky-300/10 text-sky-100" : "text-slate-200"} ${option.value === "other" ? "mt-2 border-t border-white/10" : ""}`}>
              <span aria-hidden="true" className={`flex size-9 shrink-0 items-center justify-center rounded-lg text-[11px] font-semibold ${option.logo ? "bg-white text-slate-500" : option.value === "other" ? "bg-white/5 text-slate-400" : "bg-sky-300/10 text-sky-200"}`}>{option.value === "other" ? <Plus size={17} /> : kind === "country" ? option.value : option.logo ? <BankLogo key={option.logo} src={option.logo} /> : <Landmark size={17} />}</span>
              <span className="min-w-0 flex-1"><span className="block break-words">{option.label}</span>{option.detail && <span className="mt-0.5 block text-xs text-slate-400">{option.detail}</span>}</span>
              {value === option.value && <Check size={17} aria-hidden="true" className="shrink-0 text-sky-300" />}
            </button>)}
          </div>
          <div className="shrink-0 border-t border-white/10 px-4 py-2.5 text-[11px] text-slate-400">Use ↑ ↓ to browse · Enter to select · Esc to close</div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  </div>;
}
