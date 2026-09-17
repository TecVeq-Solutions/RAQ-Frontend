'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Asset, DepreciationConfigFormData, DepreciationMethod, DepreciationFrequency } from '@/types/assets';
import {
  X,
  TrendingDown,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Clock,
  Sparkles,
  Calculator,
} from 'lucide-react';

interface AssetDepreciationConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export default function AssetDepreciationConfigModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: AssetDepreciationConfigModalProps) {
  const [formData, setFormData] = useState<DepreciationConfigFormData>({
    depreciation_method: 'straight_line',
    useful_life_years: '5',
    depreciation_frequency: 'monthly',
    depreciation_start_date: new Date().toISOString().split('T')[0],
    salvage_value: '0.00',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (asset && isOpen) {
      setFormData({
        depreciation_method: (asset.depreciation_method as DepreciationMethod) || 'straight_line',
        useful_life_years: asset.useful_life_years ? String(asset.useful_life_years) : '5',
        depreciation_frequency: (asset.depreciation_frequency as DepreciationFrequency) || 'monthly',
        depreciation_start_date: asset.depreciation_start_date
          ? asset.depreciation_start_date.substring(0, 10)
          : asset.purchase_date
          ? asset.purchase_date.substring(0, 10)
          : new Date().toISOString().split('T')[0],
        salvage_value: asset.salvage_value ? String(asset.salvage_value) : '0.00',
      });
      setError(null);
      setFieldErrors({});
    }
  }, [asset, isOpen]);

  if (!isOpen || !asset) return null;

  const cost = Number(asset.purchase_cost || 0);
  const salvage = Number(formData.salvage_value || 0);
  const usefulYears = Number(formData.useful_life_years || 0);
  const depreciableAmount = Math.max(0, cost - salvage);

