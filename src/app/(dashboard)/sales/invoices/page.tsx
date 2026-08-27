'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Receipt, Printer, Eye, CheckCircle2 } from 'lucide-react';

export default function InvoicesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/sales')
      .then((res) => {
        if (res.data?.data) {
          setSales(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Sales Receipts & Invoices</h1>
          <p className="text-sm text-slate-500">Print or inspect generated customer invoices (PRD S-03)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A] text-sm">
            <Receipt className="w-4 h-4 text-[#16A34A]" />
            Generated Invoices Archive
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Invoice #</th>
                <th className="px-6 py-3">Customer</th>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Amount</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">{sale.invoice_no || sale.id}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{sale.customer?.name || sale.customer || 'Walk-in Customer'}</td>
                    <td className="px-6 py-4 text-slate-500">{sale.sale_date || sale.date}</td>
                    <td className="px-6 py-4 font-extrabold text-[#16A34A]">
                      Rs. {Number(sale.grand_total || sale.amount || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button className="px-3 py-1.5 rounded-lg bg-emerald-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white font-semibold text-xs border border-emerald-200 transition-all inline-flex items-center gap-1">
                        <Printer className="w-3.5 h-3.5" /> Print
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    {loading ? 'Loading generated invoices...' : 'No invoices generated yet.'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
