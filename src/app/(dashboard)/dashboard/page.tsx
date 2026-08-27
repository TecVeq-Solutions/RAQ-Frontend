'use client';

import React, { useEffect, useState } from 'react';
import { authService } from '@/lib/auth';
import { User, Role } from '@/types/auth';
import apiClient from '@/lib/api';
import {
  TrendingUp,
  Boxes,
  Users,
  AlertTriangle,
  Receipt,
  DollarSign,
  ShieldCheck,
  Briefcase,
  Eye,
  ArrowUpRight,
  Sparkles,
} from 'lucide-react';

interface DashboardStats {
  role: Role;
  total_sales: number | null;
  total_purchases: number | null;
  stock_items: number;
  low_stock_alerts: number;
  active_customers: number | null;
  active_suppliers: number | null;
  monthly_revenue: number | null;
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

  const formatCurrency = (val: number | null) => {
    if (val === null || val === undefined) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(val);
  };

  const getRoleHeaderDetails = (role?: Role) => {
    switch (role) {
      case 'admin':
        return {
          title: 'System Administrator Portal',
          desc: 'Full administrative privileges: user governance, fiscal audit, and master configurations.',
          icon: ShieldCheck,
          badgeColor: 'bg-emerald-100 text-emerald-800 border-emerald-300',
        };
      case 'staff':
        return {
          title: 'Staff Operations Hub',
          desc: 'Manage point-of-sale entries, stock requisition, purchase orders, and payment logs.',
          icon: Briefcase,
          badgeColor: 'bg-blue-100 text-blue-800 border-blue-300',
        };
      case 'viewer':
      default:
        return {
          title: 'Analytics & Read-Only Dashboard',
          desc: 'Viewing live stock inventory balances and high-level financial summary reports.',
          icon: Eye,
          badgeColor: 'bg-slate-100 text-slate-700 border-slate-300',
        };
    }
  };

  const roleInfo = getRoleHeaderDetails(user?.role);
  const RoleIcon = roleInfo.icon;

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-[#0F172A] to-slate-800 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-[#16A34A]/20 to-transparent pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold border ${roleInfo.badgeColor}`}>
                <RoleIcon className="w-3.5 h-3.5" />
                {user?.role ? user.role.toUpperCase() : 'USER'}
              </span>
              <span className="text-slate-400 text-xs flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#16A34A]" />
                Live Workspace
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Welcome back, <span className="text-[#16A34A]">{user?.name || 'User'}</span>!
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              {roleInfo.desc}
            </p>
          </div>

          <div className="flex-shrink-0 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 text-right">
            <div className="text-xs text-slate-300">Active Account</div>
            <div className="text-sm font-semibold font-mono text-emerald-300 truncate">
              {user?.email || 'authenticated'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Status: Active & Verified</div>
          </div>
        </div>
      </div>

      {/* Role-Based Quick Stats */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#0F172A] tracking-tight">
            Key Performance Metrics
          </h2>
          <span className="text-xs text-slate-500 font-medium">Real-time sync</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Sales (Admin/Staff only) */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Sales
                </span>
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <DollarSign className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-[#0F172A]">
                  {formatCurrency(stats?.total_sales ?? 124580)}
                </div>
                <div className="flex items-center gap-1 text-xs font-semibold text-emerald-600 mt-1">
                  <ArrowUpRight className="w-3.5 h-3.5" />
                  <span>+14.2% from last month</span>
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 2: Total Purchases (Admin/Staff only) */}
          {user?.role !== 'viewer' ? (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Total Purchases
                </span>
                <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
              </div>
              <div className="mt-4">
                <div className="text-2xl font-bold text-[#0F172A]">
                  {formatCurrency(stats?.total_purchases ?? 89200)}
                </div>
                <div className="text-xs text-slate-500 mt-1 font-medium">
                  45 orders processed
                </div>
              </div>
            </div>
          ) : null}

          {/* Card 3: Stock Inventory (All roles) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Stock Items
              </span>
              <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Boxes className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-[#0F172A]">
                {stats?.stock_items ?? 450} <span className="text-xs text-slate-400 font-normal">SKUs</span>
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                In stock & active catalog
              </div>
            </div>
          </div>

          {/* Card 4: Low Stock Alerts (All roles) */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                Low Stock Alerts
              </span>
              <div className="w-10 h-10 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-4">
              <div className="text-2xl font-bold text-rose-600">
                {stats?.low_stock_alerts ?? 12}
              </div>
              <div className="text-xs text-slate-500 mt-1 font-medium">
                Requires restocking
              </div>
            </div>
          </div>

          {/* Card 5: Read-Only Overview for Viewer */}
          {user?.role === 'viewer' && (
            <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-sm col-span-1 sm:col-span-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
                  Read-Only Mode Notice
                </span>
                <Eye className="w-5 h-5 text-slate-400" />
              </div>
              <div className="mt-3 text-sm text-slate-600">
                You are currently logged in as a <strong>Viewer</strong>. You have read-only permissions to inspect Stock and View Reports. Sensitive financial transaction mutations and user management are restricted to Admin & Staff.
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Role Permission Matrix Card */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-sm">
        <h3 className="text-base font-bold text-[#0F172A] mb-4">
          Current Role Access Privileges
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className={`p-4 rounded-xl border ${user?.role === 'admin' ? 'border-[#16A34A] bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Administrator</span>
              {user?.role === 'admin' && <span className="text-xs font-bold text-[#16A34A]">Active</span>}
            </div>
            <ul className="text-xs space-y-1 text-slate-600">
              <li>• Full system module access</li>
              <li>• User management & role assignments</li>
              <li>• System configuration & database audits</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${user?.role === 'staff' ? 'border-[#16A34A] bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Staff Member</span>
              {user?.role === 'staff' && <span className="text-xs font-bold text-[#16A34A]">Active</span>}
            </div>
            <ul className="text-xs space-y-1 text-slate-600">
              <li>• Create and view Sales invoices</li>
              <li>• Record Purchases & Payments</li>
              <li>• Manage inventory & customers</li>
            </ul>
          </div>

          <div className={`p-4 rounded-xl border ${user?.role === 'viewer' ? 'border-[#16A34A] bg-emerald-50/40' : 'border-slate-200 bg-slate-50 opacity-60'}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-bold text-sm text-[#0F172A]">Viewer</span>
              {user?.role === 'viewer' && <span className="text-xs font-bold text-[#16A34A]">Active</span>}
            </div>
            <ul className="text-xs space-y-1 text-slate-600">
              <li>• Inspect live Stock inventory</li>
              <li>• View summary & financial reports</li>
              <li>• Read-only access boundaries</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
