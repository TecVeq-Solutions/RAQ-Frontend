'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  ArrowLeft,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Printer,
  X,
  UserCheck,
  Calendar,
  DollarSign,
  FileText,
  RotateCcw,
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  address?: string;
  current_balance: number;
  is_active: boolean;
}

interface PaymentRecord {
  id: number;
  payment_no: string;
  payment_type: 'received' | 'sent';
  party_type: 'customer' | 'supplier';
  customer_id?: number | null;
  payment_method: string;
  amount: number;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  customer?: { id: number; name: string; phone?: string; address?: string; current_balance: number };
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash' },
  { id: 'jazzcash', label: 'JazzCash' },
  { id: 'easypaisa', label: 'Easypaisa' },
  { id: 'bank', label: 'Bank Transfer' },
  { id: 'card', label: 'Card Payment' },
  { id: 'qr', label: 'QR Payment' },
  { id: 'paypal', label: 'PayPal' },
  { id: 'stripe', label: 'Stripe' },
];

export default function ReceivePaymentPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(true);

  // Form states
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<string>('cash');
  const [paymentDate, setPaymentDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [referenceNumber, setReferenceNumber] = useState<string>('');
  const [narration, setNarration] = useState<string>('');

  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  // Receipt Modal State
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<PaymentRecord | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  // Fetch registered customers
  const fetchCustomers = useCallback(async () => {
    setLoadingCustomers(true);
    try {
      const res = await apiClient.get('/customers');
      if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers', err);
    } finally {
      setLoadingCustomers(false);
    }
  }, []);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  // Selected customer snapshot
  const activeCustomer = useMemo(() => {
    return customers.find((c) => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  // Remaining balance calculation
  const remainingBalance = useMemo(() => {
    if (!activeCustomer) return 0;
    const current = Number(activeCustomer.current_balance) || 0;
    const paying = Number(amount) || 0;
    return Math.max(0, current - paying);
  }, [activeCustomer, amount]);

  // Form submit handler
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);

    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }

    const payAmount = Number(amount);
    if (!payAmount || payAmount <= 0) {
      setFormError('Please enter a valid payment amount greater than 0.');
      return;
    }

    if (activeCustomer && payAmount > Number(activeCustomer.current_balance)) {
      setFormError(
        `Payment amount cannot exceed outstanding balance of Rs. ${Number(activeCustomer.current_balance).toFixed(2)}`
      );
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        amount: payAmount,
        payment_method: paymentMethod,
        payment_date: paymentDate,
        reference_number: referenceNumber.trim() || null,
        notes: narration.trim() || null,
      };

      const res = await apiClient.post('/payments/customer', payload);
      if (res.data?.data) {
        setFormSuccess('Customer payment received and ledger credited successfully!');
        setActiveReceiptPayment(res.data.data);

        // Reset form
        setSelectedCustomerId('');
        setAmount('');
        setReferenceNumber('');
        setNarration('');
        fetchCustomers();
      }
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save customer payment. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleNativePrint = () => {
    const printContent = document.getElementById('printable-payment-receipt');
    if (!printContent) return;

    const originalContents = document.body.innerHTML;
    const printHtml = printContent.innerHTML;

    document.body.innerHTML = `
      <div style="display: flex; justify-content: center; align-items: flex-start; padding: 20px; font-family: monospace;">
        <div style="width: 100%; max-width: ${printFormat === 'thermal' ? '300px' : '700px'};">
          ${printHtml}
        </div>
      </div>
    `;
    window.print();
    document.body.innerHTML = originalContents;
    window.location.reload();
  };

  return (
    <div className="space-y-6 animate-fadeIn max-w-3xl pb-16">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link
          href="/payments"
          className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-[#0F172A]">Receive Customer Payment</h1>
          <p className="text-xs sm:text-sm text-slate-500">
            Record cash/bank collection and credit customer ledger (PRD E-01)
          </p>
        </div>
      </div>

      {/* Main Payment Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/90 shadow-sm">
        <form onSubmit={handleSavePayment} className="space-y-5">
          {formError && (
            <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          {formSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-bold flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{formSuccess}</span>
              </div>
              {activeReceiptPayment && (
                <button
                  type="button"
                  onClick={() => setActiveReceiptPayment(activeReceiptPayment)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-black shadow-xs cursor-pointer hover:bg-[#059669]"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>View & Print Receipt</span>
                </button>
              )}
            </div>
          )}

          {/* Customer Selection */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Select Customer <span className="text-rose-500">*</span>
            </label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              required
              disabled={loadingCustomers}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
            >
              <option value="">-- Choose Customer --</option>
              {customers
                .filter((c) => c.is_active)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''} — Outstanding: Rs. {Number(c.current_balance).toFixed(2)}
                  </option>
                ))}
            </select>
          </div>

          {/* Dynamic Live Balance Snapshot */}
          {activeCustomer && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 bg-slate-50/80 rounded-2xl border border-slate-200/80">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center font-bold">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Outstanding Khata Balance</span>
                  <div className="font-black text-rose-600 text-base">
                    Rs. {Number(activeCustomer.current_balance).toFixed(2)}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-start sm:justify-end gap-3 sm:border-l sm:border-slate-200 sm:pl-4">
                <div className="text-left sm:text-right">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Remaining Balance After Payment</span>
                  <div className="font-black text-[#16A34A] text-base">
                    Rs. {remainingBalance.toFixed(2)}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Payment Amount & Method */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Payment Amount (Rs.) <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
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

          {/* Payment Date & Reference */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Payment Date <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={paymentDate}
                onChange={(e) => setPaymentDate(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
                Transaction / Reference #
              </label>
              <input
                type="text"
                value={referenceNumber}
                onChange={(e) => setReferenceNumber(e.target.value)}
                placeholder="e.g. TID / Cheque No. (optional)"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
              />
            </div>
          </div>

          {/* Narration / Description (PRD E-01) */}
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-slate-700 mb-2">
              Narration / Description (PRD E-01)
            </label>
            <input
              type="text"
              value={narration}
              onChange={(e) => setNarration(e.target.value)}
              placeholder="e.g. Cash received from Ali for Inv #104"
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting || loadingCustomers}
            className="w-full py-4 rounded-2xl bg-[#16A34A] hover:bg-[#059669] text-white font-black text-sm sm:text-base transition-all shadow-lg shadow-[#16A34A]/25 flex items-center justify-center gap-2.5 cursor-pointer disabled:opacity-50 hover:scale-[1.01] active:scale-[0.99] mt-6"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Recording Payment...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Payment & Credit Customer Ledger</span>
              </>
            )}
          </button>
        </form>
      </div>

      {/* Official Printable Receipt & Voucher Modal */}
      {activeReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-xl rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <Printer className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">Payment Receipt Ready</h3>
                  <p className="text-[11px] text-slate-400 font-mono">{activeReceiptPayment.payment_no}</p>
                </div>
              </div>

              {/* Format Switcher */}
              <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintFormat('thermal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'thermal' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'a4' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Standard
                </button>
              </div>
            </div>

            {/* Receipt Preview Area */}
            <div className="p-6 bg-slate-100/50 max-h-[65vh] overflow-y-auto">
              {printFormat === 'thermal' ? (
                /* Thermal 80mm Preview */
                <div
                  id="printable-payment-receipt"
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200/80 max-w-[320px] mx-auto text-slate-800 font-mono text-[11px] leading-relaxed space-y-3"
                >
                  <div className="text-center pb-3 border-b border-dashed border-slate-300">
                    <h2 className="text-sm font-black text-slate-900 uppercase">SALES & ACCOUNTING ERP</h2>
                    <p className="text-[10px] text-slate-500">OFFICIAL PAYMENT RECEIPT</p>
                    <div className="font-bold text-slate-700 mt-1">{activeReceiptPayment.payment_no}</div>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-bold">{activeReceiptPayment.payment_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold">
                        {activeReceiptPayment.customer?.name || activeCustomer?.name || 'Customer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Payment Mode:</span>
                      <span className="font-bold uppercase">{activeReceiptPayment.payment_method}</span>
                    </div>
                    {activeReceiptPayment.reference_number && (
                      <div className="flex justify-between">
                        <span className="text-slate-500">Ref / Txn #:</span>
                        <span className="font-bold">{activeReceiptPayment.reference_number}</span>
                      </div>
                    )}
                  </div>

                  <div className="py-2 border-y border-dashed border-slate-300 space-y-1">
                    <div className="flex justify-between font-black text-xs text-slate-900">
                      <span>AMOUNT RECEIVED:</span>
                      <span className="text-[#16A34A]">Rs. {Number(activeReceiptPayment.amount).toFixed(2)}</span>
                    </div>
                    {(activeReceiptPayment.customer || activeCustomer) && (
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Current Khata Balance:</span>
                        <span className="font-bold">
                          Rs. {Number(activeReceiptPayment.customer?.current_balance ?? remainingBalance).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  {activeReceiptPayment.notes && (
                    <div className="text-[10px] text-slate-500 italic">
                      Narration: {activeReceiptPayment.notes}
                    </div>
                  )}

                  <div className="text-center pt-2 text-[9px] text-slate-400">
                    <p>Computer Generated Receipt</p>
                    <p>Customer Ledger Credited</p>
                  </div>
                </div>
              ) : (
                /* A4 Standard Voucher Preview */
                <div
                  id="printable-payment-receipt"
                  className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200/80 space-y-4 text-xs"
                >
                  <div className="flex items-start justify-between pb-3 border-b border-slate-200">
                    <div>
                      <h2 className="text-base font-black text-[#0F172A]">SALES & ACCOUNTING ERP</h2>
                      <p className="text-slate-500 text-[11px]">Financial & Cash Flow Management</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-[10px] font-black uppercase bg-emerald-100 text-[#16A34A] border border-emerald-200">
                        PAYMENT RECEIPT
                      </span>
                      <div className="font-mono font-bold text-xs text-[#0F172A] mt-1">{activeReceiptPayment.payment_no}</div>
                      <div className="text-slate-400 text-[10px]">Date: {activeReceiptPayment.payment_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Customer Details</div>
                      <div className="font-bold text-slate-800 text-xs">
                        {activeReceiptPayment.customer?.name || activeCustomer?.name || 'Customer'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {activeReceiptPayment.customer?.phone || activeCustomer?.phone || ''}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Transaction Details</div>
                      <div className="font-bold text-slate-800 text-xs">Method: {activeReceiptPayment.payment_method?.toUpperCase()}</div>
                      {activeReceiptPayment.reference_number && (
                        <div className="text-slate-500 text-[10px]">Txn Ref: {activeReceiptPayment.reference_number}</div>
                      )}
                    </div>
                  </div>

                  <div className="p-4 bg-emerald-50/50 rounded-xl border border-emerald-200/70 flex justify-between items-center">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-emerald-800">Net Amount Received</div>
                      <div className="text-xs text-slate-500">Atomic ledger credit posted</div>
                    </div>
                    <div className="text-xl font-black text-[#16A34A]">
                      Rs. {Number(activeReceiptPayment.amount).toFixed(2)}
                    </div>
                  </div>

                  {activeReceiptPayment.notes && (
                    <div className="text-slate-600 text-[11px] p-2.5 bg-slate-50 rounded-lg border border-slate-200/60">
                      <strong>Narration:</strong> {activeReceiptPayment.notes}
                    </div>
                  )}

                  <div className="pt-8 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
                    <div>Received By: ______________</div>
                    <div>Authorized Stamp: ______________</div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80">
              <button
                type="button"
                onClick={() => setActiveReceiptPayment(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handleNativePrint}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] font-black text-xs text-white transition-all shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Receipt ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
