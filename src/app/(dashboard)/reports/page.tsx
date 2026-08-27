'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { BarChart3, TrendingUp, DollarSign, PieChart, FileText } from 'lucide-react';

export default function ReportsPage() {
  const [reports, setReports] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiClient
      .get('/reports')
      .then((res) => {
        if (res.data?.data) {
          setReports(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Financial & Inventory Reports</h1>
          <p className="text-sm text-slate-500 mt-0.5">High level turnover analysis and balance summaries</p>
        </div>

        <button className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 text-white font-semibold hover:bg-slate-800 transition-all shadow-sm text-sm">
          <FileText className="w-4 h-4" /> Export Financial PDF
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Annual Turnover</span>
            <DollarSign className="w-5 h-5 text-[#16A34A]" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">
            ${reports?.annual_turnover?.toLocaleString() ?? '1,250,000'}
          </div>
          <p className="text-xs text-slate-400 mt-2">Fiscal Year 2025 - 2026</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Gross Margin Profit</span>
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">
            ${reports?.gross_profit?.toLocaleString() ?? '340,000'}
          </div>
          <p className="text-xs text-slate-400 mt-2">Before operating expenses</p>
        </div>

        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-4">
            <span className="text-xs font-bold uppercase tracking-wider">Net Margin</span>
            <PieChart className="w-5 h-5 text-blue-600" />
          </div>
          <div className="text-3xl font-extrabold text-[#0F172A]">
            {reports?.net_margin_percentage ?? 27.2}%
          </div>
          <p className="text-xs text-slate-400 mt-2">Healthy baseline efficiency</p>
        </div>
      </div>
    </div>
  );
}
