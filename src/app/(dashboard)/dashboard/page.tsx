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
} from 'lucide-react';

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
  today_profit: number | null;
  monthly_profit: number | null;
  recent_sales: RecentSale[];
  recent_purchases: RecentPurchase[];
  low_stock_products: LowStockItem[];
  sales_vs_purchases_chart: ChartItem[];
}

export default function DashboardPage() {
  const [user, setUser] = useState<User | null>(null);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const currentUser = authService.getUserFromCookie();
    setUser(currentUser);

    apiClient
      .get<{ success: boolean; data: DashboardStats }>('/dashboard/stats')
      .then((res) => {
        if (res.data.success) {
          setStats(res.data.data);
        }
      })
      .catch((err) => {
        console.error('Failed to load dashboard stats:', err);
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

  const getRoleHeaderDetails = (role?: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'System Administrator',
          desc: 'Full governance: Sales, Purchases, Ledgers, Reports, User Management, and System Backups.',
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

  // Max value calculation for bar height in Chart
  const maxChartVal = Math.max(
    ...(stats?.sales_vs_purchases_chart.flatMap((c) => [c.sales, c.purchases]) || [100])
  );

  return (
    <div className="space-y-8 animate-fadeIn w-full pb-16">
      {/* SECTION A: Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 p-7 sm:p-9 text-white shadow-xl shadow-slate-950/15 border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/15 to-transparent pointer-events-none" />
        <div className="absolute left-1/4 bottom-0 -mb-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                <span>{user?.role ? user.role.toUpperCase() : 'USER'}</span>
              </span>
              <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 bg-slate-800/80 px-3 py-1 rounded-full border border-slate-700/50">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span>Live Business ERP Data</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome back, <span className="text-emerald-400">{user?.name || 'Administrator'}</span>!
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          {/* System Status Pill */}
          <div className="flex-shrink-0 bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/60 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
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

      {/* SECTION I: Quick Actions Bar (Admin/Staff) */}
      {user?.role !== 'viewer' && (
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm space-y-3.5">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" />
              <span>Quick Action Shortcuts</span>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3.5">
            <Link
              href="/sales/new"
              className="px-4 py-3.5 rounded-2xl bg-emerald-50/70 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-emerald-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>+ New Sale</span>
            </Link>

            <Link
              href="/purchases/new"
              className="px-4 py-3.5 rounded-2xl bg-blue-50/70 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <Plus className="w-4 h-4 group-hover:rotate-90 transition-transform" />
              <span>+ New Purchase</span>
            </Link>

            <Link
              href="/customers/new"
              className="px-4 py-3.5 rounded-2xl bg-purple-50/70 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <Users className="w-4 h-4" />
              <span>+ Add Customer</span>
            </Link>

            <Link
              href="/suppliers/new"
              className="px-4 py-3.5 rounded-2xl bg-amber-50/70 hover:bg-amber-600 text-amber-800 hover:text-white border border-amber-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </Link>

            <Link
              href="/payments/receive"
              className="px-4 py-3.5 rounded-2xl bg-teal-50/70 hover:bg-teal-600 text-teal-800 hover:text-white border border-teal-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Receive Payment</span>
            </Link>

            <Link
              href="/expenses/new"
              className="px-4 py-3.5 rounded-2xl bg-rose-50/70 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200/80 transition-all font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-2xs hover:scale-105 active:scale-95 group cursor-pointer"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>+ Add Expense</span>
            </Link>
          </div>
        </div>
      )}

      {/* SECTION B: 4 Primary KPI Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
            Key Performance Metrics
          </h2>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold">Live MySQL Aggregations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Sales */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Total Sales
                </span>
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100/80 font-bold shrink-0">
                  <DollarSign className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {formatCurrency(stats?.total_sales)}
                </div>
                <div className="flex items-center gap-1 text-xs sm:text-sm font-bold text-emerald-600 mt-1.5">
                  <ArrowUpRight className="w-4 h-4" />
                  <span>Gross Sales Recorded</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 2: Total Purchases */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-center justify-between">
                <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                  Total Purchases
                </span>
                <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 font-bold shrink-0">
                  <Receipt className="w-6 h-6" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                  {formatCurrency(stats?.total_purchases)}
                </div>
                <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                  Inventory Procurement Total
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 3: Stock Items (All Roles) */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Stock Items
              </span>
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100/80 font-bold shrink-0">
                <Boxes className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                {stats?.stock_items ?? 0} <span className="text-sm text-slate-400 font-bold">SKUs</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                Active Product Catalog
              </div>
            </div>
          </div>

          {/* Card 4: Low Stock Alerts (All Roles - Clickable) */}
          <Link
            href="/stock"
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition-colors">
                Low Stock Alerts
              </span>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 font-bold shrink-0 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-rose-600 flex items-center justify-between tracking-tight">
                <span>{stats?.low_stock_alerts ?? 0}</span>
                <ArrowRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                Items requiring replenishment
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION C & D: Outstanding & Profit Summary Cards (Admin/Staff) */}
      {user?.role !== 'viewer' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Customer Outstanding */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Customer Outstanding
              </span>
              <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                <Users className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-xl sm:text-2xl font-black text-purple-700 tracking-tight">
                {formatCurrency(stats?.customer_outstanding)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Receivable from Customers</p>
            </div>
          </div>

          {/* Supplier Outstanding */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Supplier Outstanding
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center font-bold">
                <Building2 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className="text-xl sm:text-2xl font-black text-amber-800 tracking-tight">
                {formatCurrency(stats?.supplier_outstanding)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Payable to Suppliers</p>
            </div>
          </div>

          {/* Today's Profit */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Net Profit
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <TrendingUp className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className={`text-xl sm:text-2xl font-black tracking-tight ${(stats?.today_profit ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                {formatCurrency(stats?.today_profit)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Sales minus Expenses today</p>
            </div>
          </div>

          {/* This Month's Profit */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                This Month&apos;s Profit
              </span>
              <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
                <BarChart3 className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3.5">
              <div className={`text-xl sm:text-2xl font-black tracking-tight ${(stats?.monthly_profit ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                {formatCurrency(stats?.monthly_profit)}
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">Fiscal Month Net Earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: Sales vs Purchases Overview Chart */}
      {user?.role !== 'viewer' && stats?.sales_vs_purchases_chart && stats.sales_vs_purchases_chart.length > 0 && (
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Sales vs Purchases Overview</h3>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Monthly fiscal transaction comparisons</p>
            </div>

            <div className="flex items-center gap-5 text-xs sm:text-sm font-bold">
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-[#16A34A] shadow-xs" />
                <span className="text-slate-700">Sales</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full bg-blue-500 shadow-xs" />
                <span className="text-slate-700">Purchases</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-52 flex items-end justify-between gap-4 pt-6 border-b border-slate-100 pb-3">
            {stats.sales_vs_purchases_chart.map((c, i) => {
              const salesPercent = maxChartVal > 0 ? (c.sales / maxChartVal) * 100 : 0;
              const purchasesPercent = maxChartVal > 0 ? (c.purchases / maxChartVal) * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2.5 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-2 h-full">
                    {/* Sales Bar */}
                    <div
                      style={{ height: `${Math.max(salesPercent, 4)}%` }}
                      className="w-1/2 max-w-[28px] bg-gradient-to-t from-emerald-600 to-[#16A34A] rounded-t-lg transition-all group-hover:brightness-110 relative shadow-xs"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {formatCurrency(c.sales)}
                      </div>
                    </div>

                    {/* Purchases Bar */}
                    <div
                      style={{ height: `${Math.max(purchasesPercent, 4)}%` }}
                      className="w-1/2 max-w-[28px] bg-gradient-to-t from-blue-600 to-blue-500 rounded-t-lg transition-all group-hover:brightness-110 relative shadow-xs"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-9 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-xs font-bold py-1 px-2 rounded-lg pointer-events-none whitespace-nowrap z-20 shadow-md">
                        {formatCurrency(c.purchases)}
                      </div>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-slate-600">{c.month}</span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION F & G: Recent Sales & Recent Purchases Tables */}
      {user?.role !== 'viewer' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Sales Table */}
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Recent Sales Invoices</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Latest customer transactions</p>
                </div>
                <Link
                  href="/sales"
                  className="text-xs sm:text-sm font-bold text-[#16A34A] hover:text-[#059669] flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3.5 px-3">Invoice</th>
                      <th className="py-3.5 px-3">Customer</th>
                      <th className="py-3.5 px-3">Date</th>
                      <th className="py-3.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_sales && stats.recent_sales.length > 0 ? (
                      stats.recent_sales.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 font-bold font-mono text-slate-900 text-sm">
                            {s.invoice_no}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-800 text-sm">
                            {s.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium text-sm">
                            {s.sale_date ? s.sale_date.split('T')[0] : '—'}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-sm sm:text-base text-[#16A34A]">
                            {formatCurrency(s.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-sm">
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
          <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Recent Purchase Orders</h3>
                  <p className="text-xs sm:text-sm text-slate-500">Latest supplier requisitions</p>
                </div>
                <Link
                  href="/purchases"
                  className="text-xs sm:text-sm font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <span>View All</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-slate-700">
                  <thead>
                    <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                      <th className="py-3.5 px-3">Purchase #</th>
                      <th className="py-3.5 px-3">Supplier</th>
                      <th className="py-3.5 px-3">Date</th>
                      <th className="py-3.5 px-3 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_purchases && stats.recent_purchases.length > 0 ? (
                      stats.recent_purchases.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-3 font-bold font-mono text-slate-900 text-sm">
                            {p.purchase_no}
                          </td>
                          <td className="py-3.5 px-3 font-semibold text-slate-800 text-sm">
                            {p.supplier?.name || 'General Supplier'}
                          </td>
                          <td className="py-3.5 px-3 text-slate-600 font-medium text-sm">
                            {p.purchase_date ? p.purchase_date.split('T')[0] : '—'}
                          </td>
                          <td className="py-3.5 px-3 text-right font-black text-sm sm:text-base text-blue-600">
                            {formatCurrency(p.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-sm">
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

      {/* SECTION H: Low Stock Products Detailed Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Low Stock Products Alert</h3>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">Products reaching minimum threshold limits</p>
          </div>
          <Link
            href="/stock"
            className="text-xs sm:text-sm font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <span>View All Stock</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-700">
            <thead>
              <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                <th className="py-3.5 px-4">Product Name</th>
                <th className="py-3.5 px-4">SKU</th>
                <th className="py-3.5 px-4 text-center">Current Stock</th>
                <th className="py-3.5 px-4 text-center">Threshold</th>
                <th className="py-3.5 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
                stats.low_stock_products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4 font-bold text-slate-900 text-sm">
                      {item.name}
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-500 text-xs">
                      {item.sku}
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-rose-600 text-sm">
                      {item.stock_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-3.5 px-4 text-center font-semibold text-slate-600 text-sm">
                      {item.alert_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5" /> Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500 font-semibold text-sm">
                    ✨ Great! All product stock levels are currently above minimum threshold limits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION J: Role Permission Matrix Card */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <h3 className="text-base sm:text-lg font-black text-[#0F172A]">
          Active Role Access Privileges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          <div className={`p-5 rounded-2xl border ${user?.role === 'admin' ? 'border-emerald-300 bg-emerald-50/50 shadow-xs' : 'border-slate-200 bg-slate-50/80 opacity-70'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-black text-sm sm:text-base text-slate-900">Administrator</span>
              {user?.role === 'admin' && <span className="text-xs font-black text-[#16A34A] bg-emerald-100 px-2.5 py-0.5 rounded-full">Active Session</span>}
            </div>
            <ul className="text-xs sm:text-sm space-y-2 text-slate-600 font-medium">
              <li>• Full system module access (Sales, Purchases, Ledgers)</li>
              <li>• User management & role governance</li>
              <li>• Database backups & system restores</li>
              <li>• Comprehensive financial audit reports</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border ${user?.role === 'staff' ? 'border-blue-300 bg-blue-50/50 shadow-xs' : 'border-slate-200 bg-slate-50/80 opacity-70'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-black text-sm sm:text-base text-slate-900">Staff Member</span>
              {user?.role === 'staff' && <span className="text-xs font-black text-blue-600 bg-blue-100 px-2.5 py-0.5 rounded-full">Active Session</span>}
            </div>
            <ul className="text-xs sm:text-sm space-y-2 text-slate-600 font-medium">
              <li>• Create and manage Sales & Purchase orders</li>
              <li>• Customer & Supplier ledger operations</li>
              <li>• Record Payments & Expense transactions</li>
              <li>• Access operational reports & inventory status</li>
            </ul>
          </div>

          <div className={`p-5 rounded-2xl border ${user?.role === 'viewer' ? 'border-purple-300 bg-purple-50/50 shadow-xs' : 'border-slate-200 bg-slate-50/80 opacity-70'}`}>
            <div className="flex items-center justify-between mb-2.5">
              <span className="font-black text-sm sm:text-base text-slate-900">Viewer</span>
              {user?.role === 'viewer' && <span className="text-xs font-black text-purple-600 bg-purple-100 px-2.5 py-0.5 rounded-full">Active Session</span>}
            </div>
            <ul className="text-xs sm:text-sm space-y-2 text-slate-600 font-medium">
              <li>• Read-only inspection of stock catalog</li>
              <li>• View summary & financial reports</li>
              <li>• Strict read-only boundaries (No transaction mutations)</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
