'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import { User, Role } from '@/types/auth';
import { UserCog, UserPlus, ShieldAlert, CheckCircle, XCircle, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function UsersManagementPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useEffect(() => {
    // Check if current user is admin
    if (!authService.isAdmin()) {
      setIsAuthorized(false);
      setLoading(false);
      return;
    }

    fetchUsers();
  }, []);

  const fetchUsers = () => {
    apiClient
      .get<{ success: boolean; data: User[] }>('/admin/users')
      .then((res) => {
        if (res.data?.data) {
          setUsers(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load users:', err);
        if (err.response?.status === 403) {
          setIsAuthorized(false);
        }
      })
      .finally(() => setLoading(false));
  };

  const toggleUserStatus = async (userId: number, currentStatus: boolean) => {
    setActionLoading(userId);
    try {
      await apiClient.patch(`/admin/users/${userId}/status`, {
        is_active: !currentStatus,
      });
      // Refresh list
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status.');
    } finally {
      setActionLoading(null);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 animate-fadeIn">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-rose-900">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-rose-700 mt-2">
          Only users with the <strong>Administrator</strong> role are authorized to access User Management & Governance.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-4 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A]">User Management</h1>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
              <ShieldCheck className="w-3 h-3" /> Admin Exclusive
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-0.5">Control staff credentials, roles, and active statuses</p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm">
          <UserPlus className="w-4 h-4" /> Add System User
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A] text-sm">
            <UserCog className="w-4 h-4 text-[#16A34A]" />
            Registered Staff & Admin Accounts
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">User Details</th>
                <th className="px-6 py-3">Email Address</th>
                <th className="px-6 py-3">Assigned Role</th>
                <th className="px-6 py-3">Account Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.length > 0 ? (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-slate-100 font-bold text-slate-700 flex items-center justify-center text-xs">
                          {u.name.charAt(0)}
                        </div>
                        <span className="font-semibold text-[#0F172A]">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{u.email}</td>
                    <td className="px-6 py-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                          u.role === 'admin'
                            ? 'bg-purple-100 text-purple-800'
                            : u.role === 'staff'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {u.role}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {u.is_active ? (
                        <span className="inline-flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                          <CheckCircle className="w-4 h-4" /> Active
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-rose-500 text-xs font-semibold">
                          <XCircle className="w-4 h-4" /> Deactivated
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => toggleUserStatus(u.id, u.is_active)}
                        disabled={actionLoading === u.id || u.role === 'admin'}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === u.id
                          ? 'Updating...'
                          : u.is_active
                          ? 'Deactivate'
                          : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    {loading ? 'Fetching system users...' : 'No users found.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
