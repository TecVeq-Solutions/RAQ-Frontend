'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { User, Role } from '@/types/auth';
import apiClient from '@/lib/api';
import {
  TrendingUp,
  Boxes,
  Users,
  AlertTriangle,
  Receipt,
  ShieldCheck,
  Briefcase,
  Eye,
  ArrowUpRight,
  Sparkles,
  DollarSign,
  Building2,
  CreditCard,
  FileSpreadsheet,
  Plus,
  ArrowRight,
  TrendingDown,
  Clock,
  CheckCircle2,
  BarChart3,
  Calendar,
  Activity,
  Factory,
  Layers,
  ShieldAlert,
  Percent,
  ChevronRight,
  PieChart,
} from 'lucide-react';

import StaffDashboard from '@/components/dashboard/StaffDashboard';
import { TenantPackageSummary } from '@/components/tenant/TenantPackageSummary';
import { DueAlertsData } from '@/types/ledger';
import { formatInvoiceNumber } from '@/lib/formatters';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

interface RecentSale {
  id: number;
  invoice_no: string;
  sale_date: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  customer?: { name: string };
}

interface RecentPurchase {
  id: number;
  purchase_no: string;
  purchase_date: string;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  supplier?: { name: string };
}

interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  alert_quantity: number;
  unit?: { name: string; short_name: string };
}

interface ChartItem {
  month: string;
  sales: number;
  purchases: number;
}

