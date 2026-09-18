'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { superAdminAuthService } from '@/lib/superAdminAuth';
import { SuperAdminUser } from '@/types/superAdminAuth';
import {
  LogOut,
  Layers,
  Clock,
  LayoutDashboard,
  PackageCheck,
  KeyRound,
  Building2,
  ScrollText,
  Bell,
} from 'lucide-react';
import { NotificationBell } from '@/components/notifications/NotificationBell';

export default function SuperAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<SuperAdminUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentTime, setCurrentTime] = useState<string>('');
  const pathname = usePathname();

  useEffect(() => {
    // 1. Initial immediate load from stored cookie
    const cachedUser = superAdminAuthService.getUserFromCookie();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    } else {
      // 2. Fetch fresh user profile from API endpoint /api/super-admin/me
      superAdminAuthService
        .getCurrentUser()
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
          } else {
            window.location.href = '/super-admin-login';
          }
        })
        .catch(() => {
          window.location.href = '/super-admin-login';
        })
        .finally(() => {
          setLoading(false);
        });
    }

    // Set clock
    const updateTime = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = async () => {
    await superAdminAuthService.logout();
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center animate-spin">
            <Layers className="w-6 h-6 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-white font-semibold text-base">Initializing Platform Control Panel</h2>
            <p className="text-slate-400 text-xs mt-1">Verifying Super Administrator credentials...</p>
          </div>
        </div>
      </div>
    );
  }

  const isDashboardActive = pathname === '/super-admin/dashboard' || pathname === '/super-admin';
  const isPackagesActive = pathname.startsWith('/super-admin/packages');
  const isLicensesActive = pathname.startsWith('/super-admin/licenses');
  const isTenantsActive = pathname.startsWith('/super-admin/tenants');
  const isLogsActive = pathname.startsWith('/super-admin/logs');

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col antialiased selection:bg-indigo-500 selection:text-white">
      {/* Top Super Admin Platform Navigation */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-slate-900/80 border-b border-slate-800/80 px-4 sm:px-6 lg:px-8 py-3 transition-all">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand & Platform Badge */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 flex items-center justify-center">
              <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                <Layers className="w-5 h-5 text-indigo-400" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-white text-base tracking-tight">RAQ Platform</span>
                <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 tracking-wider">
                  Super Admin
                </span>
              </div>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                SaaS Infrastructure & Multi-Tenant Orchestration
              </p>
            </div>
          </div>

          {/* Center Navigation Tabs & Status */}
          <div className="flex items-center gap-2 sm:gap-4">
            <nav className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 text-xs">
              <Link
                href="/super-admin/dashboard"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isDashboardActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/super-admin/packages"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isPackagesActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5" />
                <span>Packages & Limits</span>
              </Link>

              <Link
                href="/super-admin/licenses"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isLicensesActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Licenses</span>
              </Link>

              <Link
                href="/super-admin/tenants"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isTenantsActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>Tenants</span>
              </Link>

              <Link
                href="/super-admin/logs"
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all ${
                  isLogsActive
                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5" />
                <span>System Logs</span>
              </Link>
            </nav>

            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span className="font-medium text-emerald-400">Online</span>
              <span className="text-slate-500">|</span>
              <div className="flex items-center gap-1.5 text-slate-400 text-[11px]">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
            </div>
          </div>

          {/* Right Super Admin Profile & Actions */}
          <div className="flex items-center gap-3">
            <NotificationBell basePath="/super-admin" />

            <div className="hidden sm:flex flex-col text-right">
              <span className="text-xs font-semibold text-slate-200">{user.name}</span>
              <span className="text-[11px] text-slate-400">{user.email}</span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400 font-bold text-xs shadow-inner">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="px-3 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all text-xs font-medium flex items-center gap-1.5 hover:shadow-lg hover:shadow-red-500/10 cursor-pointer"
              title="Sign Out Super Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950/50 py-4 px-6 text-center text-xs text-slate-400">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>RAQ Multi-Tenant Cloud ERP &bull; Platform Administration v1.0.0</span>
          <span className="text-slate-400">Phase 6 &bull; License Lifecycle Engine & Expiry Automation</span>
        </div>
      </footer>
    </div>
  );
}
