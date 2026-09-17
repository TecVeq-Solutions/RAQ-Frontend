'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { FinancialAccount, AccountTransaction, AccountStatementResponse } from '@/types/financialAccounts';
import {
  X,
  Loader2,
  Calendar,
  Filter,
  RefreshCw,
  Landmark,
  Wallet,
  Smartphone,
  Layers,
  ArrowDownLeft,
  ArrowUpRight,
  ArrowRightLeft,
  DollarSign,
  TrendingDown,
  TrendingUp,
  Receipt,
  FileSpreadsheet,
  Printer,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

interface AccountStatementDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  account: FinancialAccount | null;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; color: string; icon: React.ComponentType<{ className?: string }>; sign: '+' | '-' }
> = {
  customer_receipt: {
    label: 'Customer Receipt',
    color: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    icon: ArrowDownLeft,
    sign: '+',
  },
  transfer_in: {
    label: 'Transfer In',
    color: 'bg-teal-50 text-teal-700 border-teal-200',
    icon: ArrowDownLeft,
    sign: '+',
  },
  deposit: {
    label: 'Deposit',
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ArrowDownLeft,
    sign: '+',
  },
  supplier_payment: {
    label: 'Supplier Payment',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: ArrowUpRight,
    sign: '-',
  },
  expense: {
    label: 'Expense',
    color: 'bg-rose-50 text-rose-700 border-rose-200',
    icon: ArrowUpRight,
    sign: '-',
  },
  transfer_out: {
    label: 'Transfer Out',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    icon: ArrowUpRight,
    sign: '-',
  },
  withdrawal: {
    label: 'Withdrawal',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    icon: ArrowUpRight,
    sign: '-',
  },
};

