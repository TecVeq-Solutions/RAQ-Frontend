'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Role } from '@/types/auth';
import { authService } from '@/lib/auth';
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Boxes,
  Users,
  Building2,
  BarChart3,
  UserCog,
  LogOut,
  ShieldCheck,
  Briefcase,
  Eye,
  ChevronDown,
  ChevronRight,
  CreditCard,
  FileSpreadsheet,
  Database,
  PlusCircle,
  History,
  FileText,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

interface SidebarProps {
  user: User | null;
  isOpen: boolean;
  onClose: () => void;
}

interface SubMenuItem {
  name: string;
  href: string;
  badge?: string;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  href?: string;
  children?: SubMenuItem[];
  badge?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff', 'viewer'],
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    roles: ['admin', 'staff'],
    children: [
      { name: 'New Sale', href: '/sales/new' },
      { name: 'Sales History', href: '/sales' },
      { name: 'Receipts / Invoices', href: '/sales/invoices' },
    ],
  },
  {
    name: 'Purchases',
    icon: Receipt,
    roles: ['admin', 'staff'],
    children: [
      { name: 'New Purchase', href: '/purchases/new' },
      { name: 'Purchase History', href: '/purchases' },
    ],
  },
  {
    name: 'Stock & Inventory',
    icon: Boxes,
    roles: ['admin', 'staff', 'viewer'],
    children: [
      { name: 'Products', href: '/products' },
      { name: 'Stock', href: '/stock' },
      { name: 'Stock Movements', href: '/stock-movements' },
      { name: 'Low Stock', href: '/low-stock' },
    ],
  },
  {
    name: 'Customers',
    icon: Users,
    roles: ['admin', 'staff'],
    children: [
      { name: 'Customer List', href: '/customers' },
      { name: 'Add Customer', href: '/customers/new' },
      { name: 'Customer Ledger', href: '/customers/ledger' },
    ],
  },
  {
    name: 'Suppliers',
    icon: Building2,
    roles: ['admin', 'staff'],
    children: [
      { name: 'Supplier List', href: '/suppliers' },
      { name: 'Add Supplier', href: '/suppliers/new' },
      { name: 'Supplier Ledger', href: '/suppliers/ledger' },
    ],
  },
  {
    name: 'Payments',
    icon: CreditCard,
    roles: ['admin', 'staff'],
    children: [
      { name: 'Receive Payment', href: '/payments/receive' },
      { name: 'Payment History', href: '/payments' },
    ],
  },
  {
    name: 'Expenses',
    icon: FileSpreadsheet,
    roles: ['admin', 'staff'],
    children: [
      { name: 'Add Expense', href: '/expenses/new' },
      { name: 'Expense History', href: '/expenses' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'staff', 'viewer'],
    children: [
      { name: 'Sales Report', href: '/reports/sales' },
      { name: 'Purchase Report', href: '/reports/purchases' },
      { name: 'Profit Report', href: '/reports/profit' },
      { name: 'Customer-wise Sales', href: '/reports/customer-sales' },
      { name: 'Outstanding Report', href: '/reports/outstanding' },
    ],
  },
  {
    name: 'User Management',
    href: '/users',
    icon: UserCog,
    roles: ['admin'],
    badge: 'Admin',
  },
  {
    name: 'Backup & Restore',
    href: '/backup',
    icon: Database,
    roles: ['admin'],
    badge: 'Admin',
  },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const userRole = user?.role || 'viewer';

  // Manage open state for accordion menus
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  // Auto-expand menu if current path matches any of its children
  useEffect(() => {
    const initialOpen: Record<string, boolean> = {};
    MENU_ITEMS.forEach((item) => {
      if (item.children) {
        const hasActiveChild = item.children.some((child) => pathname === child.href);
        if (hasActiveChild) {
          initialOpen[item.name] = true;
        }
      }
    });
    setOpenMenus((prev) => ({ ...prev, ...initialOpen }));
  }, [pathname]);

  const toggleMenu = (menuName: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [menuName]: !prev[menuName],
    }));
  };

  // Filter navigation items based on current user role
  const visibleMenuItems = MENU_ITEMS.filter((item) =>
    item.roles.includes(userRole)
  );

  const getRoleBadge = (role: Role) => {
    switch (role) {
      case 'admin':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800 border border-emerald-200">
            <ShieldCheck className="w-3 h-3 text-[#16A34A]" /> Admin
          </span>
        );
      case 'staff':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-100 text-blue-800 border border-blue-200">
            <Briefcase className="w-3 h-3 text-blue-600" /> Staff
          </span>
        );
      case 'viewer':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
            <Eye className="w-3 h-3 text-slate-500" /> Viewer
          </span>
        );
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-900/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 bg-white border-r border-slate-200 flex flex-col transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between flex-shrink-0">
          <Link href="/dashboard" className="flex items-center gap-3">
            <img
              src="/tecveq-logo.png"
              alt="Tecveq Logo"
              className="w-10 h-10 object-contain rounded-xl shadow-xs"
            />
            <div>
              <div className="text-base font-bold text-[#0F172A] tracking-tight leading-tight">
                Tecveq Suite
              </div>
              <div className="text-[11px] font-medium text-slate-400">
                Sales & Stock Accounting
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-4 pt-4 sm:pt-6 lg:pt-8 pb-4 space-y-1 scrollbar-thin">
          <div className="px-3 py-1.5 text-[10px] sm:text-[13px] font-extrabold uppercase tracking-wider text-slate-400">
            Main Navigation
          </div>

          {visibleMenuItems.map((item) => {
            const Icon = item.icon;
            const hasChildren = !!item.children && item.children.length > 0;
            const isMenuOpen = openMenus[item.name];

            // Parent link active state logic
            const isParentActive = item.href
              ? pathname === item.href
              : item.children?.some((child) => pathname === child.href);

            if (hasChildren) {
              return (
                <div key={item.name} className="space-y-1">
                  {/* Expandable Menu Header Button */}
                  <button
                    type="button"
                    onClick={() => toggleMenu(item.name)}
                    className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${isParentActive
                      ? 'bg-emerald-50 text-[#16A34A] font-semibold border border-emerald-100'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-[#0F172A]'
                      }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        className={`w-5 h-5 transition-colors ${isParentActive ? 'text-[#16A34A]' : 'text-slate-400 group-hover:text-[#16A34A]'
                          }`}
                      />
                      <span>{item.name}</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {isMenuOpen ? (
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-4 h-4 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {/* Submenu Links Accordion */}
                  {isMenuOpen && (
                    <div className="pl-9 pr-1 py-1 space-y-1 border-l-2 border-slate-100 ml-5">
                      {item.children?.map((child) => {
                        const isChildActive = pathname === child.href;
                        return (
                          <Link
                            key={child.href}
                            href={child.href}
                            onClick={onClose}
                            className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-all ${isChildActive
                              ? 'bg-[#16A34A] text-white shadow-xs font-semibold'
                              : 'text-slate-500 hover:bg-slate-100 hover:text-[#0F172A]'
                              }`}
                          >
                            <span>{child.name}</span>
                            {child.badge && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded font-bold uppercase bg-amber-100 text-amber-800">
                                {child.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            }

            // Single Menu Link Item (e.g., Dashboard, User Management, Backup)
            return (
              <Link
                key={item.name}
                href={item.href || '#'}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl font-medium text-sm transition-all group ${isParentActive
                  ? 'bg-[#16A34A] text-white shadow-sm font-semibold'
                  : 'text-slate-600 hover:bg-slate-100 hover:text-[#0F172A]'
                  }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-5 h-5 transition-colors ${isParentActive ? 'text-white' : 'text-slate-400 group-hover:text-[#16A34A]'
                      }`}
                  />
                  <span>{item.name}</span>
                </div>

                {item.badge ? (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase ${isParentActive
                      ? 'bg-white/20 text-white'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      }`}
                  >
                    {item.badge}
                  </span>
                ) : (
                  isParentActive && <ChevronRight className="w-4 h-4 text-white/70" />
                )}
              </Link>
            );
          })}
        </div>

        {/* Logout Footer */}
        <div className="p-3 border-t border-slate-100 flex-shrink-0">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              authService.logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-100 cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
