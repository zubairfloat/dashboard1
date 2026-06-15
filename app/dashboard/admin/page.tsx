"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import Link from "next/link";
import { sendApprovalEmail } from "@/lib/email/sendApprovalEmail";

interface UserProfile {
  id: string;
  username: string;
  email: string;

  assigned_tokens: number;
  bonus_tokens: number;
  current_rate: number;
  purchase_amount: number;

  total_tokens: number;
  remaining_tokens: number;

  is_approved: boolean;
  is_admin: boolean;
  is_deleted: boolean;

  approved_at?: string;
}

export default function AdminPage() {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);

  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    admins: 0,
  });

  const PAGE_SIZE = 10;

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [statusFilter, setStatusFilter] = useState("all");

  const loadUsers = async () => {
    setLoading(true);

    const from = (page - 1) * PAGE_SIZE;

    const to = from + PAGE_SIZE - 1;

    let query = supabase.from("profiles").select("*", {
      count: "exact",
    });

    if (search.trim()) {
      query = query.or(`username.ilike.%${search}%,email.ilike.%${search}%`);
    }

    if (statusFilter === "approved") {
      query = query.eq("is_approved", true);
    }

    if (statusFilter === "pending") {
      query = query.eq("is_approved", false);
    }

    if (statusFilter === "disabled") {
      query = query.eq("is_deleted", true);
    }

    const { data, error, count } = await query
      .order("created_at", {
        ascending: false,
      })
      .range(from, to);

    if (error) {
      console.error(error);
      setLoading(false);
      return;
    }

    setUsers(data || []);
    setTotalCount(count || 0);
    setLoading(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => {
      loadUsers();
    }, 400);

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, search, statusFilter]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/immutability
    loadStats();
  }, []);

  const approveUser = async (id: string) => {
    const { data: userProfile, error: profileError } = await supabase
      .from("profiles")
      .select("email, username")
      .eq("id", id)
      .single();

    if (profileError || !userProfile) {
      alert("User not found");
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
      alert(error.message);
      return;
    }

    try {
      await sendApprovalEmail(userProfile.email, userProfile.username);
    } catch (err) {
      console.error(err);
    }

    alert(`User approved successfully. Email sent to ${userProfile.email}`);

    await loadUsers();
    await loadStats();
  };

  const revokeUser = async (id: string) => {
    await supabase
      .from("profiles")
      .update({
        is_approved: false,
      })
      .eq("id", id);

    await loadUsers();
    await loadStats();
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
      alert(error.message);
      return;
    }

    await loadUsers();
    await loadStats();
  };

  const restoreUser = async (id: string) => {
    const { error } = await supabase
      .from("profiles")
      .update({
        is_deleted: false,
      })
      .eq("id", id);

    if (error) {
      alert(error.message);
      return;
    }

    await loadUsers();
    await loadStats();
  };

  const loadStats = async () => {
    const { data, error } = await supabase.from("profiles").select(`
        is_approved,
        is_admin,
        is_deleted
      `);

    if (error) {
      console.error(error);
      return;
    }

    const total = data?.length || 0;

    const approved =
      data?.filter((u) => u.is_approved && !u.is_deleted).length || 0;

    const pending =
      data?.filter((u) => !u.is_approved && !u.is_deleted).length || 0;

    const admins = data?.filter((u) => u.is_admin).length || 0;

    setStats({
      total,
      pending,
      approved,
      admins,
    });
  };

  const totalUsers = totalCount;

  const pendingUsers = users.filter((u) => !u.is_approved).length;

  const approvedUsers = users.filter((u) => u.is_approved).length;

  const adminUsers = users.filter((u) => u.is_admin).length;

  return (
    <div>
      <div className="mb-10">
        <h1 className="text-5xl font-bold text-white">Super Admin Dashboard</h1>

        <p className="mt-2 text-blue-100/70">
          Manage users, approvals and tokens
        </p>
      </div>

      {/* Stats */}

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Users" value={stats.total} />

        <StatCard title="Pending Users" value={stats.pending} />

        <StatCard title="Approved Users" value={stats.approved} />

        <StatCard title="Admins" value={stats.admins} />
      </div>

      {/* Users Search */}

      <div className="mt-8 mb-6 flex flex-col gap-4 md:flex-row">
        <input
          type="text"
          placeholder="Search by username or email..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          className="flex-1 rounded-xl border border-white/10 bg-white/5 p-3 text-white placeholder:text-blue-100/40"
        />

        <select
          value={statusFilter}
          onChange={(e) => {
            setPage(1);
            setStatusFilter(e.target.value);
          }}
          className="rounded-xl border border-white/10 bg-white/5 p-3 text-white"
        >
          <option value="all">All Users</option>

          <option value="approved">Approved</option>

          <option value="pending">Pending</option>

          <option value="disabled">Disabled</option>
        </select>
      </div>

      {/* Users Table */}

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          User Management
        </h2>

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-white/10 text-blue-100/60">
                    <th>User</th>
                    <th>Status</th>

                    <th>Tokens</th>
                    <th>Actions</th>
                    <th>Approval Time</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((user) => (
                    <tr
                      key={user.id}
                      className={`border-b border-white/5 ${
                        user.is_deleted ? "bg-red-500/10 opacity-60" : ""
                      }`}
                    >
                      <td className="py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 font-bold text-white">
                            {user.username?.charAt(0).toUpperCase()}
                          </div>

                          <div>
                            <p className="font-medium text-white">
                              {user.username}
                            </p>

                            <p className="text-sm text-blue-100/60">
                              {user.email}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="py-4">
                        {user.is_deleted ? (
                          <span className="rounded-full bg-red-500/20 px-3 py-1 text-xs text-red-300">
                            Disabled
                          </span>
                        ) : user.is_approved ? (
                          <span className="rounded-full bg-green-500/20 px-3 py-1 text-xs text-green-300">
                            Approved
                          </span>
                        ) : (
                          <span className="rounded-full bg-yellow-500/20 px-3 py-1 text-xs text-yellow-300">
                            Pending
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-white">
                        {user.remaining_tokens}
                      </td>

                      <td className="py-4">
                        <div className="flex flex-wrap gap-2">
                          {!user.is_admin && (
                            <>
                              {user.is_deleted ? (
                                <button
                                  onClick={() => restoreUser(user.id)}
                                  className="cursor-pointer rounded bg-purple-600 px-3 py-2 text-white"
                                >
                                  Restore
                                </button>
                              ) : (
                                <>
                                  {!user.is_approved && (
                                    <button
                                      onClick={() => approveUser(user.id)}
                                      className="cursor-pointer rounded bg-green-500 px-3 py-2 text-white"
                                    >
                                      Approve
                                    </button>
                                  )}

                                  {user.is_approved && (
                                    <button
                                      onClick={() => revokeUser(user.id)}
                                      className="cursor-pointer rounded bg-yellow-500 px-3 py-2 text-white"
                                    >
                                      Revoke
                                    </button>
                                  )}

                                  <Link
                                    href={`/dashboard/admin/users/${user.id}/tokens`}
                                    className="cursor-pointer rounded bg-blue-500 px-3 py-2 text-white"
                                  >
                                    Tokens
                                  </Link>

                                  <button
                                    onClick={() => deleteUser(user.id)}
                                    className="cursor-pointer rounded bg-red-600 px-3 py-2 text-white"
                                  >
                                    Disable
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                      <td className="py-4 text-white">
                        {!user.is_approved && (
                          <Link
                            href={`/dashboard/admin/users/${user.id}/approval-time`}
                            className="rounded bg-purple-600 px-3 py-2 text-white hover:bg-purple-700"
                          >
                            Approval Time
                          </Link>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="space-y-4 md:hidden">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`rounded-2xl border p-4 ${
                    user.is_deleted
                      ? "border-red-500/20 bg-red-500/10"
                      : "border-white/10 bg-white/5"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-white">
                        {user.username}
                      </h3>

                      <p className="mt-1 break-all text-sm text-blue-100/70">
                        {user.email}
                      </p>
                    </div>

                    {user.is_deleted ? (
                      <span className="rounded-full bg-red-500/20 px-2 py-1 text-xs text-red-300">
                        Disabled
                      </span>
                    ) : user.is_approved ? (
                      <span className="rounded-full bg-green-500/20 px-2 py-1 text-xs text-green-300">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-full bg-yellow-500/20 px-2 py-1 text-xs text-yellow-300">
                        Pending
                      </span>
                    )}
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    <span className="text-sm text-blue-100/60">
                      Remaining Tokens
                    </span>

                    <span className="font-semibold text-white">
                      {user.remaining_tokens}
                    </span>
                  </div>

                  {!user.is_admin && (
                    <div className="mt-4 grid grid-cols-2 gap-2">
                      {user.is_deleted ? (
                        <button
                          onClick={() => restoreUser(user.id)}
                          className="rounded-lg bg-purple-600 px-3 py-2 text-sm text-white"
                        >
                          Restore
                        </button>
                      ) : (
                        <>
                          {!user.is_approved && (
                            <button
                              onClick={() => approveUser(user.id)}
                              className="cursor-pointer rounded-lg bg-green-500 px-3 py-2 text-sm text-white"
                            >
                              Approve
                            </button>
                          )}

                          {user.is_approved && (
                            <button
                              onClick={() => revokeUser(user.id)}
                              className="cursor-pointer rounded-lg bg-yellow-500 px-3 py-2 text-sm text-white"
                            >
                              Revoke
                            </button>
                          )}

                          <Link
                            href={`/dashboard/admin/users/${user.id}/tokens`}
                            className="cursor-pointer rounded-lg bg-blue-500 px-3 py-2 text-center text-sm text-white"
                          >
                            Tokens
                          </Link>

                          <button
                            onClick={() => deleteUser(user.id)}
                            className="cursor-pointer rounded-lg bg-red-600 px-3 py-2 text-sm text-white"
                          >
                            Disable
                          </button>

                          {!user.is_approved && (
                            <Link
                              href={`/dashboard/admin/users/${user.id}/approval-time`}
                              className="rounded bg-purple-600 px-3 py-2 text-white hover:bg-purple-700"
                            >
                              Approval Time
                            </Link>
                          )}
                        </>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        <div className="mt-8 flex items-center justify-center gap-4">
          <button
            disabled={page === 1}
            onClick={() => setPage((prev) => prev - 1)}
            className="cursor-pointer rounded-lg bg-white/10 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          <span className="text-white">
            Page {page} of {Math.max(1, Math.ceil(totalCount / PAGE_SIZE))}
          </span>

          <button
            disabled={page >= Math.ceil(totalCount / PAGE_SIZE)}
            onClick={() => setPage((prev) => prev + 1)}
            className="cursor-pointer rounded-lg bg-white/10 px-4 py-2 text-white disabled:cursor-not-allowed disabled:opacity-40"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}

function StatCard({ title, value }: { title: string; value: number }) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
      <h3 className="text-blue-100/60">{title}</h3>

      <p className="mt-3 text-4xl font-bold text-white">{value}</p>
    </div>
  );
}
