'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { FinancialAccount, AccountType } from '@/types/financialAccounts';
import { X, Loader2, Landmark, CheckCircle2, AlertCircle, Building2, Wallet, Smartphone, Layers } from 'lucide-react';

interface FinancialAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accountToEdit?: FinancialAccount | null;
}

const ACCOUNT_TYPES: { id: AccountType; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { id: 'cash', label: 'Cash in Hand', icon: Wallet },
  { id: 'bank', label: 'Bank Account', icon: Landmark },
  { id: 'mobile_wallet', label: 'Mobile Wallet (JazzCash/Easypaisa)', icon: Smartphone },
  { id: 'other', label: 'Other Account', icon: Layers },
];

export default function FinancialAccountModal({
  isOpen,
  onClose,
  onSuccess,
  accountToEdit,
}: FinancialAccountModalProps) {
  const isEditing = !!accountToEdit;

  const [name, setName] = useState('');
  const [accountType, setAccountType] = useState<AccountType>('cash');
  const [accountNumber, setAccountNumber] = useState('');
  const [bankName, setBankName] = useState('');
  const [openingBalance, setOpeningBalance] = useState('0');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (accountToEdit) {
      setName(accountToEdit.name || '');
      setAccountType(accountToEdit.account_type || 'cash');
      setAccountNumber(accountToEdit.account_number || '');
      setBankName(accountToEdit.bank_name || '');
      setOpeningBalance(String(accountToEdit.opening_balance || 0));
      setIsActive(accountToEdit.is_active ?? true);
    } else {
      setName('');
      setAccountType('cash');
      setAccountNumber('');
      setBankName('');
      setOpeningBalance('0');
      setIsActive(true);
    }
    setError(null);
  }, [accountToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a valid account name.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (isEditing) {
        await apiClient.put(`/financial-accounts/${accountToEdit.id}`, {
          name: name.trim(),
          account_type: accountType,
          account_number: accountNumber.trim() || null,
          bank_name: bankName.trim() || null,
          is_active: isActive,
        });
      } else {
        const bal = parseFloat(openingBalance) || 0;
        if (bal < 0) {
          setError('Opening balance cannot be negative.');
          setLoading(false);
          return;
        }

        await apiClient.post('/financial-accounts', {
          name: name.trim(),
          account_type: accountType,
          account_number: accountNumber.trim() || null,
          bank_name: bankName.trim() || null,
          opening_balance: bal,
          is_active: isActive,
        });
      }

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to save financial account. Please check inputs.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200/80 w-full max-w-lg overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">
                {isEditing ? 'Edit Financial Account' : 'Create Financial Account'}
              </h2>
              <p className="text-xs text-slate-400">
                {isEditing
                  ? 'Update account metadata and status'
                  : 'Add a new dedicated cash, bank, or mobile wallet ledger'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Account Name <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Meezan Bank Main, Cash in Hand - Factory, JazzCash Business"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A] transition-all"
            />
          </div>

          {/* Account Type */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Account Type <span className="text-rose-500">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {ACCOUNT_TYPES.map((t) => {
                const Icon = t.icon;
                const isSelected = accountType === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setAccountType(t.id)}
                    className={`flex items-center gap-2.5 p-3 rounded-xl border text-left text-xs font-bold transition-all ${
                      isSelected
                        ? 'border-[#16A34A] bg-emerald-50 text-[#16A34A] shadow-xs'
                        : 'border-slate-200 hover:border-slate-300 text-slate-600 bg-slate-50/50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isSelected ? 'text-[#16A34A]' : 'text-slate-400'}`} />
                    <span>{t.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bank Name (when applicable) */}
          {(accountType === 'bank' || accountType === 'mobile_wallet') && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  {accountType === 'bank' ? 'Bank / Institution' : 'Provider Name'}
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder={accountType === 'bank' ? 'e.g. Meezan Bank, HBL' : 'e.g. Mobilink Microfinance'}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                  Account / IBAN / Wallet #
                </label>
                <input
                  type="text"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="e.g. 01020101234567, 03001234567"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>
            </div>
          )}

          {/* Opening Balance (Only when creating) */}
          {!isEditing && (
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Opening Balance (PKR)
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={openingBalance}
                  onChange={(e) => setOpeningBalance(e.target.value)}
                  placeholder="0.00"
                  className="w-full pl-10 pr-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 font-bold text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1">
                Sets the initial current balance. Future transactions will adjust this running balance.
              </p>
            </div>
          )}

          {/* Active Status */}
          <div className="flex items-center gap-3 pt-2">
            <input
              type="checkbox"
              id="isActiveAccount"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="w-4 h-4 text-[#16A34A] rounded-sm border-slate-300 focus:ring-[#16A34A]"
            />
            <label htmlFor="isActiveAccount" className="text-xs font-bold text-slate-700 cursor-pointer">
              Active Account (Selectable in payment and transfer dropdowns)
            </label>
          </div>

          {/* Footer actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-700 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white text-xs font-bold shadow-md shadow-[#16A34A]/20 transition-all disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>{isEditing ? 'Update Account' : 'Save Financial Account'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
