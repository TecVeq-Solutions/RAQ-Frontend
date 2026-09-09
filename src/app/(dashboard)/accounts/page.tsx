'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import { FinancialAccount, AccountType } from '@/types/financialAccounts';
import FinancialAccountModal from '@/components/accounts/FinancialAccountModal';
import TransferFundsModal from '@/components/accounts/TransferFundsModal';
import AccountStatementDrawer from '@/components/accounts/AccountStatementDrawer';
import {
  Landmark,
  Wallet,
  Smartphone,
  Layers,
  Plus,
  ArrowRightLeft,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Receipt,
  Edit2,
  Eye,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Building2,
  DollarSign,
  ShieldCheck,
  ChevronRight,
  CreditCard,
} from 'lucide-react';

const ACCOUNT_TYPE_LABELS: Record<AccountType, string> = {
  cash: 'Cash',
  bank: 'Bank',
  mobile_wallet: 'Mobile Wallet',
  other: 'Other',
};

const ACCOUNT_TYPE_CONFIG: Record<
  AccountType,
  { label: string; icon: React.ComponentType<{ className?: string }>; badgeColor: string; iconBg: string }
> = {
  cash: {
    label: 'Cash in Hand',
    icon: Wallet,
    badgeColor: 'bg-emerald-50 text-[#16A34A] border-emerald-200',
    iconBg: 'bg-emerald-50 text-[#16A34A] border-emerald-100',
  },
  bank: {
    label: 'Bank Account',
    icon: Landmark,
    badgeColor: 'bg-blue-50 text-blue-700 border-blue-200',
    iconBg: 'bg-blue-50 text-blue-700 border-blue-100',
  },
  mobile_wallet: {
    label: 'Mobile Wallet',
    icon: Smartphone,
    badgeColor: 'bg-amber-50 text-amber-700 border-amber-200',
    iconBg: 'bg-amber-50 text-amber-700 border-amber-100',
  },
  other: {
    label: 'Other',
    icon: Layers,
    badgeColor: 'bg-slate-50 text-slate-700 border-slate-200',
    iconBg: 'bg-slate-50 text-slate-700 border-slate-200',
  },
};

