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

  const loadUsers = async () => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .order("created_at", {
        ascending: false,
      });

    if (error) {
      console.error(error);
      return;
    }
    console.log(data);

    setUsers(data || []);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadUsers();
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

    loadUsers();
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

    loadUsers();
  };

  const totalUsers = users.length;

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
        <StatCard title="Total Users" value={totalUsers} />

        <StatCard title="Pending Users" value={pendingUsers} />

        <StatCard title="Approved Users" value={approvedUsers} />

        <StatCard title="Admins" value={adminUsers} />
      </div>

      {/* Users Table */}

      <div className="mt-8 rounded-3xl border border-white/10 bg-white/5 p-8">
        <h2 className="mb-6 text-2xl font-semibold text-white">
          User Management
        </h2>

        {loading ? (
          <p className="text-white">Loading...</p>
        ) : (
          <div className="overflow-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/10 text-blue-100/60">
                  <th className="pb-4">Username</th>
                  <th className="pb-4">Email</th>
                  <th className="pb-4">Status</th>
                  <th className="pb-4">Tokens</th>
                  <th className="pb-4">Actions</th>
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
                    <td className="py-4 text-white">{user.username}</td>

                    <td className="py-4 text-blue-100/70">{user.email}</td>

                    <td className="py-4">
                      <div className="flex flex-wrap gap-2">
                        {!user.is_admin && (
                          <>
                            {user.is_deleted ? (
                              <button
                                onClick={() => restoreUser(user.id)}
                                className="cursor-pointer rounded bg-purple-600 px-3 py-2 text-white transition hover:bg-purple-700 hover:scale-105"
                              >
                                Restore
                              </button>
                            ) : (
                              <>
                                {!user.is_approved ? (
                                  <button
                                    onClick={() => approveUser(user.id)}
                                    className="cursor-pointer rounded bg-green-500 px-3 py-2 text-white transition hover:bg-green-600 hover:scale-105"
                                  >
                                    Approve
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => revokeUser(user.id)}
                                    className="cursor-pointer rounded bg-yellow-500 px-3 py-2 text-white"
                                  >
                                    Revoke
                                  </button>
                                )}

                                <Link
                                  href={`/dashboard/admin/users/${user.id}/tokens`}
                                  className="cursor-pointer rounded bg-blue-500 px-3 py-2 text-white transition hover:bg-blue-600 hover:scale-105"
                                >
                                  Tokens
                                </Link>

                                <button
                                  onClick={() => deleteUser(user.id)}
                                  className="cursor-pointer rounded bg-red-600 px-3 py-2 text-white transition hover:bg-red-700 hover:scale-105"
                                >
                                  Disable
                                </button>
                              </>
                            )}
                          </>
                        )}
                      </div>
                    </td>

                    <td className="py-4 text-white">{user.remaining_tokens}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
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
