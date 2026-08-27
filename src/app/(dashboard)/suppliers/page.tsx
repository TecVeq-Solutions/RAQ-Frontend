'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Building2, Plus, Mail, CreditCard } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/suppliers')
      .then((res) => {
        if (res.data?.data) {
          setSuppliers(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Vendor & Supplier Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Procurement contacts and vendor credit terms</p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Add Vendor
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {suppliers.map((s) => (
          <div key={s.id} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-bold text-[#0F172A]">{s.name}</h3>
                <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 flex items-center gap-1">
                  <CreditCard className="w-3 h-3" /> {s.payment_terms}
                </span>
              </div>

              <div className="space-y-2 mt-4 text-sm text-slate-600">
                <div className="flex items-center gap-2">
                  <Mail className="w-4 h-4 text-slate-400" />
                  <span>{s.contact}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 flex justify-end">
              <button className="text-xs font-semibold text-[#16A34A] hover:underline">
                Create PO for Vendor &rarr;
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
