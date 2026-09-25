'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, Role } from '@/types/auth';
import { authService } from '@/lib/auth';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import UpgradeModuleDialog from '@/components/common/UpgradeModuleDialog';
import { ResolvedModule } from '@/types/moduleAccess';
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
  Factory,
  Wrench,
  Wallet,
  Lock,
  Bell,
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
  moduleCode?: string;
}

interface MenuItem {
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  roles: Role[];
  href?: string;
  children?: SubMenuItem[];
  badge?: string;
  section?: 'operations' | 'admin';
  moduleCode?: string;
}

const MENU_ITEMS: MenuItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    moduleCode: 'dashboard',
  },
  {
    name: 'Stock & Inventory',
    icon: Boxes,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    moduleCode: 'stock',
    children: [
      { name: 'Products Catalog', href: '/products' },
      { name: 'Stock Balance', href: '/stock' },
      { name: 'Stock Movements', href: '/stock-movements' },
      { name: 'Low Stock Alerts', href: '/low-stock', badge: 'Alerts' },
    ],
  },
  {
    name: 'Manufacturing',
    icon: Factory,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    moduleCode: 'manufacturing',
    children: [
      { name: 'Production Orders', href: '/manufacturing/orders' },
      { name: 'Launch Order', href: '/manufacturing/orders/new' },
      { name: 'Bill of Materials (BOM)', href: '/manufacturing/boms', moduleCode: 'bom' },
    ],
  },
  {
    name: 'Sales',
    icon: ShoppingCart,
    roles: ['admin', 'staff'],
    section: 'operations',
    moduleCode: 'sales',
    children: [
      { name: 'New Sale (POS)', href: '/sales/new', badge: 'Fast POS' },
      { name: 'Sales History', href: '/sales' },
      { name: 'Receipts / Invoices', href: '/sales/invoices' },
    ],
  },
  {
    name: 'Customers',
    icon: Users,
    roles: ['admin'],
    section: 'operations',
    moduleCode: 'customers',
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
    moduleCode: 'suppliers',
    children: [
      { name: 'Supplier Directory', href: '/suppliers' },
      { name: 'Add New Supplier', href: '/suppliers/new' },
      { name: 'Supplier Ledger (Khata)', href: '/suppliers/ledger' },
    ],
  },
  {
    name: 'Purchases',
    icon: Receipt,
    roles: ['admin', 'staff'],
    section: 'operations',
    moduleCode: 'purchases',
    children: [
      { name: 'New Purchase', href: '/purchases/new' },
      { name: 'Purchase History', href: '/purchases' },
    ],
  },
  {
    name: 'Assets & Machinery',
    href: '/assets',
    icon: Wrench,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    moduleCode: 'fixed_assets',
  },
  {
    name: 'Cash & Bank Accounts',
    href: '/accounts',
    icon: Wallet,
    roles: ['admin', 'staff', 'viewer'],
    section: 'operations',
    moduleCode: 'financial_accounts',
  },
  {
    name: 'Payments',
    icon: CreditCard,
    roles: ['admin', 'staff'],
    section: 'operations',
    moduleCode: 'payments',
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
    moduleCode: 'expenses',
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
    moduleCode: 'reports',
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
    moduleCode: 'users',
  },
  {
    name: 'Backup & Restore',
    href: '/backup',
    icon: Database,
    roles: ['admin'],
    section: 'admin',
    moduleCode: 'backup',
  },
  {
    name: 'Notifications',
    href: '/notifications',
    icon: Bell,
    roles: ['admin', 'staff', 'viewer'],
    section: 'admin',
  },
  {
    name: 'System Settings',
    href: '/settings',
    icon: Settings,
    roles: ['admin'],
    section: 'admin',
    moduleCode: 'settings',
  },
];

