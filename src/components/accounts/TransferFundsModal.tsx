'use client';

import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/api';
import { FinancialAccount } from '@/types/financialAccounts';
import {
  X,
  Loader2,
  ArrowRightLeft,
  CheckCircle2,
  AlertCircle,
  Wallet,
  Landmark,
  ArrowRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface TransferFundsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accounts: FinancialAccount[];
  preselectedFromAccountId?: number | null;
}

export default function TransferFundsModal({
  isOpen,
  onClose,
  onSuccess,
  accounts,
  preselectedFromAccountId,
}: TransferFundsModalProps) {
  const activeAccounts = useMemo(() => accounts.filter((a) => a.is_active), [accounts]);

  const [fromAccountId, setFromAccountId] = useState<string>('');
  const [toAccountId, setToAccountId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [transferDate, setTransferDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [description, setDescription] = useState<string>('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      if (preselectedFromAccountId) {
        setFromAccountId(String(preselectedFromAccountId));
      } else if (activeAccounts.length > 0 && !fromAccountId) {
        setFromAccountId(String(activeAccounts[0].id));
      }

      if (activeAccounts.length > 1 && !toAccountId) {
        const other = activeAccounts.find((a) => String(a.id) !== fromAccountId);
        if (other) setToAccountId(String(other.id));
      }

      setAmount('');
      setDescription('');
      setError(null);
    }
  }, [isOpen, preselectedFromAccountId, activeAccounts]);

  const sourceAccount = useMemo(() => {
    return activeAccounts.find((a) => String(a.id) === fromAccountId) || null;
  }, [activeAccounts, fromAccountId]);

  const destinationAccount = useMemo(() => {
    return activeAccounts.find((a) => String(a.id) === toAccountId) || null;
  }, [activeAccounts, toAccountId]);

  const sourceBalance = sourceAccount ? Number(sourceAccount.current_balance) : 0;
  const transferAmount = parseFloat(amount) || 0;
  const isInsufficient = transferAmount > sourceBalance;

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!fromAccountId || !toAccountId) {
      setError('Please select both source and destination accounts.');
      return;
    }

    if (fromAccountId === toAccountId) {
      setError('Source and destination accounts must be different.');
      return;
    }

    if (transferAmount <= 0) {
      setError('Transfer amount must be greater than zero.');
      return;
    }

    if (isInsufficient) {
      setError(`Insufficient funds in ${sourceAccount?.name}. Available balance: Rs. ${sourceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await apiClient.post('/financial-accounts/transfer', {
        from_account_id: parseInt(fromAccountId),
        to_account_id: parseInt(toAccountId),
        amount: transferAmount,
        transfer_date: transferDate,
        description: description.trim() || undefined,
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Transfer failed. Please check inputs and account balances.';
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
            <div className="w-9 h-9 rounded-xl bg-[#16A34A]/20 text-[#16A34A] flex items-center justify-center border border-[#16A34A]/30">
              <ArrowRightLeft className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white">Transfer Funds</h2>
              <p className="text-xs text-slate-400">
                Move balance atomically between internal cash & bank accounts
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

        {/* Transfer Visual Card */}
        <div className="bg-slate-50 px-6 py-4 border-b border-slate-200/80 flex items-center justify-between gap-4">
          {/* Source Account Preview */}
          <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">From Account</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {sourceAccount?.name || 'Select Source'}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Available: <span className="font-bold text-slate-800">Rs. {sourceBalance.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
            <ArrowRight className="w-4 h-4" />
          </div>

          {/* Destination Account Preview */}
          <div className="flex-1 bg-white p-3 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">To Account</div>
            <div className="text-xs font-bold text-slate-900 truncate mt-0.5">
              {destinationAccount?.name || 'Select Destination'}
            </div>
            <div className="text-xs font-semibold text-slate-500 mt-1">
              Current: <span className="font-bold text-slate-800">Rs. {(destinationAccount ? Number(destinationAccount.current_balance) : 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
            </div>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2.5 text-rose-700 text-xs font-semibold">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Account Selectors */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                From Account (Source) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={fromAccountId}
                onChange={(e) => setFromAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
              >
                <option value="">-- Select Source --</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={String(a.id) === toAccountId}>
                    {a.name} (Rs. {Number(a.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                To Account (Destination) <span className="text-rose-500">*</span>
              </label>
              <select
                required
                value={toAccountId}
                onChange={(e) => setToAccountId(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
              >
                <option value="">-- Select Destination --</option>
                {activeAccounts.map((a) => (
                  <option key={a.id} value={a.id} disabled={String(a.id) === fromAccountId}>
                    {a.name} (Rs. {Number(a.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Amount & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Transfer Amount (PKR) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <span className="absolute left-3.5 top-2.5 text-xs font-bold text-slate-400">Rs.</span>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className={`w-full pl-10 pr-3.5 py-2.5 rounded-xl border font-bold text-sm focus:outline-none focus:ring-2 ${
                    isInsufficient
                      ? 'border-rose-300 bg-rose-50/30 text-rose-900 focus:ring-rose-200 focus:border-rose-500'
                      : 'border-slate-200 text-slate-900 focus:ring-[#16A34A]/30 focus:border-[#16A34A]'
                  }`}
                />
              </div>
              {isInsufficient && (
                <p className="text-xs text-rose-600 font-semibold mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" /> Exceeds source account available balance
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                Transfer Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={transferDate}
                onChange={(e) => setTransferDate(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Description / Memo (Optional)
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Deposit daily cash into Meezan Bank, Petty cash refill"
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-slate-900 text-sm focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
            />
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
              disabled={loading || isInsufficient || transferAmount <= 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white text-xs font-bold shadow-md shadow-[#16A34A]/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Executing Transfer...</span>
                </>
              ) : (
                <>
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Execute Transfer</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
