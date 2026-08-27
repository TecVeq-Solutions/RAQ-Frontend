'use client';

import React from 'react';
import { TrendingUp } from 'lucide-react';

export default function ProfitReportPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Profit & Margin Report</h1>
        <p className="text-sm text-slate-500">Daily and monthly net profit analysis (PRD R-05)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <TrendingUp className="w-4 h-4 text-emerald-600" /> Net Profit Statement
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Calculates Revenue minus Cost of Goods Sold and Expenses.
        </div>
      </div>
    </div>
  );
}
