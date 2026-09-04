'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import {
  Database,
  Download,
  RefreshCw,
  Trash2,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  Loader2,
  CheckCircle2,
  AlertCircle,
  FileArchive,
  HardDrive,
  Calendar,
  Clock,
  Lock,
  Sparkles,
  Server,
} from 'lucide-react';

interface BackupItem {
  id: number;
  filename: string;
  size_bytes: number;
  size_formatted: string;
  status: 'completed' | 'failed' | 'in_progress';
  created_by: string;
  created_at: string;
}

export default function BackupPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // Restore Modal State
  const [selectedRestoreBackup, setSelectedRestoreBackup] = useState<BackupItem | null>(null);
  const [confirmCheckbox, setConfirmCheckbox] = useState(false);
  const [restoring, setRestoring] = useState(false);

  // Delete Modal State
  const [selectedDeleteBackup, setSelectedDeleteBackup] = useState<BackupItem | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!authService.isAdmin()) {
      setIsAuthorized(false);
    }
  }, []);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const res = await apiClient.get('/backups');
      if (res.data?.data) {
        setBackups(res.data.data);
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthorized(false);
      } else {
        setActionError(err.response?.data?.message || 'Failed to load backup history.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchBackups();
    }
  }, [isAuthorized, fetchBackups]);

  // Handle Manual Backup Creation
  const handleCreateBackup = async () => {
    setCreating(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await apiClient.post('/backups');
      if (res.data?.success) {
        setActionSuccess(res.data.message || 'Database backup created successfully.');
        fetchBackups();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to generate database backup.');
    } finally {
      setCreating(false);
    }
  };

  // Handle Download Backup
  const handleDownload = (backup: BackupItem) => {
    apiClient
      .get(`/backups/${backup.id}/download`, { responseType: 'blob' })
      .then((response) => {
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', backup.filename);
        document.body.appendChild(link);
        link.click();
        link.remove();
      })
      .catch(() => {
        setActionError('Failed to download backup file. Please try again.');
      });
  };

  // Handle Execute Restore
  const handleExecuteRestore = async () => {
    if (!selectedRestoreBackup || !confirmCheckbox) return;

    setRestoring(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await apiClient.post(`/backups/${selectedRestoreBackup.id}/restore`);
      if (res.data?.success) {
        setActionSuccess(res.data.message || 'Database successfully restored from backup archive.');
        setSelectedRestoreBackup(null);
        setConfirmCheckbox(false);
        fetchBackups();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Restore failed. The database has been preserved.');
    } finally {
      setRestoring(false);
    }
  };

  // Handle Execute Delete
  const handleExecuteDelete = async () => {
    if (!selectedDeleteBackup) return;

    setDeleting(true);
    setActionError(null);
    setActionSuccess(null);

    try {
      const res = await apiClient.delete(`/backups/${selectedDeleteBackup.id}`);
      if (res.data?.success) {
        setActionSuccess('Backup archive deleted successfully.');
        setSelectedDeleteBackup(null);
        fetchBackups();
      }
    } catch (err: any) {
      setActionError(err.response?.data?.message || 'Failed to delete backup.');
    } finally {
      setDeleting(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50/80 backdrop-blur-xs border border-rose-200 rounded-3xl p-10 text-center max-w-lg mx-auto my-16 shadow-lg shadow-rose-600/5 animate-fadeIn">
        <div className="w-16 h-16 rounded-3xl bg-rose-100 text-rose-600 flex items-center justify-center mx-auto mb-5 shadow-inner">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-rose-950">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-rose-800 mt-2 font-medium leading-relaxed">
          Only users with the <strong>Administrator</strong> role are authorized to manage and restore system backups.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-7 py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black text-sm rounded-2xl shadow-md shadow-rose-600/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-7 animate-fadeIn w-full pb-20">
      {/* Top Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 p-7 sm:p-9 text-white shadow-xl shadow-slate-900/10 border border-slate-700/50">
        <div className="absolute right-0 top-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-10 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 text-xs font-bold uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Enterprise Recovery Engine (PRD N-03, N-04)</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-white">
              Database Backup & Recovery
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium">
              Create instant full-database snapshots, manage automated Gzip schedules, and restore system state with safety safeguards.
            </p>
          </div>

          <button
            type="button"
            onClick={handleCreateBackup}
            disabled={creating}
            className="inline-flex items-center justify-center gap-3 px-7 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-black text-sm sm:text-base shadow-xl shadow-emerald-500/25 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer shrink-0 border border-emerald-400/30"
          >
            {creating ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Generating Backup...</span>
              </>
            ) : (
              <>
                <Download className="w-5 h-5" />
                <span>Create Manual Backup</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Action Alerts */}
      {actionError && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-3 shadow-xs animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600" />
          <span>{actionError}</span>
        </div>
      )}

      {actionSuccess && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm font-bold flex items-center gap-3 shadow-xs animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600" />
          <span>{actionSuccess}</span>
        </div>
      )}

      {/* Feature Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="group bg-gradient-to-br from-emerald-50/60 via-white to-white rounded-3xl p-6 sm:p-7 border border-emerald-200/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shrink-0 shadow-inner group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Automated Daily Backup Scheduler
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 font-bold text-[10px] uppercase">
                  Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Executes daily at <strong>02:00 AM</strong>. Backups are compressed with native Gzip (<code className="text-xs font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-emerald-200">.sql.gz</code>) and pruned automatically per retention threshold.
              </p>
            </div>
          </div>
        </div>

        <div className="group bg-gradient-to-br from-blue-50/60 via-white to-white rounded-3xl p-6 sm:p-7 border border-blue-200/60 shadow-sm hover:shadow-md transition-all">
          <div className="flex items-start gap-4">
            <div className="w-13 h-13 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0 shadow-inner group-hover:scale-110 transition-transform">
              <Lock className="w-7 h-7" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-black text-base sm:text-lg text-slate-900">
                  Production Restore Safeguard
                </h3>
                <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 font-bold text-[10px] uppercase">
                  Protected
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 font-medium leading-relaxed">
                Every restore operation creates an automatic pre-restore safety snapshot (<code className="text-xs font-mono font-bold bg-white px-1.5 py-0.5 rounded border border-blue-200">pre_restore_*.sql.gz</code>) to prevent accidental data loss.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Backup Archives Table Card */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold shadow-xs">
              <FileArchive className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-black text-base sm:text-lg text-slate-900">
                Available Backup Archives
              </h2>
              <p className="text-xs text-slate-500 font-medium">
                {backups.length} snapshot{backups.length !== 1 ? 's' : ''} stored in local persistent disk
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={fetchBackups}
            disabled={loading}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold text-xs sm:text-sm shadow-xs transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Refresh Backups"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : 'text-slate-500'}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead className="bg-slate-50/90 text-xs uppercase font-bold text-slate-600 border-b border-slate-200 tracking-wider">
              <tr>
                <th className="py-4.5 px-6">Archive Filename</th>
                <th className="py-4.5 px-6">File Size</th>
                <th className="py-4.5 px-6">Created By</th>
                <th className="py-4.5 px-6">Timestamp</th>
                <th className="py-4.5 px-6">Status</th>
                <th className="py-4.5 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Loader2 className="w-8 h-8 animate-spin text-emerald-600" />
                      <span className="font-bold text-sm text-slate-600">Loading backup archives...</span>
                    </div>
                  </td>
                </tr>
              ) : backups.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-slate-400">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <div className="w-16 h-16 rounded-3xl bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
                        <Database className="w-8 h-8 stroke-[1.5]" />
                      </div>
                      <p className="font-black text-slate-800 text-lg">No backup archives found</p>
                      <p className="text-sm text-slate-400 max-w-sm">
                        Click &quot;Create Manual Backup&quot; above or wait for the daily 02:00 AM scheduler to generate an archive.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                backups.map((b) => (
                  <tr key={b.id} className="hover:bg-slate-50/80 transition-colors group">
                    <td className="py-4.5 px-6">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-200/60 font-bold shrink-0">
                          <HardDrive className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="font-mono font-bold text-slate-900 text-sm block">
                            {b.filename}
                          </span>
                          <span className="text-[11px] font-mono text-slate-400">
                            ID: #{b.id} • gzip compressed
                          </span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-slate-100 text-slate-800 font-bold text-xs font-mono">
                        {b.size_formatted}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="font-semibold text-slate-700 text-sm">
                        {b.created_by}
                      </span>
                    </td>
                    <td className="py-4.5 px-6">
                      <div className="text-slate-600 font-medium text-sm flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{b.created_at}</span>
                      </div>
                    </td>
                    <td className="py-4.5 px-6">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        {b.status}
                      </span>
                    </td>
                    <td className="py-4.5 px-6 text-right">
                      <div className="inline-flex items-center gap-2 justify-end">
                        <button
                          type="button"
                          onClick={() => handleDownload(b)}
                          title="Download Gzip Backup (.sql.gz)"
                          className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-105 active:scale-95"
                        >
                          <Download className="w-4 h-4 text-slate-600" />
                          <span>Download</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setSelectedRestoreBackup(b);
                            setConfirmCheckbox(false);
                          }}
                          title="Restore database from this archive"
                          className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/20 transition-all flex items-center gap-1.5 cursor-pointer hover:scale-105 active:scale-95"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Restore</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedDeleteBackup(b)}
                          title="Delete archive permanently"
                          className="p-2 rounded-xl text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Restore Warning Confirmation Modal */}
      {selectedRestoreBackup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 animate-scaleUp">
            <div className="p-6 sm:p-7 bg-rose-50 border-b border-rose-100 flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                <AlertTriangle className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h3 className="font-black text-xl text-rose-950">Critical: Confirm Database Restore</h3>
                <p className="text-xs sm:text-sm text-rose-800 font-medium leading-relaxed">
                  Restoring this backup will replace the current database state. Any transactions, sales, purchases, or ledger
                  entries created after <strong>{selectedRestoreBackup.created_at}</strong> will be overwritten.
                </p>
              </div>
            </div>

            <div className="p-6 sm:p-7 space-y-5 text-sm">
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200/90 space-y-3 font-mono text-xs sm:text-sm">
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">Selected Archive:</span>
                  <span className="font-bold text-slate-900">{selectedRestoreBackup.filename}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">Archive Size:</span>
                  <span className="font-bold text-slate-900">{selectedRestoreBackup.size_formatted}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-500 font-sans font-bold">Creation Date:</span>
                  <span className="font-bold text-slate-900">{selectedRestoreBackup.created_at}</span>
                </div>
              </div>

              <label className="flex items-start gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-950 font-bold text-xs sm:text-sm cursor-pointer shadow-2xs">
                <input
                  type="checkbox"
                  checked={confirmCheckbox}
                  onChange={(e) => setConfirmCheckbox(e.target.checked)}
                  className="mt-0.5 w-5 h-5 rounded text-rose-600 focus:ring-rose-500 cursor-pointer"
                />
                <span>
                  I understand that this action is irreversible and I want to restore the database from this archive.
                </span>
              </label>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedRestoreBackup(null);
                    setConfirmCheckbox(false);
                  }}
                  disabled={restoring}
                  className="px-6 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-sm transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={!confirmCheckbox || restoring}
                  className="px-7 py-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-xl shadow-rose-600/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105 active:scale-95"
                >
                  {restoring ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Restoring Database...</span>
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-5 h-5" />
                      <span>Confirm & Restore Database</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {selectedDeleteBackup && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8 p-6 sm:p-7 space-y-5 text-sm animate-scaleUp">
            <div className="flex items-center gap-4">
              <div className="w-13 h-13 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold shrink-0 shadow-inner">
                <Trash2 className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-lg text-slate-900">Delete Backup Archive</h3>
                <p className="text-slate-500 text-xs mt-0.5">This file will be permanently removed from disk.</p>
              </div>
            </div>

            <p className="text-slate-700 font-medium text-sm">
              Are you sure you want to delete archive <strong className="text-slate-900 font-mono text-xs">{selectedDeleteBackup.filename}</strong>?
            </p>

            <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => setSelectedDeleteBackup(null)}
                disabled={deleting}
                className="px-5 py-3 rounded-2xl bg-slate-100 hover:bg-slate-200 font-bold text-slate-700 text-sm transition-colors cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleExecuteDelete}
                disabled={deleting}
                className="px-6 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm shadow-lg shadow-rose-600/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                <span>Delete Permanently</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
