'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

export default function AddExpensePage() {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [category, setCategory] = useState('Rent & Utilities');

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl  pb-12">
      <div className="flex items-center gap-3">
        <Link href="/expenses" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Add Business Expense</h1>
          <p className="text-sm text-slate-500">Record operational expense entry (PRD E-02)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Category</label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600"
          >
            <option value="Rent & Utilities">Rent & Utilities</option>
            <option value="Salaries & Wages">Salaries & Wages</option>
            <option value="Transportation & Freight">Transportation & Freight</option>
            <option value="Office Supplies & Miscellaneous">Office Supplies & Miscellaneous</option>
          </select>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Expense Description *</label>
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="e.g. Monthly Electricity Bill Payment"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Amount (Rs.) *</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-rose-600"
          />
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl bg-rose-600 text-white font-bold text-base hover:bg-rose-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Save Expense Record</span>
        </button>
      </div>
    </div>
  );
}
