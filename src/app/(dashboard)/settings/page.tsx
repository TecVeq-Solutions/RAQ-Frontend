'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import {
  Settings,
  Building,
  MapPin,
  Phone,
  Mail,
  Receipt,
  DollarSign,
  ShieldCheck,
  ShieldAlert,
  Save,
  Loader2,
  CheckCircle2,
  AlertCircle,
  HardDrive,
  FileText,
} from 'lucide-react';

interface SystemSettings {
  business_name: string;
  business_address: string;
  phone_number: string;
  email: string;
  tax_number: string;
  receipt_footer: string;
  currency_symbol: string;
  currency_code: string;
  backup_retention_days: number;
}

export default function SettingsPage() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState<SystemSettings>({
    business_name: '',
    business_address: '',
    phone_number: '',
    email: '',
    tax_number: '',
    receipt_footer: '',
    currency_symbol: 'Rs.',
    currency_code: 'PKR',
    backup_retention_days: 30,
  });

  useEffect(() => {
    if (!authService.isAdmin()) {
      setIsAuthorized(false);
    }
  }, []);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    setErrorMessage(null);
    try {
      const res = await apiClient.get('/settings');
      if (res.data?.data) {
        setFormData({
          business_name: res.data.data.business_name || '',
          business_address: res.data.data.business_address || '',
          phone_number: res.data.data.phone_number || '',
          email: res.data.data.email || '',
          tax_number: res.data.data.tax_number || '',
          receipt_footer: res.data.data.receipt_footer || '',
          currency_symbol: res.data.data.currency_symbol || 'Rs.',
          currency_code: res.data.data.currency_code || 'PKR',
          backup_retention_days: res.data.data.backup_retention_days || 30,
        });
      }
    } catch (err: any) {
      if (err.response?.status === 403) {
        setIsAuthorized(false);
      } else {
        setErrorMessage(err.response?.data?.message || 'Failed to load system settings.');
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAuthorized) {
      fetchSettings();
    }
  }, [isAuthorized, fetchSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.put('/settings', formData);
      if (res.data?.success) {
        setSuccessMessage('Business profile and system settings saved successfully!');
        if (res.data.data) {
          setFormData(res.data.data);
        }
      }
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Failed to save settings. Please verify inputs.');
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div className="bg-rose-50 border border-rose-200 rounded-3xl p-8 text-center max-w-lg mx-auto my-12 animate-fadeIn">
        <ShieldAlert className="w-14 h-14 text-rose-600 mx-auto mb-4" />
        <h2 className="text-xl font-black text-rose-900">Access Denied (403 Forbidden)</h2>
        <p className="text-sm text-rose-700 mt-2">
          Only users with the <strong>Administrator</strong> role can view or update System Settings.
        </p>
        <button
          onClick={() => router.push('/dashboard')}
          className="mt-6 px-6 py-3 bg-rose-600 text-white font-bold text-sm rounded-2xl hover:bg-rose-700 transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pb-16">
      {/* Header */}
      <div>
        <h1 className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
          System & Business Settings
        </h1>
        <p className="text-sm sm:text-base text-slate-500 mt-1">
          Configure business identity, receipt vouchers, currencies, and automated backup retention policies
        </p>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-sm font-bold flex items-center gap-3 animate-fadeIn">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-sm font-bold flex items-center gap-3 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {loading ? (
        <div className="bg-white rounded-3xl p-14 text-center text-slate-400 border border-slate-200 shadow-sm">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2 text-slate-300" />
          <p className="font-bold text-sm text-slate-600">Loading configuration settings...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Card 1: Business Profile */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold shrink-0">
                <Building className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#0F172A]">Business Identity</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Official store name, addresses and corporate tax registration</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Business / Store Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.business_name}
                  onChange={(e) => setFormData({ ...formData, business_name: e.target.value })}
                  placeholder="e.g. Tecveq Electronics & General Store"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Business Address
                </label>
                <input
                  type="text"
                  value={formData.business_address}
                  onChange={(e) => setFormData({ ...formData, business_address: e.target.value })}
                  placeholder="e.g. Shop #12, Commercial Area, Lahore"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Phone Number
                </label>
                <input
                  type="text"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                  placeholder="e.g. +92 300 1234567"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Official Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="e.g. info@tecveq.com"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Tax / NTN / STRN Number
                </label>
                <input
                  type="text"
                  value={formData.tax_number}
                  onChange={(e) => setFormData({ ...formData, tax_number: e.target.value })}
                  placeholder="e.g. NTN-1234567-8"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 2: Receipt & Formatting */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center font-bold shrink-0">
                <Receipt className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#0F172A]">Voucher & Currency Configuration</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Invoice receipt footer memo and standard currency display</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 text-sm">
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Currency Symbol
                </label>
                <input
                  type="text"
                  value={formData.currency_symbol}
                  onChange={(e) => setFormData({ ...formData, currency_symbol: e.target.value })}
                  placeholder="e.g. Rs. or $"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Currency Code
                </label>
                <input
                  type="text"
                  value={formData.currency_code}
                  onChange={(e) => setFormData({ ...formData, currency_code: e.target.value })}
                  placeholder="e.g. PKR or USD"
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Receipt Thermal/A4 Footer Memo
                </label>
                <textarea
                  rows={3}
                  value={formData.receipt_footer}
                  onChange={(e) => setFormData({ ...formData, receipt_footer: e.target.value })}
                  placeholder="e.g. Thank you for your business! Goods once sold are subject to store return policy."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>
            </div>
          </div>

          {/* Card 3: Backup Retention */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm space-y-6">
            <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100">
              <div className="w-12 h-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center font-bold shrink-0">
                <HardDrive className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-black text-base sm:text-lg text-[#0F172A]">System Backup Retention</h3>
                <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Automatic pruning of old archive files</p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 items-center text-sm">
              <div>
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700 mb-2">
                  Backup Retention Window (Days)
                </label>
                <input
                  type="number"
                  min={1}
                  max={3650}
                  required
                  value={formData.backup_retention_days}
                  onChange={(e) => setFormData({ ...formData, backup_retention_days: Number(e.target.value) })}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
                />
              </div>

              <div className="text-slate-600 text-xs sm:text-sm p-4 bg-slate-50 rounded-2xl border border-slate-200/80 leading-relaxed">
                Archives older than <strong>{formData.backup_retention_days || 30} days</strong> will be automatically purged by the daily <strong>02:00 AM</strong> scheduler to preserve server disk storage.
              </div>
            </div>
          </div>

          {/* Save Action */}
          <div className="flex items-center justify-end gap-4 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-8 py-4 rounded-2xl bg-[#16A34A] hover:bg-[#059669] text-white font-black text-sm sm:text-base shadow-lg shadow-[#16A34A]/25 transition-all flex items-center gap-2.5 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
            >
              {saving ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Settings...</span>
                </>
              ) : (
                <>
                  <Save className="w-5 h-5" />
                  <span>Save Configuration</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
