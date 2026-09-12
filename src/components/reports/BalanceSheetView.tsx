'use client';

import React, { useState } from 'react';
import {
  BalanceSheetData,
  BalanceSheetAccount,
  BalanceSheetAssetItem,
} from '@/types/reports';
import {
  Building2,
  Wallet,
  Landmark,
  Users,
  Boxes,
  Wrench,
  CheckCircle2,
  AlertTriangle,
  Scale,
  DollarSign,
  ChevronDown,
  ChevronUp,
  CreditCard,
  ShieldCheck,
  TrendingUp,
  Info,
} from 'lucide-react';

interface BalanceSheetViewProps {
  data: BalanceSheetData | null;
  loading: boolean;
  formatCurrency: (val: number | null | undefined) => string;
}

export default function BalanceSheetView({
  data,
  loading,
  formatCurrency,
}: BalanceSheetViewProps) {
  const [showAccountsDetail, setShowAccountsDetail] = useState(false);
  const [showAssetsDetail, setShowAssetsDetail] = useState(false);

  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        {/* Skeleton equation banner */}
        <div className="h-24 bg-slate-200/80 rounded-2xl w-full" />
        {/* Skeleton two-column layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200/80 rounded-2xl" />
          <div className="h-96 bg-slate-200/80 rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-2xl p-12 text-center border border-slate-200/90 shadow-xs space-y-3">
        <AlertTriangle className="w-10 h-10 text-amber-500 mx-auto" />
        <h3 className="text-base font-bold text-slate-800">Unable to load Balance Sheet</h3>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          Please check your database connectivity or refresh the page to retry computing the financial statement.
        </p>
      </div>
    );
  }

  const { assets, liabilities, equity, summary, as_of_date } = data;
  const currentAssets = assets.current_assets;
  const fixedAssets = assets.fixed_assets;
  const currentLiabilities = liabilities.current_liabilities;

  return (
    <div className="space-y-6">
      {/* 1. Executive Accounting Equation Header Banner */}
      <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-slate-950 rounded-2xl sm:rounded-3xl p-5 sm:p-7 text-white shadow-xl shadow-slate-950/10 border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-1/3 bg-gradient-to-l from-emerald-500/10 to-transparent pointer-events-none" />

        <div className="relative z-10 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                <Scale className="w-5 h-5" />
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                  Statement of Financial Position
                </h2>
                <p className="text-xs text-slate-400">
                  Authoritative Balance Sheet as of{' '}
                  <span className="font-semibold text-slate-300">{as_of_date}</span>
                </p>
              </div>
            </div>

            {/* Balanced Status Badge */}
            <div className="flex items-center gap-2">
              {summary.is_balanced ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <span>STATEMENT BALANCED</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span>OUT OF BALANCE (Diff: {formatCurrency(summary.balance_difference)})</span>
                </span>
              )}
            </div>
          </div>

          {/* Equation Strip */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 sm:gap-4 items-center">
            {/* Box 1: Total Assets */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Total Assets</span>
                <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold">
                  Owns
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-emerald-400">
                {formatCurrency(summary.total_assets)}
              </div>
              <div className="text-xs text-slate-400">
                Current ({formatCurrency(summary.total_current_assets)}) + Fixed ({formatCurrency(summary.total_fixed_assets)})
              </div>
            </div>

            {/* Box 2: Total Liabilities */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Total Liabilities</span>
                <span className="text-xs px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold">
                  Owes
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-blue-400">
                {formatCurrency(summary.total_liabilities)}
              </div>
              <div className="text-xs text-slate-400">
                Trade payables owed to suppliers
              </div>
            </div>

            {/* Box 3: Owner Equity */}
            <div className="bg-slate-800/80 backdrop-blur-md rounded-2xl p-4 border border-slate-700/80 space-y-1">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
                <span>Owner Equity / Net Worth</span>
                <span className="text-xs px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold">
                  Net Worth
                </span>
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-300">
                {formatCurrency(summary.equity)}
              </div>
              <div className="text-xs text-slate-400">
                Residual: Assets minus Liabilities
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Standard Two-Column Accounting Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* ========================================================================= */}
        {/* LEFT COLUMN: ASSETS                                                       */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
                <Building2 className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                ASSETS (What Business Owns)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Asset Ledger
            </span>
          </div>

          {/* Section A: Current Assets */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>1. Current Assets</span>
              <span className="text-slate-900 font-bold font-mono">
                {formatCurrency(currentAssets.total_current_assets)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-1">
              {/* Row 1: Cash & Bank Accounts */}
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-emerald-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Cash & Cash Equivalents
                      </div>
                      <div className="text-xs text-slate-500">
                        {currentAssets.accounts_count} active accounts (Cash, Bank & Wallets)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 font-mono">
                      {formatCurrency(currentAssets.cash_and_bank)}
                    </div>
                    <button
                      type="button"
                      onClick={() => setShowAccountsDetail(!showAccountsDetail)}
                      className="text-xs font-bold text-[#16A34A] hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                    >
                      <span>{showAccountsDetail ? 'Hide breakdown' : 'View accounts'}</span>
                      {showAccountsDetail ? (
                        <ChevronUp className="w-3 h-3" />
                      ) : (
                        <ChevronDown className="w-3 h-3" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Sub-breakdown if expanded */}
                {showAccountsDetail && currentAssets.accounts && currentAssets.accounts.length > 0 && (
                  <div className="pt-2 pl-6 space-y-1.5 border-t border-slate-200/60">
                    {currentAssets.accounts.map((acc) => (
                      <div
                        key={acc.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-xs uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                            {acc.account_type}
                          </span>
                          <span className="font-semibold text-slate-700">{acc.name}</span>
                          {acc.bank_name && (
                            <span className="text-xs text-slate-400">({acc.bank_name})</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-900 font-mono">
                          {formatCurrency(acc.current_balance)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Row 2: Customer Receivables */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Accounts Receivable (Trade Debtors)
                    </div>
                    <div className="text-xs text-slate-500">
                      {currentAssets.active_customers_with_due} customers with outstanding balance (Lena Hai)
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(currentAssets.customer_receivables)}
                </div>
              </div>

              {/* Row 3: Raw Materials Inventory */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-amber-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Raw Materials Stock
                    </div>
                    <div className="text-xs text-slate-500">
                      Paper reams, board sheets & binding supplies
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(currentAssets.raw_material_inventory)}
                </div>
              </div>

              {/* Row 4: Finished Goods Inventory */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Boxes className="w-4 h-4 text-emerald-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Finished Goods Stock
                    </div>
                    <div className="text-xs text-slate-500">
                      Manufactured registers, notebooks & commercial stock
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(currentAssets.finished_goods_inventory)}
                </div>
              </div>

              {/* Row 5: Consumables & Other Stock (if present) */}
              {(currentAssets.consumables_inventory > 0 || currentAssets.machinery_inventory > 0) && (
                <div className="p-3.5 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Boxes className="w-4 h-4 text-slate-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Consumables & Merchandise
                      </div>
                      <div className="text-xs text-slate-500">
                        Glue, inks, thread & auxiliary inventory
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-slate-900 font-mono">
                    {formatCurrency(
                      (currentAssets.consumables_inventory || 0) +
                        (currentAssets.machinery_inventory || 0)
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Section B: Non-Current / Fixed Assets */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>2. Non-Current / Capital Assets</span>
              <span className="text-slate-900 font-bold font-mono">
                {formatCurrency(fixedAssets.total_fixed_assets)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-1">
              <div className="p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Wrench className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Machinery & Capital Equipment
                      </div>
                      <div className="text-xs text-slate-500">
                        {fixedAssets.assets_count} active assets (Net Book Value after depreciation)
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-black text-slate-900 font-mono">
                      {formatCurrency(fixedAssets.machinery_and_capital_assets)}
                    </div>
                    {fixedAssets.assets && fixedAssets.assets.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setShowAssetsDetail(!showAssetsDetail)}
                        className="text-xs font-bold text-purple-600 hover:underline inline-flex items-center gap-0.5 cursor-pointer"
                      >
                        <span>{showAssetsDetail ? 'Hide asset list' : 'View assets'}</span>
                        {showAssetsDetail ? (
                          <ChevronUp className="w-3 h-3" />
                        ) : (
                          <ChevronDown className="w-3 h-3" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Sub-breakdown of capital assets */}
                {showAssetsDetail && fixedAssets.assets && fixedAssets.assets.length > 0 && (
                  <div className="pt-2 pl-6 space-y-1.5 border-t border-slate-200/60">
                    {fixedAssets.assets.map((ast) => (
                      <div
                        key={ast.id}
                        className="flex items-center justify-between text-xs py-1 px-2 rounded-lg bg-white border border-slate-100"
                      >
                        <div>
                          <span className="font-semibold text-slate-800">{ast.name}</span>
                          <span className="text-xs text-slate-400 font-mono ml-1.5">
                            ({ast.asset_code})
                          </span>
                        </div>
                        <span className="font-bold text-purple-900 font-mono">
                          {formatCurrency(ast.current_value)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section C: Total Assets Banner */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-center justify-between shadow-md shadow-emerald-700/20">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-emerald-100">
                TOTAL ASSETS
              </div>
              <div className="text-xs text-emerald-100/90">
                Current Assets + Capital Assets
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono text-white">
              {formatCurrency(assets.total_assets)}
            </div>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* RIGHT COLUMN: LIABILITIES & EQUITY                                        */}
        {/* ========================================================================= */}
        <div className="bg-white rounded-2xl sm:rounded-3xl border border-slate-200/90 shadow-xs p-5 sm:p-7 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                <Landmark className="w-4 h-4" />
              </div>
              <h3 className="text-base sm:text-lg font-black text-slate-900 tracking-tight">
                LIABILITIES & EQUITY (What Business Owes & Net Worth)
              </h3>
            </div>
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              Claims on Assets
            </span>
          </div>

          {/* Section A: Liabilities */}
          <div className="space-y-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>1. Current Liabilities</span>
              <span className="text-slate-900 font-bold font-mono">
                {formatCurrency(currentLiabilities.total_current_liabilities)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-1">
              {/* Row 1: Accounts Payable */}
              <div className="p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-blue-600" />
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Accounts Payable (Trade Creditors)
                    </div>
                    <div className="text-xs text-slate-500">
                      {currentLiabilities.active_suppliers_with_due} suppliers with outstanding balance (Dena Hai)
                    </div>
                  </div>
                </div>
                <div className="text-sm font-black text-slate-900 font-mono">
                  {formatCurrency(currentLiabilities.supplier_payables)}
                </div>
              </div>
            </div>

            {/* Total Liabilities Pill */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-blue-50/70 border border-blue-200/60 text-xs font-bold text-blue-900">
              <span>Total Liabilities</span>
              <span className="font-mono font-black">{formatCurrency(liabilities.total_liabilities)}</span>
            </div>
          </div>

          {/* Section B: Owner Equity */}
          <div className="space-y-3 pt-2">
            <div className="text-xs font-black uppercase tracking-wider text-slate-500 flex items-center justify-between">
              <span>2. Owner Equity & Retained Capital</span>
              <span className="text-slate-900 font-bold font-mono">
                {formatCurrency(equity.total_equity)}
              </span>
            </div>

            <div className="divide-y divide-slate-100 rounded-2xl border border-slate-100 bg-slate-50/50 p-1">
              <div className="p-3.5 space-y-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-purple-600" />
                    <div>
                      <div className="text-xs font-bold text-slate-800">
                        Owner Net Worth / Retained Equity
                      </div>
                      <div className="text-xs text-slate-500">
                        Residual claim of owners (Total Assets − Total Liabilities)
                      </div>
                    </div>
                  </div>
                  <div className="text-sm font-black text-purple-900 font-mono">
                    {formatCurrency(equity.owner_net_worth)}
                  </div>
                </div>
              </div>
            </div>

            {/* Total Equity Pill */}
            <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-purple-50/70 border border-purple-200/60 text-xs font-bold text-purple-900">
              <span>Total Owner Equity</span>
              <span className="font-mono font-black">{formatCurrency(equity.total_equity)}</span>
            </div>
          </div>

          {/* Section C: Total Liabilities & Equity Banner (Must Equal Total Assets) */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white flex items-center justify-between shadow-md shadow-slate-950/20 border border-slate-800">
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-300">
                TOTAL LIABILITIES & EQUITY
              </div>
              <div className="text-xs text-slate-400">
                Total Liabilities ({formatCurrency(liabilities.total_liabilities)}) + Equity ({formatCurrency(equity.total_equity)})
              </div>
            </div>
            <div className="text-xl sm:text-2xl font-black tracking-tight font-mono text-emerald-400">
              {formatCurrency(summary.liabilities_and_equity)}
            </div>
          </div>
        </div>
      </div>

      {/* 3. Accounting Footnote & Balance Verification Notice */}
      <div className="bg-slate-50 rounded-2xl p-4 sm:p-5 border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-slate-600">
        <div className="flex items-center gap-2.5">
          <Info className="w-4 h-4 text-slate-500 shrink-0" />
          <span>
            <strong>Fundamental Accounting Equation:</strong> Total Assets ({formatCurrency(summary.total_assets)}) =
            Total Liabilities ({formatCurrency(summary.total_liabilities)}) + Owner Equity ({formatCurrency(summary.equity)}).
          </span>
        </div>
        <div className="font-mono font-bold text-xs text-slate-500">
          Precision Status: {summary.is_balanced ? 'Exact match (0.00 difference)' : `Discrepancy: ${formatCurrency(summary.balance_difference)}`}
        </div>
      </div>
    </div>
  );
}
