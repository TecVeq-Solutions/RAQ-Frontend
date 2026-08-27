'use client';

import React from 'react';
import Link from 'next/link';
import { FileSpreadsheet, Plus } from 'lucide-react';

export default function ExpensesPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Expense History</h1>
          <p className="text-sm text-slate-500">Log and monitor operational business expenditures (PRD E-02, E-03)</p>
        </div>

        <Link
          href="/expenses/new"
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-rose-600 text-white font-semibold hover:bg-rose-700 transition-all shadow-sm text-sm"
        >
          <Plus className="w-4 h-4" /> Add Expense
        </Link>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <FileSpreadsheet className="w-4 h-4 text-rose-600" /> Recorded Business Expenses
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Operational expenses are factored into net profit calculations.
        </div>
      </div>
    </div>
  );
}