export default function AccountsPage() {
  const [accounts, setAccounts] = useState<FinancialAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals & Drawers
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [accountToEdit, setAccountToEdit] = useState<FinancialAccount | null>(null);
  const [statementAccount, setStatementAccount] = useState<FinancialAccount | null>(null);
  const [preselectedTransferSource, setPreselectedTransferSource] = useState<number | null>(null);

  // RBAC permissions
  const isAdmin = authService.isAdmin();
  const isStaff = authService.isStaff();
  const canCreate = isAdmin;
  const canTransfer = isAdmin || isStaff;

  const fetchAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/financial-accounts?per_page=100');
      if (res.data?.success) {
        setAccounts(res.data.data || []);
      }
    } catch (err) {
      console.error('Failed to fetch financial accounts', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  // Metric summaries across all active/loaded accounts
  const metrics = useMemo(() => {
    let totalCash = 0;
    let totalBank = 0;
    let totalWallet = 0;
    let totalOther = 0;

    accounts.forEach((a) => {
      const bal = Number(a.current_balance) || 0;
      if (a.account_type === 'cash') totalCash += bal;
      else if (a.account_type === 'bank') totalBank += bal;
      else if (a.account_type === 'mobile_wallet') totalWallet += bal;
      else totalOther += bal;
    });

    const netLiquid = totalCash + totalBank + totalWallet + totalOther;

    return {
      totalCash,
      totalBank,
      totalWallet,
      totalOther,
      netLiquid,
      count: accounts.length,
    };
  }, [accounts]);

  // Filtered accounts list
  const filteredAccounts = useMemo(() => {
    return accounts.filter((acc) => {
      // Type filter
      if (typeFilter !== 'all' && acc.account_type !== typeFilter) {
        return false;
      }
      // Status filter
      if (statusFilter === 'active' && !acc.is_active) return false;
      if (statusFilter === 'inactive' && acc.is_active) return false;

      // Search term
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        const matchesName = acc.name.toLowerCase().includes(q);
        const matchesBank = acc.bank_name?.toLowerCase().includes(q);
        const matchesNo = acc.account_number?.toLowerCase().includes(q);
        return matchesName || matchesBank || matchesNo;
      }

      return true;
    });
  }, [accounts, typeFilter, statusFilter, searchTerm]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Landmark className="w-6 h-6 text-[#16A34A]" />
            <span>Cash & Bank Accounts</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1 font-medium">
            Dedicated multi-account financial ledgers, realtime balances, atomic transfers, and statements
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canTransfer && (
            <button
              type="button"
              onClick={() => {
                setPreselectedTransferSource(null);
                setIsTransferModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs sm:text-sm shadow-md shadow-slate-900/20 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Transfer Funds</span>
            </button>
          )}

          {canCreate && (
            <button
              type="button"
              onClick={() => {
                setAccountToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] text-white font-bold text-xs sm:text-sm shadow-md shadow-[#16A34A]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          )}
        </div>
      </div>

      {/* Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Net Liquid Funds */}
        <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-2xl shadow-md flex items-center justify-between border border-slate-800">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Liquid Funds</div>
            <div className="text-xl sm:text-2xl font-black text-emerald-400 mt-1">
              Rs. {metrics.netLiquid.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
              Across {metrics.count} financial accounts
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-white/10 text-emerald-400 flex items-center justify-center border border-white/10">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Cash in Hand */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Cash in Hand</div>
            <div className="text-xl sm:text-2xl font-black text-[#16A34A] mt-1">
              Rs. {metrics.totalCash.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1 mt-0.5">
              <Wallet className="w-3.5 h-3.5" /> Physical tills & cash registers
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-100">
            <Wallet className="w-5 h-5" />
          </div>
        </div>

        {/* Bank Balances */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Bank Accounts</div>
            <div className="text-xl sm:text-2xl font-black text-blue-600 mt-1">
              Rs. {metrics.totalBank.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-blue-600 font-semibold flex items-center gap-1 mt-0.5">
              <Landmark className="w-3.5 h-3.5" /> Commercial bank deposits
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-100">
            <Landmark className="w-5 h-5" />
          </div>
        </div>

        {/* Mobile Wallets */}
        <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between">
          <div>
            <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Mobile Wallets</div>
            <div className="text-xl sm:text-2xl font-black text-amber-600 mt-1">
              Rs. {metrics.totalWallet.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-amber-600 font-semibold flex items-center gap-1 mt-0.5">
              <Smartphone className="w-3.5 h-3.5" /> JazzCash & Easypaisa
            </div>
          </div>
          <div className="w-11 h-11 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-100">
            <Smartphone className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex flex-1 items-center gap-3 w-full sm:w-auto">
          <div className="relative flex-1 sm:w-72">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search account name, bank, account #..."
              className="w-full pl-9 pr-3.5 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/30 focus:border-[#16A34A]"
            />
          </div>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Account Types</option>
            <option value="cash">Cash in Hand</option>
            <option value="bank">Bank Accounts</option>
            <option value="mobile_wallet">Mobile Wallets</option>
            <option value="other">Other Accounts</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>
        </div>

        <button
          type="button"
          onClick={fetchAccounts}
          className="p-2 rounded-xl border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
          title="Refresh Accounts"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Accounts List / Grid */}
      {loading ? (
        <div className="py-24 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#16A34A] mb-3" />
          <p className="text-xs font-bold uppercase tracking-wider">Loading financial accounts...</p>
        </div>
      ) : filteredAccounts.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-2xl border border-dashed border-slate-200 p-8 shadow-xs">
          <Landmark className="w-12 h-12 mx-auto mb-3 text-slate-300" />
          <h3 className="text-sm font-bold text-slate-700">No financial accounts found</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
            {searchTerm || typeFilter !== 'all'
              ? 'Try modifying your search or filter options.'
              : 'Create your first dedicated cash or bank account to start managing financial balances.'}
          </p>
          {canCreate && (
            <button
              onClick={() => {
                setAccountToEdit(null);
                setIsCreateModalOpen(true);
              }}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold shadow-md shadow-[#16A34A]/20"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add First Account</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAccounts.map((acc) => {
            const cfg = ACCOUNT_TYPE_CONFIG[acc.account_type] || ACCOUNT_TYPE_CONFIG.other;
            const Icon = cfg.icon;
            const currentBal = Number(acc.current_balance) || 0;
            const openBal = Number(acc.opening_balance) || 0;

            return (
              <div
                key={acc.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all p-5 flex flex-col justify-between"
              >
                <div>
                  {/* Card Header: Icon + Type Badge + Status */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${cfg.iconBg}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 leading-snug">{acc.name}</h3>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-extrabold border mt-0.5 ${cfg.badgeColor}`}
                        >
                          {ACCOUNT_TYPE_LABELS[acc.account_type] || acc.account_type}
                        </span>
                      </div>
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold border ${
                        acc.is_active
                          ? 'bg-emerald-50 text-[#16A34A] border-emerald-200'
                          : 'bg-rose-50 text-rose-600 border-rose-200'
                      }`}
                    >
                      {acc.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Bank & Account Number details */}
                  {(acc.bank_name || acc.account_number) && (
                    <div className="bg-slate-50/80 rounded-xl p-2.5 border border-slate-100 text-[11px] font-medium text-slate-600 space-y-1 mb-4">
                      {acc.bank_name && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Institution:</span>
                          <span className="font-bold text-slate-800">{acc.bank_name}</span>
                        </div>
                      )}
                      {acc.account_number && (
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Account #:</span>
                          <span className="font-mono font-bold text-slate-800">{acc.account_number}</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Balance Section */}
                  <div className="pt-2 border-t border-slate-100">
                    <div className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Balance</div>
                    <div className="text-2xl font-black text-slate-900 mt-0.5">
                      Rs. {currentBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[11px] text-slate-400 font-semibold mt-0.5">
                      Opening: Rs. {openBal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </div>
                  </div>
                </div>

                {/* Card Actions */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    type="button"
                    onClick={() => setStatementAccount(acc)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-xs transition-all cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-emerald-400" />
                    <span>View Statement</span>
                  </button>

                  <div className="flex items-center gap-1.5">
                    {canTransfer && acc.is_active && (
                      <button
                        type="button"
                        onClick={() => {
                          setPreselectedTransferSource(acc.id);
                          setIsTransferModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        title="Transfer from this account"
                      >
                        <ArrowRightLeft className="w-4 h-4 text-emerald-600" />
                      </button>
                    )}

                    {canCreate && (
                      <button
                        type="button"
                        onClick={() => {
                          setAccountToEdit(acc);
                          setIsCreateModalOpen(true);
                        }}
                        className="p-1.5 rounded-lg border border-slate-200 hover:border-slate-300 text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors"
                        title="Edit Account"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals & Drawers */}
      <FinancialAccountModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setAccountToEdit(null);
        }}
        onSuccess={fetchAccounts}
        accountToEdit={accountToEdit}
      />

      <TransferFundsModal
        isOpen={isTransferModalOpen}
        onClose={() => {
          setIsTransferModalOpen(false);
          setPreselectedTransferSource(null);
        }}
        onSuccess={fetchAccounts}
        accounts={accounts}
        preselectedFromAccountId={preselectedTransferSource}
      />

      <AccountStatementDrawer
        isOpen={!!statementAccount}
        onClose={() => setStatementAccount(null)}
        account={statementAccount}
      />
    </div>
  );
}
