"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { RowsSkeleton } from "./skeleton";
import { sendApprovalEmail } from "@/lib/email/sendApprovalEmail";
import { supabase } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import {
  ActionButton,
  StatCard,
  StatusBadge,
  UserAvatar,
} from "@/components/dashboard/ui";
import {
  CheckCircle2,
  Clock3,
  Search,
  ShieldCheck,
  Users,
} from "lucide-react";

interface UserProfile {
  id: string;
  username: string | null;
  email: string | null;
  assigned_tokens: number | null;
  bonus_tokens: number | null;
  current_rate: number | null;
  purchase_amount: number | null;
  total_tokens: number | null;
  remaining_tokens: number | null;
  is_approved: boolean | null;
  is_admin: boolean | null;
  is_deleted: boolean | null;
  approved_at?: string | null;
  approval_deadline?: string | null;
}

const PAGE_SIZE = 10;

export default function AdminUsers({ users, stats, totalCount, page, statusFilter, initialSearch, initialNow }: {
  users: UserProfile[];
  stats: { total: number; pending: number; approved: number; admins: number };
  totalCount: number;
  page: number;
  statusFilter: string;
  initialSearch: string;
  initialNow: number;
}) {
  const router = useRouter();
  const [loading, startTransition] = useTransition();
  const [message, setMessage] = useState("");
  const [searchDraft, setSearchDraft] = useState({ source: initialSearch, value: initialSearch });
  const search = searchDraft.source === initialSearch ? searchDraft.value : initialSearch;
  const setSearch = (value: string) => setSearchDraft({ source: initialSearch, value });
  function navigate(nextPage: number, nextStatus = statusFilter, nextSearch = search) {
    const params = new URLSearchParams({ page: String(nextPage), status: nextStatus });
    if (nextSearch.trim()) params.set("search", nextSearch.trim());
    startTransition(() => router.push(`/dashboard/admin?${params}`, { scroll: false }));
  }
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(totalCount / PAGE_SIZE)),
    [totalCount],
  );

  const loadUsers = async () => { startTransition(() => router.refresh()); };
  useEffect(() => {
    if (search === initialSearch) return;
    const timer = setTimeout(() => {
      const params = new URLSearchParams({ page: "1", status: statusFilter });
      if (search.trim()) params.set("search", search.trim());
      startTransition(() => router.replace(`/dashboard/admin?${params}`, { scroll: false }));
    }, 350);
    return () => clearTimeout(timer);
  }, [search, initialSearch, statusFilter, router, startTransition]);

  const approveUser = async (id: string) => {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, username, assigned_tokens, total_tokens")
      .eq("id", id)
      .single();

    if (profileError || !userProfile) {
      setMessage("User not found.");
      return;
    }

    if (
      Number(userProfile.assigned_tokens || 0) <= 0 ||
      Number(userProfile.total_tokens || 0) <= 0
    ) {
      setMessage("Assign tokens before approving this user.");
      return;
    }

    const { error } = await supabase
      .from("profiles")
      .update({
        is_approved: true,
        approved_at: new Date().toISOString(),
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    try {
      await sendApprovalEmail(
        userProfile.email || "",
        userProfile.username || "User",
      );
      setMessage(`User approved. Email sent to ${userProfile.email}.`);
    } catch (err) {
      console.error(err);
      setMessage("User approved, but the approval email could not be sent.");
    }

    await loadUsers();
  };

  const revokeUser = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_approved: false })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User approval revoked.");
    await loadUsers();
  };

  const deleteUser = async (id: string) => {
    const confirmed = window.confirm("Disable this user?");
    if (!confirmed) return;

    const { error } = await supabase
      .from("profiles")
      .update({
        is_deleted: true,
        is_approved: false,
      })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User disabled.");
    await loadUsers();
  };

  const restoreUser = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({ is_deleted: false })
      .eq("id", id);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage("User restored.");
    await loadUsers();
  };

  return (
    <div className="space-y-8">
      <ActionButton href="/dashboard/admin/kyc" tone="primary">
        <ShieldCheck size={18} /> Review KYC submissions
      </ActionButton>
      <div className="flex flex-col gap-5 workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-6 shadow-2xl shadow-blue-950/20 backdrop-blur-xl md:p-8 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <StatusBadge status="admin" label="Super admin" />
          <h1 className="mt-4 text-3xl font-bold text-white md:text-5xl">
            User Management
          </h1>
          <p className="mt-2 max-w-2xl text-blue-100/70">
            Review accounts, manage approval state, assign tokens, and keep the
            approval workflow moving.
          </p>
        </div>
        <div className="text-sm text-blue-100/60">
          Showing {users.length} of {totalCount} users
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        <StatCard title="Total Users" value={stats.total} icon={Users} />
        <StatCard
          title="Pending Users"
          value={stats.pending}
          icon={Clock3}
          tone="amber"
        />
        <StatCard
          title="Approved Users"
          value={stats.approved}
          icon={CheckCircle2}
          tone="green"
        />
        <StatCard
          title="Admins"
          value={stats.admins}
          icon={ShieldCheck}
          tone="violet"
        />
      </div>

      <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] p-5 shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="grid gap-3 md:grid-cols-[1fr_220px]">
          <label className="relative">
            <Search
              size={18}
              className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-100/45"
            />
            <input
              type="text"
              placeholder="Search by username or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
              }}
              className="h-12 w-full rounded-xl border border-white/10 bg-white/5 pl-11 pr-4 text-white placeholder:text-blue-100/40 outline-none transition focus:border-blue-300/60 focus:bg-white/10"
            />
          </label>

          <select
            value={statusFilter}
            onChange={(e) => {
              navigate(1, e.target.value);
            }}
            className="h-12 rounded-xl border border-white/10 bg-blue-950/80 px-4 text-white outline-none transition focus:border-blue-300/60"
          >
            <option value="all">All Users</option>
            <option value="approved">Approved</option>
            <option value="pending">Pending</option>
            <option value="disabled">Disabled</option>
          </select>
        </div>

        {message && (
          <div className="mt-4 rounded-xl border border-blue-300/20 bg-blue-400/10 p-3 text-sm text-blue-100">
            {message}
          </div>
        )}
      </section>

      <section className="workspace-panel rounded-2xl border border-white/10 bg-white/[0.07] shadow-2xl shadow-blue-950/20 backdrop-blur-xl">
        <div className="border-b border-white/10 p-5">
          <h2 className="text-xl font-semibold text-white">Accounts</h2>
          <p className="mt-1 text-sm text-blue-100/60">
            Approval status, token balance, and account controls.
          </p>
        </div>

        {loading ? (
          <RowsSkeleton />
        ) : users.length === 0 ? (
          <div className="p-8 text-center text-blue-100/60">
            No users match the current filters.
          </div>
        ) : (
          <>
            <div className="hidden overflow-x-auto lg:block">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-xs uppercase text-blue-100/50">
                    <th className="px-5 py-4 font-semibold">User</th>
                    <th className="px-5 py-4 font-semibold">Status</th>
                    <th className="px-5 py-4 font-semibold">Tokens</th>
                    <th className="px-5 py-4 font-semibold">Approval Time</th>
                    <th className="px-5 py-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className="border-b border-white/5 transition hover:bg-white/[0.04]"
                    >
                      <td className="px-5 py-4">
                        <UserIdentity user={user} />
                      </td>
                      <td className="px-5 py-4">
                        <UserStatus user={user} />
                      </td>
                      <td className="px-5 py-4 text-white">
                        <p className="font-semibold">
                          {Number(user.remaining_tokens || 0).toLocaleString("en-US")}
                        </p>
                        <p className="text-xs text-blue-100/50">
                          of {Number(user.total_tokens || 0).toLocaleString("en-US")}
                        </p>
                      </td>
                      <td className="px-5 py-4 text-sm text-blue-100/70">
                        {formatDeadline(user.approval_deadline, initialNow)}
                      </td>
                      <td className="px-5 py-4">
                        <UserActions
                          user={user}
                          approveUser={approveUser}
                          revokeUser={revokeUser}
                          deleteUser={deleteUser}
                          restoreUser={restoreUser}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-4 p-4 lg:hidden">
              {users.map((user) => (
                <article
                  key={user.id}
                  className="workspace-panel rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <UserIdentity user={user} />
                    <UserStatus user={user} />
                  </div>
                  <div className="mt-4 grid grid-cols-2 gap-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm">
                    <div>
                      <p className="text-blue-100/50">Remaining</p>
                      <p className="mt-1 font-semibold text-white">
                        {Number(user.remaining_tokens || 0).toLocaleString("en-US")}
                      </p>
                    </div>
                    <div>
                      <p className="text-blue-100/50">Approval Time</p>
                      <p className="mt-1 text-white">
                        {formatDeadline(user.approval_deadline, initialNow)}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <UserActions
                      user={user}
                      approveUser={approveUser}
                      revokeUser={revokeUser}
                      deleteUser={deleteUser}
                      restoreUser={restoreUser}
                    />
                  </div>
                </article>
              ))}
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 border-t border-white/10 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-blue-100/60">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <ActionButton
              className="workspace-pagination"
              disabled={loading || page === 1}
              onClick={() => navigate(Math.max(1, page - 1))}
            >
              Previous
            </ActionButton>
            <ActionButton
              className="workspace-pagination"
              disabled={loading || page >= totalPages}
              onClick={() => navigate(Math.min(totalPages, page + 1))}
            >
              Next
            </ActionButton>
          </div>
        </div>
      </section>
    </div>
  );
}

