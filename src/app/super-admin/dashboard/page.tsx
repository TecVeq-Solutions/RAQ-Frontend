'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminDashboardService } from '@/lib/superAdminDashboardService';
import { SuperAdminDashboardData } from '@/types/superAdminDashboard';
import {
  ShieldCheck,
  CreditCard,
  AlertTriangle,
  TrendingUp,
  Boxes,
  RefreshCw,
  AlertOctagon,
  Info,
  Clock,
  CheckCircle2,
  Building2,
  ArrowUpRight,
  Activity,
  Sparkles,
  Zap,
  Layers,
} from 'lucide-react';

const TIME_RANGES = [
  { key: '7_days', label: '7 Days' },
  { key: '30_days', label: '30 Days' },
  { key: '90_days', label: '90 Days' },
  { key: '6_months', label: '6 Months' },
  { key: '1_year', label: '1 Year' },
];

export default function SuperAdminDashboardPage() {
  const [data, setData] = useState<SuperAdminDashboardData | null>(null);
  const [range, setRange] = useState<string>('30_days');
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<{
    x: number;
    y: number;
    date: string;
    label: string;
    new_tenants: number;
    total_tenants: number;
  } | null>(null);

  const fetchDashboardData = useCallback(async (selectedRange: string, isManualRefresh = false) => {
    if (isManualRefresh) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);

    try {
      const response = await superAdminDashboardService.getDashboardData(selectedRange);
      setData(response);
    } catch (err: any) {
      setError(
        err.response?.data?.message ||
          'Failed to load platform analytics. Please check network connection and try again.'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData(range);
  }, [range, fetchDashboardData]);

  const handleRangeChange = (newRange: string) => {
    if (newRange === range) return;
    setRange(newRange);
  };

  const handleManualRefresh = () => {
    fetchDashboardData(range, true);
  };

  // Format compact number
  const formatCompact = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
      maximumFractionDigits: 1,
    }).format(amount);
  };

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200/90 shadow-xs">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-200 rounded-lg" />
            <div className="h-4 w-96 max-w-full bg-slate-100 rounded-md" />
          </div>
          <div className="h-10 w-48 bg-slate-200 rounded-xl" />
        </div>

        {/* Top KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-40 bg-white border border-slate-200/90 rounded-2xl p-5 space-y-3 shadow-xs">
              <div className="flex justify-between items-center">
                <div className="h-4 w-24 bg-slate-200 rounded" />
                <div className="h-8 w-8 bg-slate-100 rounded-xl" />
              </div>
              <div className="h-8 w-24 bg-slate-200 rounded-lg mt-2" />
              <div className="h-8 w-full bg-slate-100 rounded-lg mt-4" />
            </div>
          ))}
        </div>

        {/* Middle Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 h-96 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs" />
          <div className="lg:col-span-5 h-96 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs" />
        </div>

        {/* Bottom Row Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-6 h-80 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs" />
          <div className="lg:col-span-6 h-80 bg-white border border-slate-200/90 rounded-2xl p-6 shadow-xs" />
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error && !data) {
    return (
      <div className="bg-white border border-red-200 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 space-y-4 shadow-sm">
        <div className="w-14 h-14 rounded-2xl bg-red-50 text-red-600 flex items-center justify-center mx-auto border border-red-100">
          <AlertOctagon className="w-7 h-7" />
        </div>
        <h3 className="text-lg font-bold text-slate-900">Platform Analytics Unavailable</h3>
        <p className="text-slate-500 text-sm leading-relaxed">{error}</p>
        <button
          onClick={() => fetchDashboardData(range)}
          type="button"
          className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm transition-all shadow-xs cursor-pointer"
        >
          Retry Connection
        </button>
      </div>
    );
  }

  const { tenants, licenses, revenue, alerts, tenant_growth, module_adoption, recent_activity } = data!;

  // Prepare SVG chart coordinates for Tenant Growth
  const chartHeight = 240;
  const chartWidth = 700;
  const paddingX = 45;
  const paddingY = 30;

  const maxTenants = Math.max(...tenant_growth.map((p) => p.total_tenants), 5);
  const minTenants = Math.min(...tenant_growth.map((p) => p.total_tenants), 0);
  const rangeY = maxTenants - minTenants || 1;

  const points = tenant_growth.map((point, index) => {
    const x =
      paddingX +
      (index / (tenant_growth.length - 1 || 1)) * (chartWidth - paddingX * 2);
    const y =
      chartHeight -
      paddingY -
      ((point.total_tenants - minTenants) / rangeY) * (chartHeight - paddingY * 2);
    return { ...point, x, y };
  });

  const pathD = points.reduce((acc, point, index) => {
    return `${acc} ${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`;
  }, '');

  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${chartHeight - paddingY} L ${points[0].x} ${
          chartHeight - paddingY
        } Z`
      : '';

  return (
    <div className="space-y-6 sm:space-y-8 font-sans">
      {/* 1. Header Banner & Quick Controls */}
      <div className="relative overflow-hidden rounded-2xl bg-white border border-slate-200/90 p-5 sm:p-7 shadow-xs">
        <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-5">
          <div className="space-y-1.5">
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700">
                <Sparkles className="w-4 h-4" />
              </div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                Platform Intelligence & Overview
              </h1>
              <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold shadow-xs">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Telemetry
              </span>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 max-w-2xl leading-relaxed">
              Real-time multi-tenant SaaS orchestration, subscription lifecycle distribution, and financial ARR metrics.
            </p>
          </div>

          {/* Action Toolbar */}
          <div className="flex items-center gap-2.5 sm:gap-3 w-full md:w-auto justify-between md:justify-end shrink-0">
            <div className="text-[11px] text-slate-600 hidden sm:flex items-center gap-1.5 bg-slate-50 px-3.5 py-2 rounded-xl border border-slate-200 shadow-inner">
              <Clock className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-mono font-medium">Sync: {new Date(data!.generated_at).toLocaleTimeString()}</span>
            </div>

            <button
              onClick={handleManualRefresh}
              disabled={refreshing}
              type="button"
              className="px-4 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-all disabled:opacity-50 cursor-pointer shadow-xs hover:border-slate-400"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`} />
              <span>{refreshing ? 'Syncing...' : 'Refresh Metrics'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Top Metric Cards (Tenants, Licenses, MRR, ARR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        {/* Card 1: Tenant Lifecycle Overview */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Total Tenants</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {tenants.total}
            </span>
            <span className="text-xs font-bold text-emerald-600 flex items-center gap-0.5">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-50 rounded-lg py-1.5 px-1 border border-emerald-200">
              <span className="block font-bold text-emerald-800 font-mono text-xs sm:text-sm">{tenants.active}</span>
              <span className="text-[10px] text-emerald-700 font-semibold">Active</span>
            </div>
            <div className="bg-amber-50 rounded-lg py-1.5 px-1 border border-amber-200">
              <span className="block font-bold text-amber-800 font-mono text-xs sm:text-sm">{tenants.trial}</span>
              <span className="text-[10px] text-amber-700 font-semibold">Trial</span>
            </div>
            <div className="bg-red-50 rounded-lg py-1.5 px-1 border border-red-200">
              <span className="block font-bold text-red-800 font-mono text-xs sm:text-sm">{tenants.suspended}</span>
              <span className="text-[10px] text-red-700 font-semibold">Suspended</span>
            </div>
          </div>
        </div>

        {/* Card 2: Licenses Status */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Active Licenses</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100 shadow-xs">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl sm:text-4xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {licenses.active}
            </span>
            <span className="text-xs font-medium text-slate-500">/ {licenses.total} issued</span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 grid grid-cols-2 gap-2 text-center text-xs">
            <div
              className={`rounded-lg py-1.5 px-2 border transition-all ${
                licenses.expiring_soon > 0
                  ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold animate-pulse'
                  : 'bg-slate-50 border-slate-200 text-slate-700'
              }`}
            >
              <span className="block font-bold font-mono text-xs sm:text-sm">{licenses.expiring_soon}</span>
              <span className="text-[10px] font-semibold">Expiring &le;14d</span>
            </div>
            <div className="bg-red-50 rounded-lg py-1.5 px-2 border border-red-200 text-red-800">
              <span className="block font-bold font-mono text-xs sm:text-sm">{licenses.expired}</span>
              <span className="text-[10px] text-red-700 font-semibold">Expired</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Recurring Revenue (MRR) */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Monthly Revenue (MRR)</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-100 shadow-xs">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCompact(revenue.monthly_mrr)}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">{revenue.currency}</span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-semibold text-slate-600">{revenue.paying_tenants_count} Paid Accounts</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200">
              Monthly
            </span>
          </div>
        </div>

        {/* Card 4: Projected Annual Revenue (ARR) */}
        <div className="bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl p-5 sm:p-6 shadow-xs relative overflow-hidden transition-all duration-200 hover:-translate-y-0.5 group">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Annual Run Rate (ARR)</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-700 border border-purple-100 shadow-xs">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-1.5">
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono tracking-tight tabular-nums">
              {formatCompact(revenue.projected_annual_arr)}
            </span>
            <span className="text-xs font-bold text-slate-500 uppercase">{revenue.currency}</span>
          </div>
          <div className="mt-4 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span className="text-[11px] font-semibold text-slate-600">MRR &times; 12 Forecast</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200">
              Annualized
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Tenant Growth Chart & Module Adoption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tenant Growth Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Tenant Growth Trajectory</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cumulative platform organizations based on signup telemetry.
              </p>
            </div>

            {/* Time Range Segmented Pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-100 border border-slate-200 text-xs">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRangeChange(r.key)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                    range === r.key
                      ? 'bg-emerald-600 text-white shadow-xs font-bold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive SVG Chart Canvas */}
          <div className="relative mt-6 w-full h-[260px] flex items-center justify-center">
            {tenant_growth.length === 0 ? (
              <div className="text-center text-slate-400 text-xs">No registration telemetry recorded in this period.</div>
            ) : (
              <div className="w-full h-full relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="growthGradientEmerald" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#16A34A" stopOpacity="0.25" />
                      <stop offset="60%" stopColor="#16A34A" stopOpacity="0.08" />
                      <stop offset="100%" stopColor="#16A34A" stopOpacity="0.0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines */}
                  {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
                    const y = paddingY + ratio * (chartHeight - paddingY * 2);
                    const val = Math.round(maxTenants - ratio * rangeY);
                    return (
                      <g key={idx}>
                        <line
                          x1={paddingX}
                          y1={y}
                          x2={chartWidth - paddingX}
                          y2={y}
                          stroke="#E2E8F0"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 3.5}
                          fill="#64748B"
                          fontSize="10"
                          fontFamily="monospace"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area Fill */}
                  <path d={areaD} fill="url(#growthGradientEmerald)" />

                  {/* Smooth Line Curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#16A34A"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />

                  {/* Data Points and Interactivity */}
                  {points.map((pt, idx) => (
                    <g key={idx} className="cursor-pointer">
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={hoveredPoint?.date === pt.date ? 6 : 3.5}
                        className={`transition-all duration-150 ${
                          hoveredPoint?.date === pt.date
                            ? 'fill-emerald-600 stroke-white stroke-2 shadow-md'
                            : 'fill-white stroke-emerald-600 stroke-2'
                        }`}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Hit area */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={14}
                        fill="transparent"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                    </g>
                  ))}
                </svg>

                {/* Floating Tooltip */}
                {hoveredPoint && (
                  <div
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-white border border-slate-200 backdrop-blur-md rounded-xl px-3.5 py-2 text-xs shadow-xl text-slate-900"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                    }}
                  >
                    <div className="font-bold text-slate-900">{hoveredPoint.label}</div>
                    <div className="flex items-center justify-between gap-3 text-[11px] mt-1 text-slate-600">
                      <span>Total: <strong className="text-slate-900 font-mono">{hoveredPoint.total_tenants}</strong></span>
                      <span>New: <strong className="text-emerald-700 font-mono font-bold">+{hoveredPoint.new_tenants}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-500 border-t border-slate-100 pt-3 mt-4">
            <span>Range: <strong className="text-slate-700">{TIME_RANGES.find((r) => r.key === range)?.label}</strong></span>
            <span>Baseline: <strong className="text-slate-800 font-mono">{tenant_growth[0]?.total_tenants || 0}</strong> &rarr; Current: <strong className="text-emerald-700 font-mono font-bold">{tenants.total}</strong></span>
          </div>
        </div>

        {/* Right Column: Module Adoption Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                  <Boxes className="w-4 h-4" />
                </div>
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Module Adoption</h2>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Computed from packages &plus; tenant overrides.
              </p>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              {module_adoption.length} Modules
            </span>
          </div>

          {/* Module List with Progress Bars */}
          <div className="mt-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {module_adoption.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">No active modules found.</div>
            ) : (
              module_adoption.map((mod) => (
                <div key={mod.id} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-800 group-hover:text-emerald-700 transition-colors">
                        {mod.name}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono bg-slate-100 px-1.5 py-0.2 rounded border border-slate-200">
                        {mod.code}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-500 font-mono">
                        {mod.tenants_count}/{mod.total_active_tenants}
                      </span>
                      <span className="text-xs font-bold text-emerald-700 font-mono w-12 text-right">
                        {mod.adoption_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden border border-slate-200">
                    <div
                      className="h-full bg-gradient-to-r from-emerald-500 to-teal-600 rounded-full transition-all duration-500 shadow-xs"
                      style={{ width: `${Math.min(mod.adoption_percentage, 100)}%` }}
                    />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* 4. Bottom Row: System Alerts & Recent Platform Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: System Alerts (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-amber-50 text-amber-700 border border-amber-100">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Platform System Alerts</h2>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                alerts.length === 0
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-800 border-amber-200'
              }`}
            >
              {alerts.length === 0 ? 'All Systems Clear' : `${alerts.length} Active Alerts`}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="p-6 rounded-xl bg-emerald-50/50 border border-emerald-100 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <h4 className="text-xs font-bold text-slate-900">No Critical Platform Issues</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-sm mx-auto">
                  All tenant licenses, automated backups, and subscription quotas are operating within normal parameters.
                </p>
              </div>
            ) : (
              alerts.map((alert) => {
                const isCritical = alert.severity === 'critical';
                const isWarning = alert.severity === 'warning';

                return (
                  <div
                    key={alert.id}
                    className={`p-4 rounded-xl border flex items-start gap-3 transition-all ${
                      isCritical
                        ? 'bg-red-50 border-red-200 text-red-900 shadow-xs'
                        : isWarning
                        ? 'bg-amber-50 border-amber-200 text-amber-900 shadow-xs'
                        : 'bg-blue-50 border-blue-200 text-blue-900 shadow-xs'
                    }`}
                  >
                    <div className="mt-0.5 shrink-0">
                      {isCritical ? (
                        <AlertOctagon className="w-5 h-5 text-red-600" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-amber-600" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-600" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs">{alert.title}</span>
                        <span
                          className={`text-[9px] uppercase font-black px-2 py-0.5 rounded ${
                            isCritical
                              ? 'bg-red-100 text-red-800 border border-red-200'
                              : isWarning
                              ? 'bg-amber-100 text-amber-800 border border-amber-200'
                              : 'bg-blue-100 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-700 mt-1 leading-relaxed">{alert.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Activity / Audit Trail (6 cols) */}
        <div className="lg:col-span-6 bg-white border border-slate-200/90 rounded-2xl p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-100">
                <Activity className="w-4 h-4" />
              </div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Recent Platform Events</h2>
            </div>
            <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
              Audit Trail
            </span>
          </div>

          <div className="mt-4 space-y-2.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {recent_activity.length === 0 ? (
              <div className="text-center text-slate-400 text-xs py-8">No recent events recorded.</div>
            ) : (
              recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start justify-between gap-3 text-xs hover:border-slate-300 transition-all group"
                >
                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-bold text-slate-900 group-hover:text-emerald-700 transition-colors">
                        {item.tenant_name}
                      </span>
                      <span className="text-[10px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-100 text-emerald-800 border border-emerald-200">
                        {item.event_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-600 truncate">{item.description}</p>
                  </div>

                  <span className="text-[10px] font-mono text-slate-400 shrink-0">
                    {item.created_at ? new Date(item.created_at).toLocaleDateString() : ''}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
