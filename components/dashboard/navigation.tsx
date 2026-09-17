"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Coins, Crown, LayoutDashboard, Package, Settings, ShieldCheck, User } from "lucide-react";

export default function Navigation({ isAdmin, hasPackage, hasTokens }: { isAdmin: boolean; hasPackage: boolean; hasTokens: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Profile", icon: User },
    ...(!isAdmin ? [{ href: "/dashboard/kyc", label: "KYC Verification", icon: ShieldCheck }] : []),
    { href: "/dashboard/packages", label: "Packages", icon: Package, disabled: !hasPackage, reason: "No package assigned yet" },
    { href: "/dashboard/tokens", label: "Tokens", icon: Coins, disabled: !hasTokens, reason: "No tokens assigned yet" },
    { href: "/dashboard/settings", label: "Settings", icon: Settings },
    ...(isAdmin ? [{ href: "/dashboard/admin", label: "Admin Panel", icon: Crown }] : []),
  ];
  return <nav className="workspace-navigation" aria-label="Main navigation">
    {items.map(({ href, label, icon: Icon, disabled, reason }) => {
      const active = href === "/dashboard" ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
      return disabled ? <span key={href} className="workspace-nav-link" aria-disabled="true" title={reason}><Icon size={18} aria-hidden="true" />{label}</span> : <Link key={href} href={href} className="workspace-nav-link" aria-current={active ? "page" : undefined}><Icon size={18} aria-hidden="true" />{label}</Link>;
    })}
  </nav>;
}
