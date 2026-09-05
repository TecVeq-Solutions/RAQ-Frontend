'use client';

import React from 'react';
import { User } from '@/types/auth';
import { authService } from '@/lib/auth';
import { Menu, LogOut, CheckCircle } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 2xl:h-20 bg-white border-b border-slate-200 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
      {/* Left: Mobile Menu Toggle, Logo & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 max-w-[65%] sm:max-w-none">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:outline-none cursor-pointer shrink-0"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Brand / Logo for Mobile & Desktop */}
        <div className="flex items-center gap-2.5 min-w-0">
          <img
            src="/tecveq-logo.png"
            alt="Tecveq Logo"
            className="w-8 h-8 2xl:w-9 2xl:h-9 object-contain rounded-lg shadow-xs shrink-0 lg:hidden"
          />
          <div className="min-w-0 truncate">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-[13.5px] sm:text-[15px] 2xl:text-base font-bold text-slate-900 tracking-tight leading-tight truncate">
                Tecveq Suite
              </span>
              <span className="hidden xs:inline-flex items-center px-1.5 py-0.2 bg-emerald-100 text-emerald-800 text-[10px] font-bold rounded">
                ERP
              </span>
            </div>
            <div className="text-[11px] 2xl:text-xs font-medium text-slate-500 truncate leading-tight flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0 hidden sm:inline-block animate-pulse" />
              <span className="truncate">Sales & Accounting ERP</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right: User Information & Action */}
      <div className="flex items-center gap-2 sm:gap-4 shrink-0">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs 2xl:text-sm font-semibold rounded-full">
          <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
          <span>API Connected</span>
        </div>

        {/* User Badge Info */}
        <div className="flex items-center gap-2.5 sm:gap-3 pl-2 sm:pl-3 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-xs 2xl:text-sm font-bold text-slate-900 leading-tight truncate max-w-[150px]">
              {user?.name || 'User'}
            </div>
            <div className="text-[11px] 2xl:text-xs text-slate-400 capitalize font-medium">
              {user?.role ? `${user.role} role` : 'Authenticated'}
            </div>
          </div>

          <div className="w-8 h-8 sm:w-9 sm:h-9 2xl:w-10 2xl:h-10 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs 2xl:text-sm shadow-xs shrink-0">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>

          {/* Quick Logout Button */}
          <button
            type="button"
            title="Sign Out"
            onClick={(e) => {
              e.preventDefault();
              authService.logout();
            }}
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4 2xl:w-5 2xl:h-5" />
          </button>
        </div>
      </div>
    </header>
  );
}
