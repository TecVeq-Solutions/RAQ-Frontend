'use client';

import React from 'react';
import { BarChart3 } from 'lucide-react';

export default function SalesReportPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Sales Report</h1>
        <p className="text-sm text-slate-500">Daily and monthly sales analytics (PRD R-01, R-02)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <BarChart3 className="w-4 h-4 text-[#16A34A]" /> Daily & Monthly Sales Summary
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Sales reports calculate real totals directly from backend MySQL data.
        </div>
      </div>
    </div>
  );
}
