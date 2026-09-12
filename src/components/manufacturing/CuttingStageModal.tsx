'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { ProductionOrder, ProductionCuttingLog, CuttingLogFormData } from '@/types/manufacturing';
import {
  X,
  Scissors,
  AlertTriangle,
  AlertCircle,
  Loader2,
  CheckCircle2,
  TrendingDown,
  Layers,
  Sparkles,
  Info,
} from 'lucide-react';

interface CuttingStageModalProps {
  order: ProductionOrder;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (cuttingLog: ProductionCuttingLog) => void;
}

export default function CuttingStageModal({
  order,
  isOpen,
  onClose,
  onSuccess,
}: CuttingStageModalProps) {
  const [formData, setFormData] = useState<CuttingLogFormData>({
    raw_material_product_id: '',
    input_quantity: '',
    expected_output_sheets: '',
    actual_output_sheets: '',
    wastage_sheets: '',
    operator_name: '',
    cutting_machine_id: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Initialize form with order details
  useEffect(() => {
    if (order && isOpen) {
      setError(null);

      // Find first raw material (paper) in order items
      const paperItem = (order.items || []).find(
        (item) =>
          item.rawMaterialProduct?.product_type === 'raw_material' ||
          item.raw_material_product?.product_type === 'raw_material' ||
          true
      );

      const rawId = paperItem ? paperItem.raw_material_product_id : '';
      const inputQty = paperItem ? String(paperItem.planned_quantity || '') : '';

      // Default expected sheets (e.g., if planned quantity exists)
      const plannedOutput = parseFloat(String(order.planned_quantity || '0'));
      const defaultExpected = plannedOutput > 0 ? String(plannedOutput * 2) : '1000';

      setFormData({
        raw_material_product_id: rawId,
        input_quantity: inputQty,
        expected_output_sheets: defaultExpected,
        actual_output_sheets: '',
        wastage_sheets: '0',
        operator_name: '',
        cutting_machine_id: '',
        notes: '',
      });
    }
  }, [order, isOpen]);

  if (!isOpen || !order) return null;

  const expectedSheets = parseInt(String(formData.expected_output_sheets || '0'), 10) || 0;
  const actualSheets = parseInt(String(formData.actual_output_sheets || '0'), 10) || 0;
  const wastageSheets = parseInt(String(formData.wastage_sheets || '0'), 10) || 0;
  const totalCutSheets = actualSheets + wastageSheets;

  // Live Wastage % Calculation
  const liveWastagePercent =
    expectedSheets > 0 ? ((wastageSheets / expectedSheets) * 100).toFixed(2) : '0.00';
  const isHighWastage = parseFloat(liveWastagePercent) > 10.0;

  const handleChange = (field: keyof CuttingLogFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!formData.raw_material_product_id) {
      setError('Please select the paper raw material used for cutting.');
      return;
    }

    const inputQtyNum = parseFloat(String(formData.input_quantity));
    if (isNaN(inputQtyNum) || inputQtyNum <= 0) {
      setError('Input paper quantity must be greater than 0.');
      return;
    }

    if (expectedSheets <= 0) {
      setError('Expected output sheets must be greater than 0.');
      return;
    }

    if (actualSheets < 0) {
      setError('Actual cut sheets produced cannot be negative.');
      return;
    }

    if (wastageSheets < 0) {
      setError('Wastage sheets cannot be negative.');
      return;
    }

    const payload = {
      raw_material_product_id: Number(formData.raw_material_product_id),
      input_quantity: inputQtyNum,
      expected_output_sheets: expectedSheets,
      actual_output_sheets: actualSheets,
      wastage_sheets: wastageSheets,
      total_cut_sheets: totalCutSheets,
      operator_name: formData.operator_name?.trim() || null,
      cutting_machine_id: formData.cutting_machine_id ? Number(formData.cutting_machine_id) : null,
      notes: formData.notes?.trim() || null,
    };

    setLoading(true);
    try {
      const res = await apiClient.post(`/production-orders/${order.id}/cutting-log`, payload);
      const createdLog = res.data?.data || res.data;
      onSuccess(createdLog);
      onClose();
    } catch (err: any) {
      console.error('Failed to save cutting log', err);
      const msg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to record cutting log.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm animate-fadeIn">
      <div className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50">
          <div className="flex items-center gap-3">
            <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/60 dark:text-blue-400">
              <Scissors className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                Stage 1 — Paper Cutting & Wastage Log
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Order <span className="font-semibold text-slate-700 dark:text-slate-200">{order.order_no}</span> — Record sheet sizing, cut count & scrap rates.
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

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Error Alert */}
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-3.5 text-sm text-rose-700 dark:bg-rose-950/50 dark:text-rose-300 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
              <div className="flex-1">
                <p className="font-semibold text-xs">Validation Failed</p>
                <p className="text-xs mt-0.5">{error}</p>
              </div>
            </div>
          )}

          {/* Raw Material Selection & Input Quantity */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Raw Paper Material <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={formData.raw_material_product_id}
                onChange={(e) => handleChange('raw_material_product_id', e.target.value)}
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              >
                <option value="">Select Paper Product...</option>
                {order.items?.map((item) => {
                  const prod = item.rawMaterialProduct || item.raw_material_product;
                  return (
                    <option key={item.raw_material_product_id} value={item.raw_material_product_id}>
                      {prod?.name || `Product #${item.raw_material_product_id}`} (
                      {prod?.sku || 'N/A'})
                    </option>
                  );
                })}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Input Quantity (Reams / Sheets) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                step="any"
                min="0.01"
                required
                value={formData.input_quantity}
                onChange={(e) => handleChange('input_quantity', e.target.value)}
                placeholder="e.g. 2.5 Reams"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs font-semibold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          {/* Sizing & Output Metrics */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/30 space-y-4">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-600 dark:text-slate-300 flex items-center gap-2">
              <Layers className="h-4 w-4 text-blue-500" />
              Sheet Cutting Metrics
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Expected Sheets <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="1"
                  required
                  value={formData.expected_output_sheets}
                  onChange={(e) => handleChange('expected_output_sheets', e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Actual Usable Sheets <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formData.actual_output_sheets}
                  onChange={(e) => handleChange('actual_output_sheets', e.target.value)}
                  placeholder="e.g. 950"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Wastage / Scrap Sheets <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  required
                  value={formData.wastage_sheets}
                  onChange={(e) => handleChange('wastage_sheets', e.target.value)}
                  placeholder="e.g. 50"
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-bold text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>
            </div>

            {/* Live Wastage Metric Display */}
            <div className="rounded-xl bg-white p-3.5 border border-slate-200 dark:bg-slate-800/80 dark:border-slate-700 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div
                  className={`rounded-lg p-2 ${
                    isHighWastage
                      ? 'bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300'
                      : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                  }`}
                >
                  <TrendingDown className="h-5 w-5" />
                </div>
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                    Calculated Wastage Rate:
                  </span>
                  <div className="flex items-baseline gap-2">
                    <span
                      className={`text-lg font-black ${
                        isHighWastage
                          ? 'text-rose-600 dark:text-rose-400'
                          : 'text-emerald-600 dark:text-emerald-400'
                      }`}
                    >
                      {liveWastagePercent}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({wastageSheets} scrap / {expectedSheets} expected)
                    </span>
                  </div>
                </div>
              </div>

              <div className="text-xs text-slate-500 dark:text-slate-400 sm:text-right">
                <div>Total Cut: <span className="font-bold text-slate-800 dark:text-slate-200">{totalCutSheets}</span> sheets</div>
                <div className="text-xs text-slate-400">Usable ({actualSheets}) + Scrap ({wastageSheets})</div>
              </div>
            </div>

            {/* High Wastage Warning Alert */}
            {isHighWastage && (
              <div className="flex items-start gap-2.5 rounded-xl bg-amber-50 p-3 text-xs text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border border-amber-300 dark:border-amber-800 animate-fadeIn">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
                <div>
                  <span className="font-bold">Warning: Wastage is above 10% ({liveWastagePercent}%).</span>
                  <p className="mt-0.5 text-xs text-amber-700 dark:text-amber-400">
                    This cutting run will be flagged for supervisor review due to high trimming loss.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Machine & Operator Details */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Cutting Machine / Line ID (Optional)
              </label>
              <input
                type="number"
                value={formData.cutting_machine_id}
                onChange={(e) => handleChange('cutting_machine_id', e.target.value)}
                placeholder="e.g. 101"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Machine Operator Name (Optional)
              </label>
              <input
                type="text"
                value={formData.operator_name}
                onChange={(e) => handleChange('operator_name', e.target.value)}
                placeholder="e.g. Muhammad Ali"
                className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Floor Notes (Optional)
            </label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={(e) => handleChange('notes', e.target.value)}
              placeholder="e.g. Sized from 23x36 reams to A4 register page dimensions..."
              className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2 text-xs text-slate-900 focus:border-blue-500 focus:outline-none dark:border-slate-700 dark:bg-slate-800 dark:text-white"
            />
          </div>

          {/* Footer Controls */}
          <div className="flex items-center justify-between border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 disabled:opacity-50 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Recording Cutting Log...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Save Log & Advance to Binding</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
