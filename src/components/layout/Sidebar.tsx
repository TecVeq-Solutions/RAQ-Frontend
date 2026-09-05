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
  Settings,
  Sparkles,
  CheckCircle2,
  X,
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
  section?: 'operations' | 'admin';
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    roles: ['admin', 'staff'],
    section: 'operations',
    children: [
      { name: 'New Sale (POS)', href: '/sales/new', badge: 'Fast POS' },
      { name: 'Sales History', href: '/sales' },
      { name: 'Receipts / Invoices', href: '/sales/invoices' },
    ],
  },
  {
    name: 'Purchases',
    icon: Receipt,
    roles: ['admin', 'staff'],
    section: 'operations',
    children: [
      { name: 'New Purchase', href: '/purchases/new' },
      { name: 'Purchase History', href: '/purchases' },
    ],
  },
  {
    name: 'Stock & Inventory',
    icon: Boxes,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    children: [
      { name: 'Products Catalog', href: '/products' },
      { name: 'Stock Balance', href: '/stock' },
      { name: 'Stock Movements', href: '/stock-movements' },
      { name: 'Low Stock Alerts', href: '/low-stock', badge: 'Alerts' },
    ],
  },
  {
    name: 'Customers',
    icon: Users,
    roles: ['admin'],
    section: 'operations',
    children: [
      { name: 'Customer Directory', href: '/customers' },
      { name: 'Add New Customer', href: '/customers/new' },
      { name: 'Customer Ledger (Khata)', href: '/customers/ledger' },
    ],
  },
  {
    name: 'Suppliers',
    icon: Building2,
    roles: ['admin'],
    section: 'operations',
    children: [
      { name: 'Supplier Directory', href: '/suppliers' },
      { name: 'Add New Supplier', href: '/suppliers/new' },
      { name: 'Supplier Ledger (Khata)', href: '/suppliers/ledger' },
    ],
  },
  {
    name: 'Payments',
    icon: CreditCard,
    roles: ['admin', 'staff'],
    section: 'operations',
    children: [
      { name: 'Receive Payment', href: '/payments/receive' },
      { name: 'Payment History', href: '/payments' },
    ],
  },
  {
    name: 'Expenses',
    icon: FileSpreadsheet,
    roles: ['admin'],
    section: 'operations',
    children: [
      { name: 'Add Expense', href: '/expenses/new' },
      { name: 'Expense History', href: '/expenses' },
    ],
  },
  {
    name: 'Reports',
    icon: BarChart3,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    children: [
      { name: 'Sales Report', href: '/reports/sales' },
      { name: 'Purchase Report', href: '/reports/purchases' },
      { name: 'Profit & Loss Report', href: '/reports/profit' },
      { name: 'Customer-wise Sales', href: '/reports/customer-sales' },
      { name: 'Outstanding Balances', href: '/reports/outstanding' },
    ],
  },
  {
    name: 'User Management',
    href: '/users',
    icon: UserCog,
    roles: ['admin'],
    section: 'admin',
    // badge: 'Admin',
  },
  {
    name: 'Backup & Restore',
    href: '/backup',
    icon: Database,
    roles: ['admin'],
    section: 'admin',
  },
  {
    name: 'System Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
    section: 'admin',
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
        const hasActiveChild = item.children.some((child) => {
          if (
            child.href === '/sales' ||
            child.href === '/purchases' ||
            child.href === '/customers' ||
            child.href === '/suppliers' ||
            child.href === '/payments' ||
            child.href === '/expenses' ||
            child.href === '/reports'
          ) {
            return pathname === child.href;
          }
          return pathname === child.href || pathname.startsWith(child.href + '/');
        });
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

  const operationsItems = visibleMenuItems.filter(
    (item) => item.section === 'operations'
  );
  const adminItems = visibleMenuItems.filter((item) => item.section === 'admin');

  const renderMenuItem = (item: MenuItem) => {
    const Icon = item.icon;
    const hasChildren = !!item.children && item.children.length > 0;
    const isMenuOpen = openMenus[item.name];

    // Parent link active state logic
    const isParentActive = item.href
      ? pathname === item.href
      : item.children?.some((child) => {
        if (
          child.href === '/sales' ||
          child.href === '/purchases' ||
          child.href === '/customers' ||
          child.href === '/suppliers' ||
          child.href === '/payments' ||
          child.href === '/expenses' ||
          child.href === '/reports'
        ) {
          return pathname === child.href;
        }
        return pathname === child.href || pathname.startsWith(child.href + '/');
      });

    if (hasChildren) {
      return (
        <div key={item.name} className="space-y-1">
          {/* Expandable Menu Header Button */}
          <button
            type="button"
            onClick={() => toggleMenu(item.name)}
            className={`w-full flex items-center justify-between px-3 2xl:px-3.5 py-2.5 2xl:py-3 rounded-xl font-semibold text-[13.5px] 2xl:text-[15px] transition-all group cursor-pointer ${isParentActive
              ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200/90 shadow-xs'
              : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950 border border-transparent'
              }`}
          >
            <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
              <div
                className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isParentActive
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                  }`}
              >
                <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
              </div>
              <span className="tracking-tight truncate font-bold text-slate-800 group-hover:text-slate-950">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              <ChevronDown
                className={`w-4 h-4 2xl:w-4.5 2xl:h-4.5 transition-transform duration-200 ${isMenuOpen ? 'rotate-180 text-emerald-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
              />
            </div>
          </button>

          {/* Submenu Links Accordion */}
          {isMenuOpen && (
            <div className="ml-4 2xl:ml-5 pl-3 2xl:pl-3.5 py-1 space-y-1 border-l-2 border-emerald-200/80">
              {item.children?.map((child) => {
                const isChildActive = pathname === child.href;
                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 2xl:py-2.5 rounded-xl text-[13px] 2xl:text-[14.5px] font-semibold transition-all group/sub ${isChildActive
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-950'
                      }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full transition-all shrink-0 ${isChildActive
                          ? 'bg-white scale-125 shadow-xs'
                          : 'bg-slate-300 group-hover/sub:bg-emerald-600'
                          }`}
                      />
                      <span className="truncate tracking-tight">{child.name}</span>
                    </div>
                    {child.badge && (
                      <span
                        className={`text-[9px] 2xl:text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${isChildActive
                          ? 'bg-white/25 text-white'
                          : 'bg-emerald-100/80 text-emerald-800'
                          }`}
                      >
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
        className={`flex items-center justify-between px-3 2xl:px-3.5 py-2.5 2xl:py-3 rounded-xl font-semibold text-[13.5px] 2xl:text-[15px] transition-all group ${isParentActive
          ? 'bg-emerald-600 text-white shadow-xs font-bold'
          : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
          }`}
      >
        <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
          <div
            className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${isParentActive
              ? 'bg-white/20 text-white'
              : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
              }`}
          >
            <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <span className="tracking-tight truncate font-bold">{item.name}</span>
        </div>

        {item.badge ? (
          <span
            className={`text-[9px] 2xl:text-[10px] px-1.5 py-0.5 rounded-md font-bold uppercase tracking-wider ${isParentActive
              ? 'bg-white/25 text-white'
              : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
              }`}
          >
            {item.badge}
          </span>
        ) : (
          isParentActive && (
            <ChevronRight className="w-4 h-4 2xl:w-4.5 2xl:h-4.5 text-white/80 shrink-0" />
          )
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 2xl:w-80 max-w-[85vw] sm:max-w-xs 2xl:max-w-sm bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-none lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'
          }`}
      >
        {/* Brand Header */}
        <div className="h-16 2xl:h-20 px-5 2xl:px-6 border-b border-slate-100 flex items-center justify-between flex-shrink-0 bg-white">
          <Link href="/dashboard" className="flex items-center gap-3 group">
            <div className="relative">
              <img
                src="/tecveq-logo.png"
                alt="Tecveq Logo"
                className="w-9 h-9 2xl:w-10 2xl:h-10 object-contain rounded-xl shadow-xs group-hover:scale-105 transition-transform"
              />
              <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-500 rounded-full border-2 border-white" />
            </div>
            <div>
              <div className="text-[15px] 2xl:text-[17px] font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                <span>Tecveq Suite</span>
                <span className="text-[10px] px-1.5 py-0.2 bg-emerald-100 text-emerald-800 font-bold rounded">
                  ERP
                </span>
              </div>
              <div className="text-[11px] 2xl:text-[12px] font-semibold text-slate-400">
                Sales, Stock & Accounting
              </div>
            </div>
          </Link>

          {/* Close button on mobile */}
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User Mini Profile Card */}
        {/* <div className="px-3.5 2xl:px-4.5 pt-3 pb-1 flex-shrink-0">
          <div className="p-2.5 2xl:p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 2xl:w-9 2xl:h-9 rounded-xl bg-slate-900 text-white font-bold flex items-center justify-center text-xs 2xl:text-sm shadow-xs shrink-0">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'A'}
              </div>
              <div className="min-w-0">
                <div className="text-xs 2xl:text-sm font-bold text-slate-900 truncate">
                  {user?.name || 'Administrator'}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] 2xl:text-xs text-slate-500">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="capitalize font-semibold text-emerald-700">{user?.role || 'admin'}</span>
                  <span>• Online</span>
                </div>
              </div>
            </div>

            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] 2xl:text-[11px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200 shrink-0">
              Active
            </span>
          </div>
        </div> */}

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 2xl:px-4.5 py-3 space-y-4 scrollbar-thin">
          {/* Operations & Main Section */}
          {operationsItems.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-1.5 text-[11px] 2xl:text-[12px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                Main Navigation
              </div>
              {operationsItems.map(renderMenuItem)}
            </div>
          )}

          {/* Admin & System Section */}
          {adminItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-3 pt-1 pb-1.5 text-[11px] 2xl:text-[12px] font-extrabold uppercase tracking-wider text-slate-400 select-none">
                System & Settings
              </div>
              {adminItems.map(renderMenuItem)}
            </div>
          )}
        </div>

        {/* Logout & Footer */}
        <div className="p-3 2xl:p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-[11px] 2xl:text-[12px] font-medium text-slate-400 px-1">
            <span>Tecveq Suite v2.4</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3 h-3" /> Live
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              authService.logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 2xl:py-3 rounded-xl text-[13.5px] 2xl:text-[15px] font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-200 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>
    </>
  );
}
