'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
  ArrowLeft,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Calendar,
  CreditCard,
  Hash,
  FileText,
  DollarSign,
  Plus,
} from 'lucide-react';

const PREDEFINED_CATEGORIES = [
  'Salaries & Wages',
  'Rent',
  'Electricity',
  'Gas',
  'Internet & Phone',
  'Transportation & Fuel',
  'Maintenance & Repairs',
  'Office Supplies & Stationery',
  'Marketing & Advertising',
  'Taxes & Legal Fees',
  'Packaging Material',
  'Miscellaneous',
];

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'easypaisa', label: 'Easypaisa' },
  { id: 'card', label: 'Card Payment' },
  { id: 'online', label: 'Online Gateway' },
  { id: 'cheque', label: 'Cheque' },
];

export default function AddExpensePage() {
  const router = useRouter();

  // Form states
  const [categoryName, setCategoryName] = useState('Salaries & Wages');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategory, setIsCustomCategory] = useState(false);
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<string>('');
  const [expenseDate, setExpenseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [referenceNumber, setReferenceNumber] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    const finalCategory = isCustomCategory ? customCategory.trim() : categoryName.trim();
    if (!finalCategory) {
      setErrorMessage('Please specify an expense category.');
      return;
    }

    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      setErrorMessage('Please enter a valid expense amount greater than 0.');
      return;
    }

    setSubmitting(true);

    try {
      const payload = {
        category_name: finalCategory,
        amount: numAmount,
        expense_date: expenseDate,
        payment_method: paymentMethod,
        reference_number: referenceNumber.trim() || null,
        description: description.trim() || null,
      };

      const res = await apiClient.post('/expenses', payload);

      if (res.data?.success) {
        setSuccessMessage('Business expense record saved successfully!');
        // Reset form
        setDescription('');
        setAmount('');
        setReferenceNumber('');

        // Redirect after short delay or offer navigation
        setTimeout(() => {
          router.push('/expenses');
        }, 1200);
      }
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Failed to save expense record. Please verify inputs.'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-2xl pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/expenses"
          className="p-2.5 rounded-2xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors shadow-xs"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Add Business Expense</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Record operational expense entry with category & payment channel (PRD E-02)
          </p>
        </div>
      </div>

      {/* Main Expense Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Error Alert */}
          {errorMessage && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Success Alert */}
          {successMessage && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-bold flex items-center gap-2.5 animate-fadeIn">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700">
                Expense Category <span className="text-rose-500">*</span>
              </label>
              <button
                type="button"
                onClick={() => setIsCustomCategory(!isCustomCategory)}
                className="text-[11px] font-bold text-blue-600 hover:underline cursor-pointer"
              >
                {isCustomCategory ? 'Choose from list' : '+ Add custom category'}
              </button>
            </div>

            {isCustomCategory ? (
              <input
                type="text"
                required
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="Enter custom category name (e.g. Legal Consulting)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            ) : (
              <select
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              >
                {PREDEFINED_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Expense Description / Narration
            </label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g. Monthly salary payment for warehouse supervisor"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
            />
          </div>

          {/* Amount & Payment Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Amount (Rs.) <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                min="0.01"
                step="any"
                required
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Payment Method <span className="text-rose-500">*</span>
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              >
                {PAYMENT_METHODS.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Expense Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={expenseDate}
                onChange={(e) => setExpenseDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Receipt / Reference #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. BILL-9988 or Cheque No."
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-black text-sm sm:text-base transition-all shadow-lg shadow-rose-600/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Saving Expense...</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Save Expense Record</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
