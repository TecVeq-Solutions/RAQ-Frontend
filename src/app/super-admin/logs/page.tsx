'use client';

import React, { useEffect, useState, useCallback } from 'react';
import {
  ScrollText,
  Search,
  Filter,
  RefreshCw,
  AlertTriangle,
  AlertCircle,
  Info,
  Clock,
  User,
  Building2,
  Globe,
  ArrowRight,
  X,
  Code,
  CheckCircle2,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Shield,
  Layers,
  FileJson,
} from 'lucide-react';
import {
  AdminActivityLog,
  LogCategory,
  LogSeverity,
  SystemLogFilterParams,
  SystemLogSummary,
} from '@/types/systemLog';
import { systemLogService } from '@/lib/systemLogService';

const CATEGORIES: { label: string; value: string; color: string }[] = [
  { label: 'All Categories', value: 'all', color: 'bg-slate-100 text-slate-700 border-slate-200' },
  { label: 'Auth', value: 'auth', color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { label: 'License', value: 'license', color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { label: 'Package', value: 'package', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Tenant', value: 'tenant', color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { label: 'User', value: 'user', color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { label: 'Module', value: 'module', color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { label: 'AI ERP', value: 'ai', color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { label: 'Support', value: 'support', color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { label: 'Database', value: 'db', color: 'bg-rose-50 text-rose-700 border-rose-200' },
];

const SEVERITIES: { label: string; value: string; color: string }[] = [
  { label: 'All Severities', value: 'all', color: 'text-slate-600' },
  { label: 'Info', value: 'info', color: 'text-emerald-600' },
  { label: 'Warning', value: 'warning', color: 'text-amber-600' },
  { label: 'Critical', value: 'critical', color: 'text-rose-600' },
];

export default function SystemLogsPage() {
  const [logs, setLogs] = useState<AdminActivityLog[]>([]);
  const [summary, setSummary] = useState<SystemLogSummary>({
    total_logs: 0,
    critical_logs: 0,
    warning_logs: 0,
    recent_24h: 0,
  });
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState<AdminActivityLog | null>(null);

  // Filter States
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [severity, setSeverity] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(25);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params: SystemLogFilterParams = {
        page,
        per_page: perPage,
      };

      if (search.trim()) params.search = search.trim();
      if (category !== 'all') params.category = category;
      if (severity !== 'all') params.severity = severity;
      if (dateFrom) params.date_from = dateFrom;
      if (dateTo) params.date_to = dateTo;

      const data = await systemLogService.getLogs(params);
      setLogs(data.logs);
      setSummary(data.summary);
      setTotalPages(data.pagination.last_page);
      setTotalCount(data.pagination.total);
    } catch (err) {
      console.error('Failed to load system logs:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, search, category, severity, dateFrom, dateTo]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchLogs();
  };

  const resetFilters = () => {
    setSearch('');
    setCategory('all');
    setSeverity('all');
    setDateFrom('');
    setDateTo('');
    setPage(1);
  };

  const getSeverityBadge = (sev: LogSeverity) => {
    switch (sev) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30 uppercase tracking-wider">
            <AlertCircle className="w-3 h-3 text-rose-400" />
            Critical
          </span>
        );
      case 'warning':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30 uppercase tracking-wider">
            <AlertTriangle className="w-3 h-3 text-amber-400" />
            Warning
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 uppercase tracking-wider">
            <Info className="w-3 h-3 text-emerald-400" />
            Info
          </span>
        );
    }
  };

  const getCategoryBadge = (cat: LogCategory) => {
    const found = CATEGORIES.find((c) => c.value === cat);
    return (
      <span
        className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold border ${
          found ? found.color : 'bg-slate-800 text-slate-300 border-slate-700'
        }`}
      >
        {cat.toUpperCase()}
      </span>
    );
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 font-sans">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 shadow-xs">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                System Audit & Activity Logs
              </h1>
              <p className="text-xs sm:text-sm text-slate-500">
                Centralized, immutable audit trail for platform mutations, security events, and tenant operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition-all disabled:opacity-50 shadow-xs cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Total System Events</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-slate-900 font-mono">{summary.total_logs}</span>
            <span className="text-[11px] text-slate-500 font-medium">recorded</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Critical Incidents</span>
            <div className="p-2 rounded-xl bg-red-50 text-red-700 border border-red-100">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-red-600 font-mono">{summary.critical_logs}</span>
            <span className="text-[11px] text-slate-500 font-medium">high severity</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Warnings & Flags</span>
            <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-amber-600 font-mono">{summary.warning_logs}</span>
            <span className="text-[11px] text-slate-500 font-medium">review advised</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-500 uppercase">Recent 24 Hours</span>
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-black text-emerald-700 font-mono">{summary.recent_24h}</span>
            <span className="text-[11px] text-slate-500 font-medium">mutations</span>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, description, IP address, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>

            <select
              value={severity}
              onChange={(e) => {
                setSeverity(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium cursor-pointer"
            >
              {SEVERITIES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>

            <input
              type="date"
              value={dateFrom}
              onChange={(e) => {
                setDateFrom(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
              title="From Date"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 focus:bg-white focus:outline-none focus:border-emerald-500 font-medium"
              title="To Date"
            />

            {(search || category !== 'all' || severity !== 'all' || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Activity Log Table */}
      <div className="rounded-2xl bg-white border border-slate-200/90 overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 font-bold border-b border-slate-200">
              <tr>
                <th className="py-3.5 px-4">Timestamp</th>
                <th className="py-3.5 px-3">Severity</th>
                <th className="py-3.5 px-3">Category</th>
                <th className="py-3.5 px-4">Action & Description</th>
                <th className="py-3.5 px-4">Actor</th>
                <th className="py-3.5 px-4">Tenant / Target</th>
                <th className="py-3.5 px-3 text-right">Details</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-emerald-600" />
                      <span>Loading activity logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <ScrollText className="w-8 h-8 text-slate-400" />
                      <p className="text-sm font-bold text-slate-800">No activity logs found</p>
                      <p className="text-xs text-slate-500">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-50/80 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500 whitespace-nowrap font-medium">
                      {new Date(log.created_at).toLocaleString('en-US', {
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit',
                      })}
                    </td>
                    <td className="py-3.5 px-3 whitespace-nowrap">{getSeverityBadge(log.severity)}</td>
                    <td className="py-3.5 px-3 whitespace-nowrap">{getCategoryBadge(log.category)}</td>
                    <td className="py-3.5 px-4 max-w-md">
                      <div className="font-bold text-slate-900">{log.action}</div>
                      <div className="text-slate-500 truncate text-[11px] mt-0.5">{log.description}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.super_admin ? (
                        <div className="flex items-center gap-1.5 text-slate-800 font-medium">
                          <User className="w-3.5 h-3.5 text-emerald-600" />
                          <span>{log.super_admin.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-400">System Engine</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.tenant ? (
                        <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-medium">{log.tenant.name}</span>
                        </div>
                      ) : log.target_type ? (
                        <span className="text-slate-500 font-mono text-[11px]">
                          {log.target_type} #{log.target_id}
                        </span>
                      ) : (
                        <span className="text-slate-400">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-600 hover:text-slate-900 transition-colors"
                        title="Inspect Log Entry"
                      >
                        <Code className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="flex items-center justify-between px-4 py-3 bg-white border-t border-slate-200 text-xs text-slate-500">
          <div>
            Showing <span className="font-bold text-slate-800">{logs.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-semibold text-slate-800">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/40 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white border-l border-slate-200 h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Audit Event Details</h3>
                  <p className="text-[11px] font-mono text-slate-500">Log ID: #{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-1.5 rounded-lg bg-white hover:bg-slate-100 text-slate-500 hover:text-slate-800 border border-slate-200 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Event Summary Box */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedLog.severity)}
                    {getCategoryBadge(selectedLog.category)}
                  </div>
                  <span className="font-mono text-[11px] text-slate-500">
                    {new Date(selectedLog.created_at).toUTCString()}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-slate-900">{selectedLog.action}</h4>
                  <p className="text-slate-600 mt-1 text-xs leading-relaxed">{selectedLog.description}</p>
                </div>
              </div>

              {/* Context Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Actor</span>
                  <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedLog.super_admin ? selectedLog.super_admin.name : 'System'}</span>
                  </div>
                  {selectedLog.super_admin?.email && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {selectedLog.super_admin.email}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                  <span className="text-[11px] text-slate-500 block font-medium">Target Organization</span>
                  <div className="mt-1 font-bold text-slate-900 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{selectedLog.tenant ? selectedLog.tenant.name : 'Platform Level'}</span>
                  </div>
                  {selectedLog.tenant?.slug && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      slug: {selectedLog.tenant.slug}
                    </span>
                  )}
                </div>
              </div>

              {/* HTTP Request Diagnostics */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <h5 className="font-bold text-slate-800 text-xs flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Request Diagnostics</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-600">
                  <div>
                    <span className="text-slate-500">Method: </span>
                    <span className="text-emerald-700 font-bold">{selectedLog.request_method || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">IP: </span>
                    <span className="text-slate-800">{selectedLog.ip_address || '127.0.0.1'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Path: </span>
                    <span className="text-slate-700">{selectedLog.request_path || 'N/A'}</span>
                  </div>
                  {selectedLog.user_agent && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Agent: </span>
                      <span className="text-slate-600 break-all text-[10px]">{selectedLog.user_agent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* State Diffs (Before vs After) */}
              {(selectedLog.before_data || selectedLog.after_data) && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-slate-800 text-xs flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-emerald-600" />
                    <span>State Mutation Diff</span>
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLog.before_data && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-rose-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Before State
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-800 font-mono overflow-x-auto max-h-56">
                          {JSON.stringify(selectedLog.before_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedLog.after_data && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-emerald-700 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          After State
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-800 font-mono overflow-x-auto max-h-56">
                          {JSON.stringify(selectedLog.after_data, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata Details */}
              {selectedLog.metadata && (
                <div className="space-y-2">
                  <h5 className="font-semibold text-slate-800 text-xs">Extended Metadata</h5>
                  <pre className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[10px] text-slate-800 font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Security Masking Notice */}
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-emerald-900 text-[11px]">
                <Shield className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero Sensitive Exposure Guarantee: Passwords, tokens, and credentials are redacted automatically.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