function UserIdentity({ user }: { user: UserProfile }) {
  const name = user.username || user.email?.split("@")[0] || "User";

  return (
    <div className="flex min-w-0 items-center gap-3">
      <UserAvatar name={name} />
      <div className="min-w-0">
        <p className="truncate font-semibold text-white">{name}</p>
        <p className="truncate text-sm text-blue-100/60">{user.email}</p>
      </div>
    </div>
  );
}

function UserStatus({ user }: { user: UserProfile }) {
  if (user.is_deleted) return <StatusBadge status="disabled" />;
  if (user.is_admin) return <StatusBadge status="admin" label="Admin" />;
  if (user.is_approved) return <StatusBadge status="approved" />;
  return <StatusBadge status="pending" />;
}

function UserActions({
  user,
  approveUser,
  revokeUser,
  deleteUser,
  restoreUser,
}: {
  user: UserProfile;
  approveUser: (id: string) => void;
  revokeUser: (id: string) => void;
  deleteUser: (id: string) => void;
  restoreUser: (id: string) => void;
}) {
  if (user.is_admin) {
    return <span className="text-sm text-blue-100/50">Admin account</span>;
  }

  if (user.is_deleted) {
    return (
      <ActionButton tone="primary" onClick={() => restoreUser(user.id)}>
        Restore
      </ActionButton>
    );
  }

  return (
    <div className="flex flex-wrap gap-2">
      {!user.is_approved ? (
        <ActionButton tone="success" onClick={() => approveUser(user.id)}>
          Approve
        </ActionButton>
      ) : (
        <ActionButton tone="warning" onClick={() => revokeUser(user.id)}>
          Revoke
        </ActionButton>
      )}
      <ActionButton href={`/dashboard/admin/kyc?user=${user.id}`} tone="primary">
        <ShieldCheck size={16} /> KYC &amp; saved details
      </ActionButton>
      <ActionButton href={`/dashboard/admin/users/${user.id}/tokens`} tone="primary">
        Tokens
      </ActionButton>
      {!user.is_approved && (
        <ActionButton
          href={`/dashboard/admin/users/${user.id}/approval-time`}
          tone="neutral"
        >
          Time
        </ActionButton>
      )}
      <ActionButton tone="danger" onClick={() => deleteUser(user.id)}>
        Disable
      </ActionButton>
    </div>
  );
}

function formatDeadline(deadline: string | null | undefined, now: number) {
  if (!deadline) return "Not set";

  const diff = new Date(deadline).getTime() - now;
  if (Number.isNaN(diff)) return "Invalid date";
  if (diff <= 0) return "Expired";

  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor(
    (diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
  );

  return days > 0 ? `${days}d ${hours}h left` : `${hours}h left`;
}