export default function AccountStatementDrawer({
  isOpen,
  onClose,
  account,
}: AccountStatementDrawerProps) {
  const [statementData, setStatementData] = useState<AccountStatementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  const fetchStatement = useCallback(async () => {
    if (!account) return;

    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.append('date_from', dateFrom);
      if (dateTo) params.append('date_to', dateTo);
      if (typeFilter) params.append('transaction_type', typeFilter);
      params.append('page', String(currentPage));
      params.append('per_page', '50');

      const res = await apiClient.get(`/financial-accounts/${account.id}/statement?${params.toString()}`);
      if (res.data?.success) {
        setStatementData(res.data);
      }
    } catch (err) {
      console.error('Failed to fetch account statement', err);
    } finally {
      setLoading(false);
    }
  }, [account, dateFrom, dateTo, typeFilter, currentPage]);

  useEffect(() => {
    if (isOpen && account) {
      fetchStatement();
    }
  }, [isOpen, account, fetchStatement]);

  if (!isOpen || !account) return null;

  const currentBal = statementData ? Number(statementData.summary.current_balance) : Number(account.current_balance);
  const openBal = statementData ? Number(statementData.summary.opening_balance) : Number(account.opening_balance);
  const totalIn = statementData ? Number(statementData.summary.total_inflow) : 0;
  const totalOut = statementData ? Number(statementData.summary.total_outflow) : 0;
  const netFlow = statementData ? Number(statementData.summary.net_flow) : 0;
  const transactions = statementData?.data || [];
  const pagination = statementData?.pagination;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white w-full max-w-4xl h-full shadow-2xl border-l border-slate-200/80 flex flex-col overflow-hidden animate-slide-left">
        {/* Header */}
        <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
              <Landmark className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base font-bold text-white">{account.name}</h2>
                <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-white/15 text-slate-200">
                  {account.account_type.replace('_', ' ')}
                </span>
                {!account.is_active && (
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300">
                    Inactive
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                {account.bank_name ? `${account.bank_name} • ` : ''}
                {account.account_number ? `A/C: ${account.account_number} • ` : ''}
                Account Statement & Audit Ledger
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.print()}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              title="Print Statement"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Statement Financial Metrics */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 p-6 bg-slate-50 border-b border-slate-200">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Opening Balance</div>
            <div className="text-base font-black text-slate-700 mt-0.5">
              Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Inflow (+)</div>
            <div className="text-base font-black text-[#16A34A] mt-0.5">
              Rs. {totalIn.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Outflow (-)</div>
            <div className="text-base font-black text-rose-600 mt-0.5">
              Rs. {totalOut.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Period Flow</div>
            <div className={`text-base font-black mt-0.5 ${netFlow >= 0 ? 'text-[#16A34A]' : 'text-rose-600'}`}>
              Rs. {netFlow.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="bg-slate-900 text-white p-3.5 rounded-xl shadow-xs col-span-2 sm:col-span-1">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Current Balance</div>
            <div className="text-base font-black text-emerald-400 mt-0.5">
              Rs. {currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        {/* Filter Bar */}
        <div className="p-4 bg-white border-b border-slate-200/80 flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-bold text-xs uppercase">From:</span>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => {
                  setDateFrom(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 text-xs focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 px-2.5 py-1.5 rounded-xl text-xs">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span className="text-slate-400 font-bold text-xs uppercase">To:</span>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => {
                  setDateTo(e.target.value);
                  setCurrentPage(1);
                }}
                className="bg-transparent font-semibold text-slate-700 text-xs focus:outline-none"
              />
            </div>

            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none"
            >
              <option value="">All Transaction Types</option>
              <option value="customer_receipt">Customer Receipts (+)</option>
              <option value="supplier_payment">Supplier Payments (-)</option>
              <option value="expense">Expenses (-)</option>
              <option value="transfer_in">Transfers In (+)</option>
              <option value="transfer_out">Transfers Out (-)</option>
              <option value="deposit">Deposits (+)</option>
              <option value="withdrawal">Withdrawals (-)</option>
            </select>
          </div>

          <button
            onClick={() => {
              setDateFrom('');
              setDateTo('');
              setTypeFilter('');
              setCurrentPage(1);
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-800 flex items-center gap-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Reset Filters
          </button>
        </div>

        {/* Transactions Table Body */}
        <div className="flex-1 overflow-y-auto p-6">
          {loading ? (
            <div className="py-20 flex flex-col items-center justify-center text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mb-3" />
              <p className="text-xs font-bold uppercase tracking-wider">Loading statement ledger...</p>
            </div>
          ) : transactions.length === 0 ? (
            <div className="py-20 text-center text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
              <Receipt className="w-12 h-12 mx-auto mb-3 text-slate-300" />
              <p className="text-sm font-bold text-slate-600">No transactions recorded for this period</p>
              <p className="text-xs text-slate-400 mt-1">
                New receipts, payments, expenses, or transfers will appear here chronologically.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-slate-200 shadow-xs">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-100 text-xs font-bold uppercase tracking-wider text-slate-600 border-b border-slate-200">
                    <th className="py-3 px-4">Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Description</th>
                    <th className="py-3 px-4 text-right">Amount (PKR)</th>
                    <th className="py-3 px-4 text-right">Running Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs font-medium text-slate-700">
                  {transactions.map((tx) => {
                    const cfg = TYPE_CONFIG[tx.transaction_type] || {
                      label: tx.transaction_type,
                      color: 'bg-slate-50 text-slate-600 border-slate-200',
                      icon: ArrowRightLeft,
                      sign: '+',
                    };
                    const Icon = cfg.icon;
                    const isInflow = cfg.sign === '+';

                    return (
                      <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900 whitespace-nowrap">
                          {tx.transaction_date}
                        </td>
                        <td className="py-3 px-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${cfg.color}`}
                          >
                            <Icon className="w-3 h-3" />
                            {cfg.label}
                          </span>
                        </td>
                        <td className="py-3 px-4 max-w-xs truncate text-slate-600 font-semibold" title={tx.description}>
                          {tx.description}
                        </td>
                        <td
                          className={`py-3 px-4 text-right font-black whitespace-nowrap ${
                            isInflow ? 'text-[#16A34A]' : 'text-rose-600'
                          }`}
                        >
                          {isInflow ? '+' : '-'}Rs.{' '}
                          {Number(tx.amount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900 whitespace-nowrap">
                          Rs. {Number(tx.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination Footer */}
        {pagination && pagination.last_page > 1 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-600 font-semibold">
            <div>
              Showing page {pagination.current_page} of {pagination.last_page} ({pagination.total} total transactions)
            </div>
            <div className="flex items-center gap-2">
              <button
                disabled={pagination.current_page <= 1}
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                disabled={pagination.current_page >= pagination.last_page}
                onClick={() => setCurrentPage((p) => p + 1)}
                className="p-1.5 rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-white transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
