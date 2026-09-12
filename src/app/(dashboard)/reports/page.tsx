'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import apiClient from '@/lib/api';
import { AgingReportData } from '@/types/ledger';
import { BalanceSheetData } from '@/types/reports';
import BalanceSheetView from '@/components/reports/BalanceSheetView';
import ManufacturingReportsView from '@/components/reports/ManufacturingReportsView';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  PieChart,
  BarChart3,
  Calendar,
  Printer,
  Download,
  FileSpreadsheet,
  Package,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  Filter,
  RefreshCw,
  Loader2,
  Tag,
  CreditCard,
  Building,
  Building2,
  CheckCircle2,
  FileText,
  Boxes,
  Clock,
  Search,
  Users,
  ChevronDown,
  ChevronUp,
  Scissors,
  Wrench,
  Scale,
  Factory,
} from 'lucide-react';

interface ProfitLossData {
  date_from: string;
  date_to: string;
  sales: number;
  sales_count: number;
  total_paid_amount: number;
  total_due_amount: number;
  items_sold_count: number;
  cogs: number;
  gross_profit: number;
  gross_margin_percentage: number;
  expenses: number;
  expenses_count: number;
  net_profit: number;
  net_margin_percentage: number;
  stock_valuation: number;
  expense_categories: Array<{ category: string; amount: number; count: number }>;
  payment_methods: Array<{ method: string; type: string; amount: number; count: number }>;
  daily_trends: Array<{ date: string; sales: number; expenses: number }>;
  top_products: Array<{
    id: number;
    name: string;
    sku: string;
    quantity_sold: number;
    total_revenue: number;
    total_cogs: number;
  }>;
}

interface MonthlyData {
  year: number;
  month: number;
  month_name: string;
  summary: {
    total_sales: number;
    total_cogs: number;
    gross_profit: number;
    total_expenses: number;
    net_profit: number;
  };
  daily_ledger: Array<{
    date: string;
    day: string;
    sales: number;
    cogs: number;
    gross_profit: number;
    expenses: number;
    net_profit: number;
  }>;
}

interface StockValuationData {
  total_products: number;
  total_stock_valuation: number;
  total_retail_valuation: number;
  raw_material_valuation?: number;
  finished_goods_valuation?: number;
  consumable_valuation?: number;
  machinery_valuation?: number;
  potential_gross_profit: number;
  products: Array<{
    id: number;
    sku: string;
    name: string;
    product_type?: string;
    category: string;
    stock_quantity: number;
    unit_name: string;
    secondary_unit_name?: string | null;
    conversion_ratio?: number | null;
    purchase_price: number;
    selling_price: number;
    stock_valuation: number;
    retail_valuation: number;
    potential_margin: number;
  }>;
}

