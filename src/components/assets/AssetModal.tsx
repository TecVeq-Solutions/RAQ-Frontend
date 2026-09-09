'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Asset, AssetFormData, AssetType, AssetStatus } from '@/types/assets';
import {
  X,
  Wrench,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Building,
  Truck,
  Armchair,
  Tv,
  HelpCircle,
  Calendar,
  DollarSign,
  MapPin,
  FileText,
  Tag,
  ShieldAlert,
} from 'lucide-react';

interface AssetModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  asset?: Asset | null;
  readOnly?: boolean;
}

const ASSET_TYPES: { value: AssetType; label: string; icon: any }[] = [
  { value: 'machinery', label: 'Machinery & Equipment', icon: Wrench },
  { value: 'vehicle', label: 'Vehicle & Transport', icon: Truck },
  { value: 'building', label: 'Building & Infrastructure', icon: Building },
  { value: 'furniture', label: 'Furniture & Fixtures', icon: Armchair },
  { value: 'electronics', label: 'Electronics & Computers', icon: Tv },
  { value: 'other', label: 'Other Capital Asset', icon: HelpCircle },
];

const ASSET_STATUSES: { value: AssetStatus; label: string; color: string }[] = [
  { value: 'active', label: 'Active & Operational', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' },
  { value: 'retired', label: 'Retired', color: 'text-slate-400 border-slate-500/30 bg-slate-500/10' },
  { value: 'disposed', label: 'Disposed', color: 'text-rose-400 border-rose-500/30 bg-rose-500/10' },
];

export default function AssetModal({
  isOpen,
  onClose,
  onSuccess,
  asset,
  readOnly = false,
}: AssetModalProps) {
  const isEditing = Boolean(asset);

  const [formData, setFormData] = useState<AssetFormData>({
    name: '',
    asset_code: '',
    asset_type: 'machinery',
    purchase_cost: '',
    purchase_date: new Date().toISOString().split('T')[0],
    current_value: '',
    status: 'active',
    location: '',
    description: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (asset) {
      setFormData({
        name: asset.name || '',
        asset_code: asset.asset_code || '',
        asset_type: asset.asset_type || 'machinery',
        purchase_cost: asset.purchase_cost || '',
        purchase_date: asset.purchase_date ? asset.purchase_date.substring(0, 10) : '',
        current_value: asset.current_value || '',
        status: asset.status || 'active',
        location: asset.location || '',
        description: asset.description || '',
      });
    } else {
      setFormData({
        name: '',
        asset_code: '',
        asset_type: 'machinery',
        purchase_cost: '',
        purchase_date: new Date().toISOString().split('T')[0],
        current_value: '',
        status: 'active',
        location: '',
        description: '',
      });
    }
    setError(null);
    setFieldErrors({});
  }, [asset, isOpen]);

  if (!isOpen) return null;

  const validate = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Asset name is required.';
    if (!formData.asset_code.trim()) errors.asset_code = 'Asset code is required.';
    if (!formData.asset_type) errors.asset_type = 'Asset type is required.';
    if (formData.purchase_cost === '' || Number(formData.purchase_cost) < 0) {
      errors.purchase_cost = 'Purchase cost must be a non-negative number.';
    }
    if (!formData.purchase_date) errors.purchase_date = 'Purchase date is required.';
    if (formData.current_value === '' || Number(formData.current_value) < 0) {
      errors.current_value = 'Current value must be a non-negative number.';
    }
    if (!formData.status) errors.status = 'Status is required.';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;
    if (!validate()) return;

    setLoading(true);
    setError(null);
    setFieldErrors({});

    try {
      const payload = {
        name: formData.name.trim(),
        asset_code: formData.asset_code.trim().toUpperCase(),
        asset_type: formData.asset_type,
        purchase_cost: Number(formData.purchase_cost),
        purchase_date: formData.purchase_date,
        current_value: Number(formData.current_value),
        status: formData.status,
        location: formData.location?.trim() || null,
        description: formData.description?.trim() || null,
      };

      if (isEditing && asset) {
        await apiClient.put(`/assets/${asset.id}`, payload);
      } else {
        await apiClient.post('/assets', payload);
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Failed to save capital asset', err);
      if (err.response?.data?.errors) {
        const backendErrors: Record<string, string> = {};
        Object.entries(err.response.data.errors).forEach(([key, val]: [string, any]) => {
          backendErrors[key] = Array.isArray(val) ? val[0] : String(val);
        });
        setFieldErrors(backendErrors);
        setError('Please correct the highlighted errors.');
      } else {
        setError(err.response?.data?.message || 'Failed to save asset. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto animate-fade-in">
      <div className="relative w-full max-w-3xl my-8 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold text-slate-100">
                {readOnly
                  ? 'Asset Details & Specifications'
                  : isEditing
                  ? `Edit Capital Asset: ${asset?.asset_code}`
                  : 'Register New Capital Asset'}
              </h2>
              <p className="text-xs text-slate-400">
                {readOnly
                  ? 'Inspection mode for capital equipment specifications'
                  : isEditing
                  ? 'Update book value, status, or asset specifications'
                  : 'Add a new machine, vehicle, building, or capital asset to the register'}
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

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-start gap-3 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <Tag className="w-3.5 h-3.5 text-amber-400" />
              General Identification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Asset Name <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polar High-Speed Paper Cutting Machine 115"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.name ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.name}</p>
                )}
              </div>

              {/* Asset Code */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Asset Code / Tag <span className="text-rose-400">*</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AST-MACH-001"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 font-mono text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.asset_code ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.asset_code && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.asset_code}</p>
                )}
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Asset Classification <span className="text-rose-400">*</span>
                </label>
                <select
                  disabled={readOnly}
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as AssetType })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.asset_type ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.asset_type && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.asset_type}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Valuation & Status */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
              Financials & Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Purchase Cost */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Purchase Cost (PKR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={readOnly}
                  value={formData.purchase_cost}
                  onChange={(e) => {
                    const cost = e.target.value;
                    setFormData({
                      ...formData,
                      purchase_cost: cost,
                      // Auto-fill current value if empty
                      current_value: !formData.current_value && !isEditing ? cost : formData.current_value,
                    });
                  }}
                  placeholder="0.00"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.purchase_cost ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.purchase_cost && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.purchase_cost}</p>
                )}
              </div>

              {/* Current Book Value */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Current Book Value (PKR) <span className="text-rose-400">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={readOnly}
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="0.00"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.current_value ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.current_value && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.current_value}</p>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Purchase Date <span className="text-rose-400">*</span>
                </label>
                <input
                  type="date"
                  disabled={readOnly}
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all ${
                    fieldErrors.purchase_date ? 'border-rose-500' : 'border-slate-800'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed' : ''}`}
                />
                {fieldErrors.purchase_date && (
                  <p className="mt-1 text-xs text-rose-400">{fieldErrors.purchase_date}</p>
                )}
              </div>
            </div>

            {/* Operational Status */}
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1.5">
                Operational Status <span className="text-rose-400">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ASSET_STATUSES.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setFormData({ ...formData, status: st.value })}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all text-center ${
                      formData.status === st.value
                        ? `${st.color} ring-1 ring-amber-500/40 shadow-sm font-semibold`
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-300 hover:border-slate-700'
                    } ${readOnly ? 'cursor-not-allowed' : ''}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-rose-400">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          {/* Section: Location & Description */}
          <div className="space-y-4 pt-2 border-t border-slate-800/80">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              Physical Location & Notes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Physical Location / Department
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Main Production Hall - Bay 4 (Cutting Section)"
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all border-slate-800 ${
                    readOnly ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-slate-300 mb-1.5">
                  Technical Specifications & Notes
                </label>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Hydraulic clamp pressure 30kN, digital touch display, dual-hand safety interlock..."
                  className={`w-full px-3.5 py-2.5 bg-slate-950 border rounded-xl text-slate-100 text-sm placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500/50 transition-all border-slate-800 resize-none ${
                    readOnly ? 'opacity-70 cursor-not-allowed' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Cost Note */}
          {isEditing && (
            <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center justify-between text-xs text-slate-400">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-400" />
                <span>Accumulated Maintenance Expended:</span>
              </div>
              <span className="font-semibold text-amber-400 font-mono text-sm">
                PKR {Number(asset?.maintenance_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-800 text-slate-300 hover:bg-slate-800 text-sm font-medium transition-colors"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-semibold text-sm shadow-lg shadow-amber-500/20 disabled:opacity-50 flex items-center gap-2 transition-all"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Saving Asset...
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Update Asset
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Register Asset
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
