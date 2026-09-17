'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Asset, DisposalFormData, DisposalType } from '@/types/assets';
import {
  X,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  User,
  FileText,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  TrendingDown,
} from 'lucide-react';

interface AssetDisposalModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export default function AssetDisposalModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: AssetDisposalModalProps) {
  const [formData, setFormData] = useState<DisposalFormData>({
    disposal_date: new Date().toISOString().split('T')[0],
    disposal_type: 'sold',
    sale_proceeds: '',
    buyer_name: '',
    reason: '',
    notes: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        disposal_date: new Date().toISOString().split('T')[0],
        disposal_type: 'sold',
        sale_proceeds: '',
        buyer_name: '',
        reason: '',
        notes: '',
      });
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const cost = Number(asset.purchase_cost || 0);
  const accDep = Number(asset.accumulated_depreciation || 0);
  const netBookValue = Math.max(0, cost - accDep);
  const proceeds = formData.disposal_type === 'sold' ? Number(formData.sale_proceeds || 0) : 0;
  const gainLossAmount = proceeds - netBookValue;
  const isGain = gainLossAmount > 0;
  const isLoss = gainLossAmount < 0;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.disposal_date) errors.disposal_date = 'Disposal date is required.';
    if (!formData.disposal_type) errors.disposal_type = 'Disposal type is required.';
    if (formData.disposal_type === 'sold' && (formData.sale_proceeds === '' || Number(formData.sale_proceeds) < 0)) {
      errors.sale_proceeds = 'Sale proceeds must be a non-negative number.';
    }
    if (!formData.reason.trim()) errors.reason = 'A reason for disposal is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!confirm(`Are you sure you want to permanently dispose/sell asset "${asset.asset_code} - ${asset.name}"? This action will generate double-entry disposal journal entries and cancel future depreciation.`)) {
      return;
    }

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        disposal_date: formData.disposal_date,
        disposal_type: formData.disposal_type,
        sale_proceeds: formData.disposal_type === 'sold' ? Number(formData.sale_proceeds || 0) : 0,
        buyer_name: formData.disposal_type === 'sold' ? formData.buyer_name?.trim() || null : null,
        reason: formData.reason.trim(),
        notes: formData.notes?.trim() || null,
      };

      await apiClient.post(`/assets/${asset.id}/dispose`, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to process asset disposal', err);
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]: [string, any]) => {
          backendErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
        setError('Please correct the highlighted errors.');
      } else {
        setError(err.response?.data?.message || 'Failed to dispose asset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-2xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Asset Disposal & Sale Settlement
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Process asset derecognition, compute Net Book Value, and record Gain/Loss journal entries
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Asset Financials Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 grid grid-cols-3 gap-3 text-xs shrink-0">
          <div>
            <span className="text-slate-500 font-medium block">Original Cost:</span>
            <span className="text-slate-900 font-mono font-bold">
              PKR {cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Accumulated Deprec:</span>
            <span className="text-purple-700 font-mono font-bold">
              PKR {accDep.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div>
            <span className="text-slate-500 font-medium block">Net Book Value (NBV):</span>
            <span className="text-emerald-700 font-mono font-bold">
              PKR {netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Disposal Type Selection */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Disposal Classification <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              {[
                { value: 'sold', label: 'Sale / Realization' },
                { value: 'scrapped', label: 'Scrapped / Salvaged' },
                { value: 'written_off', label: 'Written Off' },
                { value: 'donated', label: 'Donated / Transferred' },
              ].map((t) => (
                <button
                  key={t.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, disposal_type: t.value as DisposalType })}
                  className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                    formData.disposal_type === t.value
                      ? 'border-rose-300 bg-rose-50 text-rose-800 ring-2 ring-rose-400/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Disposal Date */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-600" />
                Settlement / Disposal Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={formData.disposal_date}
                onChange={(e) => setFormData({ ...formData, disposal_date: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                  fieldErrors.disposal_date ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {fieldErrors.disposal_date && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.disposal_date}</p>
              )}
            </div>

            {/* Sale Proceeds (if sold) */}
            {formData.disposal_type === 'sold' && (
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                  Sale Proceeds / Realized Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.sale_proceeds}
                  onChange={(e) => setFormData({ ...formData, sale_proceeds: e.target.value })}
                  placeholder="0.00"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.sale_proceeds ? 'border-rose-500' : 'border-slate-200'
                  }`}
                />
                {fieldErrors.sale_proceeds && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.sale_proceeds}</p>
                )}
              </div>
            )}

            {/* Buyer Name (if sold) */}
            {formData.disposal_type === 'sold' && (
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5 text-blue-600" />
                  Buyer / Customer Name
                </label>
                <input
                  type="text"
                  value={formData.buyer_name || ''}
                  onChange={(e) => setFormData({ ...formData, buyer_name: e.target.value })}
                  placeholder="e.g. Lahore Machinery Traders / Mr. Aslam"
                  className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                />
              </div>
            )}

            {/* Reason */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Reason for Disposal / Retirement <span className="text-rose-500">*</span>
              </label>
              <textarea
                rows={2}
                value={formData.reason}
                onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                placeholder="Explain the operational reason for scrapping, selling, or writing off this equipment..."
                className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all resize-none ${
                  fieldErrors.reason ? 'border-rose-500' : 'border-slate-200'
                }`}
              />
              {fieldErrors.reason && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.reason}</p>
              )}
            </div>

            {/* Notes */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Internal Notes / Approval Reference
              </label>
              <input
                type="text"
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="e.g. Board resolution ref #2026/04, inspected by chief engineer"
                className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
              />
            </div>
          </div>

          {/* Gain / Loss Settlement Calculation Preview */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-slate-500 font-medium">Net Book Value at Disposal:</span>
              <span className="font-mono text-slate-800 font-bold">
                PKR {netBookValue.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
            {formData.disposal_type === 'sold' && (
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Realized Sale Proceeds:</span>
                <span className="font-mono text-slate-800 font-bold">
                  PKR {proceeds.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-1.5 font-bold">
                {isGain ? (
                  <>
                    <TrendingUp className="w-4 h-4 text-emerald-600" />
                    <span className="text-emerald-700">Recognized Capital Gain on Sale:</span>
                  </>
                ) : isLoss ? (
                  <>
                    <TrendingDown className="w-4 h-4 text-rose-600" />
                    <span className="text-rose-700">Recognized Loss on Disposal:</span>
                  </>
                ) : (
                  <span className="text-slate-700">Net Disposal Impact:</span>
                )}
              </div>
              <span
                className={`font-mono font-bold text-sm ${
                  isGain ? 'text-emerald-700' : isLoss ? 'text-rose-700' : 'text-slate-700'
                }`}
              >
                PKR {Math.abs(gainLossAmount).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Warning Banner */}
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 flex items-start gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>
              Disposing this asset will cancel any future unposted depreciation schedule periods and permanently update the asset status to <strong>Disposed</strong>.
            </span>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Disposal...</span>
                </>
              ) : (
                <>
                  <Trash2 className="w-4 h-4" />
                  <span>Confirm & Process Disposal</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