export default function ReportsPage() {
  const searchParams = useSearchParams();
  const initialTab = searchParams?.get('tab');

  const [activeTab, setActiveTab] = useState<
    'profit-loss' | 'monthly' | 'stock-valuation' | 'aging' | 'balance-sheet' | 'manufacturing'
  >(
    initialTab === 'aging'
      ? 'aging'
      : initialTab === 'balance-sheet'
      ? 'balance-sheet'
      : initialTab === 'manufacturing'
      ? 'manufacturing'
      : 'profit-loss'
  );
  const [loading, setLoading] = useState(true);

  // Date range filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(todayStr);

  // Aging & Balance Sheet Filters & State
  const [asOfDate, setAsOfDate] = useState<string>(todayStr);
  const [agingType, setAgingType] = useState<'all' | 'receivables' | 'payables'>('all');
  const [agingSearch, setAgingSearch] = useState<string>('');
  const [agingData, setAgingData] = useState<AgingReportData | null>(null);
  const [balanceSheetData, setBalanceSheetData] = useState<BalanceSheetData | null>(null);
  const [expandedEntities, setExpandedEntities] = useState<Record<string, boolean>>({});

  const toggleEntityExpand = (key: string) => {
    setExpandedEntities((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // Report Datasets
  const [plData, setPlData] = useState<ProfitLossData | null>(null);
  const [monthlyData, setMonthlyData] = useState<MonthlyData | null>(null);
  const [stockData, setStockData] = useState<StockValuationData | null>(null);

  // Quick Preset Helper
  const setQuickPreset = (preset: 'today' | 'week' | 'month' | 'last-month' | 'year') => {
    const now = new Date();
    if (preset === 'today') {
      setDateFrom(todayStr);
      setDateTo(todayStr);
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
    }
  };

  const fetchReports = useCallback(async () => {
    setLoading(true);
    try {
      if (activeTab === 'profit-loss') {
        const res = await apiClient.get('/reports/profit-loss', {
          params: { date_from: dateFrom, date_to: dateTo },
        });
        if (res.data?.data) setPlData(res.data.data);
      } else if (activeTab === 'monthly') {
        const res = await apiClient.get('/reports/monthly-sales', {
          params: {
            year: new Date(dateFrom).getFullYear(),
            month: new Date(dateFrom).getMonth() + 1,
          },
        });
        if (res.data?.data) setMonthlyData(res.data.data);
      } else if (activeTab === 'stock-valuation') {
        const res = await apiClient.get('/reports/stock-valuation');
        if (res.data?.data) setStockData(res.data.data);
      } else if (activeTab === 'aging') {
        const res = await apiClient.get('/reports/aging', {
          params: {
            as_of_date: asOfDate,
            type: agingType !== 'all' ? agingType : undefined,
            search: agingSearch.trim() || undefined,
          },
        });
        if (res.data?.data) setAgingData(res.data.data);
      } else if (activeTab === 'balance-sheet') {
        const res = await apiClient.get('/reports/balance-sheet', {
          params: {
            as_of_date: asOfDate,
          },
        });
        if (res.data?.data) setBalanceSheetData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFrom, dateTo, asOfDate, agingType, agingSearch]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Rs. 0.00';
    return `Rs. ${Number(val).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  const handleExportCsv = () => {
    const type =
      activeTab === 'profit-loss'
        ? 'profit-loss'
        : activeTab === 'monthly'
        ? 'monthly-sales'
        : activeTab === 'stock-valuation'
        ? 'stock-valuation'
        : activeTab === 'balance-sheet'
        ? 'balance-sheet'
        : 'profit-loss';
    const params = new URLSearchParams({
      type,
      date_from: dateFrom,
      date_to: dateTo,
      as_of_date: asOfDate,
    });
    window.open(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api'}/reports/export/csv?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Top Header & Export/Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-xl sm:text-2xl 2xl:text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight">Financial & Profit/Loss Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Real-time COGS calculations, gross margin, operating costs, and inventory valuation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-bold text-xs transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV / Excel</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-black text-xs shadow-md shadow-[#16A34A]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Date Filter & Tab Switcher Bar */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex flex-wrap items-center gap-1.5 bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('profit-loss')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profit-loss'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Executive Profit & Loss
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Monthly Sales & P&L
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock-valuation')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stock-valuation'
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              Stock Valuation & Audit
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('aging')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'aging'
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Aging Analysis</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('balance-sheet')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'balance-sheet'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Scale className="w-3.5 h-3.5" />
              <span>Balance Sheet</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('manufacturing')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'manufacturing'
                  ? 'bg-indigo-600 text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-slate-100'
              }`}
            >
              <Factory className="w-3.5 h-3.5" />
              <span>Manufacturing Reports</span>
            </button>
          </div>

          {/* Date Picker & Presets (for Profit-Loss & Monthly) */}
          {activeTab !== 'stock-valuation' && activeTab !== 'aging' && activeTab !== 'balance-sheet' && activeTab !== 'manufacturing' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-2.5 py-1.5 rounded-xl text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                />
                <span className="text-xs font-bold text-slate-400 uppercase">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                />
              </div>

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickPreset('today')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('week')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  This Week
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('month')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('last-month')}
                  className="px-2.5 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer"
                >
                  Last Month
                </button>
              </div>

              <button
                type="button"
                onClick={fetchReports}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0 cursor-pointer"
                title="Refresh Report"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* As of Date Filter for Balance Sheet */}
          {activeTab === 'balance-sheet' && (
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">As of Date</span>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                />
              </div>
              <button
                type="button"
                onClick={fetchReports}
                className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 transition-colors shrink-0 cursor-pointer"
                title="Refresh Balance Sheet"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Aging Filter Controls */}
          {activeTab === 'aging' && (
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 px-3 py-1.5 rounded-xl text-xs">
                <span className="text-xs font-bold text-slate-400 uppercase">As of Date</span>
                <input
                  type="date"
                  value={asOfDate}
                  onChange={(e) => setAsOfDate(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 dark:text-slate-200 focus:outline-none text-xs"
                />
              </div>

              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setAgingType('all')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    agingType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setAgingType('receivables')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    agingType === 'receivables' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Receivables
                </button>
                <button
                  type="button"
                  onClick={() => setAgingType('payables')}
                  className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                    agingType === 'payables' ? 'bg-white text-blue-800 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Payables
                </button>
              </div>

              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Filter customer / supplier..."
                  value={agingSearch}
                  onChange={(e) => setAgingSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-1 focus:ring-amber-500"
                />
              </div>

              <button
                type="button"
                onClick={fetchReports}
                className="p-2 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-600 transition-colors shrink-0 cursor-pointer"
                title="Refresh Aging"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Printable Header Branding */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-xl font-black text-slate-900">SALES, PURCHASE & ACCOUNTING SYSTEM</h1>
        <p className="text-xs text-slate-500 font-bold uppercase">
          {activeTab === 'profit-loss'
            ? `PROFIT & LOSS STATEMENT (${dateFrom} TO ${dateTo})`
            : activeTab === 'monthly'
            ? `MONTHLY SALES & PROFIT REPORT`
            : 'INVENTORY STOCK VALUATION & AUDIT REPORT'}
        </p>
        <p className="text-xs text-slate-400">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white dark:bg-slate-900 p-16 rounded-2xl border border-slate-200 dark:border-slate-800 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-sm text-slate-700 dark:text-slate-200">Computing real-time accounting financials...</p>
          <p className="text-xs text-slate-400">Aggregating COGS, Sales, Expenses, and Stock Valuations</p>
        </div>
      ) : activeTab === 'profit-loss' && plData ? (
        /* ================= TAB 1: PROFIT & LOSS OVERVIEW ================= */
        <div className="space-y-6">
          {/* Executive 6 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* Total Sales */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Gross Sales</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                Rs. {plData.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">{plData.sales_count} Invoices</div>
            </div>

            {/* COGS */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Cost of Goods (COGS)</div>
              <div className="text-lg font-black text-slate-700 dark:text-slate-300 mt-1">
                Rs. {plData.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Direct Unit Purchase Cost</div>
            </div>

            {/* Gross Profit */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Gross Profit</div>
              <div className="text-lg font-black text-[#16A34A] mt-1">
                Rs. {plData.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-bold text-emerald-600 mt-0.5">
                Margin: {plData.gross_margin_percentage}%
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Operating Expenses</div>
              <div className="text-lg font-black text-rose-600 mt-1">
                Rs. {plData.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-semibold text-rose-500 mt-0.5">{plData.expenses_count} Vouchers</div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Profit</div>
              <div className={`text-lg font-black mt-1 ${plData.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rs. {plData.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-bold text-slate-300 mt-0.5">
                Net Margin: {plData.net_margin_percentage}%
              </div>
            </div>

            {/* Stock Valuation */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Stock Valuation</div>
              <div className="text-lg font-black text-blue-600 mt-1">
                Rs. {plData.stock_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-0.5">Inventory Cost Basis</div>
            </div>
          </div>

          {/* Visual Profit & Loss Waterfall Statement */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2 font-black text-sm text-slate-900 dark:text-slate-100">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                <span>Profit & Loss Financial Statement</span>
              </div>
              <span className="text-xs font-bold text-slate-400 font-mono">
                {plData.date_from} ➔ {plData.date_to}
              </span>
            </div>

            <div className="space-y-3 text-xs">
              {/* Gross Sales */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                  <span>Total Sales / Gross Revenue</span>
                </div>
                <span className="font-mono font-bold text-slate-900 text-sm">
                  Rs. {plData.sales.toFixed(2)}
                </span>
              </div>

              {/* COGS */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-slate-500"></span>
                  <span>Less: Cost of Goods Sold (COGS)</span>
                </div>
                <span className="font-mono font-bold text-slate-700 text-sm">
                  - Rs. {plData.cogs.toFixed(2)}
                </span>
              </div>

              {/* Gross Profit Divider */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-emerald-50 border border-emerald-200 font-black text-[#16A34A]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-[#16A34A]" />
                  <span>GROSS PROFIT (Margin: {plData.gross_margin_percentage}%)</span>
                </div>
                <span className="font-mono text-base">Rs. {plData.gross_profit.toFixed(2)}</span>
              </div>

              {/* Operating Expenses */}
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/60 font-semibold text-slate-700">
                <div className="flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                  <span>Less: Operating Expenses</span>
                </div>
                <span className="font-mono font-bold text-rose-600 text-sm">
                  - Rs. {plData.expenses.toFixed(2)}
                </span>
              </div>

              {/* Final Net Profit */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-900 text-white font-black shadow-md">
                <div>
                  <div className="text-xs uppercase tracking-wider text-slate-400 font-bold">Net Financial Result</div>
                  <div className="text-sm text-slate-200">
                    NET PROFIT (Net Margin: {plData.net_margin_percentage}%)
                  </div>
                </div>
                <div className={`text-2xl font-mono ${plData.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  Rs. {plData.net_profit.toFixed(2)}
                </div>
              </div>
            </div>
          </div>

          {/* Breakdown Grids: Payment Methods & Expense Categories */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Expense Categories Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span>Expense Categories Distribution</span>
                </div>
                <span className="text-xs font-bold text-slate-400">
                  Total: Rs. {plData.expenses.toFixed(2)}
                </span>
              </div>

              {plData.expense_categories.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {plData.expense_categories.map((cat, idx) => {
                    const pct = plData.expenses > 0 ? ((cat.amount / plData.expenses) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 dark:text-slate-300 text-xs">
                          <span>{cat.category} ({cat.count})</span>
                          <span>Rs. {cat.amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                          <div className="h-full bg-rose-500 rounded-full" style={{ width: `${pct}%` }}></div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">No expenses recorded in this period.</div>
              )}
            </div>

            {/* Payment Methods Breakdown */}
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#16A34A]" />
                  <span>Payment Modes Settlement</span>
                </div>
                <span className="text-xs font-bold text-slate-400">Inflow / Collections</span>
              </div>

              {plData.payment_methods.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {plData.payment_methods.map((pm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                        <span className="font-bold uppercase text-xs text-slate-800 dark:text-slate-200">{pm.method}</span>
                        <span className="text-xs text-slate-400">({pm.count} txns)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 dark:text-slate-100 text-xs">
                        Rs. {pm.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-6 text-center text-slate-400 text-xs">No payments recorded in this period.</div>
              )}
            </div>
          </div>

          {/* Top Selling Products in Period */}
          {plData.top_products?.length > 0 && (
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
                <div className="font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Top Selling Products by Revenue</span>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-500 dark:text-slate-400">
                    <tr>
                      <th className="p-2.5">Product</th>
                      <th className="p-2.5 text-center">Qty Sold</th>
                      <th className="p-2.5 text-right">Revenue</th>
                      <th className="p-2.5 text-right">COGS</th>
                      <th className="p-2.5 text-right">Gross Margin</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                    {plData.top_products.map((p, idx) => {
                      const margin = p.total_revenue - p.total_cogs;
                      const marginPct = p.total_revenue > 0 ? ((margin / p.total_revenue) * 100).toFixed(1) : '0.0';
                      return (
                        <tr key={idx}>
                          <td className="p-2.5 font-bold text-slate-800 dark:text-slate-200">
                            {p.name} <span className="text-xs font-mono text-slate-400">({p.sku})</span>
                          </td>
                          <td className="p-2.5 text-center font-bold text-slate-700 dark:text-slate-300">{p.quantity_sold}</td>
                          <td className="p-2.5 text-right font-mono font-bold text-slate-900 dark:text-slate-100">
                            Rs. {p.total_revenue.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono text-slate-500 dark:text-slate-400">
                            Rs. {p.total_cogs.toFixed(2)}
                          </td>
                          <td className="p-2.5 text-right font-mono font-bold text-[#16A34A]">
                            Rs. {margin.toFixed(2)} ({marginPct}%)
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      ) : activeTab === 'monthly' && monthlyData ? (
        /* ================= TAB 2: MONTHLY SALES & P&L ================= */
        <div className="space-y-6">
          {/* Monthly Aggregated Header */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Month Sales</div>
              <div className="text-lg font-black text-slate-900 dark:text-slate-100 mt-1">
                Rs. {monthlyData.summary.total_sales.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Month COGS</div>
              <div className="text-lg font-black text-slate-700 dark:text-slate-300 mt-1">
                Rs. {monthlyData.summary.total_cogs.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Gross Profit</div>
              <div className="text-lg font-black text-[#16A34A] mt-1">
                Rs. {monthlyData.summary.gross_profit.toFixed(2)}
              </div>
            </div>
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Expenses</div>
              <div className="text-lg font-black text-rose-600 mt-1">
                Rs. {monthlyData.summary.total_expenses.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase text-slate-400">Net Profit</div>
              <div className="text-lg font-black text-emerald-400 mt-1">
                Rs. {monthlyData.summary.net_profit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Daily Ledger Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100">
              Daily Sales & Profit Ledger — {monthlyData.month_name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">Date / Day</th>
                    <th className="px-5 py-3 text-right">Sales (Revenue)</th>
                    <th className="px-5 py-3 text-right">COGS</th>
                    <th className="px-5 py-3 text-right">Gross Profit</th>
                    <th className="px-5 py-3 text-right">Expenses</th>
                    <th className="px-5 py-3 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium font-mono text-xs">
                  {monthlyData.daily_ledger.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                      <td className="px-5 py-2.5 font-sans font-bold text-slate-800 dark:text-slate-200">{d.day}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-slate-900 dark:text-slate-100">
                        Rs. {d.sales.toFixed(2)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-500 dark:text-slate-400">Rs. {d.cogs.toFixed(2)}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-[#16A34A]">
                        Rs. {d.gross_profit.toFixed(2)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-rose-600">Rs. {d.expenses.toFixed(2)}</td>
                      <td className={`px-5 py-2.5 text-right font-bold ${d.net_profit >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                        Rs. {d.net_profit.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'stock-valuation' && stockData ? (
        /* ================= TAB 3: STOCK VALUATION & AUDIT ================= */
        <div className="space-y-6">
          {/* Main Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Total Active Products</div>
              <div className="text-2xl font-black text-slate-900 dark:text-slate-100 mt-1">{stockData.total_products}</div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Catalog Items</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Total Stock Valuation (Cost)</div>
              <div className="text-2xl font-black text-blue-600 dark:text-blue-400 mt-1">
                Rs. {stockData.total_stock_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Total Capital Invested</div>
            </div>

            <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
              <div className="text-xs font-bold uppercase text-slate-400">Retail Value (Selling Price)</div>
              <div className="text-2xl font-black text-[#16A34A] mt-1">
                Rs. {stockData.total_retail_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Potential Gross Turnover</div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
              <div className="text-xs font-bold uppercase text-slate-400">Potential Gross Margin</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                Rs. {stockData.potential_gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-slate-400 font-medium mt-0.5">Retail minus Cost</div>
            </div>
          </div>

          {/* Phase 2: Partitioned Valuation by Product Type */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-amber-700 dark:text-amber-400">
                <span>Raw Materials Value</span>
                <Scissors className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">
                Rs. {(stockData.raw_material_valuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-amber-700/80 dark:text-amber-400/80 font-medium mt-0.5">Paper, Board, Glue, Supplies</div>
            </div>

            <div className="bg-blue-50/70 dark:bg-blue-950/30 p-4 rounded-2xl border border-blue-200/80 dark:border-blue-800/50 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-blue-700 dark:text-blue-400">
                <span>Finished Goods Value</span>
                <Package className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-blue-900 dark:text-blue-200 mt-1">
                Rs. {(stockData.finished_goods_valuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-blue-700/80 dark:text-blue-400/80 font-medium mt-0.5">Registers, Notebooks, Copies</div>
            </div>

            <div className="bg-teal-50/70 dark:bg-teal-950/30 p-4 rounded-2xl border border-teal-200/80 dark:border-teal-800/50 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-teal-700 dark:text-teal-400">
                <span>Consumables Value</span>
                <Layers className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-teal-900 dark:text-teal-200 mt-1">
                Rs. {(stockData.consumable_valuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-teal-700/80 dark:text-teal-400/80 font-medium mt-0.5">Packaging & Operational</div>
            </div>

            <div className="bg-purple-50/70 dark:bg-purple-950/30 p-4 rounded-2xl border border-purple-200/80 dark:border-purple-800/50 shadow-xs">
              <div className="flex items-center justify-between text-xs font-bold uppercase text-purple-700 dark:text-purple-400">
                <span>Machinery / Assets</span>
                <Wrench className="w-3.5 h-3.5" />
              </div>
              <div className="text-xl font-black text-purple-900 dark:text-purple-200 mt-1">
                Rs. {(stockData.machinery_valuation ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-xs text-purple-700/80 dark:text-purple-400/80 font-medium mt-0.5">Equipment & Machines</div>
            </div>
          </div>

          {/* Product Valuation Table */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 font-black text-xs sm:text-sm text-slate-900 dark:text-slate-100 flex items-center justify-between">
              <span>Itemized Inventory Valuation Audit</span>
              <span className="text-slate-400 font-normal text-xs">Values calculated at current base unit purchase rate</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <tr>
                    <th className="px-5 py-3">SKU & Item Name</th>
                    <th className="px-5 py-3">Classification</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-center">Stock Quantity</th>
                    <th className="px-5 py-3 text-right">Cost Rate</th>
                    <th className="px-5 py-3 text-right">Selling Rate</th>
                    <th className="px-5 py-3 text-right">Stock Valuation (Cost)</th>
                    <th className="px-5 py-3 text-right">Retail Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                  {stockData.products.map((p) => {
                    const pType = p.product_type || 'finished_good';
                    const typeBadgeClass =
                      pType === 'raw_material'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300'
                        : pType === 'consumable'
                        ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300'
                        : pType === 'machinery'
                        ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/40 dark:text-purple-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300';

                    const typeLabel =
                      pType === 'raw_material'
                        ? 'Raw Material'
                        : pType === 'consumable'
                        ? 'Consumable'
                        : pType === 'machinery'
                        ? 'Machinery'
                        : 'Finished Good';

                    return (
                      <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="px-5 py-3 font-bold text-slate-900 dark:text-slate-100">
                          {p.name}
                          <span className="block font-mono text-xs text-slate-400">{p.sku}</span>
                        </td>
                        <td className="px-5 py-3">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${typeBadgeClass}`}>
                            {typeLabel}
                          </span>
                        </td>
                        <td className="px-5 py-3 text-slate-600 dark:text-slate-300 font-medium">{p.category}</td>
                        <td className="px-5 py-3 text-center font-bold text-slate-800 dark:text-slate-200">
                          {p.stock_quantity} {p.unit_name}
                          {p.secondary_unit_name && p.conversion_ratio && (
                            <span className="block text-xs text-slate-400 font-normal">
                              ({(p.stock_quantity / p.conversion_ratio).toFixed(2)} {p.secondary_unit_name})
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-medium">Rs. {p.purchase_price.toFixed(2)}</td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-slate-800 dark:text-slate-200">
                          Rs. {p.selling_price.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-blue-600 dark:text-blue-400">
                          Rs. {p.stock_valuation.toFixed(2)}
                        </td>
                        <td className="px-5 py-3 text-right font-mono font-bold text-[#16A34A]">
                          Rs. {p.retail_valuation.toFixed(2)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : activeTab === 'aging' && agingData ? (
        /* ================= TAB 4: AGING ANALYSIS (DUE & OVERDUE) ================= */
        <div className="space-y-8">
          {/* RECEIVABLES AGING (CUSTOMERS) */}
          {(agingType === 'all' || agingType === 'receivables') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                    <Users className="w-4 h-4" />
                  </div>
                  <span>Accounts Receivable Aging (Customer Credit Invoices)</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Outstanding: <span className="text-[#16A34A] font-black">Rs. {agingData.receivables.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              </div>

              {/* Receivables Buckets KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-bold uppercase text-slate-400">Total Receivables</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    Rs. {agingData.receivables.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{agingData.receivables.summary.count} Unpaid Invoices</div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">Current (Not Overdue)</div>
                  <div className="text-xl font-black text-[#16A34A] mt-1">
                    Rs. {agingData.receivables.summary.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400/80 font-medium mt-0.5">Within payment terms</div>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">1 - 30 Days Overdue</div>
                  <div className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">
                    Rs. {agingData.receivables.summary['1_30'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400/80 font-medium mt-0.5">Early overdue bracket</div>
                </div>

                <div className="bg-orange-50/70 dark:bg-orange-950/30 p-4 rounded-2xl border border-orange-200/80 dark:border-orange-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-orange-800 dark:text-orange-400">31 - 60 Days Overdue</div>
                  <div className="text-xl font-black text-orange-900 dark:text-orange-200 mt-1">
                    Rs. {agingData.receivables.summary['31_60'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-400/80 font-medium mt-0.5">Medium overdue bracket</div>
                </div>

                <div className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800/50 shadow-xs col-span-2 lg:col-span-1">
                  <div className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">61+ Days Overdue</div>
                  <div className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">
                    Rs. {agingData.receivables.summary['61_plus'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-400/80 font-medium mt-0.5">High risk overdue</div>
                </div>
              </div>

              {/* Receivables Detailed Breakdown Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Customer Name</th>
                        <th className="px-4 py-3.5 text-right">Current</th>
                        <th className="px-4 py-3.5 text-right">1-30 Days</th>
                        <th className="px-4 py-3.5 text-right">31-60 Days</th>
                        <th className="px-4 py-3.5 text-right">61+ Days</th>
                        <th className="px-5 py-3.5 text-right">Total Outstanding</th>
                        <th className="px-4 py-3.5 text-center">Invoices</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agingData.receivables.customers.length > 0 ? (
                        agingData.receivables.customers.map((c) => {
                          const isExpanded = !!expandedEntities[`c_${c.id}`];
                          return (
                            <React.Fragment key={c.id}>
                              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleEntityExpand(`c_${c.id}`)}
                                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                    <div>
                                      <span>{c.name}</span>
                                      {c.phone && <span className="block text-xs text-slate-400 font-normal">{c.phone}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                  {c.buckets.current > 0 ? `Rs. ${c.buckets.current.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-amber-700 dark:text-amber-400">
                                  {c.buckets['1_30'] > 0 ? `Rs. ${c.buckets['1_30'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-orange-700 dark:text-orange-400">
                                  {c.buckets['31_60'] > 0 ? `Rs. ${c.buckets['31_60'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                                  {c.buckets['61_plus'] > 0 ? `Rs. ${c.buckets['61_plus'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                                  Rs. {c.total_outstanding.toFixed(2)}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleEntityExpand(`c_${c.id}`)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    {c.invoices_count} {c.invoices_count === 1 ? 'Inv' : 'Invs'}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Invoices List */}
                              {isExpanded && c.invoices && (
                                <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                                  <td colSpan={7} className="px-6 py-4">
                                    <div className="space-y-2">
                                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Itemized Open Invoices for {c.name}
                                      </div>
                                      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-100/70 dark:bg-slate-800 text-xs uppercase font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                              <th className="px-3 py-2">Invoice #</th>
                                              <th className="px-3 py-2">Sale Date</th>
                                              <th className="px-3 py-2">Due Date</th>
                                              <th className="px-3 py-2">Terms</th>
                                              <th className="px-3 py-2 text-right">Invoice Total</th>
                                              <th className="px-3 py-2 text-right">Paid</th>
                                              <th className="px-3 py-2 text-right">Due Amount</th>
                                              <th className="px-3 py-2 text-center">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            {c.invoices.map((inv) => (
                                              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.invoice_no}</td>
                                                <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{inv.date}</td>
                                                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 font-bold">{inv.due_date || '-'}</td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{inv.payment_terms ? inv.payment_terms.replace('_', ' ') : '-'}</td>
                                                <td className="px-3 py-2 text-right font-mono">Rs. {inv.grand_total.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-slate-400">Rs. {inv.paid_amount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-[#16A34A]">Rs. {inv.due_amount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-center">
                                                  {inv.due_status === 'overdue' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                      Overdue ({inv.overdue_days}d)
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'due_today' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                      Due Today
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'due_soon' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                                      Due Soon
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'current' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                      Current
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                            No overdue or outstanding receivables found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* PAYABLES AGING (SUPPLIERS) */}
          {(agingType === 'all' || agingType === 'payables') && (
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2 font-black text-base sm:text-lg text-slate-900 dark:text-slate-100">
                  <div className="w-8 h-8 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                    <Building2 className="w-4 h-4" />
                  </div>
                  <span>Accounts Payable Aging (Vendor Procurement Orders)</span>
                </div>
                <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                  Total Outstanding: <span className="text-blue-700 font-black">Rs. {agingData.payables.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </span>
              </div>

              {/* Payables Buckets KPI Cards */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
                <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs">
                  <div className="text-xs font-bold uppercase text-slate-400">Total Payables</div>
                  <div className="text-xl font-black text-slate-900 dark:text-slate-100 mt-1">
                    Rs. {agingData.payables.summary.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">{agingData.payables.summary.count} Unpaid Bills</div>
                </div>

                <div className="bg-emerald-50/70 dark:bg-emerald-950/30 p-4 rounded-2xl border border-emerald-200/80 dark:border-emerald-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-emerald-800 dark:text-emerald-400">Current (Not Overdue)</div>
                  <div className="text-xl font-black text-[#16A34A] mt-1">
                    Rs. {agingData.payables.summary.current.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-emerald-700 dark:text-emerald-400/80 font-medium mt-0.5">Within payment terms</div>
                </div>

                <div className="bg-amber-50/70 dark:bg-amber-950/30 p-4 rounded-2xl border border-amber-200/80 dark:border-amber-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-amber-800 dark:text-amber-400">1 - 30 Days Overdue</div>
                  <div className="text-xl font-black text-amber-900 dark:text-amber-200 mt-1">
                    Rs. {agingData.payables.summary['1_30'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-amber-700 dark:text-amber-400/80 font-medium mt-0.5">Early overdue bracket</div>
                </div>

                <div className="bg-orange-50/70 dark:bg-orange-950/30 p-4 rounded-2xl border border-orange-200/80 dark:border-orange-800/50 shadow-xs">
                  <div className="text-xs font-bold uppercase text-orange-800 dark:text-orange-400">31 - 60 Days Overdue</div>
                  <div className="text-xl font-black text-orange-900 dark:text-orange-200 mt-1">
                    Rs. {agingData.payables.summary['31_60'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-orange-700 dark:text-orange-400/80 font-medium mt-0.5">Medium overdue bracket</div>
                </div>

                <div className="bg-rose-50/70 dark:bg-rose-950/30 p-4 rounded-2xl border border-rose-200/80 dark:border-rose-800/50 shadow-xs col-span-2 lg:col-span-1">
                  <div className="text-xs font-bold uppercase text-rose-800 dark:text-rose-400">61+ Days Overdue</div>
                  <div className="text-xl font-black text-rose-900 dark:text-rose-200 mt-1">
                    Rs. {agingData.payables.summary['61_plus'].toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-xs text-rose-700 dark:text-rose-400/80 font-medium mt-0.5">High risk overdue</div>
                </div>
              </div>

              {/* Payables Detailed Breakdown Table */}
              <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 dark:bg-slate-800/80 text-xs uppercase font-bold text-slate-500 dark:text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <tr>
                        <th className="px-5 py-3.5">Vendor / Supplier Name</th>
                        <th className="px-4 py-3.5 text-right">Current</th>
                        <th className="px-4 py-3.5 text-right">1-30 Days</th>
                        <th className="px-4 py-3.5 text-right">31-60 Days</th>
                        <th className="px-4 py-3.5 text-right">61+ Days</th>
                        <th className="px-5 py-3.5 text-right">Total Outstanding</th>
                        <th className="px-4 py-3.5 text-center">Bills</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                      {agingData.payables.suppliers.length > 0 ? (
                        agingData.payables.suppliers.map((s) => {
                          const isExpanded = !!expandedEntities[`s_${s.id}`];
                          return (
                            <React.Fragment key={s.id}>
                              <tr className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors">
                                <td className="px-5 py-3.5 font-bold text-slate-900 dark:text-slate-100">
                                  <div className="flex items-center gap-2">
                                    <button
                                      type="button"
                                      onClick={() => toggleEntityExpand(`s_${s.id}`)}
                                      className="p-1 rounded-md hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 cursor-pointer"
                                    >
                                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                                    </button>
                                    <div>
                                      <span>{s.name}</span>
                                      {s.phone && <span className="block text-xs text-slate-400 font-normal">{s.phone}</span>}
                                    </div>
                                  </div>
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-emerald-700 dark:text-emerald-400">
                                  {s.buckets.current > 0 ? `Rs. ${s.buckets.current.toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-amber-700 dark:text-amber-400">
                                  {s.buckets['1_30'] > 0 ? `Rs. ${s.buckets['1_30'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-medium text-orange-700 dark:text-orange-400">
                                  {s.buckets['31_60'] > 0 ? `Rs. ${s.buckets['31_60'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-4 py-3.5 text-right font-mono font-bold text-rose-700 dark:text-rose-400">
                                  {s.buckets['61_plus'] > 0 ? `Rs. ${s.buckets['61_plus'].toFixed(2)}` : '-'}
                                </td>
                                <td className="px-5 py-3.5 text-right font-mono font-black text-slate-900 dark:text-slate-100 text-sm">
                                  Rs. {s.total_outstanding.toFixed(2)}
                                </td>
                                <td className="px-4 py-3.5 text-center">
                                  <button
                                    type="button"
                                    onClick={() => toggleEntityExpand(`s_${s.id}`)}
                                    className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold text-xs transition-colors cursor-pointer"
                                  >
                                    {s.invoices_count} {s.invoices_count === 1 ? 'Bill' : 'Bills'}
                                  </button>
                                </td>
                              </tr>

                              {/* Expanded Bills List */}
                              {isExpanded && s.invoices && (
                                <tr className="bg-slate-50/80 dark:bg-slate-800/40">
                                  <td colSpan={7} className="px-6 py-4">
                                    <div className="space-y-2">
                                      <div className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                                        Itemized Open Bills for {s.name}
                                      </div>
                                      <div className="overflow-x-auto bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800">
                                        <table className="w-full text-left text-xs">
                                          <thead className="bg-slate-100/70 dark:bg-slate-800 text-xs uppercase font-bold text-slate-600 dark:text-slate-400 border-b border-slate-200 dark:border-slate-700">
                                            <tr>
                                              <th className="px-3 py-2">PO / Bill #</th>
                                              <th className="px-3 py-2">Purchase Date</th>
                                              <th className="px-3 py-2">Due Date</th>
                                              <th className="px-3 py-2">Terms</th>
                                              <th className="px-3 py-2 text-right">Bill Total</th>
                                              <th className="px-3 py-2 text-right">Paid</th>
                                              <th className="px-3 py-2 text-right">Due Amount</th>
                                              <th className="px-3 py-2 text-center">Status</th>
                                            </tr>
                                          </thead>
                                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                                            {s.invoices.map((inv) => (
                                              <tr key={inv.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                <td className="px-3 py-2 font-mono font-bold text-slate-900 dark:text-slate-100">{inv.purchase_no}</td>
                                                <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">{inv.date}</td>
                                                <td className="px-3 py-2 font-mono text-slate-700 dark:text-slate-300 font-bold">{inv.due_date || '-'}</td>
                                                <td className="px-3 py-2 text-slate-600 dark:text-slate-300">{inv.payment_terms ? inv.payment_terms.replace('_', ' ') : '-'}</td>
                                                <td className="px-3 py-2 text-right font-mono">Rs. {inv.grand_total.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-mono text-slate-500 dark:text-slate-400">Rs. {inv.paid_amount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-right font-mono font-bold text-blue-700 dark:text-blue-400">Rs. {inv.due_amount.toFixed(2)}</td>
                                                <td className="px-3 py-2 text-center">
                                                  {inv.due_status === 'overdue' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                                                      Overdue ({inv.overdue_days}d)
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'due_today' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                                      Due Today
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'due_soon' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                                                      Due Soon
                                                    </span>
                                                  )}
                                                  {inv.due_status === 'current' && (
                                                    <span className="px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                                      Current
                                                    </span>
                                                  )}
                                                </td>
                                              </tr>
                                            ))}
                                          </tbody>
                                        </table>
                                      </div>
                                    </div>
                                  </td>
                                </tr>
                              )}
                            </React.Fragment>
                          );
                        })
                      ) : (
                        <tr>
                          <td colSpan={7} className="px-6 py-10 text-center text-slate-400">
                            No overdue or outstanding payables found.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      ) : null}

      {/* BALANCE SHEET & FINANCIAL POSITION TAB */}
      {activeTab === 'balance-sheet' ? (
        <BalanceSheetView
          data={balanceSheetData}
          loading={loading}
          formatCurrency={formatCurrency}
        />
      ) : null}

      {/* MANUFACTURING REPORTS SUITE (PHASE 13) */}
      {activeTab === 'manufacturing' ? (
        <ManufacturingReportsView formatCurrency={formatCurrency} />
      ) : null}
    </div>
  );
}
