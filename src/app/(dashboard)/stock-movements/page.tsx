'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import {
  History,
  ArrowUpRight,
  ArrowDownRight,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Package,
  Layers,
  Calendar,
  UserCheck
} from 'lucide-react';

interface StockMovement {
  id: number;
  product_id: number;
  movement_type: string;
  reference_type?: string | null;
  reference_id?: number | null;
  quantity: number;
  unit_price: number;
  previous_stock: number;
  new_stock: number;
  movement_date: string;
  notes?: string | null;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: { id: number; name: string; short_name: string };
  };
  user?: {
    id: number;
    name: string;
  };
}

export default function StockMovementsPage() {
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [movementType, setMovementType] = useState('');

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchMovements = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (movementType) params.movement_type = movementType;

      const res = await apiClient.get('/stock-movements', { params });
      if (res.data?.data) {
        setMovements(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load stock movements', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, movementType]);

  useEffect(() => {
    fetchMovements();
  }, [fetchMovements]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Stock Movements & Audit Log</h1>
          <p className="text-sm text-slate-500">
            Immutable inventory audit ledger: purchases (+📈), sales (-📉), adjustments, and returns
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search product, SKU, notes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={movementType}
              onChange={(e) => setMovementType(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Movement Types</option>
              <option value="purchase">Purchase (Inward Stock)</option>
              <option value="sale">Sale (Outward Stock)</option>
              <option value="adjustment_in">Adjustment In</option>
              <option value="adjustment_out">Adjustment Out</option>
              <option value="return_in">Return In</option>
              <option value="return_out">Return Out</option>
            </select>
          </div>

          <button
            onClick={fetchMovements}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh Stock Log"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <History className="w-4 h-4 text-[#16A34A]" />
            <span>Stock Audit History ({movements.length} records)</span>
          </div>
          <span className="text-xs text-slate-400">🔒 Immutable MySQL Log</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Date & Time</th>
                <th className="px-6 py-3.5">Product</th>
                <th className="px-6 py-3.5 text-center">Movement Type</th>
                <th className="px-6 py-3.5 text-center">Prev Stock</th>
                <th className="px-6 py-3.5 text-center">Change Qty</th>
                <th className="px-6 py-3.5 text-center">New Stock</th>
                <th className="px-6 py-3.5">Reference / Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading stock movements...</span>
                    </div>
                  </td>
                </tr>
              ) : movements.length > 0 ? (
                movements.map((m) => {
                  const isInward =
                    m.movement_type === 'purchase' ||
                    m.movement_type === 'adjustment_in' ||
                    m.movement_type === 'return_in';
                  const unitName = m.product?.unit?.short_name || 'Units';

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono text-xs text-slate-500">
                        {m.movement_date ? m.movement_date.substring(0, 19).replace('T', ' ') : '-'}
                      </td>
                      <td className="px-6 py-4 font-bold text-[#0F172A]">
                        {m.product?.name || 'Product'}
                        <span className="block font-mono font-normal text-xs text-slate-400">
                          {m.product?.sku}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {m.movement_type === 'purchase' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-600" />
                            Purchase Inward
                          </span>
                        ) : m.movement_type === 'sale' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            <ArrowDownRight className="w-3.5 h-3.5 text-blue-600" />
                            Sale Outward
                          </span>
                        ) : isInward ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                            <ArrowUpRight className="w-3.5 h-3.5 text-slate-500" />
                            {m.movement_type.replace('_', ' ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                            <ArrowDownRight className="w-3.5 h-3.5 text-rose-500" />
                            {m.movement_type.replace('_', ' ')}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center font-semibold text-slate-500">
                        {m.previous_stock} {unitName}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span
                          className={`font-black text-sm ${
                            isInward ? 'text-[#16A34A]' : 'text-rose-600'
                          }`}
                        >
                          {isInward ? '+' : '-'}
                          {m.quantity} {unitName}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center font-extrabold text-slate-900">
                        {m.new_stock} {unitName}
                      </td>
                      <td className="px-6 py-4 text-xs text-slate-500">
                        <div className="font-medium text-slate-700">{m.notes || '-'}</div>
                        {m.user && (
                          <div className="text-[11px] text-slate-400">By: {m.user.name}</div>
                        )}
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No stock movements found.
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
