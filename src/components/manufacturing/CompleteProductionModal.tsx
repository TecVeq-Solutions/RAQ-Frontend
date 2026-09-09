'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { ProductionOrder, CompleteProductionPayload } from '@/types/manufacturing';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Loader2,
  TrendingDown,
  TrendingUp,
  Boxes,
} from 'lucide-react';

interface CompleteProductionModalProps {
  order: ProductionOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedOrder: ProductionOrder) => void;
}

interface ConsumedItemRow {
  raw_material_product_id: number;
  product_name: string;
  sku?: string;
  planned_quantity: number;
  consumed_quantity: string;
  unit_name: string;
  current_stock: number;
}

export default function CompleteProductionModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: CompleteProductionModalProps) {
  const [actualQuantity, setActualQuantity] = useState<string>('');
  const [consumptionRows, setConsumptionRows] = useState<ConsumedItemRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize state from order
  useEffect(() => {
    if (order && isOpen) {
      setActualQuantity(String(order.planned_quantity || ''));
      setError(null);

      const rows: ConsumedItemRow[] = (order.items || []).map((item) => {
        const prod = item.rawMaterialProduct || item.raw_material_product;
        const planned = parseFloat(String(item.planned_quantity)) || 0;
        const currentStock = parseFloat(String(prod?.stock_quantity)) || 0;

        return {
          raw_material_product_id: item.raw_material_product_id,
          product_name: prod?.name || `Product #${item.raw_material_product_id}`,
          sku: prod?.sku || '',
          planned_quantity: planned,
          consumed_quantity: String(planned),
          unit_name: item.unit?.short_name || prod?.unit?.short_name || 'Units',
          current_stock: currentStock,
        };
      });

      setConsumptionRows(rows);
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const finishedProd = order.finishedProduct || order.finished_product;
  const finishedUnit = finishedProd?.unit?.short_name || 'Units';

  const handleConsumedQtyChange = (index: number, val: string) => {
    setConsumptionRows((prev) => {
      const next = [...prev];
      next[index] = { ...next[index], consumed_quantity: val };
      return next;
    });
  };

  // Check for any stock shortages
  const hasShortages = consumptionRows.some((row) => {
    const consumed = parseFloat(row.consumed_quantity) || 0;
    return consumed > row.current_stock;
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const actualQtyNum = parseFloat(actualQuantity);
    if (isNaN(actualQtyNum) || actualQtyNum < 0) {
      setError('Actual finished quantity must be a non-negative number.');
      return;
    }

    if (consumptionRows.length === 0) {
      setError('At least one raw material consumption line is required.');
      return;
    }

    for (let i = 0; i < consumptionRows.length; i++) {
      const row = consumptionRows[i];
      const consumedNum = parseFloat(row.consumed_quantity);
      if (isNaN(consumedNum) || consumedNum < 0) {
        setError(`Please enter a valid consumed quantity for ${row.product_name}.`);
        return;
      }
    }

    const payload: CompleteProductionPayload = {
      actual_quantity: actualQtyNum,
      consumption: consumptionRows.map((row) => ({
        raw_material_product_id: row.raw_material_product_id,
        consumed_quantity: parseFloat(row.consumed_quantity) || 0,
      })),
    };

    setLoading(true);
    try {
      const res = await apiClient.post(`/production-orders/${order.id}/complete`, payload);
      const updatedOrder = res.data?.data || res.data;
      onSuccess(updatedOrder);
      onClose();
    } catch (err: any) {
      console.error('Failed to complete production order', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to complete production order.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600 dark:bg-emerald-950/60 dark:text-emerald-400">
              <CheckCircle2 className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Complete Production & Stock Transformation
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order <span className="font-semibold text-slate-700 dark:text-slate-200">{order.order_no}</span> — Atomically deduct raw materials & add finished goods to stock.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold">Transformation Failed</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Transformation Summary Card */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Finished Goods Produced */}
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 dark:border-emerald-900 dark:bg-emerald-950/20">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
                  <TrendingUp className="h-4 w-4" />
                  Finished Good Output (+ Stock)
                </div>
                <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400">
                  Target: {parseFloat(String(order.planned_quantity)).toLocaleString()} {finishedUnit}
                </span>
              </div>
              <p className="text-sm font-bold text-slate-900 dark:text-white mb-2">
                {finishedProd?.name || `Product #${order.finished_product_id}`}
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Actual Finished Output Produced <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <input
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={actualQuantity}
                    onChange={(e) => setActualQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-sm font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                  <span className="absolute right-3 top-2 text-xs font-medium text-slate-400">
                    {finishedUnit}
                  </span>
                </div>
              </div>
            </div>

            {/* Atomic Guarantee Note */}
            <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900 dark:bg-blue-950/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-blue-700 dark:text-blue-400 mb-2">
                  <Boxes className="h-4 w-4" />
                  Atomic Transaction Guarantee
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                  Completing this batch will execute a single database transaction with pessimistic row locks. Raw material stocks decrease (<span className="font-mono text-amber-700 dark:text-amber-400 font-bold">production_out</span>) and finished goods stock increases (<span className="font-mono text-emerald-700 dark:text-emerald-400 font-bold">production_in</span>).
                </p>
              </div>
              <div className="mt-3 flex items-center gap-2 text-[11px] text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Zero negative stock allowed. Rolls back fully on shortage.</span>
              </div>
            </div>
          </div>

          {/* Raw Materials Consumption Table */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingDown className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                  Raw Material Consumption Lines (- Stock)
                </h4>
              </div>
              {hasShortages && (
                <div className="flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                  <AlertTriangle className="h-4 w-4" />
                  <span>Warning: One or more materials exceed current stock!</span>
                </div>
              )}
            </div>

            <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 text-[11px] uppercase font-semibold tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="px-4 py-3">Raw Material</th>
                    <th className="px-4 py-3 text-right">Available Stock</th>
                    <th className="px-4 py-3 text-right">Planned Qty</th>
                    <th className="px-4 py-3 text-right w-44">Actual Consumed Qty</th>
                    <th className="px-4 py-3 text-center">Audit Movement</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {consumptionRows.map((row, idx) => {
                    const consumedVal = parseFloat(row.consumed_quantity) || 0;
                    const isShortage = consumedVal > row.current_stock;

                    return (
                      <tr
                        key={idx}
                        className={`transition-colors ${
                          isShortage
                            ? 'bg-rose-50/50 dark:bg-rose-950/20'
                            : 'hover:bg-slate-50/70 dark:hover:bg-slate-800/50'
                        }`}
                      >
                        <td className="px-4 py-3">
                          <div className="font-bold text-slate-900 dark:text-white">
                            {row.product_name}
                          </div>
                          {row.sku && (
                            <div className="text-[10px] text-slate-400 font-mono">
                              SKU: {row.sku}
                            </div>
                          )}
                        </td>

                        <td className="px-4 py-3 text-right font-medium">
                          <span
                            className={
                              isShortage
                                ? 'font-bold text-rose-600 dark:text-rose-400'
                                : 'text-slate-700 dark:text-slate-300'
                            }
                          >
                            {row.current_stock.toLocaleString()} {row.unit_name}
                          </span>
                        </td>

                        <td className="px-4 py-3 text-right font-medium text-slate-500">
                          {row.planned_quantity.toLocaleString()} {row.unit_name}
                        </td>

                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <input
                              type="number"
                              step="any"
                              min="0"
                              required
                              value={row.consumed_quantity}
                              onChange={(e) => handleConsumedQtyChange(idx, e.target.value)}
                              className={`w-28 rounded-lg border px-2.5 py-1 text-right text-xs font-bold focus:outline-none ${
                                isShortage
                                  ? 'border-rose-400 bg-rose-50 text-rose-900 dark:bg-rose-950/60 dark:text-rose-200 focus:border-rose-500'
                                  : 'border-slate-300 bg-white text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-white focus:border-blue-500'
                              }`}
                            />
                            <span className="text-[11px] text-slate-400 shrink-0">
                              {row.unit_name}
                            </span>
                          </div>
                          {isShortage && (
                            <p className="text-[10px] text-rose-600 dark:text-rose-400 mt-1 font-semibold">
                              Shortage by {(consumedVal - row.current_stock).toLocaleString()} {row.unit_name}
                            </p>
                          )}
                        </td>

                        <td className="px-4 py-3 text-center">
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-[10px] font-bold text-amber-700 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-200 dark:border-amber-800">
                            production_out
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 shadow-lg shadow-emerald-600/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Transforming Stock...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Confirm Stock Transformation</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
