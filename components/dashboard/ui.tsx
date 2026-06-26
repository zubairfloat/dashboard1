"use client";

import Link from "next/link";
import type { ComponentType, ReactNode } from "react";
import type { LucideProps } from "lucide-react";
import { cn } from "@/lib/utils";

type Status = "approved" | "pending" | "disabled" | "admin" | "active";

const statusStyles: Record<Status, string> = {
  approved: "border-emerald-400/30 bg-emerald-400/10 text-emerald-200",
  pending: "border-amber-400/30 bg-amber-400/10 text-amber-200",
  disabled: "border-rose-400/30 bg-rose-400/10 text-rose-200",
  admin: "border-sky-400/30 bg-sky-400/10 text-sky-200",
  active: "border-indigo-300/30 bg-indigo-300/10 text-indigo-100",
};

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: ComponentType<LucideProps>;
  tone?: "blue" | "green" | "amber" | "rose" | "violet";
}

const toneStyles: Record<NonNullable<StatCardProps["tone"]>, string> = {
  blue: "from-sky-400/20 to-indigo-400/10 text-sky-200",
  green: "from-emerald-400/20 to-teal-400/10 text-emerald-200",
  amber: "from-amber-400/20 to-orange-400/10 text-amber-200",
  rose: "from-rose-400/20 to-red-400/10 text-rose-200",
  violet: "from-violet-400/20 to-indigo-400/10 text-violet-200",
};

export function StatCard({
  title,
  value,
  description,
  icon: Icon,
  tone = "blue",
}: StatCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl transition hover:border-white/20 hover:bg-white/[0.09]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium text-blue-100/65">{title}</p>
          <p className="mt-3 text-3xl font-bold text-white sm:text-4xl">
            {value}
          </p>
        </div>
        {Icon && (
          <div
            className={cn(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
              toneStyles[tone],
            )}
          >
            <Icon size={20} />
          </div>
        )}
      </div>
      {description && (
        <p className="mt-4 text-sm text-blue-100/55">{description}</p>
      )}
    </div>
  );
}

export function StatusBadge({
  status,
  label,
}: {
  status: Status;
  label?: string;
}) {
  const text =
    label ||
    status.charAt(0).toUpperCase() + status.slice(1);

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold",
        statusStyles[status],
      )}
    >
      {text}
    </span>
  );
}

export function UserAvatar({
  name,
  image,
  className,
}: {
  name?: string | null;
  image?: string | null;
  className?: string;
}) {
  const fallback = (name || "User").trim().charAt(0).toUpperCase() || "U";

  if (image) {
    return (
      <img
        src={image}
        alt={name || "User"}
        className={cn(
          "h-11 w-11 rounded-full border border-white/15 object-cover",
          className,
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        "flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-white to-blue-100 font-bold text-blue-950 shadow-lg shadow-blue-950/20",
        className,
      )}
    >
      {fallback}
    </div>
  );
}

interface ActionButtonProps {
  children: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  tone?: "primary" | "success" | "warning" | "danger" | "neutral";
  className?: string;
}

const actionStyles: Record<NonNullable<ActionButtonProps["tone"]>, string> = {
  primary: "bg-blue-500 text-white hover:bg-blue-400",
  success: "bg-emerald-500 text-white hover:bg-emerald-400",
  warning: "bg-amber-500 text-blue-950 hover:bg-amber-400",
  danger: "bg-rose-500 text-white hover:bg-rose-400",
  neutral: "border border-white/10 bg-white/10 text-white hover:bg-white/15",
};

export function ActionButton({
  children,
  onClick,
  href,
  disabled = false,
  tone = "neutral",
  className,
}: ActionButtonProps) {
  const classes = cn(
    "inline-flex min-h-10 items-center justify-center rounded-xl px-4 py-2 text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-blue-300/60 disabled:cursor-not-allowed disabled:opacity-45",
    actionStyles[tone],
    className,
  );

  if (href) {
    return (
      <Link
        href={disabled ? "#" : href}
        className={cn(classes, disabled && "pointer-events-none opacity-45")}
      >
        {children}
      </Link>
    );
  }

  return (
    <button onClick={onClick} disabled={disabled} className={classes}>
      {children}
    </button>
  );
}

export function LoadingCard({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="rounded-2xl border border-white/10 bg-white/[0.07] px-6 py-5 text-white shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-sky-300" />
          <span className="text-sm font-medium text-blue-100">{label}</span>
        </div>
      </div>
    </div>
  );
}
