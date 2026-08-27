'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Boxes, AlertTriangle, CheckCircle2 } from 'lucide-react';

export default function StockPage() {
  const [stock, setStock] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/stock')
      .then((res) => {
        if (res.data?.data) {
          setStock(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Stock & Inventory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Real-time inventory levels, SKUs, and reorder warnings</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A] text-sm">
            <Boxes className="w-4 h-4 text-[#16A34A]" />
            Item Inventory Catalog
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Item Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Available Qty</th>
                <th className="px-6 py-3">Reorder Point</th>
                <th className="px-6 py-3">Stock Condition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stock.length > 0 ? (
                stock.map((item) => {
                  const isLow = item.quantity <= item.reorder_level;
                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-[#0F172A]">{item.name}</td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">{item.sku}</td>
                      <td className="px-6 py-4 font-bold text-slate-800">
                        {item.quantity} <span className="text-xs font-normal text-slate-400">{item.unit}</span>
                      </td>
                      <td className="px-6 py-4 text-slate-500">
                        {item.reorder_level} {item.unit}
                      </td>
                      <td className="px-6 py-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Optimal
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    {loading ? 'Fetching stock levels...' : 'No inventory items available.'}
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
