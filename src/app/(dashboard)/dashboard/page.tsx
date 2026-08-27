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
  const [chartTimeframe, setChartTimeframe] = useState<'monthly' | 'daily'>('monthly');

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
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'staff':
        return {
          title: 'Staff Member',
          desc: 'Point-of-Sale entries, Purchase Order requisitions, Inventory updates, and Payments.',
          icon: Briefcase,
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'viewer':
      default:
        return {
          title: 'Viewer Account',
          desc: 'Read-only access to view live stock catalog and high-level financial summary reports.',
          icon: Eye,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
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
    <div className="space-y-8 animate-fadeIn pb-8">
      {/* SECTION A: Top Header / Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] via-slate-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#16A34A]/25 to-transparent pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {user?.role ? user.role.toUpperCase() : 'USER'}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-[#16A34A]" />
                Live Business ERP Data
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-[#16A34A]">{user?.name || 'Administrator'}</span>!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          {/* Quick Info Badge */}
          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 flex items-center gap-4">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <div className="text-xs text-slate-300">Database & System Status</div>
              <div className="text-sm font-semibold text-emerald-300">
                Connected (MySQL 8+)
              </div>
              <div className="text-[11px] text-slate-400">Currency: PKR (Rs.)</div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION I: Quick Actions Bar (Admin/Staff) */}
      {user?.role !== 'viewer' && (
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs">
          <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
            Quick Actions Shortcuts
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            <Link
              href="/sales/new"
              className="px-3.5 py-2.5 rounded-xl bg-emerald-50 hover:bg-[#16A34A] text-[#16A34A] hover:text-white border border-emerald-200 transition-all font-semibold text-xs flex items-center justify-center gap-2 group"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Sale</span>
            </Link>

            <Link
              href="/purchases/new"
              className="px-3.5 py-2.5 rounded-xl bg-blue-50 hover:bg-blue-600 text-blue-700 hover:text-white border border-blue-200 transition-all font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>+ New Purchase</span>
            </Link>

            <Link
              href="/customers/new"
              className="px-3.5 py-2.5 rounded-xl bg-purple-50 hover:bg-purple-600 text-purple-700 hover:text-white border border-purple-200 transition-all font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Users className="w-4 h-4" />
              <span>+ Add Customer</span>
            </Link>

            <Link
              href="/suppliers/new"
              className="px-3.5 py-2.5 rounded-xl bg-amber-50 hover:bg-amber-600 text-amber-700 hover:text-white border border-amber-200 transition-all font-semibold text-xs flex items-center justify-center gap-2"
            >
              <Building2 className="w-4 h-4" />
              <span>+ Add Supplier</span>
            </Link>

            <Link
              href="/payments/receive"
              className="px-3.5 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-600 text-teal-700 hover:text-white border border-teal-200 transition-all font-semibold text-xs flex items-center justify-center gap-2"
            >
              <CreditCard className="w-4 h-4" />
              <span>+ Receive Payment</span>
            </Link>

            <Link
              href="/expenses/new"
              className="px-3.5 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-600 text-rose-700 hover:text-white border border-rose-200 transition-all font-semibold text-xs flex items-center justify-center gap-2"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>+ Add Expense</span>
            </Link>
          </div>
        </div>
      )}

      {/* SECTION B: 4 Primary KPI Cards */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
            Key Performance Metrics
          </h2>
          <span className="text-xs text-slate-500 font-medium">Live MySQL Aggregations</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Sales */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Sales
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-[#0F172A]">
                  {formatCurrency(stats?.total_sales)}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>Gross Sales Recorded</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 2: Total Purchases */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  Total Purchases
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-extrabold text-[#0F172A]">
                  {formatCurrency(stats?.total_purchases)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  Inventory Procurement Total
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 3: Stock Items (All Roles) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Stock Items
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-[#0F172A]">
                {stats?.stock_items ?? 0} <span className="text-xs text-slate-400 font-normal">SKUs</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Active Product Catalog
              </div>
            </div>
          </div>

          {/* Card 4: Low Stock Alerts (All Roles - Clickable) */}
          <Link
            href="/stock"
            className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-all group block"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition-colors">
                Low Stock Alerts
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-extrabold text-rose-600 flex items-center justify-between">
                <span>{stats?.low_stock_alerts ?? 0}</span>
                <ArrowRight className="w-4 h-4 text-rose-400 group-hover:translate-x-1 transition-transform" />
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
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
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Customer Outstanding
              </span>
              <Users className="w-5 h-5 text-purple-600" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-extrabold text-purple-700">
                {formatCurrency(stats?.customer_outstanding)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Receivable from Customers</p>
            </div>
          </div>

          {/* Supplier Outstanding */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Supplier Outstanding
              </span>
              <Building2 className="w-5 h-5 text-amber-600" />
            </div>
            <div className="mt-3">
              <div className="text-xl font-extrabold text-amber-700">
                {formatCurrency(stats?.supplier_outstanding)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Payable to Suppliers</p>
            </div>
          </div>

          {/* Today's Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today's Net Profit
              </span>
              <TrendingUp className="w-5 h-5 text-emerald-600" />
            </div>
            <div className="mt-3">
              <div className={`text-xl font-extrabold ${(stats?.today_profit ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                {formatCurrency(stats?.today_profit)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Sales minus Expenses today</p>
            </div>
          </div>

          {/* This Month's Profit */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                This Month's Profit
              </span>
              <BarChart3 className="w-5 h-5 text-[#16A34A]" />
            </div>
            <div className="mt-3">
              <div className={`text-xl font-extrabold ${(stats?.monthly_profit ?? 0) >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
                {formatCurrency(stats?.monthly_profit)}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">Fiscal Month Net Earnings</p>
            </div>
          </div>
        </div>
      )}

      {/* SECTION E: Sales vs Purchases Overview Chart */}
      {user?.role !== 'viewer' && stats?.sales_vs_purchases_chart && stats.sales_vs_purchases_chart.length > 0 && (
        <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
            <div>
              <h3 className="text-base font-bold text-[#0F172A]">Sales vs Purchases Overview</h3>
              <p className="text-xs text-slate-500">Monthly fiscal transaction comparisons</p>
            </div>

            <div className="flex items-center gap-4 text-xs font-semibold">
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-[#16A34A]" />
                <span>Sales</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded-full bg-blue-500" />
                <span>Purchases</span>
              </div>
            </div>
          </div>

          {/* Bar Chart Graphics */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100 pb-2">
            {stats.sales_vs_purchases_chart.map((c, i) => {
              const salesPercent = maxChartVal > 0 ? (c.sales / maxChartVal) * 100 : 0;
              const purchasesPercent = maxChartVal > 0 ? (c.purchases / maxChartVal) * 100 : 0;

              return (
                <div key={i} className="flex-1 flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="w-full flex items-end justify-center gap-1.5 h-full">
                    {/* Sales Bar */}
                    <div
                      style={{ height: `${Math.max(salesPercent, 4)}%` }}
                      className="w-1/2 max-w-[24px] bg-[#16A34A] rounded-t-md transition-all group-hover:brightness-110 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                        {formatCurrency(c.sales)}
                      </div>
                    </div>

                    {/* Purchases Bar */}
                    <div
                      style={{ height: `${Math.max(purchasesPercent, 4)}%` }}
                      className="w-1/2 max-w-[24px] bg-blue-500 rounded-t-md transition-all group-hover:brightness-110 relative"
                    >
                      <div className="opacity-0 group-hover:opacity-100 absolute -top-8 left-1/2 -translate-x-1/2 bg-slate-900 text-white text-[10px] py-0.5 px-1.5 rounded pointer-events-none whitespace-nowrap z-20">
                        {formatCurrency(c.purchases)}
                      </div>
                    </div>
                  </div>
                  <span className="text-[11px] font-semibold text-slate-500">{c.month}</span>
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Recent Sales Invoices</h3>
                  <p className="text-xs text-slate-500">Latest customer transactions</p>
                </div>
                <Link
                  href="/sales"
                  className="text-xs font-bold text-[#16A34A] hover:text-[#059669] flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-2">Invoice</th>
                      <th className="py-2.5 px-2">Customer</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_sales && stats.recent_sales.length > 0 ? (
                      stats.recent_sales.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-2 font-bold font-mono text-[#0F172A]">
                            {s.invoice_no}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-slate-700">
                            {s.customer?.name || 'Walk-in Customer'}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">
                            {s.sale_date ? new Date(s.sale_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-extrabold text-[#16A34A]">
                            {formatCurrency(s.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
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
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold text-[#0F172A]">Recent Purchase Orders</h3>
                  <p className="text-xs text-slate-500">Latest supplier requisitions</p>
                </div>
                <Link
                  href="/purchases"
                  className="text-xs font-bold text-blue-600 hover:text-blue-700 flex items-center gap-1 transition-colors"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-2">Purchase #</th>
                      <th className="py-2.5 px-2">Supplier</th>
                      <th className="py-2.5 px-2">Date</th>
                      <th className="py-2.5 px-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {stats?.recent_purchases && stats.recent_purchases.length > 0 ? (
                      stats.recent_purchases.map((p) => (
                        <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                          <td className="py-2.5 px-2 font-bold font-mono text-[#0F172A]">
                            {p.purchase_no}
                          </td>
                          <td className="py-2.5 px-2 font-medium text-slate-700">
                            {p.supplier?.name || 'General Supplier'}
                          </td>
                          <td className="py-2.5 px-2 text-slate-500">
                            {p.purchase_date ? new Date(p.purchase_date).toLocaleDateString() : '—'}
                          </td>
                          <td className="py-2.5 px-2 text-right font-extrabold text-blue-600">
                            {formatCurrency(p.grand_total)}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={4} className="py-6 text-center text-slate-400">
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
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-base font-bold text-[#0F172A]">Low Stock Products Alert</h3>
            <p className="text-xs text-slate-500">Products reaching minimum threshold limits</p>
          </div>
          <Link
            href="/stock"
            className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
          >
            <span>View All Stock</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-2.5 px-2">Product Name</th>
                <th className="py-2.5 px-2">SKU</th>
                <th className="py-2.5 px-2 text-center">Current Stock</th>
                <th className="py-2.5 px-2 text-center">Threshold</th>
                <th className="py-2.5 px-2 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
                stats.low_stock_products.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="py-2.5 px-2 font-bold text-[#0F172A]">
                      {item.name}
                    </td>
                    <td className="py-2.5 px-2 font-mono text-slate-500">
                      {item.sku}
                    </td>
                    <td className="py-2.5 px-2 text-center font-extrabold text-rose-600">
                      {item.stock_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-2.5 px-2 text-center font-semibold text-slate-500">
                      {item.alert_quantity} {item.unit?.short_name || 'units'}
                    </td>
                    <td className="py-2.5 px-2 text-right">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3 h-3" /> Low Stock
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500 font-medium">
                    ✨ Great! All product stock levels are currently above minimum threshold limits.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION J: Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-[#0F172A] mb-4">
          Active Role Access Privileges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${user?.role === 'admin' ? 'border-[#16A34A] bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Administrator</span>
              {user?.role === 'admin' && <span className="text-xs font-bold text-[#16A34A]">Active Session</span>}
            </div>
            <ul className="text-xs space-y-1.5 text-slate-600">
              <li>• Full system module access (Sales, Purchases, Ledgers)</li>
              <li>• User management & role governance</li>
              <li>• Database backups & system restores</li>
              <li>• Comprehensive financial audit reports</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${user?.role === 'staff' ? 'border-[#16A34A] bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Staff Member</span>
              {user?.role === 'staff' && <span className="text-xs font-bold text-[#16A34A]">Active Session</span>}
            </div>
            <ul className="text-xs space-y-1.5 text-slate-600">
              <li>• Create and manage Sales & Purchase orders</li>
              <li>• Customer & Supplier ledger operations</li>
              <li>• Record Payments & Expense transactions</li>
              <li>• Access operational reports & inventory status</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${user?.role === 'viewer' ? 'border-[#16A34A] bg-emerald-50/40 shadow-xs' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Viewer</span>
              {user?.role === 'viewer' && <span className="text-xs font-bold text-[#16A34A]">Active Session</span>}
            </div>
            <ul className="text-xs space-y-1.5 text-slate-600">
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
