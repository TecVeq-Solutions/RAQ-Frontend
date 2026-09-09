'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Asset, AssetMaintenanceFormData } from '@/types/assets';
import {
  X,
  Wrench,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Calendar,
  DollarSign,
  Building,
  UserCheck,
  FileText,
  Sparkles,
} from 'lucide-react';

interface AssetMaintenanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset: Asset | null;
}

export default function AssetMaintenanceModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
}: AssetMaintenanceModalProps) {
  const [formData, setFormData] = useState<AssetMaintenanceFormData>({
    maintenance_date: new Date().toISOString().split('T')[0],
    cost: '',
    vendor_name: '',
    performed_by: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        maintenance_date: new Date().toISOString().split('T')[0],
        cost: '',
        vendor_name: '',
        performed_by: '',
        description: '',
      });
      setError(null);
      setFieldErrors({});
    }
  }, [isOpen, asset]);

  if (!isOpen || !asset) return null;

  const currentMaintenanceCost = Number(asset.maintenance_cost || 0);
  const enteredCost = Number(formData.cost || 0);
  const projectedMaintenanceCost = currentMaintenanceCost + (enteredCost > 0 ? enteredCost : 0);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.maintenance_date) errors.maintenance_date = 'Maintenance date is required.';
    if (formData.cost === '' || Number(formData.cost) <= 0) {
      errors.cost = 'Maintenance cost must be greater than zero.';
    }
    if (!formData.description.trim()) {
      errors.description = 'Description of repair / maintenance is required.';
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
        maintenance_date: formData.maintenance_date,
        cost: Number(formData.cost),
        vendor_name: formData.vendor_name?.trim() || null,
        performed_by: formData.performed_by?.trim() || null,
        description: formData.description.trim(),
      };

      await apiClient.post(`/assets/${asset.id}/maintenance`, payload);

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to record maintenance expense', err);
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]: [string, any]) => {
          backendErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
        setError('Please correct the highlighted errors.');
      } else {
        setError(err.response?.data?.message || 'Failed to record maintenance. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-2xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                Record Machine Maintenance & Repair
              </h2>
              <p className="text-xs text-slate-400">
                Log service expenses, vendor work, or overhaul costs for capital assets
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Target Asset Banner */}
        <div className="px-6 py-3.5 bg-slate-950/70 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2.5">
            <span className="px-2.5 py-1 rounded-lg bg-slate-800 text-amber-400 font-mono font-semibold">
              {asset.asset_code}
            </span>
            <span className="text-slate-200 font-medium text-sm">{asset.name}</span>
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <div>
              <span>Current Maint: </span>
              <span className="text-slate-200 font-mono font-medium">
                PKR {currentMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Maintenance Date */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-amber-400" />
                Maintenance Date <span className="text-rose-400">*</span>
              </label>
              <input
                type="date"
                value={formData.maintenance_date}
                onChange={(e) => setFormData({ ...formData, maintenance_date: e.target.value })}
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  fieldErrors.maintenance_date ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.maintenance_date && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.maintenance_date}</p>
              )}
            </div>

            {/* Maintenance Cost */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                Service / Repair Cost (PKR) <span className="text-rose-400">*</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                placeholder="0.00"
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                  fieldErrors.cost ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.cost && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.cost}</p>
              )}
            </div>

            {/* Vendor / Workshop */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <Building className="w-3.5 h-3.5 text-blue-400" />
                Vendor / Service Center (Optional)
              </label>
              <input
                type="text"
                value={formData.vendor_name || ''}
                onChange={(e) => setFormData({ ...formData, vendor_name: e.target.value })}
                placeholder="e.g. Precision Hydraulics & Blade Honing Ltd"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Performed By / Technician */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-purple-400" />
                Technician / Performed By (Optional)
              </label>
              <input
                type="text"
                value={formData.performed_by || ''}
                onChange={(e) => setFormData({ ...formData, performed_by: e.target.value })}
                placeholder="e.g. Eng. Tariq Mahmood / In-House Mechanic"
                className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all"
              />
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="block text-xs font-medium text-slate-300 mb-1.5 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5 text-amber-400" />
                Work Done / Maintenance Description <span className="text-rose-400">*</span>
              </label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Describe the maintenance, parts replaced, calibration performed, or preventative servicing..."
                className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all resize-none ${
                  fieldErrors.description ? 'border-rose-500' : 'border-slate-800'
                }`}
              />
              {fieldErrors.description && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.description}</p>
              )}
            </div>
          </div>

          {/* Automatic Accumulation Live Preview Callout */}
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs space-y-1.5">
            <div className="flex items-center gap-2 text-amber-400 font-semibold">
              <Sparkles className="w-4 h-4" />
              <span>Automated Maintenance Ledger Increment</span>
            </div>
            <p className="text-slate-400">
              Upon recording, the asset&apos;s accumulated maintenance cost will automatically increase from{' '}
              <span className="font-mono text-slate-200">
                PKR {currentMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>{' '}
              to{' '}
              <span className="font-mono text-emerald-400 font-semibold">
                PKR {projectedMaintenanceCost.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
              .
            </p>
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Recording Maintenance...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Record Maintenance
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
