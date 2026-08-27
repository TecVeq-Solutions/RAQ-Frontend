'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Users, Building2 } from 'lucide-react';

export default function OutstandingReportPage() {
  const [customers, setCustomers] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([apiClient.get('/customers'), apiClient.get('/suppliers')])
      .then(([cRes, sRes]) => {
        if (cRes.data?.data) setCustomers(cRes.data.data);
        if (sRes.data?.data) setSuppliers(sRes.data.data);
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-[#0F172A]">Outstanding Balances Report</h1>
        <p className="text-sm text-slate-500">Customer receivables and supplier payables breakdown (PRD R-07)</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Receivables */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100 mb-4">
            <Users className="w-4 h-4 text-purple-600" /> Customer Receivables (Outstanding)
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
              <tr>
                <th className="py-2.5 px-2">Customer</th>
                <th className="py-2.5 px-2 text-right">Outstanding (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {customers.map((c) => (
                <tr key={c.id}>
                  <td className="py-2.5 px-2 font-bold text-[#0F172A]">{c.name}</td>
                  <td className="py-2.5 px-2 text-right font-extrabold text-purple-700">
                    Rs. {Number(c.current_balance || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Supplier Payables */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm pb-3 border-b border-slate-100 mb-4">
            <Building2 className="w-4 h-4 text-amber-600" /> Supplier Payables (Outstanding)
          </div>

          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 uppercase text-slate-500 font-bold">
              <tr>
                <th className="py-2.5 px-2">Supplier</th>
                <th className="py-2.5 px-2 text-right">Outstanding (Rs.)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {suppliers.map((s) => (
                <tr key={s.id}>
                  <td className="py-2.5 px-2 font-bold text-[#0F172A]">{s.name}</td>
                  <td className="py-2.5 px-2 text-right font-extrabold text-amber-700">
                    Rs. {Number(s.current_balance || 0).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
