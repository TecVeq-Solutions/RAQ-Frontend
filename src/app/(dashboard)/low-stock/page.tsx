'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { AlertTriangle, Boxes } from 'lucide-react';

export default function LowStockPage() {
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/dashboard/stats')
      .then((res) => {
        if (res.data?.data?.low_stock_products) {
          setLowStockProducts(res.data.data.low_stock_products);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-rose-600 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6" /> Low Stock Items Alert
          </h1>
          <p className="text-sm text-slate-500">Products at or below configured alert thresholds (PRD I-06)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-center">Current Stock</th>
                <th className="px-6 py-3 text-center">Alert Limit</th>
                <th className="px-6 py-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {lowStockProducts.length > 0 ? (
                lowStockProducts.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 text-center font-extrabold text-rose-600">{p.stock_quantity}</td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-500">{p.alert_quantity}</td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        Restock Required
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                    {loading ? 'Checking stock levels...' : '✨ All inventory stock levels are currently sufficient!'}
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