export default function Sidebar({ user, isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const userRole = user?.role || 'viewer';
  const { isLocked, getModule, currentPackage } = useModuleAccess();

  // Upgrade Modal State
  const [selectedLockedModule, setSelectedLockedModule] = useState<ResolvedModule | null>(null);
  const [isUpgradeOpen, setIsUpgradeOpen] = useState<boolean>(false);

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

  const handleOpenUpgrade = (moduleCode: string) => {
    const resolved = getModule(moduleCode);
    if (resolved) {
      setSelectedLockedModule(resolved);
    } else {
      setSelectedLockedModule({
        module: moduleCode,
        module_id: null,
        module_name: moduleCode.replace(/_/g, ' ').toUpperCase(),
        allowed: false,
        source: 'package',
        package: currentPackage,
        override: null,
        reason: 'This module is not included in your current subscription tier.',
        available_in: [],
      });
    }
    setIsUpgradeOpen(true);
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
    const locked = item.moduleCode ? isLocked(item.moduleCode) : false;

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
            onClick={() => {
              if (locked && item.moduleCode) {
                handleOpenUpgrade(item.moduleCode);
              } else {
                toggleMenu(item.name);
              }
            }}
            className={`w-full flex items-center justify-between px-3 2xl:px-3.5 py-2.5 2xl:py-3 rounded-xl font-semibold text-sm 2xl:text-base transition-all group cursor-pointer ${
              locked
                ? 'opacity-85 text-slate-600 hover:bg-amber-50/70 hover:text-amber-950 border border-transparent'
                : isParentActive
                ? 'bg-emerald-50/90 text-emerald-950 border border-emerald-200/90 shadow-xs'
                : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
              <div
                className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
                  locked
                    ? 'bg-amber-100/80 text-amber-700 group-hover:bg-amber-200'
                    : isParentActive
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
                }`}
              >
                <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
              </div>
              <span className="tracking-tight truncate font-bold text-slate-800 group-hover:text-slate-950 flex items-center gap-1.5">
                {item.name}
              </span>
            </div>

            <div className="flex items-center gap-1.5 shrink-0 ml-1">
              {locked ? (
                <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300/60 text-[11px] font-extrabold tracking-tight">
                  <Lock className="w-3 h-3 text-amber-700" />
                  <span>Lock</span>
                </span>
              ) : (
                <ChevronDown
                  className={`w-4 h-4 2xl:w-4.5 2xl:h-4.5 transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180 text-emerald-600 font-bold' : 'text-slate-400 group-hover:text-slate-600'
                  }`}
                />
              )}
            </div>
          </button>

          {/* Submenu Links Accordion */}
          {isMenuOpen && !locked && (
            <div className="ml-4 2xl:ml-5 pl-3 2xl:pl-3.5 py-1 space-y-1 border-l-2 border-emerald-200/80">
              {item.children?.map((child) => {
                const isChildActive = pathname === child.href;
                const isChildLocked = child.moduleCode ? isLocked(child.moduleCode) : false;

                if (isChildLocked && child.moduleCode) {
                  return (
                    <button
                      key={child.href}
                      type="button"
                      onClick={() => handleOpenUpgrade(child.moduleCode!)}
                      className="w-full flex items-center justify-between px-3 py-2 2xl:py-2.5 rounded-xl text-sm font-semibold transition-all text-slate-500 hover:bg-amber-50 hover:text-amber-950 cursor-pointer text-left"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                        <span className="truncate tracking-tight">{child.name}</span>
                      </div>
                      <Lock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                    </button>
                  );
                }

                return (
                  <Link
                    key={child.href}
                    href={child.href}
                    onClick={onClose}
                    className={`flex items-center justify-between px-3 py-2 2xl:py-2.5 rounded-xl text-sm font-semibold transition-all group/sub ${
                      isChildActive
                        ? 'bg-emerald-600 text-white font-bold shadow-xs'
                        : 'text-slate-600 hover:bg-slate-100/90 hover:text-slate-950'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span
                        className={`w-1.5 h-1.5 2xl:w-2 2xl:h-2 rounded-full transition-all shrink-0 ${
                          isChildActive
                            ? 'bg-white scale-125 shadow-xs'
                            : 'bg-slate-300 group-hover/sub:bg-emerald-600'
                        }`}
                      />
                      <span className="truncate tracking-tight">{child.name}</span>
                    </div>

                    {child.badge && (
                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                          isChildActive
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

    // Single Menu Link Item (e.g., Dashboard, Assets, User Management, Backup)
    if (locked && item.moduleCode) {
      return (
        <button
          key={item.name}
          type="button"
          onClick={() => handleOpenUpgrade(item.moduleCode!)}
          className="w-full flex items-center justify-between px-3 2xl:px-3.5 py-2.5 2xl:py-3 rounded-xl font-semibold text-sm 2xl:text-base transition-all group text-slate-600 hover:bg-amber-50 hover:text-amber-950 cursor-pointer text-left"
        >
          <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
            <div className="w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg flex items-center justify-center shrink-0 bg-amber-100/80 text-amber-700 group-hover:bg-amber-200 transition-colors">
              <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
            </div>
            <span className="tracking-tight truncate font-bold text-slate-700 group-hover:text-slate-950">
              {item.name}
            </span>
          </div>

          <span className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-amber-100/90 text-amber-900 border border-amber-300/60 text-[11px] font-extrabold tracking-tight shrink-0">
            <Lock className="w-3 h-3 text-amber-700" />
            <span>Lock</span>
          </span>
        </button>
      );
    }

    return (
      <Link
        key={item.name}
        href={item.href || '#'}
        onClick={onClose}
        className={`flex items-center justify-between px-3 2xl:px-3.5 py-2.5 2xl:py-3 rounded-xl font-semibold text-sm 2xl:text-base transition-all group ${
          isParentActive
            ? 'bg-emerald-600 text-white shadow-xs font-bold'
            : 'text-slate-700 hover:bg-slate-100/90 hover:text-slate-950'
        }`}
      >
        <div className="flex items-center gap-2.5 2xl:gap-3 min-w-0">
          <div
            className={`w-7 h-7 2xl:w-8 2xl:h-8 rounded-lg flex items-center justify-center shrink-0 transition-colors ${
              isParentActive
                ? 'bg-white/20 text-white'
                : 'bg-slate-100 text-slate-500 group-hover:bg-emerald-100 group-hover:text-emerald-700'
            }`}
          >
            <Icon className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
          </div>
          <span className="tracking-tight truncate font-bold">{item.name}</span>
        </div>

        {item.badge && (
          <span
            className={`text-xs px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
              isParentActive
                ? 'bg-white/25 text-white'
                : 'bg-emerald-100/80 text-emerald-800'
            }`}
          >
            {item.badge}
          </span>
        )}
      </Link>
    );
  };

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-72 2xl:w-80 max-w-[85vw] sm:max-w-xs 2xl:max-w-sm bg-white border-r border-slate-200/90 flex flex-col transition-all duration-300 ease-in-out shadow-lg lg:shadow-none lg:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
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
              <div className="text-base 2xl:text-lg font-extrabold text-slate-900 tracking-tight leading-tight flex items-center gap-1.5">
                <span>Tecveq Suite</span>
                <span className="text-xs px-1.5 py-0.5 bg-emerald-100 text-emerald-800 font-bold rounded">
                  ERP
                </span>
              </div>
              <div className="text-xs font-semibold text-slate-400">
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

        {/* Navigation Items */}
        <div className="flex-1 overflow-y-auto px-3.5 2xl:px-4.5 py-3 space-y-4 scrollbar-thin">
          {/* Operations & Main Section */}
          {operationsItems.length > 0 && (
            <div className="space-y-1">
              <div className="px-3 pt-1 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                Main Navigation
              </div>
              {operationsItems.map(renderMenuItem)}
            </div>
          )}

          {/* Admin & System Section */}
          {adminItems.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100">
              <div className="px-3 pt-1 pb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400 select-none">
                System & Settings
              </div>
              {adminItems.map(renderMenuItem)}
            </div>
          )}
        </div>

        {/* Current Plan Badge in Footer */}
        {currentPackage && (
          <div className="px-4 py-2 mx-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs">
            <span className="text-slate-500 font-medium">Active Plan:</span>
            <span className="font-extrabold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
              {currentPackage.name}
            </span>
          </div>
        )}

        {/* Logout & Footer */}
        <div className="p-3 2xl:p-4 border-t border-slate-100 flex-shrink-0 bg-slate-50/70 space-y-2">
          <div className="flex items-center justify-between text-xs font-medium text-slate-400 px-1">
            <span>Tecveq Suite v2.4</span>
            <span className="flex items-center gap-1 text-emerald-600 font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" /> Live
            </span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              authService.logout();
            }}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 2xl:py-3 rounded-xl text-sm 2xl:text-base font-bold text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors border border-transparent hover:border-red-200 cursor-pointer shadow-2xs"
          >
            <LogOut className="w-4 h-4 2xl:w-4.5 2xl:h-4.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* Global Upgrade Module Dialog */}
      <UpgradeModuleDialog
        isOpen={isUpgradeOpen}
        onClose={() => setIsUpgradeOpen(false)}
        module={selectedLockedModule}
        currentPackage={currentPackage}
      />
    </>
  );
}
