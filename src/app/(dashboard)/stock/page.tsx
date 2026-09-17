'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { Category, ProductType } from '@/types/inventory';
import StockBadge from '@/components/inventory/StockBadge';
import { Boxes, Search, Filter, RefreshCw, Loader2, Layers, Package, Scissors, Wrench } from 'lucide-react';

interface StockItem {
  id: number;
  name: string;
  sku: string;
  product_type?: ProductType;
  paper_size?: string | null;
  gsm?: number | null;
  sheets_per_unit?: number | null;
  pages_count?: number | null;
  material_type?: string | null;
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
  const [productTypeTab, setProductTypeTab] = useState<'all' | ProductType>('all');

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
      if (productTypeTab !== 'all') params.product_type = productTypeTab;

      const res = await apiClient.get('/stock', { params });
      if (res.data?.data) setStockItems(res.data.data);
    } catch (err) {
      console.error('Failed to load stock catalog', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, productTypeTab]);

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
            Real-time stock balance, base unit metrics, raw material inventory, and secondary unit conversions
          </p>
        </div>
      </div>

      {/* Classification Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {[
          { key: 'all', label: 'All Items', icon: Boxes },
          { key: 'finished_good', label: 'Finished Goods', icon: Package },
          { key: 'raw_material', label: 'Raw Materials', icon: Scissors },
          { key: 'consumable', label: 'Consumables', icon: Layers },
          { key: 'machinery', label: 'Machinery', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = productTypeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setProductTypeTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#16A34A]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search stock item, SKU, paper spec..."
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
                <th className="px-6 py-3">Product Name & Specs</th>
                <th className="px-6 py-3">Type</th>
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
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading stock inventory...</span>
                    </div>
                  </td>
                </tr>
              ) : stockItems.length > 0 ? (
                stockItems.map((item) => {
                  const pType = item.product_type || 'finished_good';
                  const typeBadgeClass =
                    pType === 'raw_material'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : pType === 'consumable'
                      ? 'bg-teal-100 text-teal-800 border-teal-200'
                      : pType === 'machinery'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                  const typeLabel =
                    pType === 'raw_material'
                      ? 'Raw Material'
                      : pType === 'consumable'
                      ? 'Consumable'
                      : pType === 'machinery'
                      ? 'Machinery'
                      : 'Finished Good';

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A]">{item.name}</div>
                        {(item.paper_size || item.gsm || item.sheets_per_unit || item.pages_count || item.material_type) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                            {item.material_type && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {item.material_type}
                              </span>
                            )}
                            {item.paper_size && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                Size: {item.paper_size}
                              </span>
                            )}
                            {item.gsm && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {item.gsm} GSM
                              </span>
                            )}
                            {item.sheets_per_unit && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {item.sheets_per_unit} sheets
                              </span>
                            )}
                            {item.pages_count && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {item.pages_count} pgs
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono text-xs text-slate-600">{item.sku}</td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {item.category_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-bold text-[#16A34A]">
                          Rs. {Number(item.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {pType === 'finished_good' && Number(item.purchase_price || 0) > 0 && (
                          <div className="text-xs text-blue-600 font-semibold mt-0.5">
                            Mfg Cost: Rs. {Number(item.purchase_price || 0).toFixed(2)}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-extrabold text-slate-900">
                          {item.stock_display?.full_display}
                        </div>
                        <div className="text-xs text-slate-400">
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No inventory records found matching the selected classification.
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
