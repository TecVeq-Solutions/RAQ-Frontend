'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Clock,
  User,
  Building2,
  AlertTriangle,
  X,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { supportSessionService } from '@/lib/supportSessionService';
import { tenantUserService } from '@/lib/tenantUserService';
import { TenantUser } from '@/types/tenantUser';

interface StartSupportModalProps {
  isOpen: boolean;
  onClose: () => void;
  tenantId: number;
  tenantName: string;
  preselectedUser?: TenantUser | null;
}

const DURATION_OPTIONS = [
  { label: '15 Minutes', value: 15 },
  { label: '30 Minutes', value: 30 },
  { label: '1 Hour (Standard)', value: 60 },
  { label: '2 Hours', value: 120 },
  { label: '4 Hours', value: 240 },
  { label: '8 Hours (Extended)', value: 480 },
];

export default function StartSupportModal({
  isOpen,
  onClose,
  tenantId,
  tenantName,
  preselectedUser,
}: StartSupportModalProps) {
  const router = useRouter();
  const [users, setUsers] = useState<TenantUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState<boolean>(false);
  const [selectedUserId, setSelectedUserId] = useState<number | undefined>(
    preselectedUser ? preselectedUser.id : undefined
  );
  const [reason, setReason] = useState<string>('');
  const [durationMinutes, setDurationMinutes] = useState<number>(60);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;

    if (preselectedUser) {
      setSelectedUserId(preselectedUser.id);
    } else {
      // Fetch tenant users for selection
      setLoadingUsers(true);
      tenantUserService
        .getTenantUsers(tenantId, { per_page: 50, status: 'active' })
        .then((res) => {
          setUsers(res.users);
          if (res.users.length > 0 && !selectedUserId) {
            // Default to first admin or first user
            const adminUser = res.users.find((u) => u.role === 'admin') || res.users[0];
            setSelectedUserId(adminUser.id);
          }
        })
        .catch((err) => {
          console.error('Failed to load tenant users for support modal:', err);
        })
        .finally(() => {
          setLoadingUsers(false);
        });
    }
  }, [isOpen, tenantId, preselectedUser]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason.trim()) {
      setError('A mandatory justification reason is required to start Support Mode.');
      return;
    }

    try {
      setSubmitting(true);
      setError(null);

      await supportSessionService.startSession(tenantId, {
        user_id: selectedUserId,
        reason: reason.trim(),
        duration_minutes: durationMinutes,
      });

      // Redirect Super Admin into Tenant ERP workspace
      window.location.href = '/dashboard';
    } catch (err: any) {
      console.error('Failed to start support session:', err);
      setError(
        err?.response?.data?.message ||
          'Failed to start support session. Please check requirements and try again.'
      );
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200 font-sans">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 bg-slate-900 text-white relative">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="absolute top-5 right-5 p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-2xl bg-amber-500/20 border border-amber-500/30">
              <ShieldAlert className="w-6 h-6 text-amber-400" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-amber-400">
                SaaS Support & Impersonation
              </span>
              <h2 className="text-xl font-black text-white">Start Support Session</h2>
            </div>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed mt-1">
            Initiate a controlled, time-bounded, and fully audited support session to assist{' '}
            <strong className="text-white font-bold">{tenantName}</strong>.
          </p>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2.5 animate-shake">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Organization & Target User */}
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Building2 className="w-4 h-4 text-emerald-600" />
                <div>
                  <span className="text-[11px] font-semibold text-slate-400 block">Organization</span>
                  <span className="text-xs font-bold text-slate-900">{tenantName}</span>
                </div>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md bg-white border border-slate-200 text-slate-600">
                Tenant #{tenantId}
              </span>
            </div>

            {preselectedUser ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <User className="w-4 h-4 text-emerald-600" />
                  <div>
                    <span className="text-[11px] font-semibold text-slate-400 block">Impersonating User</span>
                    <span className="text-xs font-bold text-slate-900">
                      {preselectedUser.name} ({preselectedUser.email})
                    </span>
                  </div>
                </div>
                <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                  {preselectedUser.role}
                </span>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Select Impersonation Account</span>
                  <span className="text-rose-500">*</span>
                </label>
                {loadingUsers ? (
                  <div className="py-3 text-center text-xs text-slate-400">Loading active users...</div>
                ) : (
                  <select
                    value={selectedUserId || ''}
                    onChange={(e) => setSelectedUserId(Number(e.target.value))}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    required
                  >
                    {users.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.name} — {u.email} ({u.role.toUpperCase()})
                      </option>
                    ))}
                  </select>
                )}
              </div>
            )}
          </div>

          {/* Session Duration Selector */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-amber-600" />
              <span>Session Duration (Automatic Expiry)</span>
              <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationMinutes(opt.value)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    durationMinutes === opt.value
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Mandatory Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
              <span className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-emerald-600" />
                <span>Mandatory Support Reason / Ticket</span>
                <span className="text-rose-500">*</span>
              </span>
              <span className="text-[10px] text-slate-400 font-normal">Audit Recorded</span>
            </label>
            <textarea
              rows={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g., Ticket #4928 — Investigating discrepancy in raw material cutting log calculation."
              className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              required
            />
          </div>

          {/* Security & Audit Disclosure Notice */}
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 shrink-0 text-amber-600 mt-0.5" />
            <div className="space-y-1">
              <span className="font-bold block">Strict Auditing & Tenant Isolation Active</span>
              <p className="text-amber-800 leading-normal">
                This temporary session generates a scoped Sanctum token that expires automatically. All operations
                are permanently logged in the system audit logs.
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-bold text-slate-700 hover:bg-slate-50 transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 hover:shadow-lg transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Starting Support Mode...</span>
                </>
              ) : (
                <>
                  <span>Launch Support Mode</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
