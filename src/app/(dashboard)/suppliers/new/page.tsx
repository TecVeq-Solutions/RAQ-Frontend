'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Building2, CheckCircle2 } from 'lucide-react';

export default function AddSupplierPage() {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [openingBalance, setOpeningBalance] = useState<number>(0);

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl mx-auto pb-12">
      <div className="flex items-center gap-3">
        <Link href="/suppliers" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Add New Supplier</h1>
          <p className="text-sm text-slate-500">Create vendor profile with opening balance (PRD P-01, P-04)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-4">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Company / Supplier Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Master Rice Mills Ltd."
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Contact Person</label>
            <input
              type="text"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              placeholder="e.g. Bilal Hassan"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Phone Number</label>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="0321-7654321"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">Opening Payable Balance (Rs.)</label>
          <input
            type="number"
            value={openingBalance}
            onChange={(e) => setOpeningBalance(Number(e.target.value))}
            placeholder="0.00"
            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-600"
          />
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl bg-amber-600 text-white font-bold text-base hover:bg-amber-700 transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer mt-4"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Save Supplier Account</span>
        </button>
      </div>
    </div>
  );
}
