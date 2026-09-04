'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '@/lib/api';
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
  CheckCircle2,
  FileText,
  Boxes,
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
  potential_gross_profit: number;
  products: Array<{
    id: number;
    sku: string;
    name: string;
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
  const [activeTab, setActiveTab] = useState<'profit-loss' | 'monthly' | 'stock-valuation'>('profit-loss');
  const [loading, setLoading] = useState(true);

  // Date range filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(todayStr);

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
      }
    } catch (err) {
      console.error('Failed to load reports', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, dateFrom, dateTo]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const handleExportCsv = () => {
    const type = activeTab === 'profit-loss' ? 'profit-loss' : activeTab === 'monthly' ? 'monthly-sales' : 'stock-valuation';
    const params = new URLSearchParams({
      type,
      date_from: dateFrom,
      date_to: dateTo,
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
          <h1 className="text-2xl font-black text-[#0F172A] tracking-tight">Financial & Profit/Loss Reports</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Real-time COGS calculations, gross margin, operating costs, and inventory valuation
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-all cursor-pointer"
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
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => setActiveTab('profit-loss')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'profit-loss'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Executive Profit & Loss
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('monthly')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'monthly'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Monthly Sales & P&L
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('stock-valuation')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                activeTab === 'stock-valuation'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Stock Valuation & Audit
            </button>
          </div>

          {/* Date Picker & Presets (for Profit-Loss & Monthly) */}
          {activeTab !== 'stock-valuation' && (
            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2 py-1 rounded-xl text-xs">
                <span className="text-[10px] font-bold text-slate-400 uppercase">From</span>
                <input
                  type="date"
                  value={dateFrom}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none"
                />
                <span className="text-[10px] font-bold text-slate-400 uppercase">To</span>
                <input
                  type="date"
                  value={dateTo}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="bg-transparent font-bold text-slate-800 focus:outline-none"
                />
              </div>

              {/* Quick Presets */}
              <div className="hidden sm:flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setQuickPreset('today')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  Today
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
                >
                  This Month
                </button>
                <button
                  type="button"
                  onClick={() => setQuickPreset('last-month')}
                  className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 text-[11px] font-bold transition-colors cursor-pointer"
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
        <p className="text-[10px] text-slate-400">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-sm text-slate-700">Computing real-time accounting financials...</p>
          <p className="text-xs text-slate-400">Aggregating COGS, Sales, Expenses, and Stock Valuations</p>
        </div>
      ) : activeTab === 'profit-loss' && plData ? (
        /* ================= TAB 1: PROFIT & LOSS OVERVIEW ================= */
        <div className="space-y-6">
          {/* Executive 6 Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3.5">
            {/* Total Sales */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Gross Sales</div>
              <div className="text-lg font-black text-slate-900 mt-1">
                Rs. {plData.sales.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">{plData.sales_count} Invoices</div>
            </div>

            {/* COGS */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Cost of Goods (COGS)</div>
              <div className="text-lg font-black text-slate-700 mt-1">
                Rs. {plData.cogs.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Direct Unit Purchase Cost</div>
            </div>

            {/* Gross Profit */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Gross Profit</div>
              <div className="text-lg font-black text-[#16A34A] mt-1">
                Rs. {plData.gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-bold text-emerald-600 mt-0.5">
                Margin: {plData.gross_margin_percentage}%
              </div>
            </div>

            {/* Operating Expenses */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Operating Expenses</div>
              <div className="text-lg font-black text-rose-600 mt-1">
                Rs. {plData.expenses.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-semibold text-rose-500 mt-0.5">{plData.expenses_count} Vouchers</div>
            </div>

            {/* Net Profit */}
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md border border-slate-800">
              <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Net Profit</div>
              <div className={`text-lg font-black mt-1 ${plData.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                Rs. {plData.net_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-bold text-slate-300 mt-0.5">
                Net Margin: {plData.net_margin_percentage}%
              </div>
            </div>

            {/* Stock Valuation */}
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Stock Valuation</div>
              <div className="text-lg font-black text-blue-600 mt-1">
                Rs. {plData.stock_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[10px] font-semibold text-slate-500 mt-0.5">Inventory Cost Basis</div>
            </div>
          </div>

          {/* Visual Profit & Loss Waterfall Statement */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-black text-sm text-[#0F172A]">
                <TrendingUp className="w-4 h-4 text-[#16A34A]" />
                <span>Profit & Loss Financial Statement</span>
              </div>
              <span className="text-[11px] font-bold text-slate-400 font-mono">
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
                  <div className="text-[10px] uppercase tracking-wider text-slate-400 font-bold">Net Financial Result</div>
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                  <Tag className="w-4 h-4 text-rose-600" />
                  <span>Expense Categories Distribution</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">
                  Total: Rs. {plData.expenses.toFixed(2)}
                </span>
              </div>

              {plData.expense_categories.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {plData.expense_categories.map((cat, idx) => {
                    const pct = plData.expenses > 0 ? ((cat.amount / plData.expenses) * 100).toFixed(1) : 0;
                    return (
                      <div key={idx} className="space-y-1">
                        <div className="flex justify-between font-bold text-slate-700 text-[11px]">
                          <span>{cat.category} ({cat.count})</span>
                          <span>Rs. {cat.amount.toFixed(2)} ({pct}%)</span>
                        </div>
                        <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-[#16A34A]" />
                  <span>Payment Modes Settlement</span>
                </div>
                <span className="text-[10px] font-bold text-slate-400">Inflow / Collections</span>
              </div>

              {plData.payment_methods.length > 0 ? (
                <div className="space-y-2 text-xs">
                  {plData.payment_methods.map((pm, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-2 rounded-xl bg-slate-50 border border-slate-200/60 font-medium"
                    >
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#16A34A]"></span>
                        <span className="font-bold uppercase text-[11px] text-slate-800">{pm.method}</span>
                        <span className="text-[10px] text-slate-400">({pm.count} txns)</span>
                      </div>
                      <span className="font-mono font-bold text-slate-900 text-xs">
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
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <div className="font-black text-xs text-slate-900 flex items-center gap-2">
                  <Package className="w-4 h-4 text-purple-600" />
                  <span>Top Selling Products by Revenue</span>
                </div>
              </div>

              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500">
                  <tr>
                    <th className="p-2.5">Product</th>
                    <th className="p-2.5 text-center">Qty Sold</th>
                    <th className="p-2.5 text-right">Revenue</th>
                    <th className="p-2.5 text-right">COGS</th>
                    <th className="p-2.5 text-right">Gross Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {plData.top_products.map((p, idx) => {
                    const margin = p.total_revenue - p.total_cogs;
                    const marginPct = p.total_revenue > 0 ? ((margin / p.total_revenue) * 100).toFixed(1) : '0.0';
                    return (
                      <tr key={idx}>
                        <td className="p-2.5 font-bold text-slate-800">
                          {p.name} <span className="text-[10px] font-mono text-slate-400">({p.sku})</span>
                        </td>
                        <td className="p-2.5 text-center font-bold">{p.quantity_sold}</td>
                        <td className="p-2.5 text-right font-mono font-bold text-slate-900">
                          Rs. {p.total_revenue.toFixed(2)}
                        </td>
                        <td className="p-2.5 text-right font-mono text-slate-500">
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
          )}
        </div>
      ) : activeTab === 'monthly' && monthlyData ? (
        /* ================= TAB 2: MONTHLY SALES & P&L ================= */
        <div className="space-y-6">
          {/* Monthly Aggregated Header */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3.5">
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Month Sales</div>
              <div className="text-lg font-black text-slate-900 mt-1">
                Rs. {monthlyData.summary.total_sales.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Month COGS</div>
              <div className="text-lg font-black text-slate-700 mt-1">
                Rs. {monthlyData.summary.total_cogs.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Gross Profit</div>
              <div className="text-lg font-black text-[#16A34A] mt-1">
                Rs. {monthlyData.summary.gross_profit.toFixed(2)}
              </div>
            </div>
            <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Expenses</div>
              <div className="text-lg font-black text-rose-600 mt-1">
                Rs. {monthlyData.summary.total_expenses.toFixed(2)}
              </div>
            </div>
            <div className="bg-slate-900 text-white p-4 rounded-2xl shadow-md">
              <div className="text-[10px] font-black uppercase text-slate-400">Net Profit</div>
              <div className="text-lg font-black text-emerald-400 mt-1">
                Rs. {monthlyData.summary.net_profit.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Daily Ledger Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-black text-xs text-slate-900">
              Daily Sales & Profit Ledger — {monthlyData.month_name}
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">Date / Day</th>
                    <th className="px-5 py-3 text-right">Sales (Revenue)</th>
                    <th className="px-5 py-3 text-right">COGS</th>
                    <th className="px-5 py-3 text-right">Gross Profit</th>
                    <th className="px-5 py-3 text-right">Expenses</th>
                    <th className="px-5 py-3 text-right">Net Profit</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium font-mono text-[11px]">
                  {monthlyData.daily_ledger.map((d, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-2.5 font-sans font-bold text-slate-800">{d.day}</td>
                      <td className="px-5 py-2.5 text-right font-bold text-slate-900">
                        Rs. {d.sales.toFixed(2)}
                      </td>
                      <td className="px-5 py-2.5 text-right text-slate-500">Rs. {d.cogs.toFixed(2)}</td>
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
          {/* Stock Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Total Active Products</div>
              <div className="text-2xl font-black text-slate-900 mt-1">{stockData.total_products}</div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Catalog Items</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Stock Valuation (Cost Basis)</div>
              <div className="text-2xl font-black text-blue-600 mt-1">
                Rs. {stockData.total_stock_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Capital Invested</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs">
              <div className="text-[10px] font-black uppercase text-slate-400">Retail Value (Selling Price)</div>
              <div className="text-2xl font-black text-[#16A34A] mt-1">
                Rs. {stockData.total_retail_valuation.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Potential Gross Turnover</div>
            </div>

            <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-md">
              <div className="text-[10px] font-black uppercase text-slate-400">Potential Gross Margin</div>
              <div className="text-2xl font-black text-emerald-400 mt-1">
                Rs. {stockData.potential_gross_profit.toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </div>
              <div className="text-[11px] text-slate-400 font-medium mt-0.5">Retail minus Cost</div>
            </div>
          </div>

          {/* Product Valuation Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 font-black text-xs text-slate-900 flex items-center justify-between">
              <span>Itemized Inventory Valuation Audit</span>
              <span className="text-slate-400 font-normal text-[11px]">Values calculated at current base unit purchase rate</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-600">
                <thead className="bg-slate-50 text-[10px] uppercase font-bold text-slate-500 border-b border-slate-100">
                  <tr>
                    <th className="px-5 py-3">SKU & Item Name</th>
                    <th className="px-5 py-3">Category</th>
                    <th className="px-5 py-3 text-center">Stock Quantity</th>
                    <th className="px-5 py-3 text-right">Cost Rate</th>
                    <th className="px-5 py-3 text-right">Selling Rate</th>
                    <th className="px-5 py-3 text-right">Stock Valuation (Cost)</th>
                    <th className="px-5 py-3 text-right">Retail Valuation</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stockData.products.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="px-5 py-3 font-bold text-slate-900">
                        {p.name}
                        <span className="block font-mono text-[10px] text-slate-400">{p.sku}</span>
                      </td>
                      <td className="px-5 py-3 text-slate-600 font-medium">{p.category}</td>
                      <td className="px-5 py-3 text-center font-bold text-slate-800">
                        {p.stock_quantity} {p.unit_name}
                        {p.secondary_unit_name && p.conversion_ratio && (
                          <span className="block text-[10px] text-slate-400 font-normal">
                            ({(p.stock_quantity / p.conversion_ratio).toFixed(2)} {p.secondary_unit_name})
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-medium">Rs. {p.purchase_price.toFixed(2)}</td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-slate-800">
                        Rs. {p.selling_price.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-blue-600">
                        Rs. {p.stock_valuation.toFixed(2)}
                      </td>
                      <td className="px-5 py-3 text-right font-mono font-bold text-[#16A34A]">
                        Rs. {p.retail_valuation.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