  const totalPeriods = formData.depreciation_frequency === 'monthly' ? Math.round(usefulYears * 12) : usefulYears;
  const periodicDepreciation = totalPeriods > 0 ? depreciableAmount / totalPeriods : 0;
  const annualDepreciation = usefulYears > 0 ? depreciableAmount / usefulYears : 0;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (formData.depreciation_method === 'straight_line') {
      if (!formData.useful_life_years || Number(formData.useful_life_years) <= 0) {
        errors.useful_life_years = 'Useful life must be greater than zero years.';
      }
      if (!formData.depreciation_start_date) {
        errors.depreciation_start_date = 'Depreciation start date is required.';
      }
      if (salvage >= cost) {
        errors.salvage_value = 'Salvage/residual value must be less than the asset purchase cost.';
      }
      if (salvage < 0) {
        errors.salvage_value = 'Salvage value cannot be negative.';
      }
    }

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        depreciation_method: formData.depreciation_method,
        useful_life_years: formData.depreciation_method === 'straight_line' ? Number(formData.useful_life_years) : null,
        depreciation_frequency: formData.depreciation_frequency,
        depreciation_start_date: formData.depreciation_start_date,
        salvage_value: Number(formData.salvage_value || 0),
      };

      await apiClient.post(`/assets/${asset.id}/depreciation-config`, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to configure asset depreciation', err);
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]: [string, any]) => {
          backendErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
        setError('Please correct the highlighted errors.');
      } else {
        setError(err.response?.data?.message || 'Failed to configure depreciation. Please try again.');
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
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold">
              <TrendingDown className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                Configure Fixed Asset Depreciation
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Set useful life, residual value, and auto-generate the straight-line depreciation schedule
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

        {/* Target Asset Banner */}
        <div className="px-6 py-3.5 bg-slate-50 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-purple-800 font-mono font-bold shadow-xs">
              {asset.asset_code}
            </span>
            <span className="text-slate-800 font-bold text-sm">{asset.name}</span>
          </div>
          <div className="text-slate-500">
            <span>Purchase Cost: </span>
            <span className="text-slate-900 font-mono font-bold">
              PKR {cost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Depreciation Method */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Depreciation Calculation Method
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, depreciation_method: 'straight_line' })}
                  className={`px-4 py-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    formData.depreciation_method === 'straight_line'
                      ? 'border-purple-300 bg-purple-50/80 text-purple-900 ring-2 ring-purple-500/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold text-purple-950">Straight-Line Method</div>
                  <div className="text-slate-500 text-xs mt-0.5">Equal periodic depreciation expense</div>
                </button>

                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, depreciation_method: 'none' })}
                  className={`px-4 py-3 rounded-xl border text-xs font-medium text-left transition-all cursor-pointer ${
                    formData.depreciation_method === 'none'
                      ? 'border-slate-400 bg-slate-100 text-slate-900 ring-2 ring-slate-400/20 shadow-xs'
                      : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <div className="font-bold text-slate-900">Non-Depreciable</div>
                  <div className="text-slate-500 text-xs mt-0.5">e.g. Land or static capital holding</div>
                </button>
              </div>
            </div>

            {formData.depreciation_method === 'straight_line' && (
              <>
                {/* Useful Life (Years) */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-purple-600" />
                    Useful Asset Life (Years) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    max="100"
                    value={formData.useful_life_years}
                    onChange={(e) => setFormData({ ...formData, useful_life_years: e.target.value })}
                    placeholder="e.g. 5"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                      fieldErrors.useful_life_years ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.useful_life_years && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.useful_life_years}</p>
                  )}
                </div>

                {/* Depreciation Frequency */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-blue-600" />
                    Schedule Posting Frequency
                  </label>
                  <select
                    value={formData.depreciation_frequency}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        depreciation_frequency: e.target.value as DepreciationFrequency,
                      })
                    }
                    className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all cursor-pointer"
                  >
                    <option value="monthly">Monthly (12 periods / year)</option>
                    <option value="annually">Annually (1 period / year)</option>
                  </select>
                </div>

                {/* Depreciation Start Date */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-amber-600" />
                    Depreciation Start Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={formData.depreciation_start_date}
                    onChange={(e) => setFormData({ ...formData, depreciation_start_date: e.target.value })}
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                      fieldErrors.depreciation_start_date ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.depreciation_start_date && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.depreciation_start_date}</p>
                  )}
                </div>

                {/* Salvage / Residual Value */}
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5 flex items-center gap-1.5">
                    <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
                    Residual / Salvage Value (PKR)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formData.salvage_value}
                    onChange={(e) => setFormData({ ...formData, salvage_value: e.target.value })}
                    placeholder="0.00"
                    className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                      fieldErrors.salvage_value ? 'border-rose-500' : 'border-slate-200'
                    }`}
                  />
                  {fieldErrors.salvage_value && (
                    <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.salvage_value}</p>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Live Schedule Calculation Summary */}
          {formData.depreciation_method === 'straight_line' && usefulYears > 0 && (
            <div className="p-4 rounded-xl bg-purple-50/70 border border-purple-200 text-xs space-y-2.5">
              <div className="flex items-center gap-2 text-purple-900 font-bold">
                <Calculator className="w-4 h-4 text-purple-700" />
                <span>Calculated Straight-Line Depreciation Engine</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-slate-700 pt-1">
                <div>
                  <span className="text-slate-500 font-medium block">Depreciable Basis</span>
                  <span className="font-mono font-bold text-slate-900">
                    PKR {depreciableAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Total Periods</span>
                  <span className="font-mono font-bold text-slate-900">
                    {totalPeriods} {formData.depreciation_frequency === 'monthly' ? 'Months' : 'Years'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Periodic Expense</span>
                  <span className="font-mono font-bold text-purple-700">
                    PKR {periodicDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 font-medium block">Annual Depreciation</span>
                  <span className="font-mono font-bold text-emerald-700">
                    PKR {annualDepreciation.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            </div>
          )}

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
              className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-semibold text-sm shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Generating Schedule...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Apply & Generate Schedule</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
