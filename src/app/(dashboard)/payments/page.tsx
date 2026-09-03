'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '@/lib/api';
import {
  CreditCard,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  Search,
  Filter,
  Calendar,
  DollarSign,
  UserCheck,
  Building2,
  Printer,
  X,
  Loader2,
  RefreshCw,
  Wallet,
  FileCheck2,
  CheckCircle2,
  AlertCircle,
  Hash,
  ChevronRight,
  TrendingDown,
  TrendingUp,
} from 'lucide-react';

interface Party {
  id: number;
  name: string;
  phone?: string;
  current_balance: number;
  is_active: boolean;
}

interface PaymentRecord {
  id: number;
  payment_no: string;
  payment_type: 'received' | 'sent';
  party_type: 'customer' | 'supplier';
  customer_id?: number | null;
  supplier_id?: number | null;
  sale_id?: number | null;
  purchase_id?: number | null;
  payment_method: string;
  amount: number;
  payment_date: string;
  reference_number?: string | null;
  notes?: string | null;
  created_at: string;
  customer?: { id: number; name: string; phone?: string; address?: string; current_balance: number };
  supplier?: { id: number; name: string; phone?: string; address?: string; current_balance: number };
  sale?: { id: number; invoice_no: string; grand_total: number };
  purchase?: { id: number; purchase_no: string; grand_total: number };
}

