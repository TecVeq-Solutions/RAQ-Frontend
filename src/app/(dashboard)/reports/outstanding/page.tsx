'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  Users,
  Building2,
  DollarSign,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  Search,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  CreditCard,
  CheckCircle2,
  AlertTriangle,
  FileText,
} from 'lucide-react';

interface ReceivableItem {
  id: number;
  name: string;
  phone?: string | null;
  address?: string | null;
  opening_balance: number;
  current_balance: number;
  unpaid_invoices_count: number;
  last_payment_date?: string | null;
  last_payment_amount: number;
}

interface PayableItem {
  id: number;
  name: string;
  contact_person?: string | null;
  phone?: string | null;
  address?: string | null;
  opening_balance: number;
  current_balance: number;
  unpaid_orders_count: number;
  last_payment_date?: string | null;
  last_payment_amount: number;
}

interface OutstandingReportData {
  summary: {
    total_receivables: number;
    receivables_count: number;
    total_payables: number;
    payables_count: number;
    net_position: number;
  };
  receivables: ReceivableItem[];
  payables: PayableItem[];
}

export default function OutstandingReportPage() {
  const [loading, setLoading] = useState(true);
  const [reportData, setReportData] = useState<OutstandingReportData | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'receivables' | 'payables'>('overview');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  const fetchOutstandingReport = useCallback(async () => {
    setLoading(true);
    try {
      const params: Record<string, string> = {
        type: activeTab === 'overview' ? 'all' : activeTab,
      };
      if (debouncedSearch && debouncedSearch.trim() !== '') {
        params.search = debouncedSearch.trim();
      }

      const res = await apiClient.get('/reports/outstanding', { params });
      if (res.data?.data) {
        setReportData(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch outstanding report:', err);
    } finally {
      setLoading(false);
    }
  }, [activeTab, debouncedSearch]);

  useEffect(() => {
    fetchOutstandingReport();
  }, [fetchOutstandingReport]);

  const handleExportCsv = () => {
    const params = new URLSearchParams({
      type: 'outstanding',
    });
    if (debouncedSearch) {
      params.append('search', debouncedSearch);
    }
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
    window.open(`${apiUrl}/reports/export/csv?${params.toString()}`, '_blank');
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = Number(val) || 0;
    return `Rs. ${num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-7 animate-fadeIn pb-16">
      {/* Top Header & Export/Print Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            Outstanding Balances & Aging Report
          </h1>
          <p className="text-sm sm:text-base text-slate-600 font-medium mt-1">
            Customer receivables (Lena Hai), supplier payables (Dena Hai), and net business liquidity (PRD R-07)
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-sm transition-all cursor-pointer shadow-xs border border-slate-200"
            title="Download CSV Spreadsheet"
          >
            <Download className="w-4 h-4 text-slate-700" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#15803D] text-white font-bold text-sm shadow-md shadow-[#16A34A]/25 transition-all hover:scale-105 active:scale-95 cursor-pointer"
            title="Print this report summary"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs & Search Filter Bar */}
      <div className="bg-white p-5 sm:p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4 print:hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          {/* Tabs */}
          <div className="flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-xl border border-slate-200">
            <button
              type="button"
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer ${
                activeTab === 'overview'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              Full Overview
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('receivables')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'receivables'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Users className="w-4 h-4 text-purple-600" />
              <span>Customer Receivables</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('payables')}
              className={`px-4 py-2 rounded-lg text-xs sm:text-sm font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'payables'
                  ? 'bg-white text-slate-950 shadow-xs border border-slate-300'
                  : 'text-slate-600 hover:text-slate-950'
              }`}
            >
              <Building2 className="w-4 h-4 text-amber-600" />
              <span>Supplier Payables</span>
            </button>
          </div>

          {/* Search Input & Refresh */}
          <div className="flex items-center gap-3">
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search party or phone..."
                className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-sm font-semibold rounded-xl pl-10 pr-3.5 py-2.5 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 shadow-2xs placeholder:text-slate-400"
              />
            </div>

            <button
              type="button"
              onClick={fetchOutstandingReport}
              className="p-2.5 rounded-xl border border-slate-300 bg-slate-100 hover:bg-slate-200 text-slate-800 transition-colors cursor-pointer shadow-xs shrink-0"
              title="Refresh Report"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : 'text-slate-600'}`} />
            </button>
          </div>
        </div>
      </div>

      {/* Printable Header Branding */}
      <div className="hidden print:block text-center pb-4 border-b border-slate-300">
        <h1 className="text-2xl font-black text-slate-900">SALES & INVENTORY ERP</h1>
        <p className="text-sm text-slate-700 font-bold uppercase tracking-wider mt-1">
          OUTSTANDING BALANCES & LIQUIDITY POSITION REPORT
        </p>
        <p className="text-xs text-slate-500 mt-0.5">Printed on: {new Date().toLocaleString()}</p>
      </div>

      {loading ? (
        <div className="bg-white p-16 rounded-2xl border border-slate-200 text-center text-slate-500 space-y-3">
          <Loader2 className="w-9 h-9 animate-spin mx-auto text-[#16A34A]" />
          <p className="font-bold text-base text-slate-800">Calculating Outstanding Ledger Balances...</p>
          <p className="text-sm text-slate-500">Aggregating customer receivables, supplier payables, and net position</p>
        </div>
      ) : reportData ? (
        <div className="space-y-7">
          {/* Executive Position KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {/* 1. Total Customer Receivables */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Receivables</div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <ArrowDownRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-purple-700 mt-2">
                {formatCurrency(reportData.summary.total_receivables)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-purple-600 mt-1">
                Lena Hai (From Customers)
              </div>
            </div>

            {/* 2. Debtors Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-purple-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Debtor Customers</div>
                <div className="p-2 rounded-xl bg-purple-50 text-purple-600">
                  <Users className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {reportData.summary.receivables_count} Customers
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                With Pending Balances
              </div>
            </div>

            {/* 3. Total Supplier Payables */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Total Payables</div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ArrowUpRight className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-amber-600 mt-2">
                {formatCurrency(reportData.summary.total_payables)}
              </div>
              <div className="text-xs sm:text-sm font-semibold text-amber-600 mt-1">
                Dena Hai (To Suppliers)
              </div>
            </div>

            {/* 4. Creditors Count */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group hover:border-amber-400 transition-all">
              <div className="flex items-center justify-between">
                <div className="text-xs font-bold uppercase text-slate-500 tracking-wider">Creditor Suppliers</div>
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <Building2 className="w-5 h-5" />
                </div>
              </div>
              <div className="text-xl sm:text-2xl font-black text-slate-900 mt-2">
                {reportData.summary.payables_count} Suppliers
              </div>
              <div className="text-xs sm:text-sm font-semibold text-slate-500 mt-1">
                With Pending Dues
              </div>
            </div>

            {/* 5. Net Financial Liquidity Position */}
            <div className="bg-slate-950 text-white p-5 rounded-2xl border border-slate-800 shadow-md relative overflow-hidden">
              <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">Net Position</div>
              <div
                className={`text-xl sm:text-2xl font-black mt-2 ${
                  reportData.summary.net_position >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {formatCurrency(reportData.summary.net_position)}
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-300 mt-1">
                {reportData.summary.net_position >= 0 ? 'Surplus Receivables' : 'Deficit Payables'}
              </div>
            </div>
          </div>

          {/* TABLE SECTION: Receivables & Payables */}
          <div className="space-y-7">
            {/* Customer Receivables Section */}
            {(activeTab === 'overview' || activeTab === 'receivables') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-purple-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-purple-700" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Customer Receivables ({reportData.receivables.length} Outstanding Accounts)
                    </h3>
                  </div>
                  <div className="font-black text-purple-700 text-sm sm:text-base">
                    Total: {formatCurrency(reportData.summary.total_receivables)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Customer Name</th>
                        <th className="p-4">Phone / Address</th>
                        <th className="p-4 text-right">Opening Balance</th>
                        <th className="p-4 text-right">Current Due (Lena Hai)</th>
                        <th className="p-4 text-center">Unpaid Invoices</th>
                        <th className="p-4 text-right">Last Payment</th>
                        <th className="p-4 text-center print:hidden">Ledger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {reportData.receivables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
                            <p className="font-bold text-base text-slate-800">No Customer Receivables Due</p>
                            <p className="text-xs text-slate-500">All customer accounts are fully cleared.</p>
                          </td>
                        </tr>
                      ) : (
                        reportData.receivables.map((r) => (
                          <tr key={r.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-900 text-sm sm:text-base">{r.name}</td>
                            <td className="p-4 text-slate-600 text-xs sm:text-sm">
                              {r.phone ? <div className="font-mono text-slate-800">{r.phone}</div> : null}
                              {r.address ? <div className="text-xs text-slate-400">{r.address}</div> : null}
                            </td>
                            <td className="p-4 text-right text-slate-600 text-sm font-medium">
                              {formatCurrency(r.opening_balance)}
                            </td>
                            <td className="p-4 text-right font-black text-purple-700 text-base whitespace-nowrap">
                              {formatCurrency(r.current_balance)}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-800 text-sm">
                              {r.unpaid_invoices_count > 0 ? (
                                <span className="px-2.5 py-1 rounded-full bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                                  {r.unpaid_invoices_count} unpaid
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-xs sm:text-sm">
                              {r.last_payment_date ? (
                                <div>
                                  <div className="font-bold text-[#16A34A]">{formatCurrency(r.last_payment_amount)}</div>
                                  <div className="text-slate-400 text-xs">{r.last_payment_date}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">No payments</span>
                              )}
                            </td>
                            <td className="p-4 text-center print:hidden">
                              <Link
                                href={`/customers/${r.id}/ledger`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 font-bold text-xs transition-colors border border-purple-200"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Ledger</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Supplier Payables Section */}
            {(activeTab === 'overview' || activeTab === 'payables') && (
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-5 border-b border-slate-200 bg-amber-50/50 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-5 h-5 text-amber-700" />
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">
                      Supplier Payables ({reportData.payables.length} Outstanding Accounts)
                    </h3>
                  </div>
                  <div className="font-black text-amber-700 text-sm sm:text-base">
                    Total: {formatCurrency(reportData.summary.total_payables)}
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-100 text-slate-700 uppercase font-bold text-xs tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="p-4">Supplier Name</th>
                        <th className="p-4">Contact Person / Phone</th>
                        <th className="p-4 text-right">Opening Balance</th>
                        <th className="p-4 text-right">Current Due (Dena Hai)</th>
                        <th className="p-4 text-center">Unpaid Orders</th>
                        <th className="p-4 text-right">Last Payment</th>
                        <th className="p-4 text-center print:hidden">Ledger</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-sm">
                      {reportData.payables.length === 0 ? (
                        <tr>
                          <td colSpan={7} className="p-12 text-center text-slate-500">
                            <CheckCircle2 className="w-8 h-8 mx-auto text-emerald-500 mb-1.5" />
                            <p className="font-bold text-base text-slate-800">No Supplier Payables Due</p>
                            <p className="text-xs text-slate-500">All supplier balances are fully settled.</p>
                          </td>
                        </tr>
                      ) : (
                        reportData.payables.map((p) => (
                          <tr key={p.id} className="hover:bg-slate-50 transition-colors">
                            <td className="p-4 font-bold text-slate-900 text-sm sm:text-base">{p.name}</td>
                            <td className="p-4 text-slate-600 text-xs sm:text-sm">
                              {p.contact_person ? <div className="font-semibold text-slate-800">{p.contact_person}</div> : null}
                              {p.phone ? <div className="font-mono text-slate-500">{p.phone}</div> : null}
                            </td>
                            <td className="p-4 text-right text-slate-600 text-sm font-medium">
                              {formatCurrency(p.opening_balance)}
                            </td>
                            <td className="p-4 text-right font-black text-amber-600 text-base whitespace-nowrap">
                              {formatCurrency(p.current_balance)}
                            </td>
                            <td className="p-4 text-center font-bold text-slate-800 text-sm">
                              {p.unpaid_orders_count > 0 ? (
                                <span className="px-2.5 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 font-bold text-xs">
                                  {p.unpaid_orders_count} unpaid
                                </span>
                              ) : (
                                <span className="text-xs text-slate-400">-</span>
                              )}
                            </td>
                            <td className="p-4 text-right text-xs sm:text-sm">
                              {p.last_payment_date ? (
                                <div>
                                  <div className="font-bold text-[#16A34A]">{formatCurrency(p.last_payment_amount)}</div>
                                  <div className="text-slate-400 text-xs">{p.last_payment_date}</div>
                                </div>
                              ) : (
                                <span className="text-slate-400 text-xs">No payments</span>
                              )}
                            </td>
                            <td className="p-4 text-center print:hidden">
                              <Link
                                href={`/suppliers/${p.id}/ledger`}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs transition-colors border border-amber-200"
                              >
                                <FileText className="w-3.5 h-3.5" />
                                <span>Ledger</span>
                              </Link>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
