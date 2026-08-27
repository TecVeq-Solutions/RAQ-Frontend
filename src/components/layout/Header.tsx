'use client';

import React from 'react';
import { User } from '@/types/auth';
import { authService } from '@/lib/auth';
import { Menu, LogOut, Shield, Bell, CheckCircle } from 'lucide-react';

interface HeaderProps {
  user: User | null;
  onMenuToggle: () => void;
}

export default function Header({ user, onMenuToggle }: HeaderProps) {
  return (
    <header className="h-16 bg-white border-b border-slate-200 px-4 sm:px-6 lg:px-8 flex items-center justify-between sticky top-0 z-30 shadow-sm">
      {/* Left: Mobile Menu Toggle & Title */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 focus:outline-none"
          aria-label="Toggle navigation menu"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider hidden sm:inline-block">
            Sales & Accounting ERP
          </span>
        </div>
      </div>

      {/* Right: User Information & Action */}
      <div className="flex items-center gap-4">
        {/* System Status Pill */}
        <div className="hidden md:flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-[#16A34A] text-xs font-medium rounded-full">
          <CheckCircle className="w-3.5 h-3.5" />
          <span>API Connected</span>
        </div>

        {/* User Badge Info */}
        <div className="flex items-center gap-3 pl-2 border-l border-slate-200">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-semibold text-[#0F172A] leading-tight">
              {user?.name || 'User'}
            </div>
            <div className="text-xs text-slate-400 capitalize">
              {user?.role ? `${user.role} role` : 'Authenticated'}
            </div>
          </div>

          <div className="w-9 h-9 rounded-full bg-[#0F172A] text-white flex items-center justify-center font-semibold text-xs shadow-sm">
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
            className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors ml-1 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}
