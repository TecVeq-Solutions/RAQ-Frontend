'use client';

import React from 'react';
import { Receipt } from 'lucide-react';

export default function PurchasesReportPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Purchase Report</h1>
        <p className="text-sm text-slate-500">Daily and monthly procurement breakdown (PRD R-03, R-04)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <Receipt className="w-4 h-4 text-blue-600" /> Procurement Summary Log
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Purchase reports aggregate supplier transactions from the database.
        </div>
      </div>
    </div>
  );
}
