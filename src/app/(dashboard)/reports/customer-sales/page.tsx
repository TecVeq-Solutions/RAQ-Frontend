'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import {
  Users,
  DollarSign,
  Receipt,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  CheckCircle2,
  Clock,
  Search,
  Eye,
  X,
  Building2,
  Phone,
  UserCheck,
  CreditCard,
  ShoppingBag,
} from 'lucide-react';

interface CustomerBreakdownItem {
  id: number | string;
  name: string;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  opening_balance: number;
  current_balance: number;
  invoices_count: number;
  total_sales: number;
  total_paid: number;
  total_due: number;
  last_sale_date?: string | null;
}

interface CustomerSalesReportData {
  date_from: string;
  date_to: string;
  summary: {
    total_customers: number;
    transacting_customers: number;
    total_sales: number;
    total_paid: number;
    total_due: number;
    total_invoices: number;
    total_receivables: number;
  };
  customers: CustomerBreakdownItem[];
}

interface CustomerOption {
  id: number;
  name: string;
  phone?: string;
}

export default function CustomerSalesReportPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<CustomerSalesReportData | null>(null);
  const [customerOptions, setCustomerOptions] = useState<CustomerOption[]>([]);

  // Date Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(todayStr);

  // Additional Filters
  const [selectedCustomer, setSelectedCustomer] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Selected customer for drilldown modal
  const [activeCustomer, setActiveCustomer] = useState<CustomerBreakdownItem | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Load customer options for filter dropdown
  useEffect(() => {
    async function loadCustomers() {
      try {
        const res = await apiClient.get('/customers');
        if (res.data?.data) {
          setCustomerOptions(res.data.data);
        }
      } catch (err) {
        console.error('Failed to load customers filter list', err);
      }
    }
    loadCustomers();
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

  // Fetch Customer Sales Report Data
  const fetchCustomerSalesReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        date_from: dateFrom,
        date_to: dateTo,
      };
      if (selectedCustomer && selectedCustomer !== 'all') {
        params.customer_id = selectedCustomer;
      }
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.search = debouncedSearch.trim();
      }

      const res = await apiClient.get('/reports/customer-sales', { params });
      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch customer sales report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo, selectedCustomer, debouncedSearch]);

  useEffect(() => {
    fetchCustomerSalesReport();
  }, [fetchCustomerSalesReport]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      type: 'customer-sales',
      date_from: dateFrom,
      date_to: dateTo,
    });
    if (selectedCustomer && selectedCustomer !== 'all') {
      params.append('customer_id', selectedCustomer);
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
            Customer-wise Sales Report
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Client sales volume, invoice totals, paid amounts, and current ledger balances (PRD R-06)
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

        {/* Row 2: Customer Filter, Search & Refresh */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-3 border-t border-slate-100">
          {/* Customer Dropdown */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Customer</label>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-bold rounded-xl px-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 cursor-pointer shadow-2xs"
            >
              <option value="all">All Customers</option>
              <option value="walk-in">Walk-in Customers Only</option>
              {customerOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.phone ? `(${c.phone})` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Search Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-bold uppercase text-slate-600 tracking-wider">Search Customer</label>
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Name, phone, or address..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 shadow-2xs placeholder:text-slate-400"
              />
            </div>
          </div>

          {/* Refresh Action */}
          <div className="flex items-end">
            <button
              type="button"
              onClick={fetchCustomerSalesReport}
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
          CUSTOMER-WISE SALES TURNOVER REPORT ({dateFrom} TO {dateTo})
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-base text-slate-800">Loading Customer Sales Data...</p>
          <p className="text-sm text-slate-500">Aggregating client accounts, invoices, and ledger positions</p>
        </div>
      ) : reportData ? (
        <div className="space-y-7">
          {/* Executive KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Turnover */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#16A34A]/50 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Sales Turnover</div>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A]">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(reportData.summary.total_sales)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {reportData.summary.total_invoices} Invoices in Period
              </div>
            </div>

            {/* 2. Amount Collected */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Paid by Customers</div>
                <div className="p-2 rounded-xl bg-emerald-50 text-[#16A34A]">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-[#16A34A] mt-2">
                {formatCurrency(reportData.summary.total_paid)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                {reportData.summary.total_sales > 0
                  ? `${Math.round((reportData.summary.total_paid / reportData.summary.total_sales) * 100)}% Cleared`
                  : '0% Paid'}
              </div>
            </div>

            {/* 3. Invoices Due */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Invoices Due (Period)</div>
                <div className="p-2 rounded-xl bg-rose-50 text-rose-600">
                  <Clock className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
                {formatCurrency(reportData.summary.total_due)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-rose-600 mt-1">
                Pending on Period Invoices
              </div>
            </div>

            {/* 4. Ledger Receivables (Total Due) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Ledger Receivables</div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <CreditCard className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-700 mt-2">
                {formatCurrency(reportData.summary.total_receivables)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-purple-600 mt-1">
                All Customer Balances
              </div>
            </div>

            {/* 5. Transacting Customers */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Active Customers</div>
                <div className="p-2 rounded-xl bg-blue-50 text-blue-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {reportData.summary.transacting_customers} / {reportData.summary.total_customers}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Placed orders in date range
              </div>
            </div>
          </div>

          {/* Customer Breakdown Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                Customer Sales Volume & Balances ({reportData.customers.length} Accounts)
              </h3>
              <div className="text-xs sm:text-sm font-bold text-slate-600">
                Period: <span className="text-slate-950 font-bold">{reportData.date_from}</span> to{' '}
                <span className="text-slate-950 font-bold">{reportData.date_to}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Customer Name</th>
                    <th className="p-4">Phone / Address</th>
                    <th className="p-4 text-center">Orders Count</th>
                    <th className="p-4 text-right">Sales Volume</th>
                    <th className="p-4 text-right">Paid Amount</th>
                    <th className="p-4 text-right">Period Due</th>
                    <th className="p-4 text-right">Ledger Balance</th>
                    <th className="p-4 text-center">Last Active</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {reportData.customers.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-16 text-center text-slate-500">
                        <Users className="w-10 h-10 mx-auto text-slate-300 mb-2" />
                        <p className="font-bold text-base text-slate-800">No Customer Records Found</p>
                        <p className="text-sm text-slate-500 mt-1">Try adjusting your date range or search keyword.</p>
                      </td>
                    </tr>
                  ) : (
                    reportData.customers.map((cust, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors">
                        <td className="p-4 font-bold text-slate-900 text-sm sm:text-base">
                          {cust.id === 'walk-in' ? (
                            <span className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg border border-slate-200">
                              <UserCheck className="w-3.5 h-3.5 text-slate-500" /> Walk-in Customers
                            </span>
                          ) : (
                            <span className="font-bold text-slate-900">{cust.name}</span>
                          )}
                        </td>
                        <td className="p-4 text-slate-600 text-xs sm:text-sm">
                          {cust.phone && cust.phone !== '-' ? (
                            <div className="font-mono text-slate-700">{cust.phone}</div>
                          ) : null}
                          {cust.address && cust.address !== '-' ? (
                            <div className="text-xs text-slate-400">{cust.address}</div>
                          ) : null}
                        </td>
                        <td className="p-4 text-center font-bold text-slate-800 text-sm">
                          <span className="px-2.5 py-1 rounded-full bg-slate-100 text-slate-800 font-black text-xs">
                            {cust.invoices_count} orders
                          </span>
                        </td>
                        <td className="p-4 text-right font-black text-slate-950 text-base whitespace-nowrap">
                          {formatCurrency(cust.total_sales)}
                        </td>
                        <td className="p-4 text-right font-bold text-[#16A34A] text-base whitespace-nowrap">
                          {formatCurrency(cust.total_paid)}
                        </td>
                        <td className="p-4 text-right font-bold text-rose-600 text-base whitespace-nowrap">
                          {cust.total_due > 0 ? formatCurrency(cust.total_due) : '-'}
                        </td>
                        <td className="p-4 text-right font-black text-purple-700 text-base whitespace-nowrap">
                          {formatCurrency(cust.current_balance)}
                        </td>
                        <td className="p-4 text-center text-xs text-slate-600 whitespace-nowrap font-medium">
                          {cust.last_sale_date || '-'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {reportData.customers.length > 0 && (
                  <tfoot className="bg-slate-100 font-black text-sm border-t-2 border-slate-300 text-slate-950">
                    <tr>
                      <td colSpan={3} className="p-4 uppercase text-xs text-slate-600">
                        Total Summary ({reportData.customers.length} Accounts):
                      </td>
                      <td className="p-4 text-right text-slate-950 text-base">
                        {formatCurrency(reportData.summary.total_sales)}
                      </td>
                      <td className="p-4 text-right text-[#16A34A] text-base">
                        {formatCurrency(reportData.summary.total_paid)}
                      </td>
                      <td className="p-4 text-right text-rose-600 text-base">
                        {formatCurrency(reportData.summary.total_due)}
                      </td>
                      <td className="p-4 text-right text-purple-700 text-base">
                        {formatCurrency(reportData.summary.total_receivables)}
                      </td>
                      <td></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
