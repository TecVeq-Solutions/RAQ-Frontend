'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Supplier } from '@/types/ledger';
import { X, Loader2, Building2, Info } from 'lucide-react';

interface SupplierModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  supplierToEdit?: Supplier | null;
}

export default function SupplierModal({
  isOpen,
  onClose,
  onSuccess,
  supplierToEdit,
}: SupplierModalProps) {
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (supplierToEdit) {
      setName(supplierToEdit.name || '');
      setContactPerson(supplierToEdit.contact_person || '');
      setEmail(supplierToEdit.email || '');
      setPhone(supplierToEdit.phone || '');
      setAddress(supplierToEdit.address || '');
      setOpeningBalance(String(supplierToEdit.opening_balance || '0'));
      setIsActive(supplierToEdit.is_active ?? true);
    } else {
      setName('');
      setContactPerson('');
      setEmail('');
      setPhone('');
      setAddress('');
      setOpeningBalance('0');
      setIsActive(true);
    }
    setError(null);
  }, [supplierToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Supplier Name is required.');

    setLoading(true);
    setError(null);

    const payload: any = {
      name: name.trim(),
      contact_person: contactPerson.trim() || null,
      email: email.trim() || null,
      phone: phone.trim() || null,
      address: address.trim() || null,
      is_active: isActive,
    };

    // Only post opening_balance on creation to preserve ledger history immutability
    if (!supplierToEdit) {
      payload.opening_balance = parseFloat(openingBalance) || 0;
    }

    try {
      if (supplierToEdit) {
        await apiClient.put(`/suppliers/${supplierToEdit.id}`, payload);
      } else {
        await apiClient.post('/suppliers', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save supplier.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-base">
            <Building2 className="w-5 h-5 text-[#16A34A]" />
            <span>{supplierToEdit ? 'Edit Supplier Info' : 'Register New Supplier'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Supplier / Company Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Al-Noor Mills"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Contact Person
            </label>
            <input
              type="text"
              placeholder="e.g. Junaid Noor"
              value={contactPerson}
              onChange={(e) => setContactPerson(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Phone Number
              </label>
              <input
                type="text"
                placeholder="e.g. 03009876543"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                Email Address
              </label>
              <input
                type="email"
                placeholder="e.g. supplier@domain.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Khata Opening Balance (Rs.)
            </label>
            <input
              type="number"
              step="0.01"
              min="0"
              disabled={!!supplierToEdit}
              placeholder="e.g. 100000"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] disabled:bg-slate-100 disabled:text-slate-500 disabled:cursor-not-allowed"
            />
            {supplierToEdit && (
              <p className="mt-1 text-[11px] text-slate-500 flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-slate-400" />
                Opening balance is immutable. Post reversing entry for changes.
              </p>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Address
            </label>
            <textarea
              rows={2}
              placeholder="Supplier address..."
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          <div className="flex items-center gap-2 pt-2">
            <input
              type="checkbox"
              id="supplierActive"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]"
            />
            <label htmlFor="supplierActive" className="text-xs font-bold text-slate-800 cursor-pointer">
              Active Status
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-semibold bg-[#16A34A] text-white hover:bg-[#059669] transition-all shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{supplierToEdit ? 'Save Changes' : 'Register Supplier'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
