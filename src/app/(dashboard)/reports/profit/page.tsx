'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Receipt,
  Calendar,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  Package,
  Layers,
  PieChart,
  BarChart3,
  CheckCircle2,
  FileSpreadsheet,
  ArrowRight,
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

export default function ProfitReportPage() {
  const [loading, setLoading] = useState(true);
  const [plData, setPlData] = useState<ProfitLossData | null>(null);

  // Date Filters
  const todayStr = new Date().toISOString().split('T')[0];
  const firstDayOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
    .toISOString()
    .split('T')[0];

  const [dateFrom, setDateFrom] = useState<string>(firstDayOfMonth);
  const [dateTo, setDateTo] = useState<string>(todayStr);

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

  // Fetch Profit & Loss Report Data
  const fetchProfitReport = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reports/profit-loss', {
        params: {
          date_from: dateFrom,
          date_to: dateTo,
        },
      });
      if (res.data?.data) {
        setPlData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch profit report:', err);
    } finally {
      setLoading(false);
    }
  }, [dateFrom, dateTo]);

  useEffect(() => {
    fetchProfitReport();
  }, [fetchProfitReport]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      type: 'profit-loss',
      date_from: dateFrom,
      date_to: dateTo,
    });
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
            Profit & Margin Statement Report
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Real-time COGS calculations, gross margin, operating expenses, and net profitability (PRD R-05)
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

          {/* Date Range Inputs & Refresh */}
          <div className="flex items-center gap-3">
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

            <button
              type="button"
              onClick={fetchProfitReport}
              className="p-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shadow-xs"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header Branding */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-slate-900">SALES & INVENTORY ERP</h1>
        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider mt-1">
          PROFIT & LOSS STATEMENT ({dateFrom} TO {dateTo})
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-base text-slate-800">Computing Real-time Accounting Financials...</p>
          <p className="text-sm text-slate-500">Aggregating COGS, Sales, Expenses, and Stock Valuations</p>
        </div>
      ) : plData ? (
        <div className="space-y-7">
          {/* Executive 6 Financial Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4">
            {/* 1. Gross Revenue */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Gross Sales</div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {formatCurrency(plData.sales)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                {plData.sales_count} Completed Invoices
              </div>
            </div>

            {/* 2. Direct COGS */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-slate-400 transition-all">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Cost of Goods (COGS)</div>
              <div className="text-xl sm:text-2xl font-black text-slate-700 mt-2">
                {formatCurrency(plData.cogs)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Direct Unit Purchase Cost
              </div>
            </div>

            {/* 3. Gross Profit */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-[#16A34A] transition-all">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Gross Profit</div>
              <div className="text-xl sm:text-2xl font-black text-[#16A34A] mt-2">
                {formatCurrency(plData.gross_profit)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-emerald-700 mt-1">
                Margin: {plData.gross_margin_percentage}%
              </div>
            </div>

            {/* 4. Operating Expenses */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-rose-400 transition-all">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Operating Expenses</div>
              <div className="text-xl sm:text-2xl font-black text-rose-600 mt-2">
                {formatCurrency(plData.expenses)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-rose-600 mt-1">
                {plData.expenses_count} Expense Vouchers
              </div>
            </div>

            {/* 5. Net Profit */}
            <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Net Profit</div>
              <div className={`text-xl sm:text-2xl font-black mt-2 ${plData.net_profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {formatCurrency(plData.net_profit)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 mt-1">
                Net Margin: {plData.net_margin_percentage}%
              </div>
            </div>

            {/* 6. Stock Valuation */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-blue-400 transition-all">
              <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Stock Valuation</div>
              <div className="text-xl sm:text-2xl font-black text-blue-600 mt-2">
                {formatCurrency(plData.stock_valuation)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-600 mt-1">
                Inventory Cost Basis
              </div>
            </div>
          </div>

          {/* Income Statement Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white p-6 sm:p-7 rounded-3xl shadow-md border border-slate-700">
            <h2 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4">
              Income Statement Financial Equation
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-5 gap-4 items-center text-center">
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-bold uppercase">1. Gross Revenue</div>
                <div className="text-lg sm:text-xl font-black text-white mt-1">{formatCurrency(plData.sales)}</div>
              </div>
              <div className="font-black text-rose-400 text-xl">-</div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-bold uppercase">2. COGS (Direct Cost)</div>
                <div className="text-lg sm:text-xl font-black text-slate-300 mt-1">{formatCurrency(plData.cogs)}</div>
              </div>
              <div className="font-black text-rose-400 text-xl">-</div>
              <div className="bg-slate-800/80 p-4 rounded-2xl border border-slate-700">
                <div className="text-xs text-slate-400 font-bold uppercase">3. Operating Expenses</div>
                <div className="text-lg sm:text-xl font-black text-rose-300 mt-1">{formatCurrency(plData.expenses)}</div>
              </div>
            </div>
            <div className="mt-5 pt-4 border-t border-slate-700/80 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-sm text-slate-300 font-semibold">
                Net Operating Result for Period ({plData.date_from} to {plData.date_to})
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                = {formatCurrency(plData.net_profit)} Net Profit
              </div>
            </div>
          </div>

          {/* Breakdown Rows: Expense Categories & Top Products Margin */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Expense Categories Breakdown */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-200">
                <FileSpreadsheet className="w-5 h-5 text-rose-600" /> Expense Categories Breakdown
              </div>
              {plData.expense_categories.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No expense vouchers in selected period</div>
              ) : (
                <div className="space-y-2.5">
                  {plData.expense_categories.map((cat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3.5 rounded-xl bg-slate-50 hover:bg-slate-100 transition-colors border border-slate-200"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
                        <span className="font-bold text-slate-900 text-xs sm:text-sm">{cat.category}</span>
                        <span className="text-xs text-slate-500 font-semibold">({cat.count} vouchers)</span>
                      </div>
                      <span className="font-black text-rose-600 text-sm sm:text-base">{formatCurrency(cat.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Top Products Profit Contribution */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 lg:col-span-2">
              <div className="flex items-center gap-2.5 font-black text-slate-900 text-sm uppercase tracking-wider pb-3 border-b border-slate-200">
                <TrendingUp className="w-5 h-5 text-emerald-600" /> Top Revenue Products & COGS Margin
              </div>
              {plData.top_products.length === 0 ? (
                <div className="py-8 text-center text-sm text-slate-500">No product sales in selected period</div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plData.top_products.map((prod, idx) => {
                    const grossProfit = Number(prod.total_revenue) - Number(prod.total_cogs);
                    const margin = Number(prod.total_revenue) > 0 ? Math.round((grossProfit / Number(prod.total_revenue)) * 100) : 0;
                    return (
                      <div
                        key={idx}
                        className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2"
                      >
                        <div className="flex justify-between items-start">
                          <div className="truncate pr-2">
                            <div className="font-bold text-slate-900 text-sm truncate">{prod.name}</div>
                            <div className="text-xs text-slate-500 font-medium mt-0.5">
                              <span className="font-mono text-slate-600">{prod.sku}</span> • {prod.quantity_sold} sold
                            </div>
                          </div>
                          <span className="px-2 py-0.5 rounded-md text-xs font-black bg-emerald-100 text-emerald-800 border border-emerald-300">
                            {margin}% margin
                          </span>
                        </div>
                        <div className="flex justify-between text-xs pt-1 border-t border-slate-200 text-slate-600">
                          <span>Revenue: <strong className="text-slate-900">{formatCurrency(prod.total_revenue)}</strong></span>
                          <span>Profit: <strong className="text-[#16A34A]">{formatCurrency(grossProfit)}</strong></span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Daily Trends Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm sm:text-base">Daily Financial Ledger Breakdown</h3>
              <div className="text-xs sm:text-sm font-bold text-slate-600">
                Period: <span className="text-slate-950 font-bold">{plData.date_from}</span> to{' '}
                <span className="text-slate-950 font-bold">{plData.date_to}</span>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                  <tr>
                    <th className="p-4">Date</th>
                    <th className="p-4 text-right">Sales Revenue</th>
                    <th className="p-4 text-right">Operating Expenses</th>
                    <th className="p-4 text-right">Daily Net Margin</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-sm">
                  {plData.daily_trends.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-12 text-center text-slate-500">
                        No transactions recorded in this date range.
                      </td>
                    </tr>
                  ) : (
                    plData.daily_trends.map((row, idx) => {
                      const net = Number(row.sales) - Number(row.expenses);
                      return (
                        <tr key={idx} className="hover:bg-slate-50 transition-colors">
                          <td className="p-4 font-bold text-slate-900 text-sm sm:text-base">{row.date}</td>
                          <td className="p-4 text-right font-black text-slate-950 text-base">{formatCurrency(row.sales)}</td>
                          <td className="p-4 text-right font-bold text-rose-600 text-base">{formatCurrency(row.expenses)}</td>
                          <td className={`p-4 text-right font-black text-base ${net >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                            {formatCurrency(net)}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
                <tfoot className="bg-slate-100 font-black text-sm border-t-2 border-slate-300 text-slate-950">
                  <tr>
                    <td className="p-4 uppercase text-xs text-slate-600">Period Total:</td>
                    <td className="p-4 text-right text-slate-950 text-base">{formatCurrency(plData.sales)}</td>
                    <td className="p-4 text-right text-rose-600 text-base">{formatCurrency(plData.expenses)}</td>
                    <td className="p-4 text-right text-emerald-600 text-base">{formatCurrency(plData.net_profit)}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
