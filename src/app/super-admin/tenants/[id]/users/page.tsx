'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { tenantUserService } from '@/lib/tenantUserService';
import {
  CreateTenantUserPayload,
  TenantUser,
  TenantUserRole,
  TenantUsersData,
} from '@/types/tenantUser';
import {
  Users,
  UserPlus,
  Search,
  Filter,
  RefreshCw,
  ArrowLeft,
  ShieldCheck,
  ShieldAlert,
  KeyRound,
  LogOut,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Building2,
  PackageCheck,
  Layers,
  Sparkles,
  ChevronRight,
  MoreVertical,
  X,
  Lock,
  Headset,
} from 'lucide-react';
import StartSupportModal from '@/components/support/StartSupportModal';

export default function TenantUsersManagementPage() {
  const params = useParams();
  const router = useRouter();
  const tenantId = params.id as string;

  const [data, setData] = useState<TenantUsersData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [page, setPage] = useState<number>(1);
  const [notification, setNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState<boolean>(false);
  const [userToDeactivate, setUserToDeactivate] = useState<TenantUser | null>(null);
  const [userToRevoke, setUserToRevoke] = useState<TenantUser | null>(null);
  const [userToReset, setUserToReset] = useState<TenantUser | null>(null);
  const [userToImpersonate, setUserToImpersonate] = useState<TenantUser | null>(null);

  // Form State
  const [createForm, setCreateForm] = useState<CreateTenantUserPayload>({
    name: '',
    email: '',
    role: 'staff',
    is_active: true,
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);

  const fetchUsers = useCallback(async () => {
    try {
      setLoading(true);
      const res = await tenantUserService.getTenantUsers(tenantId, {
        search: search || undefined,
        role: roleFilter !== 'all' ? roleFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        page,
        per_page: 15,
      });
      setData(res);
    } catch (err: any) {
      console.error('Failed to load tenant users:', err);
      setNotification({
        type: 'error',
        message: err?.response?.data?.message || 'Failed to load tenant users. Verify tenant ID.',
      });
    } finally {
      setLoading(false);
    }
  }, [tenantId, search, roleFilter, statusFilter, page]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const showToast = (type: 'success' | 'error', message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 5000);
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setFormError(null);

    try {
      await tenantUserService.createTenantUser(tenantId, createForm);
      showToast('success', `User '${createForm.name}' created successfully. Password setup process initiated.`);
      setIsCreateOpen(false);
      setCreateForm({ name: '', email: '', role: 'staff', is_active: true });
      fetchUsers();
    } catch (err: any) {
      console.error('Create user error:', err);
      const msg = err?.response?.data?.message || err?.response?.data?.errors?.user_limit?.[0] || 'Failed to create tenant user.';
      setFormError(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (user: TenantUser, newStatus: boolean) => {
    try {
      await tenantUserService.updateUserStatus(tenantId, user.id, newStatus);
      showToast('success', `User '${user.name}' has been ${newStatus ? 'activated' : 'deactivated'} successfully.`);
      setUserToDeactivate(null);
      fetchUsers();
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to update user status.');
    }
  };

  const handleRevokeSessions = async () => {
    if (!userToRevoke) return;
    try {
      const res = await tenantUserService.revokeUserSessions(tenantId, userToRevoke.id);
      showToast('success', res.message || `Active sessions revoked for '${userToRevoke.name}'.`);
      setUserToRevoke(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to revoke user sessions.');
    }
  };

  const handlePasswordReset = async () => {
    if (!userToReset) return;
    try {
      const res = await tenantUserService.initiatePasswordReset(tenantId, userToReset.id);
      showToast('success', res.message || `Password reset flow initiated for '${userToReset.email}'.`);
      setUserToReset(null);
    } catch (err: any) {
      showToast('error', err?.response?.data?.message || 'Failed to initiate password reset.');
    }
  };

  const userLimit = data?.user_limit;
  const isUnlimited = userLimit?.is_unlimited ?? false;
  const maxUsers = userLimit?.max_users ?? -1;
  const activeCount = userLimit?.active_users ?? 0;
  const isAtLimit = !isUnlimited && maxUsers !== -1 && activeCount >= maxUsers;

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Toast Notification */}
      {notification && (
        <div
          className={`p-4 rounded-2xl flex items-center justify-between gap-3 shadow-lg border animate-in fade-in duration-200 ${
            notification.type === 'success'
              ? 'bg-emerald-50 text-emerald-950 border-emerald-200'
              : 'bg-rose-50 text-rose-950 border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {notification.type === 'success' ? (
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            ) : (
              <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
            )}
            <span className="text-sm font-semibold">{notification.message}</span>
          </div>
          <button
            type="button"
            onClick={() => setNotification(null)}
            className="p-1 text-slate-400 hover:text-slate-600 rounded-lg cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Breadcrumb & Navigation Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
            <Link href="/super-admin/dashboard" className="hover:text-indigo-600 transition-colors">
              Super Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <Link href="/super-admin/tenants" className="hover:text-indigo-600 transition-colors">
              Tenants
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-slate-700">{data?.tenant?.name || `Tenant #${tenantId}`}</span>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-indigo-600 font-bold">Users</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Users className="w-7 h-7 text-indigo-600" />
            <span>Tenant Users Administration</span>
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/super-admin/tenants"
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Back to Tenants</span>
          </Link>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            disabled={isAtLimit}
            className={`px-4 py-2.5 rounded-xl font-bold text-sm text-white shadow-md flex items-center gap-2 transition-all cursor-pointer ${
              isAtLimit
                ? 'bg-slate-400 cursor-not-allowed opacity-70'
                : 'bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 shadow-indigo-600/20 hover:scale-[1.02]'
            }`}
          >
            <UserPlus className="w-4 h-4" />
            <span>Add Tenant User</span>
          </button>
        </div>
      </div>

      {/* Tenant Context & Package Limit Banner */}
      {data?.tenant && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 rounded-3xl bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white shadow-xl">
          {/* Tenant Information */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-700/60 pb-4 md:pb-0 md:pr-4">
            <div className="flex items-center gap-2">
              <Building2 className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Organization</span>
            </div>
            <h3 className="text-lg font-black text-white truncate">{data.tenant.name}</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30 uppercase">
                {data.tenant.status}
              </span>
              <span className="text-xs text-slate-400 font-mono">slug: {data.tenant.slug}</span>
            </div>
          </div>

          {/* Active Package Tier */}
          <div className="space-y-1.5 border-b md:border-b-0 md:border-r border-slate-700/60 pb-4 md:pb-0 md:pr-4">
            <div className="flex items-center gap-2">
              <PackageCheck className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Subscription Tier</span>
            </div>
            <h3 className="text-lg font-black text-indigo-200 truncate">
              {data.package ? data.package.name : 'No Active Package'}
            </h3>
            <span className="text-xs text-slate-400">
              Code: <strong className="text-slate-200">{data.package?.code || 'none'}</strong>
            </span>
          </div>

          {/* User Limit Usage */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-indigo-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400">User Seats</span>
              </div>
              <span className="text-xs font-extrabold text-indigo-300">
                {isUnlimited ? (
                  'Unlimited Seats'
                ) : (
                  `${activeCount} / ${maxUsers} Active`
                )}
              </span>
            </div>

            {!isUnlimited && maxUsers > 0 && (
              <div className="w-full bg-slate-700/70 rounded-full h-2.5 overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    isAtLimit
                      ? 'bg-rose-500'
                      : activeCount / maxUsers > 0.8
                      ? 'bg-amber-400'
                      : 'bg-emerald-400'
                  }`}
                  style={{ width: `${Math.min(100, (activeCount / maxUsers) * 100)}%` }}
                />
              </div>
            )}

            <p className="text-xs text-slate-300">
              {isAtLimit ? (
                <span className="text-rose-300 font-bold flex items-center gap-1">
                  <AlertTriangle className="w-3.5 h-3.5" /> Package user limit reached. Upgrade tier to add more users.
                </span>
              ) : (
                `Total users registered: ${userLimit?.total_users || 0}`
              )}
            </p>
          </div>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all text-slate-900"
          />
        </div>

        <div className="flex items-center gap-2.5 w-full sm:w-auto">
          {/* Role Filter */}
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="admin">Tenant Admin</option>
            <option value="staff">Staff</option>
            <option value="viewer">Viewer</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-sm rounded-xl border border-slate-200 bg-white font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
          </select>

          <button
            type="button"
            onClick={() => fetchUsers()}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors cursor-pointer"
            title="Refresh Users"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-sm">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-xs font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-6">User</th>
                <th className="py-3.5 px-6">Email</th>
                <th className="py-3.5 px-6">Role</th>
                <th className="py-3.5 px-6">Status</th>
                <th className="py-3.5 px-6">Created At</th>
                <th className="py-3.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading && (!data?.users || data.users.length === 0) ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <p className="font-semibold text-sm">Loading tenant users...</p>
                  </td>
                </tr>
              ) : !data?.users || data.users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Users className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-700">No users found</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {search ? 'Try adjusting your search criteria.' : 'Create your first user for this tenant.'}
                    </p>
                  </td>
                </tr>
              ) : (
                data.users.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-indigo-50 border border-indigo-100 text-indigo-700 font-black text-xs flex items-center justify-center shrink-0">
                          {user.name.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{user.name}</div>
                          <div className="text-xs text-slate-400">ID: #{user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-slate-700 font-mono text-xs">{user.email}</td>
                    <td className="py-4 px-6">
                      <span
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold capitalize border ${
                          user.role === 'admin'
                            ? 'bg-purple-50 text-purple-800 border-purple-200'
                            : user.role === 'staff'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {user.role}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span
                        className={`inline-flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full font-bold border ${
                          user.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            user.is_active ? 'bg-emerald-500 animate-pulse' : 'bg-slate-400'
                          }`}
                        />
                        {user.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-xs text-slate-500">
                      {new Date(user.created_at).toLocaleDateString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {user.is_active ? (
                          <button
                            type="button"
                            onClick={() => setUserToDeactivate(user)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-700 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer"
                            title="Deactivate User & Revoke Tokens"
                          >
                            Deactivate
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(user, true)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors cursor-pointer"
                            title="Reactivate User"
                          >
                            Activate
                          </button>
                        )}

                        {user.is_active && (
                          <button
                            type="button"
                            onClick={() => setUserToImpersonate(user)}
                            className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 transition-colors cursor-pointer flex items-center gap-1"
                            title="Start Support Mode & Impersonate this user"
                          >
                            <Headset className="w-3 h-3 text-amber-700" />
                            <span>Support</span>
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => setUserToRevoke(user)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Revoke Active Sessions"
                        >
                          <LogOut className="w-3 h-3 text-slate-500" />
                          <span>Revoke</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setUserToReset(user)}
                          className="px-2.5 py-1.5 rounded-lg text-xs font-bold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-colors cursor-pointer flex items-center gap-1"
                          title="Trigger Secure Password Reset"
                        >
                          <KeyRound className="w-3 h-3 text-indigo-600" />
                          <span>Reset</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {data?.pagination && data.pagination.last_page > 1 && (
          <div className="p-4 bg-slate-50/70 border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
            <span>
              Showing Page <strong>{data.pagination.current_page}</strong> of <strong>{data.pagination.last_page}</strong> (
              {data.pagination.total} total users)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-50 cursor-pointer"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= data.pagination.last_page}
                onClick={() => setPage((p) => p + 1)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white font-bold disabled:opacity-50 cursor-pointer"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* CREATE USER MODAL */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200">
            <div className="px-6 pt-6 pb-4 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center font-bold">
                  <UserPlus className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-black">Create Tenant User</h3>
                  <p className="text-xs text-slate-300">Tenant: {data?.tenant?.name}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1.5 text-slate-300 hover:text-white rounded-full hover:bg-white/10 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4">
              {formError && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jane Doe"
                  value={createForm.name}
                  onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. user@tenant.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-medium"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-600 block mb-1">
                  Tenant Role <span className="text-rose-500">*</span>
                </label>
                <select
                  value={createForm.role}
                  onChange={(e) => setCreateForm({ ...createForm, role: e.target.value as TenantUserRole })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/30 text-sm font-semibold cursor-pointer"
                >
                  <option value="staff">Staff (Operational POS, Invoices & Orders)</option>
                  <option value="admin">Tenant Admin (Full Tenant Control & Backups)</option>
                  <option value="viewer">Viewer (Read-only Analytics & Reports)</option>
                </select>
              </div>

              <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-2.5">
                <Lock className="w-4 h-4 text-indigo-700 shrink-0 mt-0.5" />
                <p className="text-xs text-indigo-950 leading-relaxed">
                  <strong>Zero-Trust Credential Security:</strong> An automated, encrypted password setup workflow will be initiated. Passwords are never handled or displayed to Super Admins.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 disabled:opacity-50 cursor-pointer flex items-center gap-2"
                >
                  {isSubmitting && <RefreshCw className="w-4 h-4 animate-spin" />}
                  <span>Create User</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DEACTIVATE CONFIRMATION MODAL */}
      {userToDeactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Deactivate User?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                Are you sure you want to deactivate <strong className="text-slate-900">{userToDeactivate.name}</strong> ({userToDeactivate.email})?
              </p>
            </div>

            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-600 space-y-1">
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>All active sessions & tokens will be revoked</span>
              </div>
              <div className="flex items-center gap-1.5 font-bold text-slate-800">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Historical sales & ledger records remain preserved</span>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToDeactivate(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleToggleStatus(userToDeactivate, false)}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-rose-600 hover:bg-rose-700 text-white shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Deactivate User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* REVOKE SESSIONS CONFIRMATION MODAL */}
      {userToRevoke && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center mx-auto font-bold">
              <LogOut className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Revoke All Active Sessions?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                This will immediately invalidate all Sanctum personal access tokens and active device logins for <strong className="text-slate-900">{userToRevoke.name}</strong>.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToRevoke(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleRevokeSessions}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/20 cursor-pointer"
              >
                Revoke Sessions
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PASSWORD RESET CONFIRMATION MODAL */}
      {userToReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl p-6 space-y-4 border border-slate-100">
            <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mx-auto font-bold">
              <KeyRound className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Initiate Password Reset?</h3>
              <p className="text-xs text-slate-600 leading-relaxed">
                A secure password reset workflow will be registered for <strong className="text-slate-900">{userToReset.email}</strong>. The Super Admin console will not receive or expose any plaintext password.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setUserToReset(null)}
                className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-100 cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handlePasswordReset}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white shadow-md shadow-orange-600/20 cursor-pointer"
              >
                Initiate Reset
              </button>
            </div>
          </div>
        </div>
      )}

      {/* START SUPPORT MODE MODAL */}
      {userToImpersonate && data?.tenant && (
        <StartSupportModal
          isOpen={!!userToImpersonate}
          onClose={() => setUserToImpersonate(null)}
          tenantId={Number(tenantId)}
          tenantName={data.tenant.name}
          preselectedUser={userToImpersonate}
        />
      )}
    </div>
  );
}
