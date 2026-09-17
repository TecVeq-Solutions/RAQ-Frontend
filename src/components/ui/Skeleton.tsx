import React from 'react';

interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

/**
 * Base Skeleton Component with fast, smooth, lightweight GPU-accelerated shimmer effect.
 */
export function Skeleton({ className = '', ...props }: SkeletonProps) {
  return (
    <div
      className={`skeleton-shimmer rounded-xl ${className}`}
      {...props}
    />
  );
}

/**
 * Modern Card Skeleton for stats / KPI metrics.
 */
export function CardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="h-4 w-24 skeleton-shimmer rounded-md" />
            <div className="w-10 h-10 skeleton-shimmer rounded-xl" />
          </div>
          <div className="h-7 w-32 skeleton-shimmer rounded-lg" />
          <div className="h-3 w-20 skeleton-shimmer rounded-md opacity-80" />
        </div>
      ))}
    </div>
  );
}

/**
 * Modern Table Skeleton for Data Lists (Sales, Invoices, Purchases, etc.)
 */
export function TableSkeleton({
  rows = 5,
  cols = 5,
  showHeader = true,
}: {
  rows?: number;
  cols?: number;
  showHeader?: boolean;
}) {
  return (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs overflow-hidden w-full">
      {showHeader && (
        <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="h-5 w-44 skeleton-shimmer rounded-md" />
          <div className="flex items-center gap-2">
            <div className="h-9 w-48 skeleton-shimmer rounded-xl" />
            <div className="h-9 w-24 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-100 dark:border-slate-700 bg-slate-50/70 dark:bg-slate-800/50">
              {Array.from({ length: cols }).map((_, i) => (
                <th key={i} className="p-4">
                  <div className="h-4 skeleton-shimmer rounded-md w-3/4" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {Array.from({ length: rows }).map((_, rIdx) => (
              <tr key={rIdx} className="hover:bg-slate-50/50 transition-colors">
                {Array.from({ length: cols }).map((_, cIdx) => (
                  <td key={cIdx} className="p-4">
                    <div
                      className={`h-4 skeleton-shimmer rounded-md ${
                        cIdx === 0
                          ? 'w-16'
                          : cIdx === 1
                          ? 'w-36'
                          : cIdx === cols - 1
                          ? 'w-20 ml-auto'
                          : 'w-24'
                      }`}
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="p-4 border-t border-slate-100 dark:border-slate-700/80 flex items-center justify-between">
        <div className="h-4 w-32 skeleton-shimmer rounded-md" />
        <div className="flex items-center gap-1.5">
          <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
          <div className="h-8 w-8 skeleton-shimmer rounded-lg" />
        </div>
      </div>
    </div>
  );
}

/**
 * Modern POS Billing Engine Skeleton loader (matching Fast POS Counter)
 */
export function POSBillingSkeleton() {
  return (
    <div className="space-y-5 pb-12 max-w-[1900px] w-full">
      {/* POS Top Bar Skeleton */}
      <div className="bg-white dark:bg-slate-800 p-4 sm:p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer" />
          <div className="space-y-1.5">
            <div className="h-5 w-40 skeleton-shimmer rounded-md" />
            <div className="h-3.5 w-28 skeleton-shimmer rounded-md opacity-80" />
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-10 w-36 skeleton-shimmer rounded-xl" />
          <div className="h-10 w-36 skeleton-shimmer rounded-xl" />
        </div>
      </div>

      {/* Main Grid Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Catalog & Search Section (Left) */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3">
            <div className="h-11 skeleton-shimmer rounded-xl w-full" />
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="h-8 w-20 skeleton-shimmer rounded-lg shrink-0" />
              <div className="h-8 w-24 skeleton-shimmer rounded-lg shrink-0 opacity-80" />
              <div className="h-8 w-24 skeleton-shimmer rounded-lg shrink-0 opacity-80" />
              <div className="h-8 w-24 skeleton-shimmer rounded-lg shrink-0 opacity-80" />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="bg-white dark:bg-slate-800 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-3"
              >
                <div className="h-4 w-28 skeleton-shimmer rounded-md" />
                <div className="h-3 w-16 skeleton-shimmer rounded-md opacity-80" />
                <div className="flex items-center justify-between pt-2">
                  <div className="h-5 w-16 skeleton-shimmer rounded-md" />
                  <div className="h-7 w-12 skeleton-shimmer rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Cart & Billing Section (Right) */}
        <div className="lg:col-span-5 xl:col-span-4 space-y-4">
          <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-700">
              <div className="h-5 w-28 skeleton-shimmer rounded-md" />
              <div className="h-4 w-12 skeleton-shimmer rounded-md opacity-80" />
            </div>

            <div className="space-y-3 py-2">
              <div className="h-14 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60 p-2 skeleton-shimmer" />
              <div className="h-14 bg-slate-50/80 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-700/60 p-2 skeleton-shimmer" />
            </div>

            <div className="space-y-2 pt-3 border-t border-slate-100 dark:border-slate-700">
              <div className="flex justify-between">
                <div className="h-3.5 w-16 skeleton-shimmer rounded-md opacity-80" />
                <div className="h-3.5 w-20 skeleton-shimmer rounded-md opacity-80" />
              </div>
              <div className="flex justify-between">
                <div className="h-4 w-20 skeleton-shimmer rounded-md" />
                <div className="h-5 w-24 skeleton-shimmer rounded-md" />
              </div>
            </div>

            <div className="h-12 bg-emerald-500/20 dark:bg-emerald-500/10 rounded-xl w-full mt-4 skeleton-shimmer" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Modern Workspace / Initial App Layout Skeleton loader (Dashboard Layout)
 */
export function WorkspaceSkeleton() {
  return (
    <div className="min-h-screen bg-[#F3F4F6] flex max-w-full overflow-x-hidden">
      {/* Sidebar Placeholder (Desktop) */}
      <div className="hidden lg:flex flex-col w-72 2xl:w-80 bg-slate-900 border-r border-slate-800 p-5 space-y-6 shrink-0">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-800">
          <div className="w-10 h-10 rounded-xl skeleton-shimmer-dark" />
          <div className="space-y-1.5">
            <div className="h-4 w-28 skeleton-shimmer-dark rounded-md" />
            <div className="h-3 w-20 skeleton-shimmer-dark rounded-md opacity-60" />
          </div>
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-10 skeleton-shimmer-dark rounded-xl w-full" />
          ))}
        </div>
      </div>

      {/* Main Content Placeholder */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full overflow-x-hidden">
        {/* Header bar */}
        <div className="h-16 bg-white border-b border-slate-200/80 px-6 flex items-center justify-between">
          <div className="h-4 w-32 skeleton-shimmer rounded-md" />
          <div className="flex items-center gap-3">
            <div className="h-8 w-24 skeleton-shimmer rounded-lg" />
            <div className="w-8 h-8 rounded-full skeleton-shimmer" />
          </div>
        </div>

        {/* Body content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 space-y-6">
          <div className="h-28 bg-gradient-to-r from-slate-900 to-slate-800 rounded-2xl w-full skeleton-shimmer-dark" />
          <CardSkeleton count={4} />
          <TableSkeleton rows={4} cols={5} />
        </main>
      </div>
    </div>
  );
}

/**
 * Modern Dashboard Skeleton loader
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-6 sm:space-y-8 w-full max-w-full pb-16 overflow-x-hidden">
      {/* Hero Welcome Banner Skeleton */}
      <div className="rounded-2xl sm:rounded-3xl bg-slate-900 p-6 sm:p-8 space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-20 skeleton-shimmer-dark rounded-full" />
          <div className="h-5 w-40 skeleton-shimmer-dark rounded-full" />
        </div>
        <div className="h-8 w-64 skeleton-shimmer-dark rounded-lg" />
        <div className="h-4 w-96 skeleton-shimmer-dark rounded-md max-w-full" />
      </div>

      {/* KPI Cards Skeleton */}
      <CardSkeleton count={4} />

      {/* Secondary Cards Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="h-5 w-40 skeleton-shimmer rounded-md" />
          <div className="h-56 skeleton-shimmer rounded-xl" />
        </div>
        <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200/80 dark:border-slate-700/80 shadow-xs space-y-4">
          <div className="h-5 w-32 skeleton-shimmer rounded-md" />
          <div className="space-y-3">
            <div className="h-12 skeleton-shimmer rounded-xl" />
            <div className="h-12 skeleton-shimmer rounded-xl" />
            <div className="h-12 skeleton-shimmer rounded-xl" />
          </div>
        </div>
      </div>

      {/* Activity Table Skeleton */}
      <TableSkeleton rows={4} cols={5} />
    </div>
  );
}
