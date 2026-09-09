'use client';

import React, { useState, useEffect, useMemo } from 'react';
import apiClient from '@/lib/api';
import {
  ProductionSummaryData,
  RawMaterialConsumptionData,
  ManufacturingWastageData,
  ManufacturingCostData,
} from '@/types/reports';
import {
  Factory,
  Layers,
  Scissors,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Printer,
  Download,
  Search,
  Filter,
  RefreshCw,
  Boxes,
  Percent,
  Calendar,
  BarChart3,
  FileSpreadsheet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  ShieldAlert,
} from 'lucide-react';

interface ManufacturingReportsViewProps {
  formatCurrency: (val: number | null | undefined) => string;
}

interface ProductOption {
  id: number;
  name: string;
  sku: string;
}

type SubTab =
  | 'production-summary'
  | 'output-vs-target'
  | 'raw-material-consumption'
  | 'manufacturing-wastage'
  | 'manufacturing-costs';

export default function ManufacturingReportsView({ formatCurrency }: ManufacturingReportsViewProps) {
  const [subTab, setSubTab] = useState<SubTab>('production-summary');

  // Filters
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split('T')[0]);
  const [selectedProduct, setSelectedProduct] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [tableSearch, setTableSearch] = useState<string>('');

  // Products for filter dropdown
  const [productsList, setProductsList] = useState<ProductOption[]>([]);

  // Report Data states
  const [loading, setLoading] = useState(false);
  const [prodSummaryData, setProdSummaryData] = useState<ProductionSummaryData | null>(null);
  const [consumptionData, setConsumptionData] = useState<RawMaterialConsumptionData | null>(null);
  const [wastageData, setWastageData] = useState<ManufacturingWastageData | null>(null);
  const [costData, setCostData] = useState<ManufacturingCostData | null>(null);

  // Fetch product list for dropdown
  useEffect(() => {
    async function loadProducts() {
      try {
        const res = await apiClient.get('/products', {
          params: { product_type: 'finished_good', per_page: 100 },
        });
        const items = res.data?.data?.data || res.data?.data || [];
        setProductsList(items);
      } catch (err) {
        console.error('Failed to load products list', err);
      }
    }
    loadProducts();
  }, []);

  // Fetch report data based on active subTab
  const fetchReportData = async () => {
    setLoading(true);
    try {
      const params: Record<string, string | number> = {
        start_date: dateFrom,
        end_date: dateTo,
      };

      if (selectedProduct !== 'all') {
        params.finished_product_id = selectedProduct;
      }
      if (selectedStatus !== 'all') {
        params.status = selectedStatus;
      }

      if (subTab === 'production-summary' || subTab === 'output-vs-target') {
        const res = await apiClient.get('/reports/production-summary', { params });
        if (res.data?.data) {
          setProdSummaryData(res.data.data);
        }
      } else if (subTab === 'raw-material-consumption') {
        const res = await apiClient.get('/reports/raw-material-consumption', { params });
        if (res.data?.data) {
          setConsumptionData(res.data.data);
        }
      } else if (subTab === 'manufacturing-wastage') {
        const res = await apiClient.get('/reports/manufacturing-wastage', { params });
        if (res.data?.data) {
          setWastageData(res.data.data);
        }
      } else if (subTab === 'manufacturing-costs') {
        const res = await apiClient.get('/reports/manufacturing-costs', { params });
        if (res.data?.data) {
          setCostData(res.data.data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch manufacturing report', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [subTab, dateFrom, dateTo, selectedProduct, selectedStatus]);

  // Handle CSV Export
  const handleExportCsv = () => {
    const reportTypeMap: Record<SubTab, string> = {
      'production-summary': 'production-summary',
      'output-vs-target': 'production-summary',
      'raw-material-consumption': 'raw-material-consumption',
      'manufacturing-wastage': 'manufacturing-wastage',
      'manufacturing-costs': 'manufacturing-costs',
    };

    const type = reportTypeMap[subTab];
    const params = new URLSearchParams({
      type,
      start_date: dateFrom,
      end_date: dateTo,
    });
    if (selectedProduct !== 'all') params.append('finished_product_id', selectedProduct);
    if (selectedStatus !== 'all') params.append('status', selectedStatus);

    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : '';
    window.open(`/api/reports/export/csv?${params.toString()}&token=${token || ''}`, '_blank');
  };

  // Preset Date Range Helper
  const setQuickRange = (range: 'this_month' | 'last_month' | 'this_year' | 'today') => {
    const now = new Date();
    if (range === 'today') {
      const todayStr = now.toISOString().split('T')[0];
      setDateFrom(todayStr);
      setDateTo(todayStr);
    } else if (range === 'this_month') {
      const first = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      setDateFrom(first);
      setDateTo(todayStr);
    } else if (range === 'last_month') {
      const first = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
      const last = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
      setDateFrom(first);
      setDateTo(last);
    } else if (range === 'this_year') {
      const first = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
      const todayStr = now.toISOString().split('T')[0];
      setDateFrom(first);
      setDateTo(todayStr);
    }
  };

  return (
    <div className="space-y-6">
      {/* Sub-Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setSubTab('production-summary')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'production-summary'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Factory className="w-3.5 h-3.5" />
            Production Summary
          </button>

          <button
            onClick={() => setSubTab('output-vs-target')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'output-vs-target'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            Output vs Target
          </button>

          <button
            onClick={() => setSubTab('raw-material-consumption')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'raw-material-consumption'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            Raw Material Consumption
          </button>

          <button
            onClick={() => setSubTab('manufacturing-wastage')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'manufacturing-wastage'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <Scissors className="w-3.5 h-3.5" />
            Cutting & Wastage
          </button>

          <button
            onClick={() => setSubTab('manufacturing-costs')}
            className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
              subTab === 'manufacturing-costs'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
            }`}
          >
            <DollarSign className="w-3.5 h-3.5" />
            Manufacturing Costs
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCsv}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 rounded-lg text-xs font-bold transition-colors"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            Export CSV
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200 rounded-lg text-xs font-bold transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Print
          </button>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-500 font-semibold">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>Date Range:</span>
            </div>
            <input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />
            <span className="text-xs text-slate-400">to</span>
            <input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
            />

            <div className="flex items-center gap-1">
              <button
                onClick={() => setQuickRange('today')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold"
              >
                Today
              </button>
              <button
                onClick={() => setQuickRange('this_month')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold"
              >
                This Month
              </button>
              <button
                onClick={() => setQuickRange('last_month')}
                className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded text-[11px] font-bold"
              >
                Last Month
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            {/* Finished Product Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Product:</span>
              <select
                value={selectedProduct}
                onChange={(e) => setSelectedProduct(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 max-w-[180px]"
              >
                <option value="all">All Finished Products</option>
                {productsList.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Production Status Filter */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-semibold">Status:</span>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-2.5 py-1.5 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              >
                <option value="all">All Statuses</option>
                <option value="draft">Draft</option>
                <option value="in_progress">In Progress</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <button
              onClick={fetchReportData}
              disabled={loading}
              className="p-1.5 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
              title="Refresh Data"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-3 bg-white rounded-2xl border border-slate-200">
          <RefreshCw className="w-8 h-8 text-indigo-500 animate-spin" />
          <p className="text-sm font-semibold text-slate-500">Computing manufacturing analytics...</p>
        </div>
      ) : (
        <>
          {/* ========================================================= */}
          {/* 1. PRODUCTION VOLUME SUMMARY SUBTAB */}
          {/* ========================================================= */}
          {subTab === 'production-summary' && prodSummaryData && (
            <div className="space-y-6">
              {/* Summary KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Orders</span>
                    <Factory className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {prodSummaryData.summary.total_orders}
                  </div>
                  <div className="flex items-center gap-2 text-[11px] font-medium text-slate-500">
                    <span className="text-emerald-600 font-bold">{prodSummaryData.summary.completed_orders} Completed</span>
                    <span>•</span>
                    <span className="text-amber-600 font-bold">{prodSummaryData.summary.in_progress_orders} In Progress</span>
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Target Planned</span>
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {Number(prodSummaryData.summary.target_quantity).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Planned units across all orders</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Actual Output</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {Number(prodSummaryData.summary.completed_quantity).toLocaleString()}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Remaining: {Number(prodSummaryData.summary.remaining_quantity).toLocaleString()} units
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Completion Rate</span>
                    <Percent className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-purple-600">
                    {prodSummaryData.summary.completion_percentage}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2 overflow-hidden">
                    <div
                      className="bg-purple-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(prodSummaryData.summary.completion_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Product Grouping Breakdown */}
              {prodSummaryData.by_product && prodSummaryData.by_product.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-indigo-500" />
                      Production Volume by Finished Product
                    </h3>
                    <span className="text-xs font-semibold text-slate-500">
                      {prodSummaryData.by_product.length} Product Categories
                    </span>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                          <th className="px-5 py-3">Product Name</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3 text-right">Orders</th>
                          <th className="px-4 py-3 text-right">Planned Qty</th>
                          <th className="px-4 py-3 text-right">Actual Qty</th>
                          <th className="px-4 py-3 text-right">Variance</th>
                          <th className="px-5 py-3 text-right">Achievement %</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {prodSummaryData.by_product.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-900">{p.name}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{p.sku || '-'}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{p.orders_count}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {Number(p.planned_quantity).toLocaleString()} {p.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {Number(p.actual_quantity).toLocaleString()} {p.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-semibold ${
                                  p.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {p.variance > 0 ? `+${p.variance}` : p.variance}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  p.achievement_percentage >= 100
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : p.achievement_percentage >= 75
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {p.achievement_percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Detailed Orders Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-2">
                    <Factory className="w-4 h-4 text-indigo-500" />
                    Production Orders Detailed Log
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search order or product..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                        <th className="px-5 py-3">Order No</th>
                        <th className="px-4 py-3">Product</th>
                        <th className="px-4 py-3">BOM</th>
                        <th className="px-4 py-3 text-right">Planned Qty</th>
                        <th className="px-4 py-3 text-right">Actual Qty</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3 text-right">Achievement</th>
                        <th className="px-4 py-3 text-center">Status</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prodSummaryData.rows
                        .filter(
                          (r) =>
                            !tableSearch ||
                            r.order_no.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.finished_product.name.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-bold font-mono text-indigo-600">{row.order_no}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{row.finished_product.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{row.finished_product.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-slate-600">{row.bom_name}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {Number(row.planned_quantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {Number(row.actual_quantity).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-bold ${
                                  row.variance >= 0 ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {row.variance > 0 ? `+${row.variance}` : row.variance}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  row.achievement_percentage >= 100
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.achievement_percentage >= 75
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {row.achievement_percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                  row.status === 'completed'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.status === 'in_progress'
                                    ? 'bg-amber-100 text-amber-800'
                                    : row.status === 'cancelled'
                                    ? 'bg-rose-100 text-rose-800'
                                    : 'bg-slate-100 text-slate-800'
                                }`}
                              >
                                {row.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-medium">
                              {row.completion_date || row.start_date || '-'}
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 2. FINISHED OUTPUT VS TARGET SUBTAB */}
          {/* ========================================================= */}
          {subTab === 'output-vs-target' && prodSummaryData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Total Target Output
                  </div>
                  <div className="text-3xl font-black text-slate-900">
                    {Number(prodSummaryData.summary.target_quantity).toLocaleString()} <span className="text-sm font-normal text-slate-500">units</span>
                  </div>
                  <p className="text-xs text-slate-500">Theoretical expected units across all production orders</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Actual Finished Output
                  </div>
                  <div className="text-3xl font-black text-emerald-600">
                    {Number(prodSummaryData.summary.completed_quantity).toLocaleString()} <span className="text-sm font-normal text-emerald-600">units</span>
                  </div>
                  <p className="text-xs text-slate-500">Good units manufactured and transferred to finished stock</p>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                    Overall Achievement Rate
                  </div>
                  <div className="text-3xl font-black text-indigo-600">
                    {prodSummaryData.summary.completion_percentage}%
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.min(prodSummaryData.summary.completion_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Output vs Target Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Target vs Actual Output Variance Analysis
                  </h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                        <th className="px-5 py-3">Production Order</th>
                        <th className="px-4 py-3">Finished Good</th>
                        <th className="px-4 py-3 text-right">Target Output</th>
                        <th className="px-4 py-3 text-right">Actual Output</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3 text-right">Achievement %</th>
                        <th className="px-4 py-3 text-center">Performance</th>
                        <th className="px-5 py-3 text-center">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {prodSummaryData.rows.map((row) => (
                        <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                          <td className="px-5 py-3 font-bold font-mono text-indigo-600">{row.order_no}</td>
                          <td className="px-4 py-3">
                            <div className="font-bold text-slate-900">{row.finished_product.name}</div>
                            <div className="text-[10px] text-slate-400">{row.finished_product.unit_name}</div>
                          </td>
                          <td className="px-4 py-3 text-right font-medium text-slate-700">
                            {Number(row.planned_quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold text-slate-900">
                            {Number(row.actual_quantity).toLocaleString()}
                          </td>
                          <td className="px-4 py-3 text-right font-bold">
                            <span
                              className={
                                row.variance === 0
                                  ? 'text-slate-700'
                                  : row.variance > 0
                                  ? 'text-emerald-600'
                                  : 'text-rose-600'
                              }
                            >
                              {row.variance > 0 ? `+${row.variance}` : row.variance}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <span className="font-bold text-slate-900">{row.achievement_percentage}%</span>
                          </td>
                          <td className="px-4 py-3 text-center">
                            {row.performance_status === 'over_production' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                <ArrowUpRight className="w-3 h-3" /> Over Target
                              </span>
                            )}
                            {row.performance_status === 'under_production' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-100 text-amber-800 text-[10px] font-bold">
                                <ArrowDownRight className="w-3 h-3" /> Under Target
                              </span>
                            )}
                            {row.performance_status === 'on_target' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 text-blue-800 text-[10px] font-bold">
                                <CheckCircle2 className="w-3 h-3" /> On Target
                              </span>
                            )}
                          </td>
                          <td className="px-5 py-3 text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                row.status === 'completed'
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {row.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 3. RAW MATERIAL CONSUMPTION SUBTAB */}
          {/* ========================================================= */}
          {subTab === 'raw-material-consumption' && consumptionData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Orders Consuming</span>
                    <Factory className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {consumptionData.summary.total_orders_count}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    {consumptionData.summary.total_materials_count} Material types consumed
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Paper Reams</span>
                    <Boxes className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-blue-600">
                    {Number(consumptionData.summary.paper_reams_consumed).toLocaleString()} <span className="text-xs font-normal text-slate-500">Reams</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    ~{Number(consumptionData.summary.paper_sheets_consumed).toLocaleString()} parent sheets
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Material Cost</span>
                    <DollarSign className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {formatCurrency(consumptionData.summary.total_materials_cost)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Actual consumed inventory value</div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Consumption Variance</span>
                    <Layers className="w-4 h-4 text-purple-500" />
                  </div>
                  <div
                    className={`text-2xl font-black ${
                      consumptionData.summary.total_variance_quantity > 0
                        ? 'text-amber-600'
                        : 'text-slate-900'
                    }`}
                  >
                    {consumptionData.summary.total_variance_quantity > 0
                      ? `+${consumptionData.summary.total_variance_quantity}`
                      : consumptionData.summary.total_variance_quantity}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">Actual vs planned quantity variance</div>
                </div>
              </div>

              {/* Material Grouping Summary */}
              {consumptionData.by_material && consumptionData.by_material.length > 0 && (
                <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                  <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                      Material Consumption Summary by Raw Item
                    </h3>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                          <th className="px-5 py-3">Raw Material</th>
                          <th className="px-4 py-3">SKU</th>
                          <th className="px-4 py-3 text-right">Orders Consumed In</th>
                          <th className="px-4 py-3 text-right">Planned Qty</th>
                          <th className="px-4 py-3 text-right">Consumed Qty</th>
                          <th className="px-4 py-3 text-right">Variance</th>
                          <th className="px-5 py-3 text-right">Total Cost</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {consumptionData.by_material.map((mat) => (
                          <tr key={mat.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-bold text-slate-900">{mat.name}</td>
                            <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">{mat.sku || '-'}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">{mat.orders_count}</td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {Number(mat.planned_quantity).toLocaleString()} {mat.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {Number(mat.consumed_quantity).toLocaleString()} {mat.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-semibold ${
                                  mat.variance > 0 ? 'text-amber-600' : 'text-slate-700'
                                }`}
                              >
                                {mat.variance > 0 ? `+${mat.variance}` : mat.variance}
                              </span>
                            </td>
                            <td className="px-5 py-3 text-right font-bold text-emerald-600">
                              {formatCurrency(mat.total_cost)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Consumption Items Detailed Log */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Detailed Raw Material Stock Issues Log
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search material or order..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                        <th className="px-5 py-3">Order No</th>
                        <th className="px-4 py-3">Finished Good</th>
                        <th className="px-4 py-3">Raw Material</th>
                        <th className="px-4 py-3 text-right">Planned Qty</th>
                        <th className="px-4 py-3 text-right">Actual Consumed</th>
                        <th className="px-4 py-3 text-right">Variance</th>
                        <th className="px-4 py-3 text-right">Unit Cost</th>
                        <th className="px-4 py-3 text-right">Total Cost</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {consumptionData.rows
                        .filter(
                          (r) =>
                            !tableSearch ||
                            r.order_no.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.raw_material.name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.finished_product.name.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((row) => (
                          <tr key={row.id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-bold font-mono text-indigo-600">{row.order_no}</td>
                            <td className="px-4 py-3 text-slate-700 font-medium">{row.finished_product.name}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{row.raw_material.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{row.raw_material.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {Number(row.planned_quantity).toLocaleString()} {row.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {Number(row.consumed_quantity).toLocaleString()} {row.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right font-bold">
                              <span
                                className={
                                  row.variance === 0
                                    ? 'text-slate-700'
                                    : row.variance > 0
                                    ? 'text-amber-600'
                                    : 'text-emerald-600'
                                }
                              >
                                {row.variance > 0 ? `+${row.variance}` : row.variance}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-right text-slate-600">
                              {formatCurrency(row.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {formatCurrency(row.total_cost)}
                            </td>
                            <td className="px-5 py-3 text-slate-500 font-medium">{row.date || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 4. PAPER CUTTING & WASTAGE SUBTAB */}
          {/* ========================================================= */}
          {subTab === 'manufacturing-wastage' && wastageData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Cutting Operations</span>
                    <Scissors className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {wastageData.summary.total_cutting_operations}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Input: {Number(wastageData.summary.total_input_quantity).toLocaleString()} Reams/Units
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Usable Output</span>
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {Number(wastageData.summary.total_usable_sheets).toLocaleString()} <span className="text-xs font-normal text-slate-500">Sheets</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Expected: {Number(wastageData.summary.total_expected_sheets).toLocaleString()}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Scrap / Wastage</span>
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  </div>
                  <div className="text-2xl font-black text-rose-600">
                    {Number(wastageData.summary.total_wastage_sheets).toLocaleString()} <span className="text-xs font-normal text-slate-500">Sheets</span>
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Est. Scrap Cost: {formatCurrency(wastageData.summary.total_scrap_cost)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Overall Wastage %</span>
                    <Percent className="w-4 h-4 text-purple-500" />
                  </div>
                  <div
                    className={`text-2xl font-black ${
                      wastageData.summary.overall_wastage_percentage > 10
                        ? 'text-rose-600'
                        : 'text-purple-600'
                    }`}
                  >
                    {wastageData.summary.overall_wastage_percentage}%
                  </div>
                  <div className="text-[11px] font-bold text-rose-600">
                    {wastageData.summary.high_wastage_count > 0 && (
                      <span>⚠️ {wastageData.summary.high_wastage_count} high-wastage runs (&gt;10%)</span>
                    )}
                  </div>
                </div>
              </div>

              {/* High Wastage Alert Banner if any */}
              {wastageData.summary.high_wastage_count > 0 && (
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-3 text-amber-900">
                  <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div className="text-xs space-y-1">
                    <p className="font-bold">Phase 6 High Wastage Threshold Alert (&gt;10%)</p>
                    <p className="text-amber-800">
                      There are {wastageData.summary.high_wastage_count} cutting runs exceeding the 10% acceptable wastage limit. Review machine calibration or paper handling logs below.
                    </p>
                  </div>
                </div>
              )}

              {/* Wastage Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Cutting & Wastage Log Details
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search order or operator..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                        <th className="px-5 py-3">Order No</th>
                        <th className="px-4 py-3">Raw Material Cut</th>
                        <th className="px-4 py-3 text-right">Input Qty</th>
                        <th className="px-4 py-3 text-right">Expected Sheets</th>
                        <th className="px-4 py-3 text-right">Usable Sheets</th>
                        <th className="px-4 py-3 text-right">Wastage Sheets</th>
                        <th className="px-4 py-3 text-right">Wastage %</th>
                        <th className="px-4 py-3 text-center">Warning (&gt;10%)</th>
                        <th className="px-4 py-3">Operator</th>
                        <th className="px-5 py-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {wastageData.rows
                        .filter(
                          (r) =>
                            !tableSearch ||
                            r.order_no.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.operator_name.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            (r.raw_material?.name || '').toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((row) => (
                          <tr
                            key={row.id}
                            className={`transition-colors ${
                              row.is_high_wastage ? 'bg-rose-50/40 hover:bg-rose-50/70' : 'hover:bg-slate-50/70'
                            }`}
                          >
                            <td className="px-5 py-3 font-bold font-mono text-indigo-600">{row.order_no}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{row.raw_material?.name || 'Paper Ream'}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{row.raw_material?.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {row.input_quantity} {row.raw_material?.unit_name || 'Reams'}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700">
                              {Number(row.expected_output_sheets).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {Number(row.actual_output_sheets).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-rose-600">
                              {Number(row.wastage_sheets).toLocaleString()}
                            </td>
                            <td className="px-4 py-3 text-right">
                              <span
                                className={`font-black ${
                                  row.is_high_wastage ? 'text-rose-600' : 'text-slate-900'
                                }`}
                              >
                                {row.wastage_percentage}%
                              </span>
                            </td>
                            <td className="px-4 py-3 text-center">
                              {row.is_high_wastage ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-100 text-rose-800 text-[10px] font-bold">
                                  ⚠️ High Wastage
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                                  Normal
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-slate-700 font-medium">{row.operator_name || '-'}</td>
                            <td className="px-5 py-3 text-slate-500 font-medium">{row.date || '-'}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* 5. MANUFACTURING COSTS & ECONOMICS SUBTAB */}
          {/* ========================================================= */}
          {subTab === 'manufacturing-costs' && costData && (
            <div className="space-y-6">
              {/* KPI Cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Mfg Cost</span>
                    <DollarSign className="w-4 h-4 text-indigo-500" />
                  </div>
                  <div className="text-2xl font-black text-slate-900">
                    {formatCurrency(costData.summary.total_manufacturing_cost)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Materials: {formatCurrency(costData.summary.total_material_cost)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Total Stage Costs</span>
                    <Layers className="w-4 h-4 text-blue-500" />
                  </div>
                  <div className="text-2xl font-black text-blue-600">
                    {formatCurrency(costData.summary.total_stage_costs)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Labor: {formatCurrency(costData.summary.total_labor_cost)} • Binding: {formatCurrency(costData.summary.total_binding_cost)}
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Avg Unit Mfg Cost</span>
                    <BarChart3 className="w-4 h-4 text-purple-500" />
                  </div>
                  <div className="text-2xl font-black text-purple-600">
                    {formatCurrency(costData.summary.average_unit_cost)}
                  </div>
                  <div className="text-[11px] text-slate-500 font-medium">
                    Across {Number(costData.summary.total_output_quantity).toLocaleString()} output units
                  </div>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-1">
                  <div className="flex items-center justify-between text-slate-500">
                    <span className="text-xs font-semibold uppercase tracking-wider">Manufacturing Margin</span>
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="text-2xl font-black text-emerald-600">
                    {costData.summary.manufacturing_margin_percentage}%
                  </div>
                  <div className="text-[11px] font-bold text-emerald-700">
                    Est. Profit: {formatCurrency(costData.summary.manufacturing_gross_profit)}
                  </div>
                </div>
              </div>

              {/* Cost Breakdown & Profitability Table */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
                <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                    Production Order Manufacturing Cost Breakdown & Economics
                  </h3>
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2" />
                    <input
                      type="text"
                      placeholder="Search order or product..."
                      value={tableSearch}
                      onChange={(e) => setTableSearch(e.target.value)}
                      className="pl-8 pr-3 py-1 border border-slate-300 rounded-lg text-xs font-medium text-slate-700 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 w-56"
                    />
                  </div>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50/50 text-slate-500 font-semibold">
                        <th className="px-5 py-3">Order No</th>
                        <th className="px-4 py-3">Finished Good</th>
                        <th className="px-4 py-3 text-right">Output Qty</th>
                        <th className="px-4 py-3 text-right">Material Cost</th>
                        <th className="px-4 py-3 text-right">Stage Costs</th>
                        <th className="px-4 py-3 text-right">Total Mfg Cost</th>
                        <th className="px-4 py-3 text-right">Unit Mfg Cost</th>
                        <th className="px-4 py-3 text-right">Selling Value</th>
                        <th className="px-4 py-3 text-right">Gross Profit</th>
                        <th className="px-5 py-3 text-right">Margin %</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {costData.rows
                        .filter(
                          (r) =>
                            !tableSearch ||
                            r.order_no.toLowerCase().includes(tableSearch.toLowerCase()) ||
                            r.finished_product.name.toLowerCase().includes(tableSearch.toLowerCase())
                        )
                        .map((row) => (
                          <tr key={row.production_order_id} className="hover:bg-slate-50/70 transition-colors">
                            <td className="px-5 py-3 font-bold font-mono text-indigo-600">{row.order_no}</td>
                            <td className="px-4 py-3">
                              <div className="font-bold text-slate-900">{row.finished_product.name}</div>
                              <div className="text-[10px] text-slate-400 font-mono">{row.finished_product.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900">
                              {Number(row.output_quantity).toLocaleString()} {row.finished_product.unit_name}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(row.material_cost)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(row.stage_cost)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-indigo-900">
                              {formatCurrency(row.total_cost)}
                            </td>
                            <td className="px-4 py-3 text-right font-black text-purple-700 bg-purple-50/50">
                              {formatCurrency(row.unit_cost)}
                            </td>
                            <td className="px-4 py-3 text-right text-slate-700">
                              {formatCurrency(row.sales_value)}
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-emerald-600">
                              {formatCurrency(row.gross_profit)}
                            </td>
                            <td className="px-5 py-3 text-right">
                              <span
                                className={`inline-flex items-center px-2 py-0.5 rounded text-[11px] font-bold ${
                                  row.margin_percentage >= 30
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : row.margin_percentage > 0
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-rose-100 text-rose-800'
                                }`}
                              >
                                {row.margin_percentage}%
                              </span>
                            </td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
