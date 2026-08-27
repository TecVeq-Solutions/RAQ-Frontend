'use client';

import React from 'react';
import { History, ArrowUpRight, ArrowDownRight } from 'lucide-react';

export default function StockMovementsPage() {
  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Stock Movements Log</h1>
          <p className="text-sm text-slate-500">Historical inventory stock audit entries (PRD I-05)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100">
          <History className="w-4 h-4 text-[#16A34A]" />
          Stock Adjustment & Transaction Log
        </div>

        <div className="text-xs text-slate-500">
          Inventory stock movements automatically log when a <strong>Purchase</strong> (Stock Increase 📈) or <strong>Sale</strong> (Stock Decrease 📉) is completed.
        </div>

        <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-xl text-slate-400 text-sm">
          Historical stock movement records are securely preserved in MySQL and cannot be deleted.
        </div>
      </div>
    </div>
  );
}