const PAYMENT_METHODS = [
  { id: 'cash', label: 'Cash', color: 'bg-emerald-50 text-[#16A34A] border-emerald-200' },
  { id: 'jazzcash', label: 'JazzCash', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { id: 'easypaisa', label: 'Easypaisa', color: 'bg-emerald-50 text-emerald-800 border-emerald-300' },
  { id: 'bank', label: 'Bank Transfer', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { id: 'card', label: 'Card Payment', color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { id: 'qr', label: 'QR Payment', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { id: 'paypal', label: 'PayPal', color: 'bg-sky-50 text-sky-700 border-sky-200' },
  { id: 'stripe', label: 'Stripe', color: 'bg-violet-50 text-violet-700 border-violet-200' },
];

export default function PaymentsPage() {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [customers, setCustomers] = useState<Party[]>([]);
  const [suppliers, setSuppliers] = useState<Party[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_count: 0,
    total_received: 0,
    total_sent: 0,
    net_flow: 0,
  });

  // Filters
  const [partyTypeFilter, setPartyTypeFilter] = useState<'all' | 'customer' | 'supplier'>('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // Modals
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [isSupplierModalOpen, setIsSupplierModalOpen] = useState(false);
  const [activeReceiptPayment, setActiveReceiptPayment] = useState<PaymentRecord | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  // Customer Form State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [customerAmount, setCustomerAmount] = useState<string>('');
  const [customerMethod, setCustomerMethod] = useState<string>('cash');
  const [customerDate, setCustomerDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [customerRef, setCustomerRef] = useState<string>('');
  const [customerNotes, setCustomerNotes] = useState<string>('');
  const [submittingCustomer, setSubmittingCustomer] = useState(false);
  const [customerFormError, setCustomerFormError] = useState<string | null>(null);

  // Supplier Form State
  const [selectedSupplierId, setSelectedSupplierId] = useState<string>('');
  const [supplierAmount, setSupplierAmount] = useState<string>('');
  const [supplierMethod, setSupplierMethod] = useState<string>('bank');
  const [supplierDate, setSupplierDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [supplierRef, setSupplierRef] = useState<string>('');
  const [supplierNotes, setSupplierNotes] = useState<string>('');
  const [submittingSupplier, setSubmittingSupplier] = useState(false);
  const [supplierFormError, setSupplierFormError] = useState<string | null>(null);

  const fetchParties = useCallback(async () => {
    try {
      const [custRes, suppRes] = await Promise.all([
        apiClient.get('/customers'),
        apiClient.get('/suppliers'),
      ]);
      if (custRes.data?.data) setCustomers(custRes.data.data);
      if (suppRes.data?.data) setSuppliers(suppRes.data.data);
    } catch (err) {
      console.error('Failed to load customers/suppliers', err);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (partyTypeFilter !== 'all') params.party_type = partyTypeFilter;
      if (paymentMethodFilter) params.payment_method = paymentMethodFilter;
      if (searchTerm) params.search = searchTerm;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const res = await apiClient.get('/payments', { params });
      if (res.data?.data) {
        setPayments(res.data.data);
      }
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load payments', err);
    } finally {
      setLoading(false);
    }
  }, [partyTypeFilter, paymentMethodFilter, searchTerm, dateFrom, dateTo]);

  useEffect(() => {
    fetchParties();
  }, [fetchParties]);

  useEffect(() => {
    const handler = setTimeout(() => {
      fetchPayments();
    }, 250);
    return () => clearTimeout(handler);
  }, [fetchPayments]);

  // Selected party lookups & remaining balance calculation
  const activeSelectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === Number(selectedCustomerId));
  }, [customers, selectedCustomerId]);

  const customerRemainingBalance = useMemo(() => {
    if (!activeSelectedCustomer) return 0;
    const current = Number(activeSelectedCustomer.current_balance) || 0;
    const paying = Number(customerAmount) || 0;
    return Math.max(0, current - paying);
  }, [activeSelectedCustomer, customerAmount]);

  const activeSelectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === Number(selectedSupplierId));
  }, [suppliers, selectedSupplierId]);

  const supplierRemainingPayable = useMemo(() => {
    if (!activeSelectedSupplier) return 0;
    const current = Number(activeSelectedSupplier.current_balance) || 0;
    const paying = Number(supplierAmount) || 0;
    return Math.max(0, current - paying);
  }, [activeSelectedSupplier, supplierAmount]);

  // Handle Customer Payment Submit
  const handleSaveCustomerPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCustomerFormError(null);

    if (!selectedCustomerId) {
      setCustomerFormError('Please select a customer.');
      return;
    }
    const amt = Number(customerAmount);
    if (!amt || amt <= 0) {
      setCustomerFormError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (activeSelectedCustomer && amt > Number(activeSelectedCustomer.current_balance)) {
      setCustomerFormError(
        `Payment amount cannot exceed outstanding balance of Rs. ${Number(activeSelectedCustomer.current_balance).toFixed(2)}`
      );
      return;
    }

    setSubmittingCustomer(true);
    try {
      const payload = {
        customer_id: Number(selectedCustomerId),
        amount: amt,
        payment_method: customerMethod,
        payment_date: customerDate,
        reference_number: customerRef.trim() || null,
        notes: customerNotes.trim() || null,
      };

      const res = await apiClient.post('/payments/customer', payload);
      if (res.data?.data) {
        setIsCustomerModalOpen(false);
        setActiveReceiptPayment(res.data.data);
        // Reset form
        setSelectedCustomerId('');
        setCustomerAmount('');
        setCustomerRef('');
        setCustomerNotes('');
        fetchPayments();
        fetchParties();
      }
    } catch (err: any) {
      setCustomerFormError(err.response?.data?.message || 'Failed to process customer payment.');
    } finally {
      setSubmittingCustomer(false);
    }
  };

  // Handle Supplier Payment Submit
  const handleSaveSupplierPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setSupplierFormError(null);

    if (!selectedSupplierId) {
      setSupplierFormError('Please select a supplier.');
      return;
    }
    const amt = Number(supplierAmount);
    if (!amt || amt <= 0) {
      setSupplierFormError('Please enter a valid payment amount greater than 0.');
      return;
    }
    if (activeSelectedSupplier && amt > Number(activeSelectedSupplier.current_balance)) {
      setSupplierFormError(
        `Payment amount cannot exceed payable balance of Rs. ${Number(activeSelectedSupplier.current_balance).toFixed(2)}`
      );
      return;
    }

    setSubmittingSupplier(true);
    try {
      const payload = {
        supplier_id: Number(selectedSupplierId),
        amount: amt,
        payment_method: supplierMethod,
        payment_date: supplierDate,
        reference_number: supplierRef.trim() || null,
        notes: supplierNotes.trim() || null,
      };

      const res = await apiClient.post('/payments/supplier', payload);
      if (res.data?.data) {
        setIsSupplierModalOpen(false);
        setActiveReceiptPayment(res.data.data);
        // Reset form
        setSelectedSupplierId('');
        setSupplierAmount('');
        setSupplierRef('');
        setSupplierNotes('');
        fetchPayments();
        fetchParties();
      }
    } catch (err: any) {
      setSupplierFormError(err.response?.data?.message || 'Failed to process supplier payment voucher.');
    } finally {
      setSubmittingSupplier(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Quick Action Buttons */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Payment Receipts & Vouchers</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Record customer collections, supplier disbursements, and print authentic vouchers
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              setCustomerFormError(null);
              setIsCustomerModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#16A34A]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Receive Customer Payment</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setSupplierFormError(null);
              setIsSupplierModalOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <ArrowUpRight className="w-4 h-4 text-emerald-400" />
            <span>Pay Supplier Voucher</span>
          </button>
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {/* Total Collections */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Customer Inflow</div>
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] mt-1">
              Rs. {summary.total_received.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingUp className="w-3.5 h-3.5" /> Collections
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-100">
            <ArrowDownLeft className="w-5 h-5" />
          </div>
        </div>

        {/* Total Disbursements */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Supplier Outflow</div>
            <div className="text-xl sm:text-2xl font-black text-slate-900 mt-1">
              Rs. {summary.total_sent.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 font-semibold flex items-center gap-1 mt-0.5">
              <TrendingDown className="w-3.5 h-3.5 text-rose-500" /> Paid to Suppliers
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center border border-slate-200">
            <ArrowUpRight className="w-5 h-5" />
          </div>
        </div>

        {/* Net Flow */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Cash Flow</div>
            <div className={`text-xl sm:text-2xl font-black mt-1 ${summary.net_flow >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
              Rs. {summary.net_flow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Inflow minus Outflow</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Total Records */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Vouchers Count</div>
            <div className="text-xl sm:text-2xl font-black text-[#0F172A] mt-1">{summary.total_count}</div>
            <div className="text-[11px] text-slate-400 font-medium mt-0.5">Recorded Transactions</div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100">
            <FileCheck2 className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-6 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Vouch #, Party, Ref #, Notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 placeholder:font-normal placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
            />
          </div>

          {/* Party Type Filter */}
          <div>
            <select
              value={partyTypeFilter}
              onChange={(e: any) => setPartyTypeFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
            >
              <option value="all">All Parties</option>
              <option value="customer">Customers Only (Inflow)</option>
              <option value="supplier">Suppliers Only (Outflow)</option>
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentMethodFilter}
              onChange={(e) => setPaymentMethodFilter(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
            >
              <option value="">All Payment Methods</option>
              {PAYMENT_METHODS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="From Date"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#16A34A]"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              title="To Date"
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-[#16A34A]"
            />
            <button
              onClick={fetchPayments}
              title="Refresh"
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Payments History Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2.5 font-black text-sm text-[#0F172A]">
            <Receipt className="w-4 h-4 text-[#16A34A]" />
            <span>Transaction Vouchers Ledger ({payments.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50/80 text-[11px] uppercase font-bold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-5 py-3.5">Voucher #</th>
                <th className="px-5 py-3.5">Date</th>
                <th className="px-5 py-3.5">Party / Entity</th>
                <th className="px-5 py-3.5">Type</th>
                <th className="px-5 py-3.5">Method & Reference</th>
                <th className="px-5 py-3.5 text-right">Amount (PKR)</th>
                <th className="px-5 py-3.5 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span className="font-semibold text-xs">Loading payment transactions...</span>
                    </div>
                  </td>
                </tr>
              ) : payments.length > 0 ? (
                payments.map((p) => {
                  const isReceived = p.payment_type === 'received';
                  const partyName = p.customer?.name || p.supplier?.name || 'Walk-in / General';
                  const partyPhone = p.customer?.phone || p.supplier?.phone;

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3.5 font-mono font-bold text-slate-900">
                        {p.payment_no}
                      </td>
                      <td className="px-5 py-3.5 font-medium text-slate-600">{p.payment_date}</td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold text-slate-900 flex items-center gap-1.5">
                          {p.party_type === 'customer' ? (
                            <UserCheck className="w-3.5 h-3.5 text-[#16A34A]" />
                          ) : (
                            <Building2 className="w-3.5 h-3.5 text-blue-600" />
                          )}
                          <span>{partyName}</span>
                        </div>
                        {partyPhone && <div className="text-[10px] text-slate-400">{partyPhone}</div>}
                      </td>
                      <td className="px-5 py-3.5">
                        {isReceived ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-[#16A34A] border border-emerald-200">
                            <ArrowDownLeft className="w-3 h-3" /> Received (Inflow)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-black bg-slate-100 text-slate-800 border border-slate-200">
                            <ArrowUpRight className="w-3 h-3 text-rose-500" /> Paid Out (Voucher)
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="font-bold uppercase text-[11px] text-slate-800">{p.payment_method}</div>
                        {p.reference_number && (
                          <div className="text-[10px] font-mono text-slate-500">Ref: {p.reference_number}</div>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-right font-black text-sm">
                        <span className={isReceived ? 'text-[#16A34A]' : 'text-slate-900'}>
                          {isReceived ? '+' : '-'} Rs. {Number(p.amount).toFixed(2)}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() => setActiveReceiptPayment(p)}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-[#16A34A] hover:text-white text-slate-700 font-bold text-[11px] transition-all flex items-center gap-1 mx-auto cursor-pointer"
                        >
                          <Printer className="w-3.5 h-3.5" />
                          <span>Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <CreditCard className="w-8 h-8 mx-auto mb-2 text-slate-300 stroke-[1.5]" />
                    <p className="font-bold text-slate-700">No payment records found.</p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      Receive a customer balance payment or create a supplier voucher above.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Payment Receipt Entry Modal */}
      {isCustomerModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <ArrowDownLeft className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">Receive Customer Payment</h3>
                  <p className="text-[11px] text-slate-500">Credits customer ledger & lowers receivable</p>
                </div>
              </div>
              <button
                onClick={() => setIsCustomerModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveCustomerPayment} className="p-5 space-y-4 text-xs">
              {customerFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{customerFormError}</span>
                </div>
              )}

              {/* Customer Select */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                  Select Customer <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedCustomerId}
                  onChange={(e) => setSelectedCustomerId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
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

              {/* Dynamic Balance Snapshot */}
              {activeSelectedCustomer && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Balance</span>
                    <div className="font-black text-rose-600 text-sm">
                      Rs. {Number(activeSelectedCustomer.current_balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining After Pay</span>
                    <div className="font-black text-[#16A34A] text-sm">
                      Rs. {customerRemainingBalance.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Amount Received (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="0.00"
                    value={customerAmount}
                    onChange={(e) => setCustomerAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={customerMethod}
                    onChange={(e) => setCustomerMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={customerDate}
                    onChange={(e) => setCustomerDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Transaction / Reference #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. TID / Cheque No."
                    value={customerRef}
                    onChange={(e) => setCustomerRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1.5">Notes / Memo</label>
                <input
                  type="text"
                  placeholder="Optional payment remarks..."
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A]"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCustomerModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingCustomer}
                  className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-black text-xs shadow-md shadow-[#16A34A]/25 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  {submittingCustomer ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Confirm & Print Receipt</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Supplier Payment Voucher Entry Modal */}
      {isSupplierModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-xl bg-slate-900 text-white flex items-center justify-center font-bold">
                  <ArrowUpRight className="w-4 h-4 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">Pay Supplier Voucher</h3>
                  <p className="text-[11px] text-slate-500">Debits supplier ledger & reduces payable liability</p>
                </div>
              </div>
              <button
                onClick={() => setIsSupplierModalOpen(false)}
                className="p-1.5 rounded-lg hover:bg-slate-200 text-slate-400 hover:text-slate-700 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveSupplierPayment} className="p-5 space-y-4 text-xs">
              {supplierFormError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{supplierFormError}</span>
                </div>
              )}

              {/* Supplier Select */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                  Select Supplier <span className="text-rose-500">*</span>
                </label>
                <select
                  value={selectedSupplierId}
                  onChange={(e) => setSelectedSupplierId(e.target.value)}
                  required
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                >
                  <option value="">-- Choose Supplier --</option>
                  {suppliers
                    .filter((s) => s.is_active)
                    .map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.name} {s.phone ? `(${s.phone})` : ''} — Payable: Rs. {Number(s.current_balance).toFixed(2)}
                      </option>
                    ))}
                </select>
              </div>

              {/* Dynamic Balance Snapshot */}
              {activeSelectedSupplier && (
                <div className="grid grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200/80">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Outstanding Payable</span>
                    <div className="font-black text-slate-900 text-sm">
                      Rs. {Number(activeSelectedSupplier.current_balance).toFixed(2)}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Remaining Payable</span>
                    <div className="font-black text-emerald-600 text-sm">
                      Rs. {supplierRemainingPayable.toFixed(2)}
                    </div>
                  </div>
                </div>
              )}

              {/* Payment Amount & Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Payment Amount (PKR) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0.01"
                    step="any"
                    required
                    placeholder="0.00"
                    value={supplierAmount}
                    onChange={(e) => setSupplierAmount(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Payment Method <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={supplierMethod}
                    onChange={(e) => setSupplierMethod(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Payment Date <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="date"
                    required
                    value={supplierDate}
                    onChange={(e) => setSupplierDate(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-black text-slate-700 mb-1.5">
                    Reference / Cheque #
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Cheque / Txn ID"
                    value={supplierRef}
                    onChange={(e) => setSupplierRef(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                  />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 mb-1.5">Notes / Memo</label>
                <input
                  type="text"
                  placeholder="Optional voucher remarks..."
                  value={supplierNotes}
                  onChange={(e) => setSupplierNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-slate-900/20 focus:border-slate-900"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsSupplierModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submittingSupplier}
                  className="px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-black text-xs shadow-md shadow-slate-900/20 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 hover:scale-105 active:scale-95"
                >
                  {submittingSupplier ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin text-emerald-400" />
                      <span>Processing...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span>Save & Print Voucher</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Printable Dual Receipt & Voucher Modal */}
      {activeReceiptPayment && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto animate-fadeIn">
          <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl border border-slate-100 overflow-hidden my-8">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <Receipt className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-sm text-[#0F172A]">
                    {activeReceiptPayment.party_type === 'customer' ? 'Customer Payment Receipt' : 'Supplier Payment Voucher'}
                  </h3>
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
                    <p className="text-[10px] text-slate-500">
                      {activeReceiptPayment.party_type === 'customer' ? 'OFFICIAL PAYMENT RECEIPT' : 'OFFICIAL PAYMENT VOUCHER'}
                    </p>
                    <div className="font-bold text-slate-700 mt-1">{activeReceiptPayment.payment_no}</div>
                  </div>

                  <div className="space-y-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span className="font-bold">{activeReceiptPayment.payment_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Party:</span>
                      <span className="font-bold">
                        {activeReceiptPayment.customer?.name || activeReceiptPayment.supplier?.name || 'General Party'}
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
                      <span>AMOUNT PAID:</span>
                      <span className="text-[#16A34A]">Rs. {Number(activeReceiptPayment.amount).toFixed(2)}</span>
                    </div>
                    {activeReceiptPayment.customer && (
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Current Khata Balance:</span>
                        <span className="font-bold">Rs. {Number(activeReceiptPayment.customer.current_balance).toFixed(2)}</span>
                      </div>
                    )}
                    {activeReceiptPayment.supplier && (
                      <div className="flex justify-between text-[10px] text-slate-500">
                        <span>Current Payable Balance:</span>
                        <span className="font-bold">Rs. {Number(activeReceiptPayment.supplier.current_balance).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  {activeReceiptPayment.notes && (
                    <div className="text-[10px] text-slate-500 italic">
                      Remarks: {activeReceiptPayment.notes}
                    </div>
                  )}

                  <div className="text-center pt-2 text-[9px] text-slate-400">
                    <p>Computer Generated Accounting Voucher</p>
                    <p>Authorized Signature: __________________</p>
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
                        {activeReceiptPayment.party_type === 'customer' ? 'PAYMENT RECEIPT' : 'PAYMENT VOUCHER'}
                      </span>
                      <div className="font-mono font-bold text-xs text-[#0F172A] mt-1">{activeReceiptPayment.payment_no}</div>
                      <div className="text-slate-400 text-[10px]">Date: {activeReceiptPayment.payment_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Party Details</div>
                      <div className="font-bold text-slate-800 text-xs">
                        {activeReceiptPayment.customer?.name || activeReceiptPayment.supplier?.name || 'General Party'}
                      </div>
                      <div className="text-slate-500 text-[11px]">
                        {activeReceiptPayment.customer?.phone || activeReceiptPayment.supplier?.phone || ''}
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
                      <div className="text-[10px] font-bold uppercase text-emerald-800">Net Amount Paid / Received</div>
                      <div className="text-xs text-slate-500">Atomic ledger transaction completed</div>
                    </div>
                    <div className="text-xl font-black text-[#16A34A]">
                      Rs. {Number(activeReceiptPayment.amount).toFixed(2)}
                    </div>
                  </div>

                  <div className="pt-8 border-t border-slate-200 flex justify-between text-[11px] text-slate-400">
                    <div>Prepared By: ______________</div>
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
                <span>Print Voucher ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
