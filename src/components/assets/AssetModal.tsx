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
  { value: 'active', label: 'Active & Operational', color: 'text-emerald-700 border-emerald-300 bg-emerald-50' },
  { value: 'under_maintenance', label: 'Under Maintenance', color: 'text-amber-800 border-amber-300 bg-amber-50' },
  { value: 'retired', label: 'Retired', color: 'text-slate-700 border-slate-300 bg-slate-100' },
  { value: 'disposed', label: 'Disposed', color: 'text-rose-700 border-rose-300 bg-rose-50' },
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
      <div className="relative w-full max-w-3xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#16A34A] flex items-center justify-center font-bold">
              <Wrench className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-[#0F172A]">
                {readOnly
                  ? 'Asset Details & Specifications'
                  : isEditing
                  ? `Edit Capital Asset: ${asset?.asset_code}`
                  : 'Register New Capital Asset'}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
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
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto flex-1">
          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-sm font-medium">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Section: Basic Details */}
          <div className="space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <Tag className="w-4 h-4 text-[#16A34A]" />
              General Identification
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Asset Name */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Asset Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Polar High-Speed Paper Cutting Machine 115"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.name ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                />
                {fieldErrors.name && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.name}</p>
                )}
              </div>

              {/* Asset Code */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Asset Code / Tag <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.asset_code}
                  onChange={(e) => setFormData({ ...formData, asset_code: e.target.value.toUpperCase() })}
                  placeholder="e.g. AST-MACH-001"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 font-mono text-sm placeholder-slate-400 font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.asset_code ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                />
                {fieldErrors.asset_code && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.asset_code}</p>
                )}
              </div>

              {/* Asset Type */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Asset Classification <span className="text-rose-500">*</span>
                </label>
                <select
                  disabled={readOnly}
                  value={formData.asset_type}
                  onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as AssetType })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.asset_type ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                >
                  {ASSET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                {fieldErrors.asset_type && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.asset_type}</p>
                )}
              </div>
            </div>
          </div>

          {/* Section: Valuation & Status */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Financials & Status
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Purchase Cost */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Purchase Cost (PKR) <span className="text-rose-500">*</span>
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
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.purchase_cost ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                />
                {fieldErrors.purchase_cost && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.purchase_cost}</p>
                )}
              </div>

              {/* Current Book Value */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Current Book Value (PKR) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  disabled={readOnly}
                  value={formData.current_value}
                  onChange={(e) => setFormData({ ...formData, current_value: e.target.value })}
                  placeholder="0.00"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.current_value ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                />
                {fieldErrors.current_value && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.current_value}</p>
                )}
              </div>

              {/* Purchase Date */}
              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Purchase Date <span className="text-rose-500">*</span>
                </label>
                <input
                  type="date"
                  disabled={readOnly}
                  value={formData.purchase_date}
                  onChange={(e) => setFormData({ ...formData, purchase_date: e.target.value })}
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all ${
                    fieldErrors.purchase_date ? 'border-rose-500' : 'border-slate-200'
                  } ${readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''}`}
                />
                {fieldErrors.purchase_date && (
                  <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.purchase_date}</p>
                )}
              </div>
            </div>

            {/* Operational Status */}
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Operational Status <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {ASSET_STATUSES.map((st) => (
                  <button
                    key={st.value}
                    type="button"
                    disabled={readOnly}
                    onClick={() => setFormData({ ...formData, status: st.value })}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-bold transition-all text-center cursor-pointer ${
                      formData.status === st.value
                        ? `${st.color} shadow-xs ring-2 ring-[#16A34A]/30`
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    } ${readOnly ? 'cursor-not-allowed opacity-70' : ''}`}
                  >
                    {st.label}
                  </button>
                ))}
              </div>
              {fieldErrors.status && (
                <p className="mt-1 text-xs text-rose-600 font-medium">{fieldErrors.status}</p>
              )}
            </div>
          </div>

          {/* Section: Location & Description */}
          <div className="space-y-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Physical Location & Notes
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Location */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Physical Location / Department
                </label>
                <input
                  type="text"
                  disabled={readOnly}
                  value={formData.location || ''}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="e.g. Main Production Hall - Bay 4 (Cutting Section)"
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all border-slate-200 ${
                    readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''
                  }`}
                />
              </div>

              {/* Description */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Technical Specifications & Notes
                </label>
                <textarea
                  rows={3}
                  disabled={readOnly}
                  value={formData.description || ''}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g. Hydraulic clamp pressure 30kN, digital touch display, dual-hand safety interlock..."
                  className={`w-full px-3.5 py-2.5 bg-white border rounded-xl text-slate-900 text-sm font-medium placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all border-slate-200 resize-none ${
                    readOnly ? 'opacity-70 cursor-not-allowed bg-slate-50' : ''
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Maintenance Cost Note */}
          {isEditing && (
            <div className="p-3.5 rounded-xl bg-amber-50/60 border border-amber-200 flex items-center justify-between text-xs text-amber-900 font-medium">
              <div className="flex items-center gap-2">
                <Wrench className="w-4 h-4 text-amber-600" />
                <span>Accumulated Maintenance Expended:</span>
              </div>
              <span className="font-bold text-amber-800 font-mono text-sm">
                PKR {Number(asset?.maintenance_cost || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </span>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-semibold transition-colors cursor-pointer"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-semibold text-sm shadow-sm disabled:opacity-50 flex items-center gap-2 transition-all cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Saving Asset...</span>
                  </>
                ) : isEditing ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Update Asset</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Register Asset</span>
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
