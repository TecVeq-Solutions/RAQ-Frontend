'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Boxes, Plus, Edit2, Trash2 } from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/stock')
      .then((res) => {
        if (res.data?.data) {
          setProducts(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Products Catalog</h1>
          <p className="text-sm text-slate-500">Manage master product items, pricing, units, and low-stock limits (PRD I-01 to I-04)</p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm">
          <Plus className="w-4 h-4" /> Add Product
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A] text-sm">
            <Boxes className="w-4 h-4 text-[#16A34A]" />
            Products Directory
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3 text-right">Purchase Rate</th>
                <th className="px-6 py-3 text-right">Selling Rate</th>
                <th className="px-6 py-3 text-center">Current Stock</th>
                <th className="px-6 py-3 text-center">Alert Limit</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{p.name}</td>
                    <td className="px-6 py-4 font-mono text-slate-500">{p.sku}</td>
                    <td className="px-6 py-4 text-right">Rs. {Number(p.purchase_price || 0).toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-semibold text-[#16A34A]">
                      Rs. {Number(p.selling_price || 0).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold">{p.stock_quantity}</td>
                    <td className="px-6 py-4 text-center text-slate-500">{p.alert_quantity}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-400">
                    {loading ? 'Loading catalog products...' : 'No products found in catalog.'}
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
