'use client';

import React from 'react';
import Link from 'next/link';
import { CreditCard, Plus, CheckCircle2 } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Payment Receipts & History</h1>
          <p className="text-sm text-slate-500">Track customer payment collections and ledger updates (PRD E-01)</p>
        </div>

        <Link
          href="/payments/receive"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-teal-600 text-white font-semibold hover:bg-teal-700 transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Receive Payment
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <CreditCard className="w-4 h-4 text-teal-600" /> Payment Transaction History
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Customer payment collections automatically credit the customer's ledger balance.
        </div>
      </div>
    </div>
  );
}
