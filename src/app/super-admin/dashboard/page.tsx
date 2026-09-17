'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { superAdminDashboardService } from '@/lib/superAdminDashboardService';
import { SuperAdminDashboardData } from '@/types/superAdminDashboard';
import {
  Users,
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
  Calendar,
  Building2,
  Lock,
  ArrowUpRight,
  ChevronRight,
  Activity,
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

  // Format currency
  const formatCurrency = (amount: number, currency = 'PKR') => {
    return `${currency} ${amount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  // Format compact number
  const formatCompact = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      notation: 'compact',
      compactDisplay: 'short',
    }).format(amount);
  };

  // Loading Skeleton State
  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Header Skeleton */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-slate-900/50 p-6 rounded-2xl border border-slate-800">
          <div className="space-y-2">
            <div className="h-7 w-64 bg-slate-800 rounded-lg" />
            <div className="h-4 w-96 bg-slate-800/60 rounded-md" />
          </div>
          <div className="h-10 w-48 bg-slate-800 rounded-xl" />
        </div>

        {/* Top KPIs Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-36 bg-slate-900/50 border border-slate-800 rounded-2xl p-5 space-y-3">
              <div className="h-4 w-24 bg-slate-800 rounded" />
              <div className="h-8 w-20 bg-slate-800 rounded-lg" />
              <div className="h-3 w-32 bg-slate-800/60 rounded" />
            </div>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-96 bg-slate-900/50 border border-slate-800 rounded-2xl p-6" />
          <div className="h-96 bg-slate-900/50 border border-slate-800 rounded-2xl p-6" />
        </div>
      </div>
    );
  }

  // Error State with Retry
  if (error && !data) {
    return (
      <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-8 text-center max-w-xl mx-auto my-12 space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center mx-auto">
          <AlertOctagon className="w-6 h-6" />
        </div>
        <h3 className="text-lg font-bold text-white">Analytics Unavailable</h3>
        <p className="text-slate-400 text-sm">{error}</p>
        <button
          onClick={() => fetchDashboardData(range)}
          type="button"
          className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-medium text-sm transition-all shadow-lg cursor-pointer"
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
  const paddingX = 40;
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
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SaaS Platform Health Analytics
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live Telemetry
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Real-time platform orchestration, tenant lifecycle distributions, and ARR analytics.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-[11px] text-slate-400 hidden lg:flex items-center gap-1.5 bg-slate-800/40 px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-3.5 h-3.5 text-indigo-400" />
            <span>Updated {new Date(data!.generated_at).toLocaleTimeString()}</span>
          </div>

          <button
            onClick={handleManualRefresh}
            disabled={refreshing}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700/90 text-slate-200 border border-slate-700/70 text-xs font-medium flex items-center gap-2 transition-all hover:border-slate-600 disabled:opacity-50 cursor-pointer shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-indigo-400 ${refreshing ? 'animate-spin' : ''}`} />
            <span>{refreshing ? 'Syncing...' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* 2. Top Metric Cards (Tenants, Licenses, MRR, ARR) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Tenant Lifecycle Overview */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-indigo-500/10 rounded-full blur-2xl group-hover:bg-indigo-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Tenants</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{tenants.total}</span>
            <span className="text-xs font-medium text-emerald-400 flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Active
            </span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="bg-emerald-500/10 rounded-lg py-1 border border-emerald-500/20">
              <span className="block font-bold text-emerald-400">{tenants.active}</span>
              <span className="text-[10px] text-slate-400">Active</span>
            </div>
            <div className="bg-amber-500/10 rounded-lg py-1 border border-amber-500/20">
              <span className="block font-bold text-amber-400">{tenants.trial}</span>
              <span className="text-[10px] text-slate-400">Trial</span>
            </div>
            <div className="bg-red-500/10 rounded-lg py-1 border border-red-500/20">
              <span className="block font-bold text-red-400">{tenants.suspended}</span>
              <span className="text-[10px] text-slate-400">Suspended</span>
            </div>
          </div>
        </div>

        {/* Card 2: Licenses Status */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/10 rounded-full blur-2xl group-hover:bg-emerald-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Licenses</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
              <ShieldCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white tracking-tight">{licenses.active}</span>
            <span className="text-xs text-slate-400">/ {licenses.total} issued</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-center text-xs">
            <div
              className={`rounded-lg py-1 border ${
                licenses.expiring_soon > 0
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300 animate-pulse'
                  : 'bg-slate-800/60 border-slate-700/60 text-slate-300'
              }`}
            >
              <span className="block font-bold">{licenses.expiring_soon}</span>
              <span className="text-[10px]">Expiring &le;14d</span>
            </div>
            <div className="bg-rose-500/10 rounded-lg py-1 border border-rose-500/20 text-rose-400">
              <span className="block font-bold">{licenses.expired}</span>
              <span className="text-[10px] text-slate-400">Expired</span>
            </div>
          </div>
        </div>

        {/* Card 3: Monthly Recurring Revenue (MRR) */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Monthly Revenue (MRR)</span>
            <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatCompact(revenue.monthly_mrr)}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">{revenue.currency}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>{revenue.paying_tenants_count} Active subscriptions</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
              Recurring
            </span>
          </div>
        </div>

        {/* Card 4: Projected Annual Revenue (ARR) */}
        <div className="bg-slate-900/70 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-lg relative overflow-hidden transition-all group">
          <div className="absolute top-0 right-0 w-28 h-28 bg-violet-500/10 rounded-full blur-2xl group-hover:bg-violet-500/20 transition-all pointer-events-none" />
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Projected Annual (ARR)</span>
            <div className="p-2 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              {formatCompact(revenue.projected_annual_arr)}
            </span>
            <span className="text-xs text-slate-400 ml-1.5">{revenue.currency}</span>
          </div>
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs text-slate-400">
            <span>MRR &times; 12 mo projection</span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20">
              Annual
            </span>
          </div>
        </div>
      </div>

      {/* 3. Middle Row: Tenant Growth Chart & Module Adoption */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Tenant Growth Chart (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-indigo-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Tenant Growth Over Time</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Cumulative active platform organizations based on tenant creation dates.
              </p>
            </div>

            {/* Time Range Pills */}
            <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
              {TIME_RANGES.map((r) => (
                <button
                  key={r.key}
                  type="button"
                  onClick={() => handleRangeChange(r.key)}
                  className={`px-2.5 py-1 rounded-lg font-medium transition-all cursor-pointer ${
                    range === r.key
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                      : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
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
              <div className="text-center text-slate-500 text-xs">No registration data recorded in this period.</div>
            ) : (
              <div className="w-full h-full relative">
                <svg
                  viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                  className="w-full h-full overflow-visible"
                  preserveAspectRatio="none"
                >
                  <defs>
                    <linearGradient id="growthGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366F1" stopOpacity="0.35" />
                      <stop offset="100%" stopColor="#6366F1" stopOpacity="0.0" />
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
                          stroke="#1E293B"
                          strokeDasharray="4 4"
                          strokeWidth="1"
                        />
                        <text
                          x={paddingX - 10}
                          y={y + 4}
                          fill="#64748B"
                          fontSize="10"
                          textAnchor="end"
                        >
                          {val}
                        </text>
                      </g>
                    );
                  })}

                  {/* Gradient Area Fill */}
                  <path d={areaD} fill="url(#growthGradient)" />

                  {/* Smooth Line Curve */}
                  <path
                    d={pathD}
                    fill="none"
                    stroke="#818CF8"
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
                            ? 'fill-indigo-400 stroke-white stroke-2'
                            : 'fill-slate-900 stroke-indigo-400 stroke-2'
                        }`}
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      />
                      {/* Invisible hit area */}
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={12}
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
                    className="absolute z-20 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2 bg-slate-900/95 border border-indigo-500/40 backdrop-blur-md rounded-xl px-3 py-2 text-xs shadow-2xl text-white"
                    style={{
                      left: `${(hoveredPoint.x / chartWidth) * 100}%`,
                      top: `${(hoveredPoint.y / chartHeight) * 100}%`,
                    }}
                  >
                    <div className="font-bold text-indigo-300">{hoveredPoint.label}</div>
                    <div className="flex items-center justify-between gap-3 text-[11px] mt-1 text-slate-300">
                      <span>Total: <strong className="text-white">{hoveredPoint.total_tenants}</strong></span>
                      <span>New: <strong className="text-emerald-400">+{hoveredPoint.new_tenants}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="flex items-center justify-between text-[11px] text-slate-400 border-t border-slate-800/80 pt-3 mt-4">
            <span>Range: {TIME_RANGES.find((r) => r.key === range)?.label}</span>
            <span>Total Baseline: {tenant_growth[0]?.total_tenants || 0} &rarr; Current: {tenants.total}</span>
          </div>
        </div>

        {/* Right Column: Module Adoption Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <Boxes className="w-4 h-4 text-cyan-400" />
                <h2 className="text-base font-bold text-white tracking-tight">Module Adoption</h2>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Effective adoption computed from active packages &plus; tenant overrides.
              </p>
            </div>
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              {module_adoption.length} Modules
            </span>
          </div>

          {/* Module List with Progress Bars */}
          <div className="mt-4 space-y-3.5 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {module_adoption.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">No active modules found.</div>
            ) : (
              module_adoption.map((mod) => (
                <div key={mod.id} className="space-y-1.5 group">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-slate-200 group-hover:text-white transition-colors">
                        {mod.name}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">({mod.code})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-slate-400">
                        {mod.tenants_count} / {mod.total_active_tenants} tenants
                      </span>
                      <span className="text-xs font-bold text-cyan-400 w-12 text-right">
                        {mod.adoption_percentage}%
                      </span>
                    </div>
                  </div>

                  {/* Horizontal Bar */}
                  <div className="w-full h-2 bg-slate-800/80 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-cyan-500 to-indigo-500 rounded-full transition-all duration-500"
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
        <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Platform System Alerts</h2>
            </div>
            <span
              className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${
                alerts.length === 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
              }`}
            >
              {alerts.length === 0 ? 'All Clear' : `${alerts.length} Active`}
            </span>
          </div>

          <div className="mt-4 space-y-3">
            {alerts.length === 0 ? (
              <div className="p-6 rounded-xl bg-slate-950/60 border border-slate-800/60 text-center space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
                <h4 className="text-xs font-bold text-slate-200">No Critical Platform Issues</h4>
                <p className="text-[11px] text-slate-400">
                  All tenant licenses, backups, and subscriptions are operating within normal parameters.
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
                        ? 'bg-red-500/10 border-red-500/30 text-red-200'
                        : isWarning
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-200'
                    }`}
                  >
                    <div className="mt-0.5">
                      {isCritical ? (
                        <AlertOctagon className="w-5 h-5 text-red-400" />
                      ) : isWarning ? (
                        <AlertTriangle className="w-5 h-5 text-amber-400" />
                      ) : (
                        <Info className="w-5 h-5 text-blue-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-xs">{alert.title}</span>
                        <span
                          className={`text-[9px] uppercase font-extrabold px-1.5 py-0.5 rounded ${
                            isCritical
                              ? 'bg-red-500/20 text-red-300'
                              : isWarning
                              ? 'bg-amber-500/20 text-amber-300'
                              : 'bg-blue-500/20 text-blue-300'
                          }`}
                        >
                          {alert.severity}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300 mt-1">{alert.message}</p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right: Recent Activity / Audit Trail (6 cols) */}
        <div className="lg:col-span-6 bg-slate-900/70 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-4">
            <div className="flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-400" />
              <h2 className="text-base font-bold text-white tracking-tight">Recent Platform Events</h2>
            </div>
            <span className="text-xs text-slate-400">Audit Trail</span>
          </div>

          <div className="mt-4 space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
            {recent_activity.length === 0 ? (
              <div className="text-center text-slate-500 text-xs py-8">No recent events recorded.</div>
            ) : (
              recent_activity.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/60 flex items-start justify-between gap-3 text-xs hover:border-slate-700 transition-all"
                >
                  <div className="space-y-0.5 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-slate-200">{item.tenant_name}</span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {item.event_type}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 truncate">{item.description}</p>
                  </div>

                  <span className="text-[10px] text-slate-400 whitespace-nowrap">
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
