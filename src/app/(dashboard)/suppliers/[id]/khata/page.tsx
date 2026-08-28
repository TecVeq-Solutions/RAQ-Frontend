'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { LedgerStatement, Supplier } from '@/types/ledger';
import { useParams, useRouter } from 'next/navigation';
import { FileText, ArrowLeft, Calendar, Loader2, Printer } from 'lucide-react';

export default function SupplierKhataPage() {
  const params = useParams();
  const router = useRouter();
  const supplierId = params.id;

  const [statement, setStatement] = useState<LedgerStatement | null>(null);
  const [loading, setLoading] = useState(true);

  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchStatement = useCallback(async () => {
    setLoading(true);
    try {
      const queryParams: any = {};
      if (startDate) queryParams.start_date = startDate;
      if (endDate) queryParams.end_date = endDate;

      const res = await apiClient.get(`/suppliers/${supplierId}/ledger`, { params: queryParams });
      if (res.data?.data) {
        setStatement(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load supplier Khata statement', err);
    } finally {
      setLoading(false);
    }
  }, [supplierId, startDate, endDate]);

  useEffect(() => {
    fetchStatement();
  }, [fetchStatement]);

  const handlePrint = () => {
    window.print();
  };

  const supplier: Supplier | undefined = statement?.supplier;

  return (
    <div className="space-y-6 animate-fadeIn print:space-y-4 print:p-0">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 print:hidden">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/suppliers')}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">Supplier Ledger Statement</h1>
            <p className="text-sm text-slate-500">
              Complete historical ledger transaction tracking and vendor Khata summary
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold border border-slate-200 hover:bg-slate-50 text-slate-600 transition-all"
          >
            <Printer className="w-4 h-4" />
            <span>Print Ledger</span>
          </button>
        </div>
      </div>

      {/* Profile Overview Card */}
      {supplier && (
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6 print:border-none print:shadow-none print:p-0 print:grid-cols-2">
          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Vendor / Company Name</div>
            <div className="text-base font-extrabold text-[#0F172A] mt-1">{supplier.name}</div>
            <div className="text-xs text-slate-400 mt-0.5">{supplier.email || 'No email registered'}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Contact Person</div>
            <div className="text-sm font-semibold text-slate-700 mt-1">{supplier.contact_person || '-'}</div>
            <div className="text-xs text-slate-400 mt-0.5">{supplier.phone}</div>
          </div>

          <div>
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Opening Balance</div>
            <div className="text-base font-bold text-slate-600 mt-1">
              Rs. {Number(supplier.opening_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>

          <div className="md:text-right print:text-left">
            <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Payable</div>
            <div className="text-lg font-black text-amber-700 mt-1">
              Rs. {Number(supplier.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* Date Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-4 justify-between print:hidden">
        <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
          <Calendar className="w-4 h-4 text-[#16A34A]" />
          <span>Statement Filters</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>From:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-slate-600">
            <span>To:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-700 focus:outline-none focus:ring-1 focus:ring-[#16A34A]"
            />
          </div>
        </div>
      </div>

      {/* Statement Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden print:border-none print:shadow-none">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between print:hidden">
          <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
            <FileText className="w-4 h-4 text-[#16A34A]" />
            <span>Khata Statement Table</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600 print:text-xs">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100 print:bg-transparent">
              <tr>
                <th className="px-6 py-3">Date</th>
                <th className="px-6 py-3">Ref</th>
                <th className="px-6 py-3">Description</th>
                <th className="px-6 py-3 text-right">Debit (Payment -)</th>
                <th className="px-6 py-3 text-right">Credit (Payable +)</th>
                <th className="px-6 py-3 text-right">Running Balance</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {loading ? (
                <tr className="print:hidden">
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Fetching Khata statement...</span>
                    </div>
                  </td>
                </tr>
              ) : statement ? (
                <>
                  {/* Carry Forward Row */}
                  {startDate && (
                    <tr className="bg-slate-50/50 italic text-slate-500 print:bg-transparent">
                      <td className="px-6 py-4 font-mono">{startDate}</td>
                      <td className="px-6 py-4">-</td>
                      <td className="px-6 py-4 font-bold text-slate-700">Carry Forward Balance</td>
                      <td className="px-6 py-4 text-right">-</td>
                      <td className="px-6 py-4 text-right">-</td>
                      <td className="px-6 py-4 text-right font-bold text-slate-700">
                        Rs. {Number(statement.carry_forward).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                    </tr>
                  )}

                  {statement.statement.length > 0 ? (
                    statement.statement.map((entry) => (
                      <tr key={entry.id} className="hover:bg-slate-50/30 transition-colors">
                        <td className="px-6 py-4 font-mono text-xs text-slate-500">{entry.date}</td>
                        <td className="px-6 py-4 font-mono text-xs text-slate-700 uppercase">
                          {entry.reference_type === 'opening_balance' ? `OPENING-${entry.id}` : `${entry.reference_type}-${entry.reference_id}`}
                        </td>
                        <td className="px-6 py-4 text-slate-700">{entry.description}</td>
                        <td className="px-6 py-4 text-right text-slate-500">
                          {entry.debit > 0
                            ? `Rs. ${Number(entry.debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right text-[#0F172A]">
                          {entry.credit > 0
                            ? `Rs. ${Number(entry.credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}`
                            : '-'}
                        </td>
                        <td className="px-6 py-4 text-right font-extrabold text-[#0F172A]">
                          Rs. {Number(entry.running_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                        No transactions found inside selected date range.
                      </td>
                    </tr>
                  )}

                  {/* Summary Totals Row */}
                  <tr className="bg-slate-50 font-bold text-slate-700 border-t border-slate-200 print:bg-transparent">
                    <td className="px-6 py-4" colSpan={3}>
                      Total Debits / Credits Inside Date Range
                    </td>
                    <td className="px-6 py-4 text-right text-slate-600">
                      Rs. {Number(statement.totals.total_debit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-[#16A34A]">
                      Rs. {Number(statement.totals.total_credit).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-[#0F172A]">
                      -
                    </td>
                  </tr>
                </>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
