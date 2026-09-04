'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import {
  Receipt,
  DollarSign,
  ShoppingCart,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  CircleDollarSign,
  Building2,
  Search,
  Eye,
  X,
  Package,
  CreditCard,
  Layers,
  Truck,
} from 'lucide-react';

interface PurchaseItem {
  id: number;
  quantity: number | string;
  unit_price: number | string;
  subtotal: number | string;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: { id: number; name: string; short_name: string };
    secondary_unit?: { id: number; name: string; short_name: string };
  };
}

interface Purchase {
  id: number;
  purchase_no: string;
  supplier_id: number | null;
  purchase_date: string;
  subtotal: number | string;
  discount: number | string;
  tax: number | string;
  grand_total: number | string;
  paid_amount: number | string;
  due_amount: number | string;
  payment_status: 'paid' | 'partial' | 'due';
  notes?: string | null;
  created_at: string;
  supplier?: {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
  } | null;
  items?: PurchaseItem[];
  user?: {
    id: number;
    name: string;
  };
  payments?: Array<{
    id: number;
    payment_no: string;
    amount: number | string;
    payment_method: string;
    payment_date: string;
  }>;
}

interface SupplierOption {
  id: number;
  name: string;
  phone?: string;
}

interface PurchasesReportData {
  date_from: string;
  date_to: string;
  summary: {
    total_purchases: number;
    purchases_count: number;
    total_paid: number;
    total_due: number;
    total_discount: number;
    total_tax: number;
    total_items_purchased: number;
    average_order_value: number;
  };
  payment_methods: Array<{
    method: string;
    amount: number;
    count: number;
  }>;
  daily_trends: Array<{
    date: string;
    orders_count: number;
    purchases: number;
    paid: number;
    due: number;
  }>;
  top_suppliers: Array<{
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    orders_count: number;
    total_spend: number;
    total_paid: number;
    total_due: number;
  }>;
  top_products: Array<{
    id: number;
    name: string;
    sku: string;
    unit: string;
    quantity_purchased: number;
    total_cost: number;
  }>;
  purchases: Purchase[];
}

