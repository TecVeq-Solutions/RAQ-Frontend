'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { authService } from '@/lib/auth';
import { Database, Download, RefreshCw, ShieldCheck, ShieldAlert } from 'lucide-react';

export default function BackupPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);

  useEffect(() => {
    if (!authService.isAdmin()) {
      setIsAuthorized(false);
    }
  }, []);

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-8 text-center max-w-lg mx-auto my-12 animate-fadeIn">
        <ShieldAlert className="w-12 h-12 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-rose-900">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-rose-700 mt-2">
          Only users with the <strong>Administrator</strong> role are authorized to access System Backup & Recovery.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-4 py-2 bg-rose-600 text-white font-semibold text-xs rounded-xl hover:bg-rose-700 transition-colors cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Database Backup & Recovery</h1>
          <p className="text-sm text-slate-500">System backup archives and restore safety operations (PRD N-03, N-04)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between p-4 rounded-xl bg-emerald-50 border border-emerald-200">
          <div className="flex items-center gap-3">
            <ShieldCheck className="w-6 h-6 text-[#16A34A]" />
            <div>
              <h3 className="font-bold text-[#0F172A] text-sm">Automatic Daily Backups Active</h3>
              <p className="text-xs text-slate-600">Database safety logs scheduled automatically for system recovery</p>
            </div>
          </div>

          <button className="px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold text-xs hover:bg-[#059669] transition-all flex items-center gap-2 shadow-xs cursor-pointer">
            <Download className="w-4 h-4" /> Create Manual Backup
          </button>
        </div>

        <div className="border border-slate-100 rounded-xl overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-100 font-bold text-xs uppercase tracking-wider text-slate-500">
            Backup Archives History
          </div>
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-400 font-bold border-b border-slate-100">
              <tr>
                <th className="py-2.5 px-4">Filename</th>
                <th className="py-2.5 px-4">Size</th>
                <th className="py-2.5 px-4">Created Date</th>
                <th className="py-2.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              <tr>
                <td className="py-3 px-4 font-mono font-bold text-[#0F172A]">backup-sales-2026-08-27.sql.gz</td>
                <td className="py-3 px-4 text-slate-500">4.2 MB</td>
                <td className="py-3 px-4 text-slate-500">2026-08-27 02:00 AM</td>
                <td className="py-3 px-4 text-right">
                  <button className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 ml-auto cursor-pointer">
                    <RefreshCw className="w-3.5 h-3.5" /> Restore
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
