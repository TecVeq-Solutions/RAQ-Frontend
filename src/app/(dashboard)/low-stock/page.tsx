'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import StockBadge from '@/components/inventory/StockBadge';
import { AlertTriangle, Search, RefreshCw, Loader2, Layers, Boxes } from 'lucide-react';

interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  category_name: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  alert_quantity: number;
  stock_display: {
    base_stock: number;
    base_unit: string;
    base_display: string;
    secondary_stock?: number | null;
    secondary_unit?: string | null;
    secondary_display?: string | null;
    conversion_ratio?: number | null;
    full_display: string;
    status: 'normal' | 'low_stock' | 'out_of_stock';
  };
}

export default function LowStockPage() {
  const [items, setItems] = useState<LowStockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchLowStock = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get('/stock/low-stock', { params });
      if (res.data?.data) setItems(res.data.data);
    } catch (err) {
      console.error('Failed to load low-stock items', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchLowStock();
  }, [fetchLowStock]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-[#0F172A]">Low-Stock Alerts & Reorder Catalog</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-800 border border-amber-200">
              {items.length} Alerts
            </span>
          </div>
          <p className="text-sm text-slate-500">
            Products where stock balance is less than or equal to alert threshold (stock ≤ threshold)
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search low stock item, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <button
          onClick={fetchLowStock}
          className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          title="Refresh Low-Stock List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Low Stock Items Requiring Reorder ({items.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-center">Current Stock</th>
                <th className="px-6 py-3 text-center">Alert Limit</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-amber-600" />
                      <span>Checking low-stock alerts...</span>
                    </div>
                  </td>
                </tr>
              ) : items.length > 0 ? (
                items.map((item) => (
                  <tr key={item.id} className="hover:bg-amber-50/40 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center font-extrabold text-slate-900">
                      {item.stock_display?.full_display}
                    </td>
                    <td className="px-6 py-4 text-center font-semibold text-slate-600">
                      {item.alert_quantity} {item.stock_display?.base_unit}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <StockBadge
                        status={item.stock_display?.status}
                        stockQuantity={item.stock_quantity}
                        alertQuantity={item.alert_quantity}
                      />
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-emerald-700 font-medium">
                    🎉 Excellent! All product stock levels are above their alert thresholds.
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
