'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, CreditCard, CheckCircle2 } from 'lucide-react';

export default function ReceivePaymentPage() {
  const [customerName, setCustomerName] = useState('');
  const [amount, setAmount] = useState<number>(0);
  const [narration, setNarration] = useState('');

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link href="/payments" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Receive Customer Payment</h1>
          <p className="text-sm text-slate-500">Record cash/bank collection and update customer ledger (PRD E-01)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Customer Name *</label>
          <input
            type="text"
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder="e.g. Tariq Mahmood"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Payment Amount (Rs.) *</label>
          <input
            type="number"
            min={0}
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Narration / Description</label>
          <input
            type="text"
            value={narration}
            onChange={(e) => setNarration(e.target.value)}
            placeholder="e.g. Cash received from Ali for Inv #104"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-600"
          />
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl bg-teal-600 text-white font-bold text-base hover:bg-teal-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Save Payment & Credit Customer Ledger</span>
        </button>
      </div>
    </div>
  );
}
