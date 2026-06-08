"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";

type Profile = {
  id: string;
  username: string;
  email: string;
  is_admin: boolean;
  is_approved: boolean;
  total_tokens: number;
  remaining_tokens: number;
};

export default function AdminDashboardPage() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setUsers(data);
    }

    setLoading(false);
  };

  useEffect(() => {
    loadUsers();
  }, []);

  const approveUser = async (id: string) => {
    await supabase
      .from("profiles")
      .update({
        is_approved: true,
      })
      .eq("id", id);

    loadUsers();
  };

  const revokeUser = async (id: string) => {
    await supabase
      .from("profiles")
      .update({
        is_approved: false,
      })
      .eq("id", id);

    loadUsers();
  };

  const totalUsers = users.length;

  const pendingUsers = users.filter(
    (u) => !u.is_approved
  ).length;

  const approvedUsers = users.filter(
    (u) => u.is_approved
  ).length;

  const adminUsers = users.filter(
    (u) => u.is_admin
  ).length;

  if (loading) {
    return (
      <div className="text-white">
        Loading Admin Dashboard...
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-10">
        <h1 className="text-4xl font-bold text-white">
          Super Admin Dashboard
        </h1>

        <p className="mt-2 text-blue-100/70">
          Manage users, approvals, packages and tokens.
        </p>
      </div>

      {/* Stats */}
      <div className="mb-8 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-blue-100/60">
            Total Users
          </h3>

          <p className="mt-3 text-4xl font-bold text-white">
            {totalUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-blue-100/60">
            Pending Users
          </h3>

          <p className="mt-3 text-4xl font-bold text-yellow-400">
            {pendingUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-blue-100/60">
            Approved Users
          </h3>

          <p className="mt-3 text-4xl font-bold text-green-400">
            {approvedUsers}
          </p>
        </div>

        <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
          <h3 className="text-blue-100/60">
            Admin Users
          </h3>

          <p className="mt-3 text-4xl font-bold text-purple-400">
            {adminUsers}
          </p>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          User Management
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-blue-100/60">
                <th className="pb-4">Username</th>
                <th className="pb-4">Email</th>
                <th className="pb-4">Role</th>
                <th className="pb-4">Status</th>
                <th className="pb-4">Tokens</th>
                <th className="pb-4">Actions</th>
              </tr>
            </thead>

            <tbody>
              {users.map((user) => (
                <tr
                  key={user.id}
                  className="border-b border-white/5"
                >
                  <td className="py-4 text-white">
                    {user.username}
                  </td>

                  <td className="py-4 text-blue-100/70">
                    {user.email}
                  </td>

                  <td className="py-4">
                    {user.is_admin ? (
                      <span className="rounded-lg bg-purple-500/20 px-3 py-1 text-purple-300">
                        Admin
                      </span>
                    ) : (
                      <span className="rounded-lg bg-blue-500/20 px-3 py-1 text-blue-300">
                        User
                      </span>
                    )}
                  </td>

                  <td className="py-4">
                    {user.is_approved ? (
                      <span className="rounded-lg bg-green-500/20 px-3 py-1 text-green-300">
                        Approved
                      </span>
                    ) : (
                      <span className="rounded-lg bg-yellow-500/20 px-3 py-1 text-yellow-300">
                        Pending
                      </span>
                    )}
                  </td>

                  <td className="py-4 text-white">
                    {user.remaining_tokens || 0}
                  </td>

                  <td className="py-4">
                    {user.is_approved ? (
                      <button
                        onClick={() =>
                          revokeUser(user.id)
                        }
                        className="rounded-xl bg-red-500 px-4 py-2 text-sm text-white"
                      >
                        Revoke
                      </button>
                    ) : (
                      <button
                        onClick={() =>
                          approveUser(user.id)
                        }
                        className="rounded-xl bg-green-500 px-4 py-2 text-sm text-white"
                      >
                        Approve
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}