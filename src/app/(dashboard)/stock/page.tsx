'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { Category } from '@/types/inventory';
import StockBadge from '@/components/inventory/StockBadge';
import { Boxes, Search, Filter, RefreshCw, Loader2, Layers } from 'lucide-react';

interface StockItem {
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

export default function StockPage() {
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.data) setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category_id = selectedCategory;

      const res = await apiClient.get('/stock', { params });
      if (res.data?.data) setStockItems(res.data.data);
    } catch (err) {
      console.error('Failed to load stock catalog', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory]);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Stock Inventory & Multi-Unit Catalog</h1>
          <p className="text-sm text-slate-500">
            Real-time stock balance, base unit metrics, and secondary unit conversions
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search stock item, SKU..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={fetchStock}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh Stock Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <Boxes className="w-4 h-4 text-[#16A34A]" />
            <span>Stock Inventory ({stockItems.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Product Name</th>
                <th className="px-6 py-3">SKU</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Selling Price</th>
                <th className="px-6 py-3 text-center">Stock Breakdown</th>
                <th className="px-6 py-3 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading stock inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : stockItems.length > 0 ? (
                stockItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{item.name}</td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {item.category_name}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#16A34A]">
                      Rs. {Number(item.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-extrabold text-slate-900">
                        {item.stock_display?.full_display}
                      </div>
                      <div className="text-[11px] text-slate-400">
                        Alert Limit: {item.alert_quantity} {item.stock_display?.base_unit}
                      </div>
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
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No inventory records found.
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