export default function PurchasesReportPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<PurchasesReportData | null>(null);
  const [suppliers, setSuppliers] = useState<SupplierOption[]>([]);
  const [activeViewTab, setActiveViewTab] = useState<'invoices' | 'daily'>('invoices');

  // Date Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(todayStr);

  // Additional Filters
  const [selectedSupplier, setSelectedSupplier] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Active Purchase Modal for View/Print
  const [activePurchase, setActivePurchase] = useState<Purchase | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load suppliers list for filter dropdown
  useEffect(() => {
    async function loadSuppliers() {
      try {
        const res = await apiClient.get('/suppliers');
        if (res.data?.data) {
          setSuppliers(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load suppliers filter list', err);
      }
    }
    loadSuppliers();
  }, []);

  // Quick Preset Helper
  const setQuickPreset = (preset: 'today' | 'yesterday' | 'week' | 'month' | 'last-month' | 'year' | 'all') => {
    const now = new Date();
    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (preset === 'yesterday') {
      const yest = new Date();
      yest.setDate(yest.getDate() - 1);
      const yestStr = yest.toISOString().split('T')[0];
      setDateFrom(yestStr);
      setDateTo(yestStr);
    } else if (preset === 'week') {
      const firstDayWeek = new Date(now.setDate(now.getDate() - now.getDay()));
      setDateFrom(firstDayWeek.toISOString().split('T')[0]);
      setDateTo(todayStr);
    } else if (preset === 'month') {
      setDateFrom(firstDayOfMonth);
      setDateTo(todayStr);
    } else if (preset === 'last-month') {
      const prevMonthFirst = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const prevMonthLast = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setDateFrom(prevMonthFirst);
      setDateTo(prevMonthLast);
    } else if (preset === 'year') {
      const yearFirst = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      setDateFrom(yearFirst);
      setDateTo(todayStr);
    } else if (preset === 'all') {
      setDateFrom('2020-01-01');
      setDateTo(todayStr);
    }
  };

  // Fetch Purchases Report Data
  const fetchPurchasesReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (selectedSupplier && selectedSupplier !== 'all') {
        params.supplier_id = selectedSupplier;
      }
      if (selectedStatus && selectedStatus !== 'all') {
        params.payment_status = selectedStatus;
      }
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.search = debouncedSearch.trim();
      }

      const res = await apiClient.get('/reports/purchases', { params });
      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch purchases report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedSupplier, selectedStatus, debouncedSearch]);

  useEffect(() => {
    fetchPurchasesReport();
  }, [fetchPurchasesReport]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      type: 'purchases',
      date_from: dateFrom,
      date_to: dateTo,
    });
    if (selectedSupplier && selectedSupplier !== 'all') {
      params.append('supplier_id', selectedSupplier);
    }
    if (selectedStatus && selectedStatus !== 'all') {
      params.append('payment_status', selectedStatus);
    }
    if (debouncedSearch) {
      params.append('search', debouncedSearch);
    }

    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    window.open(`${apiUrl}/reports/export/csv?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-7 animate-fadeIn pb-16">
      {/* Top Header & Export/Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Purchase & Procurement Report
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Supplier procurement tracking, order volume, purchase expenses, and payables audit (PRD R-03, R-04)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer shadow-xs border border-slate-200"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md shadow-[#16A34A]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Print this report summary"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        {/* Row 1: Presets & Date Pickers */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setQuickPreset('today')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('yesterday')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              Yesterday
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('week')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              This Week
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('month')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              This Month
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('last-month')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              Last Month
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('year')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              This Year
            </button>
            <button
              type="button"
              onClick={() => setQuickPreset('all')}
              className="px-3 py-1.5 rounded-lg text-xs sm:text-sm font-bold text-slate-700 hover:bg-white hover:text-slate-950 transition-all cursor-pointer"
            >
              All Time
            </button>
          </div>

          {/* Date Range Inputs */}
          <div className="flex items-center gap-2.5 bg-slate-50 border border-slate-300 px-3.5 py-2 rounded-xl text-sm font-semibold">
            <Calendar className="w-4 h-4 text-slate-500 shrink-0" />
            <span className="text-xs font-bold text-slate-600 uppercase">From</span>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-sm"
            />
            <span className="text-xs font-bold text-slate-600 uppercase ml-1">To</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="bg-transparent font-bold text-slate-900 focus:outline-none cursor-pointer text-sm"
            />
          </div>
        </div>

        {/* Row 2: Supplier, Status, Search Filters & Refresh */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-3 border-t border-slate-100">
          {/* Supplier Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Supplier</label>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 cursor-pointer shadow-2xs"
            >
              <option value="all">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} {s.phone ? `(${s.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Payment Status</label>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 cursor-pointer shadow-2xs"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Fully Paid</option>
              <option value="partial">Partially Paid</option>
              <option value="due">Unpaid / Due</option>
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Search Purchase</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Purchase # or supplier..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Refresh Action */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchPurchasesReport}
              className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-colors cursor-pointer shadow-xs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : 'text-slate-600'}`} />
              <span>Refresh Report</span>
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header Branding */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-slate-900">SALES & INVENTORY ERP</h1>
        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider mt-1">
          COMPREHENSIVE PURCHASES & PROCUREMENT REPORT ({dateFrom} TO {dateTo})
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-base text-slate-800">Loading Purchases Report Data...</p>
          <p className="text-sm text-slate-500">Aggregating supplier purchases, items received, payments, and balances</p>
        </div>
      ) : reportData ? (
        <div className="space-y-7">
          {/* Executive KPI Cards Grid (6 Cards) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 1. Total Purchases (Gross Spend) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Purchases</div>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(reportData.summary.total_purchases)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {reportData.summary.purchases_count} Purchase Vouchers
              </div>
            </div>

            {/* 2. Total Orders */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-indigo-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Orders Count</div>
                <div className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {reportData.summary.purchases_count}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Avg {formatCurrency(reportData.summary.average_order_value)} / order
              </div>
            </div>

            {/* 3. Paid to Suppliers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Paid to Suppliers</div>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#16A34A] mt-2">
                {formatCurrency(reportData.summary.total_paid)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                {reportData.summary.total_purchases > 0
                  ? `${Math.round((reportData.summary.total_paid / reportData.summary.total_purchases) * 100)}% Cleared`
                  : '0% Paid'}
              </div>
            </div>

            {/* 4. Outstanding Payables (Due) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Payables (Due)</div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2">
                {formatCurrency(reportData.summary.total_due)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-amber-600 mt-1">
                Supplier Credit Pending
              </div>
            </div>

            {/* 5. Total Units Purchased */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Units Inward</div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Package className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {reportData.summary.total_items_purchased.toLocaleString()}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Inventory Stock Received
              </div>
            </div>

            {/* 6. Discounts & Taxes */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Discounts / Tax</div>
                <div className="p-2 rounded-xl bg-slate-100 text-slate-700">
                  <Layers className="w-5 h-5" />
                </div>
              </div>
              <div className="text-lg sm:text-xl font-black text-slate-900 mt-2">
                - {formatCurrency(reportData.summary.total_discount)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Tax: +{formatCurrency(reportData.summary.total_tax)}
              </div>
            </div>
          </div>

          {/* Top Suppliers & Payment Methods Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Payment Methods Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-200">
                <CreditCard className="w-5 h-5 text-blue-600" /> Supplier Payment Methods
              </div>
              {reportData.payment_methods.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No payment records in selected period</div>
              ) : (
                <div className="space-y-2.5">
                  {reportData.payment_methods.map((pm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
                        <span className="font-bold text-slate-900 uppercase text-xs sm:text-sm">{pm.method}</span>
                        <span className="text-xs text-slate-500 font-semibold">({pm.count} txns)</span>
                      </div>
                      <span className="font-black text-slate-900 text-sm sm:text-base">{formatCurrency(pm.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Suppliers Procurement Spend */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-200">
                <Truck className="w-5 h-5 text-indigo-600" /> Top Suppliers by Spend
              </div>
              {reportData.top_suppliers.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No supplier purchases in selected period</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {reportData.top_suppliers.map((supp, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 border border-slate-200"
                    >
                      <div className="truncate pr-3">
                        <div className="font-bold text-slate-900 text-sm truncate">{supp.name}</div>
                        <div className="text-xs text-slate-500 font-medium mt-0.5">
                          {supp.phone || supp.contact_person || 'Supplier'} • {supp.orders_count} orders
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-base text-blue-600">{formatCurrency(supp.total_spend)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Interactive Views: Purchases Table / Daily Trends */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            {/* View Switcher Tabs Header */}
            <div className="p-4 sm:p-5 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => setActiveViewTab('invoices')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeViewTab === 'invoices'
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Detailed Purchases ({reportData.purchases.length})
                </button>
                <button
                  type="button"
                  onClick={() => setActiveViewTab('daily')}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                    activeViewTab === 'daily'
                      ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                      : 'text-slate-600 hover:text-slate-950'
                  }`}
                >
                  Daily Trends Breakdown ({reportData.daily_trends.length})
                </button>
              </div>

              <div className="text-xs sm:text-sm font-bold text-slate-600">
                Period: <span className="text-slate-950 font-bold">{reportData.date_from}</span> to{' '}
                <span className="text-slate-950 font-bold">{reportData.date_to}</span>
              </div>
            </div>

            {/* TAB 1: Detailed Purchases Table */}
            {activeViewTab === 'invoices' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Purchase #</th>
                      <th className="p-4">Date</th>
                      <th className="p-4">Supplier</th>
                      <th className="p-4 text-center">Items</th>
                      <th className="p-4 text-right">Grand Total</th>
                      <th className="p-4 text-right">Paid</th>
                      <th className="p-4 text-right">Due</th>
                      <th className="p-4 text-center">Status</th>
                      <th className="p-4 text-right print:hidden">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reportData.purchases.length === 0 ? (
                      <tr>
                        <td colSpan={9} className="p-16 text-center text-slate-500">
                          <ShoppingCart className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                          <p className="font-bold text-base text-slate-800">No Purchase Records Found</p>
                          <p className="text-sm text-slate-500 mt-1">Try adjusting your date range or supplier filters.</p>
                        </td>
                      </tr>
                    ) : (
                      reportData.purchases.map((purchase) => (
                        <tr key={purchase.id} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-mono font-bold text-slate-900 text-sm sm:text-base">
                            <button
                              type="button"
                              onClick={() => setActivePurchase(purchase)}
                              className="hover:text-blue-600 underline text-left cursor-pointer font-black"
                            >
                              {purchase.purchase_no}
                            </button>
                          </td>
                          <td className="p-4 text-slate-700 whitespace-nowrap font-medium">
                            {purchase.purchase_date.split('T')[0]}
                          </td>
                          <td className="p-4">
                            {purchase.supplier ? (
                              <div>
                                <span className="font-bold text-slate-900 text-sm">{purchase.supplier.name}</span>
                                {purchase.supplier.phone && (
                                  <span className="block text-xs text-slate-500 font-medium">{purchase.supplier.phone}</span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                                <Building2 className="w-3.5 h-3.5 text-slate-500" /> Supplier
                              </span>
                            )}
                          </td>
                          <td className="p-4 text-center font-bold text-slate-800 text-sm">
                            {purchase.items?.length || 0}
                          </td>
                          <td className="p-4 text-right font-black text-slate-950 text-base whitespace-nowrap">
                            {formatCurrency(purchase.grand_total)}
                          </td>
                          <td className="p-4 text-right font-bold text-[#16A34A] text-base whitespace-nowrap">
                            {formatCurrency(purchase.paid_amount)}
                          </td>
                          <td className="p-4 text-right font-bold text-amber-600 text-base whitespace-nowrap">
                            {Number(purchase.due_amount) > 0 ? formatCurrency(purchase.due_amount) : '-'}
                          </td>
                          <td className="p-4 text-center whitespace-nowrap">
                            <span
                              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                                purchase.payment_status === 'paid'
                                  ? 'bg-emerald-50 text-[#16A34A] border border-emerald-300'
                                  : purchase.payment_status === 'partial'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-300'
                                  : 'bg-rose-50 text-rose-800 border border-rose-300'
                              }`}
                            >
                              {purchase.payment_status === 'paid' && <CheckCircle2 className="w-3.5 h-3.5" />}
                              {purchase.payment_status === 'partial' && <Clock className="w-3.5 h-3.5" />}
                              {purchase.payment_status === 'due' && <CircleDollarSign className="w-3.5 h-3.5" />}
                              {purchase.payment_status}
                            </span>
                          </td>
                          <td className="p-4 text-right whitespace-nowrap print:hidden">
                            <button
                              type="button"
                              onClick={() => setActivePurchase(purchase)}
                              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs sm:text-sm transition-colors cursor-pointer border border-slate-200"
                            >
                              <Eye className="w-3.5 h-3.5 text-slate-600" />
                              <span>View / Print</span>
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  {reportData.purchases.length > 0 && (
                    <tfoot className="bg-slate-100 font-black text-sm border-t-2 border-slate-300 text-slate-950">
                      <tr>
                        <td colSpan={4} className="p-4 text-right uppercase text-xs text-slate-600">
                          Total Summary ({reportData.purchases.length} Purchases):
                        </td>
                        <td className="p-4 text-right text-slate-950 text-base">
                          {formatCurrency(reportData.summary.total_purchases)}
                        </td>
                        <td className="p-4 text-right text-[#16A34A] text-base">
                          {formatCurrency(reportData.summary.total_paid)}
                        </td>
                        <td className="p-4 text-right text-amber-600 text-base">
                          {formatCurrency(reportData.summary.total_due)}
                        </td>
                        <td colSpan={2}></td>
                      </tr>
                    </tfoot>
                  )}
                </table>
              </div>
            )}

            {/* TAB 2: Daily Trends Breakdown Table */}
            {activeViewTab === 'daily' && (
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                    <tr>
                      <th className="p-4">Date</th>
                      <th className="p-4 text-center">Orders Count</th>
                      <th className="p-4 text-right">Daily Procurement</th>
                      <th className="p-4 text-right">Amount Paid</th>
                      <th className="p-4 text-right">Due / Payable</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {reportData.daily_trends.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="p-12 text-center text-slate-500">
                          No daily procurement trend data for this period.
                        </td>
                      </tr>
                    ) : (
                      reportData.daily_trends.map((row, idx) => (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 text-sm sm:text-base">{row.date}</td>
                          <td className="p-4 text-center font-bold text-slate-800 text-sm sm:text-base">{row.orders_count}</td>
                          <td className="p-4 text-right font-black text-slate-950 text-base">{formatCurrency(row.purchases)}</td>
                          <td className="p-4 text-right font-bold text-[#16A34A] text-base">{formatCurrency(row.paid)}</td>
                          <td className="p-4 text-right font-bold text-amber-600 text-base">
                            {row.due > 0 ? formatCurrency(row.due) : '-'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Purchase Details & Thermal/A4 Print Modal */}
      {activePurchase && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-xs z-50 flex items-center justify-center p-4 overflow-y-auto print:p-0 print:bg-white print:fixed print:inset-0">
          <div className="bg-white rounded-3xl max-w-2xl w-full border border-slate-200 shadow-2xl overflow-hidden animate-scaleUp my-8 print:border-none print:shadow-none print:m-0 print:max-w-none">
            {/* Modal Top Bar */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <div className="flex items-center gap-2.5">
                <Receipt className="w-6 h-6 text-blue-600" />
                <span className="font-black text-slate-900 text-base">Purchase Voucher: {activePurchase.purchase_no}</span>
              </div>

              <div className="flex items-center gap-3">
                {/* Format Toggle */}
                <div className="flex items-center gap-1.5 bg-slate-200 p-1.5 rounded-xl text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setPrintFormat('thermal')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      printFormat === 'thermal' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-700'
                    }`}
                  >
                    Thermal 80mm
                  </button>
                  <button
                    type="button"
                    onClick={() => setPrintFormat('a4')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      printFormat === 'a4' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-700'
                    }`}
                  >
                    Standard A4
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => setActivePurchase(null)}
                  className="p-2 rounded-xl hover:bg-slate-200 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body / Printable Template */}
            <div className="p-6 sm:p-7 overflow-y-auto max-h-[75vh]">
              {printFormat === 'thermal' ? (
                /* Thermal 80mm Layout */
                <div className="w-[320px] mx-auto bg-white p-5 border border-dashed border-slate-400 rounded-2xl font-mono text-xs text-slate-900 space-y-4 shadow-sm">
                  <div className="text-center space-y-1">
                    <h2 className="font-black text-base text-slate-950">GOODS RECEIPT / PURCHASE</h2>
                    <p className="text-xs text-slate-600">Procurement & Stock Inward</p>
                    <p className="text-xs text-slate-600">Tel: +92 300 1234567</p>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-400 py-2 space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Purchase #:</span>
                      <span className="font-bold">{activePurchase.purchase_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Date:</span>
                      <span>{activePurchase.purchase_date.split('T')[0]}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Supplier:</span>
                      <span className="font-bold">{activePurchase.supplier?.name || 'Supplier'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Status:</span>
                      <span className="uppercase font-bold">{activePurchase.payment_status}</span>
                    </div>
                  </div>

                  <div className="border-b border-dashed border-slate-400 pb-3 space-y-2">
                    {activePurchase.items?.map((itm, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-bold text-slate-950 text-sm truncate">{itm.product?.name}</div>
                        <div className="flex justify-between text-xs text-slate-700">
                          <span>
                            {itm.quantity} x Rs. {Number(itm.unit_price).toFixed(2)}
                          </span>
                          <span className="font-bold text-slate-950">Rs. {Number(itm.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span className="font-bold">Rs. {Number(activePurchase.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(activePurchase.discount) > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Discount:</span>
                        <span>- Rs. {Number(activePurchase.discount).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(activePurchase.tax) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax / Extra:</span>
                        <span>+ Rs. {Number(activePurchase.tax).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-base border-t border-slate-400 pt-2 text-slate-950">
                      <span>TOTAL:</span>
                      <span>Rs. {Number(activePurchase.grand_total).toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-[#16A34A] font-bold text-sm">
                      <span>Paid:</span>
                      <span>Rs. {Number(activePurchase.paid_amount).toFixed(2)}</span>
                    </div>
                    {Number(activePurchase.due_amount) > 0 && (
                      <div className="flex justify-between text-amber-600 font-bold text-sm">
                        <span>Due to Supplier:</span>
                        <span>Rs. {Number(activePurchase.due_amount).toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="text-center border-t border-dashed border-slate-400 pt-3 space-y-1">
                    <div className="text-xs font-bold text-slate-800">Inventory Stock Received Verified</div>
                    <div className="text-[11px] text-slate-500">Software by Sales, Purchase & Accounting ERP</div>
                  </div>
                </div>
              ) : (
                /* Standard A4 Layout */
                <div className="w-full bg-white p-7 border border-slate-300 shadow-xs rounded-2xl space-y-5 text-sm">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-5">
                    <div>
                      <h2 className="text-lg font-black text-slate-950">SALES & INVENTORY ERP</h2>
                      <p className="text-slate-600 text-xs mt-0.5">Procurement, Stock Inward & Supplier Management</p>
                      <p className="text-slate-500 text-xs">Phone: +92 300 1234567 | Email: info@saleserp.com</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3.5 py-1.5 rounded-full text-xs font-black uppercase bg-blue-100 text-blue-800 border border-blue-300">
                        PURCHASE ORDER VOUCHER
                      </span>
                      <div className="font-mono font-bold text-base text-slate-950 mt-2">{activePurchase.purchase_no}</div>
                      <div className="text-slate-500 text-xs mt-0.5">Date: {activePurchase.purchase_date.split('T')[0]}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-200">
                    <div>
                      <div className="text-xs font-bold uppercase text-slate-500">Supplier</div>
                      <div className="font-bold text-slate-900 text-sm mt-0.5">
                        {activePurchase.supplier?.name || 'Supplier'}
                      </div>
                      <div className="text-slate-600 text-xs">{activePurchase.supplier?.phone || ''}</div>
                      <div className="text-slate-600 text-xs">{activePurchase.supplier?.address || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-bold uppercase text-slate-500">Payment Status</div>
                      <div className="font-bold text-slate-950 text-sm uppercase mt-0.5">{activePurchase.payment_status}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-sm border border-slate-200 rounded-xl overflow-hidden">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs">
                      <tr>
                        <th className="p-3">#</th>
                        <th className="p-3">Item Description</th>
                        <th className="p-3 text-center">Qty Received</th>
                        <th className="p-3 text-right">Cost Rate</th>
                        <th className="p-3 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activePurchase.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-3 text-slate-500">{idx + 1}</td>
                          <td className="p-3 font-bold text-slate-900">
                            {item.product?.name}
                            <span className="block font-mono text-xs text-slate-500 font-medium">{item.product?.sku}</span>
                          </td>
                          <td className="p-3 text-center font-bold text-slate-800">
                            {item.quantity} {item.product?.unit?.short_name || 'Units'}
                          </td>
                          <td className="p-3 text-right font-medium">Rs. {Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-3 text-right font-black text-slate-950">
                            Rs. {Number(item.subtotal).toFixed(2)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-3">
                    <div className="w-72 space-y-2 text-sm">
                      <div className="flex justify-between text-slate-700 font-medium">
                        <span>Subtotal:</span>
                        <span className="font-bold text-slate-950">Rs. {Number(activePurchase.subtotal).toFixed(2)}</span>
                      </div>
                      {Number(activePurchase.discount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>Discount:</span>
                          <span>- Rs. {Number(activePurchase.discount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(activePurchase.tax) > 0 && (
                        <div className="flex justify-between text-slate-700 font-medium">
                          <span>Tax / Extra:</span>
                          <span>+ Rs. {Number(activePurchase.tax).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-lg border-t-2 border-slate-300 pt-2 text-slate-950">
                        <span>Grand Total:</span>
                        <span className="text-blue-600">Rs. {Number(activePurchase.grand_total).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between font-bold text-sm text-[#16A34A]">
                        <span>Paid:</span>
                        <span>Rs. {Number(activePurchase.paid_amount).toFixed(2)}</span>
                      </div>
                      {Number(activePurchase.due_amount) > 0 && (
                        <div className="flex justify-between font-bold text-sm text-amber-600">
                          <span>Due to Supplier:</span>
                          <span>Rs. {Number(activePurchase.due_amount).toFixed(2)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-5 border-t border-slate-200 flex items-center justify-between bg-slate-50 print:hidden">
              <button
                type="button"
                onClick={() => setActivePurchase(null)}
                className="px-5 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-sm text-slate-800 transition-colors cursor-pointer"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-6 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] font-bold text-sm text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