interface DashboardStats {
  role: Role;
  total_sales: number | null;
  total_purchases: number | null;
  stock_items: number;
  low_stock_alerts: number;
  active_customers: number | null;
  active_suppliers: number | null;
  monthly_revenue: number | null;
  customer_outstanding: number | null;
  supplier_outstanding: number | null;
  today_gross_profit: number | null;
  today_net_profit: number | null;
  today_cogs?: number | null;
  today_profit: number | null;
  monthly_gross_profit: number | null;
  monthly_net_profit: number | null;
  monthly_cogs?: number | null;
  monthly_profit: number | null;
  raw_material_stock_value: number | null;
  finished_goods_stock_value: number | null;
  today_production_quantity: number | null;
  today_due_receivables: number;
  today_due_payables: number;
  overdue_receivables: number;
  overdue_payables: number;
  overdue_receivables_count: number;
  overdue_payables_count: number;
  today_sales?: number;
  today_sales_count?: number;
  today_transactions_count?: number;
  today_payments_received?: number;
  today_payments_count?: number;
  recent_sales: RecentSale[];
  recent_purchases: RecentPurchase[];
  low_stock_products: LowStockItem[];
  sales_vs_purchases_chart: ChartItem[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [dueAlerts, setDueAlerts] = useState<DueAlertsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUserFromCookie();
    setUser(currentUser);

    Promise.all([
      apiClient.get<{ success: boolean; data: DashboardStats }>('/dashboard/stats'),
      apiClient.get<{ success: boolean; data: DueAlertsData }>('/dashboard/due-alerts'),
    ])
      .then(([statsRes, alertsRes]) => {
        if (statsRes.data?.success) {
          setStats(statsRes.data.data);
        }
        if (alertsRes.data?.success) {
          setDueAlerts(alertsRes.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats / due alerts:', err);
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const formatCurrency = (val: number | null | undefined) => {
    if (val === null || val === undefined) return 'Rs. 0.00';
    return `Rs. ${Number(val).toLocaleString('en-PK', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  if (loading) {
    return <DashboardSkeleton />;
  }

  // Dedicated Staff Dashboard branch
  if (user?.role === 'staff') {
    return (
      <StaffDashboard
        user={user}
        stats={
          stats
            ? {
                today_sales: stats.today_sales ?? 0,
                today_sales_count: stats.today_sales_count ?? 0,
                today_transactions_count: stats.today_transactions_count ?? 0,
                today_payments_received: stats.today_payments_received ?? 0,
                today_payments_count: stats.today_payments_count ?? 0,
                stock_items: stats.stock_items ?? 0,
                low_stock_alerts: stats.low_stock_alerts ?? 0,
                low_stock_products: stats.low_stock_products ?? [],
                recent_sales: stats.recent_sales ?? [],
                today_gross_profit: stats.today_gross_profit ?? null,
                today_net_profit: stats.today_net_profit ?? null,
                monthly_gross_profit: stats.monthly_gross_profit ?? null,
                monthly_net_profit: stats.monthly_net_profit ?? null,
              }
            : null
        }
        formatCurrency={formatCurrency}
      />
    );
  }

  const getRoleHeaderDetails = (role?: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'Executive Management',
          desc: 'Executive 360° overview: Manufacturing throughput, Stock valuation, True Net Profit, and Due financial obligations.',
          icon: ShieldCheck,
          badgeColor: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
        };
      case 'staff':
        return {
          title: 'Staff Member',
          desc: 'Point-of-Sale entries, Purchase Order requisitions, Inventory updates, and Payments.',
          icon: Briefcase,
          badgeColor: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
        };
      case 'viewer':
      default:
        return {
          title: 'Viewer Account',
          desc: 'Read-only access to view live stock catalog and high-level financial summary reports.',
          icon: Eye,
          badgeColor: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
        };
    }
  };

  const roleInfo = getRoleHeaderDetails(user?.role);
  const RoleIcon = roleInfo.icon;

  // Inventory distribution calculation
  const rawStockVal = stats?.raw_material_stock_value ?? 0;
  const fgStockVal = stats?.finished_goods_stock_value ?? 0;
  const totalInvVal = rawStockVal + fgStockVal;
  const rawRatio = totalInvVal > 0 ? (rawStockVal / totalInvVal) * 100 : 50;
  const fgRatio = totalInvVal > 0 ? (fgStockVal / totalInvVal) * 100 : 50;

  // Max value calculation for bar height in Chart
  const maxChartVal = Math.max(
    ...(stats?.sales_vs_purchases_chart.flatMap((c) => [c.sales, c.purchases]) || [100])
  );

  const totalOverdueCount = (stats?.overdue_receivables_count ?? 0) + (stats?.overdue_payables_count ?? 0);
  const totalOverdueAmount = (stats?.overdue_receivables ?? 0) + (stats?.overdue_payables ?? 0);

  return (
    <div className="space-y-6 sm:space-y-8 animate-fadeIn w-full max-w-full pb-16 overflow-x-hidden">
      {/* SECTION A: Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-8 lg:p-9 text-white shadow-xl shadow-slate-950/20 border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-indigo-500/15 to-transparent pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-12 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 sm:gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{user?.role ? user.role.toUpperCase() : 'USER'}</span>
              </span>
              <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                <span>Executive Management Suite</span>
              </span>
            </div>

            <h1 className="text-xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white break-words">
              Welcome back, <span className="text-indigo-400">{user?.name || 'Administrator'}</span> !
            </h1>
            <p className="text-xs sm:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          {/* System Status Pill */}
          <div className="w-full lg:w-auto flex-shrink-0 bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/60 flex items-center gap-3 sm:gap-4 shadow-lg">
            <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner shrink-0">
              <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Database & System Status</div>
              <div className="text-sm sm:text-base font-black text-emerald-300">
                Connected (MySQL 8+)
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">Base Currency: PKR (Rs.)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Global Tenant SaaS Package, Limits & License Summary */}
      <TenantPackageSummary />

      {/* SECTION B: Executive Financial Alerts Center */}
      {user?.role !== 'viewer' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div className="flex items-center gap-2.5 font-black text-base sm:text-lg text-[#0F172A]">
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center font-bold ${
                totalOverdueCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {totalOverdueCount > 0 ? <AlertTriangle className="w-4.5 h-4.5" /> : <Clock className="w-4.5 h-4.5" />}
              </div>
              <span>Credit & Due Obligations Alert Center</span>
            </div>
            <Link
              href="/reports?tab=aging"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 transition-colors"
            >
              <span>View Full Aging Analysis</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Today Due Receivables */}
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-amber-900">
                <span>Receivables Due Today</span>
                <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-xs font-black">
                  {dueAlerts?.receivables?.today_due_count ?? 0} {(dueAlerts?.receivables?.today_due_count ?? 0) === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>
              <div className="text-xl font-black text-amber-950">
                {formatCurrency(stats?.today_due_receivables ?? dueAlerts?.receivables?.today_due_amount ?? 0)}
              </div>
              <p className="text-xs text-amber-800 font-medium">Customer sales maturing today</p>
            </div>

            {/* 2. Overdue Receivables */}
            <div className={`p-4 rounded-2xl border space-y-1.5 ${
              (stats?.overdue_receivables ?? 0) > 0
                ? 'bg-rose-50/70 border-rose-200/80'
                : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-rose-900">
                <span className="flex items-center gap-1">
                  {(stats?.overdue_receivables ?? 0) > 0 && <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />}
                  Overdue Receivables
                </span>
                <span className="px-2 py-0.5 rounded-full bg-rose-200/80 text-rose-900 text-xs font-black">
                  {stats?.overdue_receivables_count ?? dueAlerts?.receivables?.overdue_count ?? 0} {(stats?.overdue_receivables_count ?? 0) === 1 ? 'invoice' : 'invoices'}
                </span>
              </div>
              <div className="text-xl font-black text-rose-950">
                {formatCurrency(stats?.overdue_receivables ?? dueAlerts?.receivables?.overdue_amount ?? 0)}
              </div>
              <p className="text-xs text-rose-800 font-medium">Exceeded customer credit terms</p>
            </div>

            {/* 3. Today Due Payables */}
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200/80 space-y-1.5">
              <div className="flex items-center justify-between text-xs font-bold text-blue-900">
                <span>Payables Due Today</span>
                <span className="px-2 py-0.5 rounded-full bg-blue-200/80 text-blue-900 text-xs font-black">
                  {dueAlerts?.payables?.today_due_count ?? 0} {(dueAlerts?.payables?.today_due_count ?? 0) === 1 ? 'bill' : 'bills'}
                </span>
              </div>
              <div className="text-xl font-black text-blue-950">
                {formatCurrency(stats?.today_due_payables ?? dueAlerts?.payables?.today_due_amount ?? 0)}
              </div>
              <p className="text-xs text-blue-800 font-medium">Supplier bills maturing today</p>
            </div>

            {/* 4. Overdue Payables */}
            <div className={`p-4 rounded-2xl border space-y-1.5 ${
              (stats?.overdue_payables ?? 0) > 0
                ? 'bg-purple-50/70 border-purple-200/80'
                : 'bg-slate-50 border-slate-200/80'
            }`}>
              <div className="flex items-center justify-between text-xs font-bold text-purple-900">
                <span className="flex items-center gap-1">
                  {(stats?.overdue_payables ?? 0) > 0 && <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />}
                  Overdue Payables
                </span>
                <span className="px-2 py-0.5 rounded-full bg-purple-200/80 text-purple-900 text-xs font-black">
                  {stats?.overdue_payables_count ?? dueAlerts?.payables?.overdue_count ?? 0} {(stats?.overdue_payables_count ?? 0) === 1 ? 'bill' : 'bills'}
                </span>
              </div>
              <div className="text-xl font-black text-purple-950">
                {formatCurrency(stats?.overdue_payables ?? dueAlerts?.payables?.overdue_amount ?? 0)}
              </div>
              <p className="text-xs text-purple-800 font-medium">Vendor credit term overdue</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION C: Primary Executive KPI Cards */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 sm:gap-0">
          <h2 className="text-base sm:text-xl font-black text-[#0F172A] tracking-tight flex items-center gap-2">
            <Activity className="w-5 h-5 text-indigo-600" />
            Executive Performance KPIs
          </h2>
          <span className="text-xs text-slate-500 font-semibold">Real-Time Authoritative Calculations</span>
        </div>

        <div className="grid grid-cols-1 min-[480px]:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {/* 1. Today's True Net Profit (Phase 12 Core Hero Card) */}
          {user?.role !== 'viewer' && (
            <div className="bg-gradient-to-br from-emerald-50 via-white to-emerald-50/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-emerald-400/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-emerald-800">
                  Today Net Profit
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-emerald-500 text-white flex items-center justify-center font-bold shadow-md shadow-emerald-500/20 shrink-0">
                  <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight break-words ${(stats?.today_net_profit ?? 0) >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                  {formatCurrency(stats?.today_net_profit)}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-100 text-xs font-bold text-emerald-800">
                  <span>Gross: {formatCurrency(stats?.today_gross_profit)}</span>
                  <span className="text-slate-400 font-mono text-xs">Sales - COGS - Exp</span>
                </div>
              </div>
            </div>
          )}

          {/* 2. Month's True Net Profit */}
          {user?.role !== 'viewer' && (
            <div className="bg-gradient-to-br from-indigo-50 via-white to-indigo-50/30 rounded-2xl sm:rounded-3xl p-4 sm:p-6 border-2 border-indigo-400/80 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-indigo-800">
                  Month Net Profit
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-indigo-600 text-white flex items-center justify-center font-bold shadow-md shadow-indigo-600/20 shrink-0">
                  <BarChart3 className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className={`text-xl sm:text-2xl lg:text-3xl font-black tracking-tight break-words ${(stats?.monthly_net_profit ?? 0) >= 0 ? 'text-indigo-700' : 'text-rose-600'}`}>
                  {formatCurrency(stats?.monthly_net_profit)}
                </div>
                <div className="flex items-center justify-between mt-2 pt-2 border-t border-indigo-100 text-xs font-bold text-indigo-800">
                  <span>Revenue: {formatCurrency(stats?.monthly_revenue)}</span>
                  <span className="text-slate-400 font-mono text-xs">Net Margin</span>
                </div>
              </div>
            </div>
          )}

          {/* 3. Today's Completed Production Output */}
          <Link
            href="/manufacturing/orders"
            className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 group-hover:text-indigo-600 transition-colors">
                Today Production
              </span>
              <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center border border-purple-100/80 font-bold shrink-0 group-hover:scale-105 transition-transform">
                <Factory className="w-5 h-5 sm:w-6 sm:h-6" />
              </div>
            </div>
            <div className="mt-3 sm:mt-4">
              <div className="text-xl sm:text-2xl lg:text-3xl font-black text-purple-700 flex items-center justify-between tracking-tight">
                <span>{Number(stats?.today_production_quantity ?? 0).toLocaleString()} <span className="text-sm font-bold text-slate-400">units</span></span>
                <ChevronRight className="w-5 h-5 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">Completed output today</div>
            </div>
          </Link>

          {/* 4. Total Sales / Operational Volume */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Today Sales Volume
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 font-bold shrink-0">
                  <DollarSign className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight break-words">
                  {formatCurrency(stats?.today_sales)}
                </div>
                <div className="flex items-center gap-1 text-xs font-bold text-blue-600 mt-1">
                  <ArrowUpRight className="w-4 h-4 shrink-0" />
                  <span>{stats?.today_sales_count ?? 0} invoices recorded</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Stock Catalog
                </span>
                <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
                  <Boxes className="w-5 h-5 sm:w-6 sm:h-6" />
                </div>
              </div>
              <div className="mt-3 sm:mt-4">
                <div className="text-xl sm:text-2xl lg:text-3xl font-black text-[#0F172A] tracking-tight">
                  {stats?.stock_items ?? 0} <span className="text-sm text-slate-400 font-bold">SKUs</span>
                </div>
                <div className="text-xs text-slate-500 mt-1 font-semibold">Active Catalog Items</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* SECTION D: Manufacturing & Inventory Stock Valuation Overview */}
      {user?.role !== 'viewer' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-5 sm:p-7 border border-slate-200/90 shadow-xs space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A] flex items-center gap-2">
                <Boxes className="w-5 h-5 text-indigo-600" />
                Manufacturing & Inventory Stock Valuation
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">Authoritative balance valuation across Raw Material and Finished Goods stock</p>
            </div>
            <Link
              href="/reports?tab=manufacturing"
              className="text-xs font-bold text-indigo-600 hover:text-indigo-700 hover:underline flex items-center gap-1 transition-colors self-start sm:self-auto"
            >
              <span>Manufacturing Reports Suite</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Raw Material Inventory Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Raw Material Stock</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-amber-100 text-amber-800">
                  Paper, Board & Glue
                </span>
              </div>
              <div className="text-2xl font-black text-slate-900">
                {formatCurrency(stats?.raw_material_stock_value)}
              </div>
              <div className="text-xs text-slate-500 font-medium">Available production inventory</div>
            </div>

            {/* Finished Goods Inventory Card */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Finished Goods Stock</span>
                <span className="px-2 py-0.5 rounded text-xs font-bold bg-emerald-100 text-emerald-800">
                  Registers & Books
                </span>
              </div>
              <div className="text-2xl font-black text-emerald-700">
                {formatCurrency(stats?.finished_goods_stock_value)}
              </div>
              <div className="text-xs text-slate-500 font-medium">Ready for distribution & sale</div>
            </div>

            {/* Inventory Ratio Split */}
            <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Inventory Value Distribution</span>
                <span className="text-indigo-600 font-black">{formatCurrency(totalInvVal)}</span>
              </div>
              <div className="w-full bg-slate-200 rounded-full h-3 overflow-hidden flex">
                <div
                  style={{ width: `${rawRatio}%` }}
                  className="bg-amber-500 h-full transition-all"
                  title={`Raw Materials: ${rawRatio.toFixed(1)}%`}
                />
                <div
                  style={{ width: `${fgRatio}%` }}
                  className="bg-emerald-600 h-full transition-all"
                  title={`Finished Goods: ${fgRatio.toFixed(1)}%`}
                />
              </div>
              <div className="flex items-center justify-between text-xs font-semibold text-slate-600">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                  Raw Material: {rawRatio.toFixed(0)}%
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-600" />
                  Finished Goods: {fgRatio.toFixed(0)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: Working Capital & Outstanding Balances */}
      {user?.role !== 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
          {/* Customer Receivables */}
          <Link
            href="/customers"
            className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-purple-600 transition-colors">
                Customer Receivables (Lena Hai)
              </span>
              <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                <Users className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight">
                {formatCurrency(stats?.customer_outstanding)}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                <span>{stats?.active_customers ?? 0} active customers</span>
                <ChevronRight className="w-4 h-4 text-purple-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Supplier Payables */}
          <Link
            href="/suppliers"
            className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-amber-700 transition-colors">
                Supplier Payables (Dena Hai)
              </span>
              <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                <Building2 className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-amber-800 tracking-tight">
                {formatCurrency(stats?.supplier_outstanding)}
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                <span>{stats?.active_suppliers ?? 0} active suppliers</span>
                <ChevronRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>

          {/* Low Stock Alerts */}
          <Link
            href="/stock"
            className="bg-white rounded-2xl sm:rounded-3xl p-5 border border-slate-200/90 shadow-xs hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition-colors">
                Low Stock Alerts
              </span>
              <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold shrink-0 group-hover:scale-105 transition-transform">
                <AlertTriangle className="w-4 h-4" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-xl sm:text-2xl font-black text-rose-600 tracking-tight">
                {stats?.low_stock_alerts ?? 0} <span className="text-sm text-slate-400 font-bold">items</span>
              </div>
              <div className="flex items-center justify-between mt-1 text-xs text-slate-500 font-medium">
                <span>Reorder threshold alerts</span>
                <ChevronRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        </div>
      )}

      {/* SECTION F: Quick Actions Bar (Admin/Staff) */}
      {user?.role !== 'viewer' && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-indigo-600" />
              <span>Executive Quick Actions</span>
            </div>
          </div>

          <div className="grid grid-cols-2 min-[480px]:grid-cols-3 lg:grid-cols-6 gap-2 sm:gap-3.5">
            <Link
              href="/sales/new"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-emerald-50/70 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-emerald-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform shrink-0" />
              <span>+ New Sale</span>
            </Link>

            <Link
              href="/purchases/new"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-blue-50/70 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform shrink-0" />
              <span>+ New Purchase</span>
            </Link>

            <Link
              href="/manufacturing/orders"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-purple-50/70 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <Factory className="w-4 h-4 shrink-0" />
              <span>+ Production Order</span>
            </Link>

            <Link
              href="/payments/receive"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-teal-50/70 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <CreditCard className="w-4 h-4 shrink-0" />
              <span>+ Receive Payment</span>
            </Link>

            <Link
              href="/expenses/new"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-rose-50/70 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <FileSpreadsheet className="w-4 h-4 shrink-0" />
              <span>+ Add Expense</span>
            </Link>

            <Link
              href="/reports?tab=balance-sheet"
              className="px-2 py-3 sm:px-4 sm:py-3.5 rounded-xl sm:rounded-2xl bg-indigo-50/70 hover:bg-indigo-600 text-indigo-700 hover:text-white border border-indigo-200/80 transition-all font-bold text-xs sm:text-sm flex flex-col sm:flex-row items-center justify-center gap-1.5 sm:gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer text-center"
            >
              <BarChart3 className="w-4 h-4 shrink-0" />
              <span>Balance Sheet</span>
            </Link>
          </div>
        </div>
      )}

      {/* SECTION G: Sales vs Purchases Overview Chart */}
      {user?.role !== 'viewer' && stats?.sales_vs_purchases_chart && stats.sales_vs_purchases_chart.length > 0 && (
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 shadow-xs space-y-4 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Sales vs Purchases Overview</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Monthly fiscal transaction comparisons</p>
            </div>

            <div className="flex items-center gap-4 sm:gap-5 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#16A34A] shadow-xs" />
                <span className="text-slate-700">Sales</span>
              </div>
              <div className="flex items-center gap-1.5 sm:gap-2">
                <div className="w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-blue-500 shadow-xs" />
                <span className="text-slate-700">Purchases</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div className="overflow-x-auto scrollbar-thin pb-2">
            <div className="h-48 sm:h-52 min-w-[280px] flex items-end justify-between gap-2 sm:gap-4 pt-6 border-b border-slate-100 pb-3">
              {stats.sales_vs_purchases_chart.map((c, i) => {
                const salesPercent = maxChartVal > 0 ? (c.sales / maxChartVal) * 100 : 0;
                const purchasesPercent = maxChartVal > 0 ? (c.purchases / maxChartVal) * 100 : 0;

                return (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="w-full flex items-end justify-center gap-1 sm:gap-2 h-full">
                      {/* Sales Bar */}
                      <div
                        style={{ height: `${Math.max(salesPercent, 4)}%` }}
                        className="w-1/2 max-w-[24px] sm:max-w-[28px] bg-gradient-to-t from-emerald-600 to-[#16A34A] rounded-t-lg transition-all group-hover:brightness-110 relative shadow-xs"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                          {formatCurrency(c.sales)}
                        </div>
                      </div>

                      {/* Purchases Bar */}
                      <div
                        style={{ height: `${Math.max(purchasesPercent, 4)}%` }}
                        className="w-1/2 max-w-[24px] sm:max-w-[28px] bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg transition-all group-hover:brightness-110 relative shadow-xs"
                      >
                        <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                          {formatCurrency(c.purchases)}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs font-bold text-slate-600 truncate max-w-full">{c.month}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* SECTION H: Recent Sales & Recent Purchases Tables */}
      {user?.role !== 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 sm:gap-6">
          {/* Recent Sales Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Recent Sales Invoices</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Latest customer transactions</p>
                </div>
                <Link
                  href="/sales"
                  className="text-xs sm:text-sm font-bold text-[#16A34A] hover:text-[#059669] flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700 min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Invoice</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Customer</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Date</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_sales && stats.recent_sales.length > 0 ? (
                      stats.recent_sales.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 font-bold font-mono text-slate-900 text-xs sm:text-sm">
                            {formatInvoiceNumber(s.invoice_no)}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[120px]">
                            {s.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">
                            {s.sale_date ? s.sale_date.split('T')[0] : '—'}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-right font-black text-xs sm:text-base text-[#16A34A] whitespace-nowrap">
                            {formatCurrency(s.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 sm:py-8 text-center text-slate-400 font-medium text-xs sm:text-sm">
                          No recent sales invoices recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Recent Purchases Table */}
          <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between gap-2 mb-3.5 sm:mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Recent Purchase Orders</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Latest supplier requisitions</p>
                </div>
                <Link
                  href="/purchases"
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors cursor-pointer shrink-0"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin">
                <table className="w-full text-left text-xs sm:text-sm text-slate-700 min-w-[340px]">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Purchase #</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Supplier</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3">Date</th>
                      <th className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_purchases && stats.recent_purchases.length > 0 ? (
                      stats.recent_purchases.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 font-bold font-mono text-slate-900 text-xs sm:text-sm">
                            {p.purchase_no}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 font-semibold text-slate-800 text-xs sm:text-sm truncate max-w-[120px]">
                            {p.supplier?.name || 'General Supplier'}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-slate-600 font-medium text-xs sm:text-sm whitespace-nowrap">
                            {p.purchase_date ? p.purchase_date.split('T')[0] : '—'}
                          </td>
                          <td className="py-2.5 sm:py-3.5 px-2.5 sm:px-3 text-right font-black text-xs sm:text-base text-blue-600 whitespace-nowrap">
                            {formatCurrency(p.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 sm:py-8 text-center text-slate-400 font-medium text-xs sm:text-sm">
                          No recent purchase orders recorded.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION I: Low Stock Products Detailed Section */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-6 lg:p-7 border border-slate-200/90 shadow-xs space-y-3.5 sm:space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Low Stock Products Alert</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Products reaching minimum threshold limits</p>
          </div>
          <Link
            href="/stock"
            className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors cursor-pointer self-start sm:self-auto shrink-0"
          >
            <span>View All Stock</span>
            <ArrowRight className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 scrollbar-thin">
          <table className="w-full text-left text-xs sm:text-sm text-slate-700 min-w-[420px]">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4">Product Name</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4">SKU</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center">Current Stock</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center">Threshold</th>
                <th className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
                stats.low_stock_products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-bold text-slate-900 text-xs sm:text-sm">
                      {item.name}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 font-mono font-medium text-slate-500 text-xs">
                      {item.sku}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center font-black text-rose-600 text-xs sm:text-sm">
                      {item.stock_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-center font-semibold text-slate-600 text-xs sm:text-sm">
                      {item.alert_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-2.5 sm:py-3.5 px-3 sm:px-4 text-right">
                      <span className="inline-flex items-center gap-1 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3 h-3 sm:w-3.5 sm:h-3.5" /> Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 sm:py-8 text-center text-slate-500 font-semibold text-xs sm:text-sm">
                    ✨ Great! All product stock levels are currently above minimum threshold limits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
