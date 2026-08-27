'use client';

import React from 'react';
import { Users } from 'lucide-react';

export default function CustomerSalesReportPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Customer-wise Sales Report</h1>
        <p className="text-sm text-slate-500">Sales volume and turnover grouped by customer (PRD R-06)</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <Users className="w-4 h-4 text-purple-600" /> Customer Sales Distribution
        </div>

        <div className="p-8 text-center text-slate-400 text-sm">
          Groups sales invoices by customer accounts.
        </div>
      </div>
    </div>
  );
}
