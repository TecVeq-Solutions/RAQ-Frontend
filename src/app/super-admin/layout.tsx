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
  CreditCard,
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
      <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center p-6">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-12 h-12 rounded-2xl bg-emerald-100 border border-emerald-200 flex items-center justify-center animate-spin">
            <Layers className="w-6 h-6 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-slate-900 font-bold text-base">Initializing Platform Control Panel</h2>
            <p className="text-slate-500 text-xs mt-1">Verifying Super Administrator credentials...</p>
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
  const isPaymentsActive = pathname.startsWith('/super-admin/payments');

  return (
    <div 
      className="min-h-screen bg-[#F8FAFC] text-slate-900 flex flex-col antialiased selection:bg-emerald-600 selection:text-white font-sans"
      style={{ fontFamily: 'var(--font-poppins), Poppins, sans-serif' }}
    >
      {/* Top Subtle Brand Accent Line */}
      <div className="h-1 w-full bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-500" />

      {/* Top Super Admin Platform Navigation Header */}
      <header className="sticky top-0 z-50 backdrop-blur-md bg-white/95 border-b border-slate-200/90 px-3 sm:px-6 lg:px-8 py-2.5 transition-all shadow-xs">
        <div className="max-w-7xl 2xl:max-w-[1700px] mx-auto flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Top Row on Mobile: Brand, Status, Profile */}
          <div className="flex items-center justify-between gap-3">
            {/* Brand & Platform Badge */}
            <div className="flex items-center gap-2.5 sm:gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-600 p-0.5 shadow-xs flex items-center justify-center shrink-0">
                <div className="w-full h-full bg-emerald-600 rounded-[10px] flex items-center justify-center text-white">
                  <Layers className="w-5 h-5 text-white" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <span className="font-extrabold text-slate-900 text-sm sm:text-base tracking-tight">Tecveq SaaS</span>
                  <span className="text-[9px] sm:text-[10px] font-bold uppercase px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 border border-emerald-200 tracking-wider">
                    Super Admin
                  </span>
                </div>
                <p className="text-[10px] sm:text-[11px] text-slate-500 hidden sm:block">
                  Sales, Purchase, Stock & Multi-Tenant Platform
                </p>
              </div>
            </div>

            {/* Mobile-only profile & logout controls */}
            <div className="flex md:hidden items-center gap-2">
              <NotificationBell basePath="/super-admin" />
              <button
                onClick={handleLogout}
                type="button"
                className="p-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs transition-all cursor-pointer"
                title="Sign Out Super Admin"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Center Navigation Tabs */}
          <div className="flex items-center justify-between md:justify-center overflow-x-auto no-scrollbar py-0.5 gap-2">
            <nav className="flex items-center p-1 rounded-xl bg-slate-100/90 border border-slate-200 text-xs">
              <Link
                href="/super-admin/dashboard"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isDashboardActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 shrink-0" />
                <span>Dashboard</span>
              </Link>

              <Link
                href="/super-admin/packages"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isPackagesActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <PackageCheck className="w-3.5 h-3.5 shrink-0" />
                <span>Packages & Limits</span>
              </Link>

              <Link
                href="/super-admin/licenses"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isLicensesActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <KeyRound className="w-3.5 h-3.5 shrink-0" />
                <span>Licenses</span>
              </Link>

              <Link
                href="/super-admin/payments"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isPaymentsActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5 shrink-0" />
                <span>Payments</span>
              </Link>

              <Link
                href="/super-admin/tenants"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isTenantsActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <Building2 className="w-3.5 h-3.5 shrink-0" />
                <span>Tenants</span>
              </Link>

              <Link
                href="/super-admin/logs"
                className={`flex items-center gap-1.5 sm:gap-2 px-3 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap ${
                  isLogsActive
                    ? 'bg-emerald-600 text-white shadow-xs font-bold'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/80'
                }`}
              >
                <ScrollText className="w-3.5 h-3.5 shrink-0" />
                <span>System Logs</span>
              </Link>
            </nav>

            {/* Status indicator on desktop / tablets */}
            <div className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs text-slate-700 shadow-xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-emerald-700 text-[11px]">System Online</span>
              <span className="text-slate-300">|</span>
              <div className="flex items-center gap-1.5 text-slate-500 text-[11px] font-mono">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>{currentTime || '00:00:00'}</span>
              </div>
            </div>
          </div>

          {/* Right Super Admin Profile & Actions (Desktop view) */}
          <div className="hidden md:flex items-center gap-3">
            <NotificationBell basePath="/super-admin" />

            <div className="flex flex-col text-right">
              <span className="text-xs font-bold text-slate-900 leading-tight">{user.name}</span>
              <span className="text-[10px] text-slate-500">{user.email}</span>
            </div>

            <div className="w-9 h-9 rounded-xl bg-emerald-100 border border-emerald-200 flex items-center justify-center text-emerald-800 font-bold text-xs shadow-xs">
              {user.name.charAt(0).toUpperCase()}
            </div>

            <button
              onClick={handleLogout}
              type="button"
              className="px-3 py-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-all text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
              title="Sign Out Super Admin"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden lg:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl 2xl:max-w-[1700px] w-full mx-auto p-3.5 sm:p-6 lg:p-8 space-y-6">
        {children}
      </main>




      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 px-4 sm:px-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl 2xl:max-w-[1700px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-emerald-600" />
            <span className="text-slate-800 font-bold">Tecveq Multi-Tenant Cloud ERP</span>
            <span className="text-slate-300">&bull;</span>
            <span className="text-slate-500 text-[11px]">Platform Administration</span>
          </div>
          <span className="text-slate-400 text-[11px]">
            Enterprise Multi-Tenant Orchestration &bull; 256-bit Encrypted Session
          </span>
        </div>
      </footer>



    </div>
  );
}
