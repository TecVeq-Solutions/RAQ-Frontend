'use client';

import React from 'react';
import Link from 'next/link';
import { User } from '@/types/auth';
import {
  TrendingUp,
  Boxes,
  AlertTriangle,
  Receipt,
  Briefcase,
  DollarSign,
  CreditCard,
  Plus,
  ArrowRight,
  ShoppingCart,
  Clock,
  CheckCircle2,
  Calendar,
  Activity,
  ArrowUpRight,
  Sparkles,
  ShieldAlert,
  Eye,
  Layers,
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

interface LowStockItem {
  id: number;
  name: string;
  sku: string;
  stock_quantity: number;
  alert_quantity: number;
  unit?: { name: string; short_name: string };
}

export interface StaffDashboardStats {
  today_sales: number;
  today_sales_count: number;
  today_transactions_count: number;
  today_payments_received: number;
  today_payments_count: number;
  stock_items: number;
  low_stock_alerts: number;
  low_stock_products: LowStockItem[];
  recent_sales: RecentSale[];
}

interface StaffDashboardProps {
  user: User | null;
  stats: StaffDashboardStats | null;
  formatCurrency: (val: number | null | undefined) => string;
}

export default function StaffDashboard({
  user,
  stats,
  formatCurrency,
}: StaffDashboardProps) {
  const currentDateFormatted = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div className="space-y-8 animate-fadeIn w-full pb-16">
      {/* SECTION 1: Staff Hero Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 p-7 sm:p-9 text-white shadow-xl shadow-slate-950/20 border border-slate-800">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/20 to-transparent pointer-events-none" />
        <div className="absolute left-1/3 bottom-0 -mb-12 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="space-y-2.5">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border bg-blue-500/20 text-blue-300 border-blue-500/40 shadow-xs">
                <Briefcase className="w-3.5 h-3.5 text-blue-400" />
                <span>STAFF OPERATIONS DESK</span>
              </span>
              <span className="text-slate-300 text-xs font-semibold flex items-center gap-1.5 bg-slate-800/90 px-3 py-1 rounded-full border border-slate-700/60">
                <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                <span>{currentDateFormatted}</span>
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Welcome, <span className="text-emerald-400">{user?.name || 'Staff Member'}</span>!
            </h1>
            <p className="text-sm sm:text-base text-slate-300 max-w-2xl font-medium leading-relaxed">
              Daily Point-of-Sale operations, customer payment receipts, purchase requisitions, and inventory stock monitoring.
            </p>
          </div>

          {/* Shift Status Pill */}
          <div className="flex-shrink-0 bg-slate-800/90 backdrop-blur-md rounded-2xl p-4 sm:p-5 border border-slate-700/70 flex items-center gap-4 shadow-lg">
            <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Active Staff Session
              </div>
              <div className="text-sm sm:text-base font-black text-emerald-300">
                Daily POS & Sales Ready
              </div>
              <div className="text-xs text-slate-400 font-mono mt-0.5">
                Role: Operations Staff
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: Prominent Quick Actions */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <div className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-slate-500 flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#16A34A]" />
            <span>Operational Quick Actions</span>
          </div>
          <span className="text-xs font-semibold text-slate-400">Direct Entry Shortcuts</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Quick Action: New Sale */}
          <Link
            href="/sales/new"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-emerald-500 to-emerald-600 text-white shadow-md shadow-emerald-600/20 hover:shadow-lg hover:shadow-emerald-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-emerald-400/30"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100 flex items-center gap-1.5">
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Point of Sale</span>
              </div>
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>+ New Sale</span>
              </div>
              <p className="text-xs text-emerald-100 font-medium">Record Cash / Credit Sale</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold group-hover:rotate-90 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
          </Link>

          {/* Quick Action: Receive Customer Payment */}
          <Link
            href="/payments/receive"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-teal-600 to-teal-700 text-white shadow-md shadow-teal-600/20 hover:shadow-lg hover:shadow-teal-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-teal-500/30"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-teal-100 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5" />
                <span>Collection</span>
              </div>
              <div className="text-lg font-black tracking-tight text-white">
                <span>+ Receive Payment</span>
              </div>
              <p className="text-xs text-teal-100 font-medium">Customer Payment Receipt</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold group-hover:scale-110 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
          </Link>

          {/* Quick Action: New Purchase */}
          <Link
            href="/purchases/new"
            className="group relative overflow-hidden p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 text-white shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-600/30 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-blue-500/30"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100 flex items-center gap-1.5">
                <Receipt className="w-3.5 h-3.5" />
                <span>Procurement</span>
              </div>
              <div className="text-lg font-black tracking-tight text-white">
                <span>+ New Purchase</span>
              </div>
              <p className="text-xs text-blue-100 font-medium">Supplier Order Requisition</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-white/20 text-white flex items-center justify-center font-bold group-hover:rotate-90 transition-transform">
              <Plus className="w-6 h-6" />
            </div>
          </Link>

          {/* Quick Action: View Stock */}
          <Link
            href="/stock"
            className="group relative overflow-hidden p-5 rounded-2xl bg-slate-800 hover:bg-slate-900 text-white shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-between cursor-pointer border border-slate-700"
          >
            <div className="space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-amber-400" />
                <span>Inventory Catalog</span>
              </div>
              <div className="text-lg font-black tracking-tight text-white flex items-center gap-1.5">
                <span>View Live Stock</span>
              </div>
              <p className="text-xs text-slate-400 font-medium">Inspect Available Quantities</p>
            </div>
            <div className="w-11 h-11 rounded-xl bg-slate-700 text-white flex items-center justify-center font-bold group-hover:translate-x-1 transition-transform">
              <ArrowRight className="w-5 h-5" />
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 3: 4 Staff Operational Metric Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg sm:text-xl font-black text-[#0F172A] tracking-tight">
            Today&apos;s Operations Overview
          </h2>
          <span className="text-xs sm:text-sm text-slate-500 font-semibold flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 text-emerald-600" />
            <span>Live Today&apos;s Summary</span>
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Today's Sales */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Sales
              </span>
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-100/80 font-bold shrink-0">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                {formatCurrency(stats?.today_sales)}
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#16A34A] mt-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>{stats?.today_sales_count ?? 0} Invoices Billed Today</span>
              </div>
            </div>
          </div>

          {/* Card 2: Today's Transactions */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Transactions
              </span>
              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100/80 font-bold shrink-0">
                <Activity className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-[#0F172A] tracking-tight">
                {stats?.today_transactions_count ?? 0} <span className="text-sm text-slate-400 font-bold">Ops</span>
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                Sales + Payment Collections Today
              </div>
            </div>
          </div>

          {/* Card 3: Today's Payments Received */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all">
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Payments Received
              </span>
              <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center border border-teal-100/80 font-bold shrink-0">
                <CreditCard className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-teal-800 tracking-tight">
                {formatCurrency(stats?.today_payments_received)}
              </div>
              <div className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-teal-700 mt-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-600" />
                <span>{stats?.today_payments_count ?? 0} Collections Recorded</span>
              </div>
            </div>
          </div>

          {/* Card 4: Current Stock / Low Stock Alerts */}
          <Link
            href="/stock"
            className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm hover:shadow-md transition-all group block cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-500 group-hover:text-rose-600 transition-colors">
                Stock / Low Stock Alerts
              </span>
              <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center border border-rose-100/80 font-bold shrink-0 group-hover:scale-110 transition-transform">
                <AlertTriangle className="w-6 h-6" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-rose-600 flex items-center justify-between tracking-tight">
                <span>{stats?.low_stock_alerts ?? 0} <span className="text-sm font-bold text-slate-500">Alerts</span></span>
                <ArrowRight className="w-5 h-5 text-rose-400 group-hover:translate-x-1.5 transition-transform" />
              </div>
              <div className="text-xs sm:text-sm text-slate-500 mt-1.5 font-semibold">
                <span>Total SKUs: {stats?.stock_items ?? 0}</span>
              </div>
            </div>
          </Link>
        </div>
      </div>

      {/* SECTION 4: Operational Data Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Sales Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Recent Sales Activity</h3>
                <p className="text-xs sm:text-sm text-slate-500">Latest customer point-of-sale invoices</p>
              </div>
              <Link
                href="/sales"
                className="text-xs sm:text-sm font-bold text-[#16A34A] hover:text-emerald-700 flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>View All Sales</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead>
                  <tr className="border-b border-slate-200/80 text-slate-600 font-bold text-xs uppercase tracking-wider bg-slate-50/70">
                    <th className="py-3.5 px-3">Invoice</th>
                    <th className="py-3.5 px-3">Customer</th>
                    <th className="py-3.5 px-3">Status</th>
                    <th className="py-3.5 px-3 text-right">Grand Total</th>
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
                        <td className="py-3.5 px-3">
                          <span
                            className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold uppercase ${
                              s.payment_status === 'paid'
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                : s.payment_status === 'partial'
                                ? 'bg-amber-50 text-amber-700 border border-amber-200'
                                : 'bg-rose-50 text-rose-700 border border-rose-200'
                            }`}
                          >
                            {s.payment_status}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right font-black text-sm sm:text-base text-[#16A34A]">
                          {formatCurrency(s.grand_total)}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-400 font-medium text-sm">
                        No sales recorded yet. Click &quot;+ New Sale&quot; to begin.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Link
              href="/sales/new"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#16A34A] hover:underline"
            >
              <span>Create New Invoice &rarr;</span>
            </Link>
          </div>
        </div>

        {/* Low Stock Alerts Table */}
        <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200/90 shadow-sm flex flex-col justify-between space-y-4">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#0F172A]">Low Stock Inventory</h3>
                <p className="text-xs sm:text-sm text-slate-500">Items reaching replenishment thresholds</p>
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
                    <th className="py-3.5 px-3">Product Name</th>
                    <th className="py-3.5 px-3">SKU</th>
                    <th className="py-3.5 px-3 text-center">Current</th>
                    <th className="py-3.5 px-3 text-right">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {stats?.low_stock_products && stats.low_stock_products.length > 0 ? (
                    stats.low_stock_products.map((item) => (
                      <tr key={item.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-3 font-bold text-slate-900 text-sm">
                          {item.name}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-medium text-slate-500 text-xs">
                          {item.sku}
                        </td>
                        <td className="py-3.5 px-3 text-center font-black text-rose-600 text-sm">
                          {item.stock_quantity} {item.unit?.short_name || 'units'}
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-black bg-rose-50 text-rose-700 border border-rose-200">
                            <AlertTriangle className="w-3 h-3" /> Low
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-slate-500 font-semibold text-sm">
                        ✨ All product stocks are above minimum alert thresholds.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="pt-2 border-t border-slate-100 flex justify-end">
            <Link
              href="/stock"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:underline"
            >
              <span>Inspect Full Stock Catalog &rarr;</span>
            </Link>
          </div>
        </div>
      </div>

      {/* SECTION 5: Operational Governance Notice */}
      <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold shrink-0">
            <Briefcase className="w-5 h-5" />
          </div>
          <div>
            <div className="text-sm font-bold text-slate-900">
              Staff Role Access Boundary
            </div>
            <p className="text-xs text-slate-500">
              You have access to Sales, Purchases, Payments, Stock, and Reports. Admin management functions (User governance, System Settings, Backup & Restore) are reserved for Administrators.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
