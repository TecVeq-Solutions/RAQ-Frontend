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
  { label: 'All Categories', value: 'all', color: 'bg-slate-800 text-slate-300' },
  { label: 'Auth', value: 'auth', color: 'bg-purple-500/10 text-purple-400 border-purple-500/30' },
  { label: 'License', value: 'license', color: 'bg-blue-500/10 text-blue-400 border-blue-500/30' },
  { label: 'Package', value: 'package', color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' },
  { label: 'Tenant', value: 'tenant', color: 'bg-cyan-500/10 text-cyan-400 border-cyan-500/30' },
  { label: 'User', value: 'user', color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30' },
  { label: 'Module', value: 'module', color: 'bg-teal-500/10 text-teal-400 border-teal-500/30' },
  { label: 'AI ERP', value: 'ai', color: 'bg-amber-500/10 text-amber-400 border-amber-500/30' },
  { label: 'Support', value: 'support', color: 'bg-orange-500/10 text-orange-400 border-orange-500/30' },
  { label: 'Database', value: 'db', color: 'bg-rose-500/10 text-rose-400 border-rose-500/30' },
];

const SEVERITIES: { label: string; value: string; color: string }[] = [
  { label: 'All Severities', value: 'all', color: 'text-slate-300' },
  { label: 'Info', value: 'info', color: 'text-emerald-400' },
  { label: 'Warning', value: 'warning', color: 'text-amber-400' },
  { label: 'Critical', value: 'critical', color: 'text-rose-400' },
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
    <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400 shadow-sm">
              <ScrollText className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                System Audit & Activity Logs
              </h1>
              <p className="text-xs sm:text-sm text-slate-400">
                Centralized, immutable audit trail for platform mutations, security events, and tenant operations.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:border-slate-700 text-slate-200 text-xs font-semibold hover:bg-slate-800/80 transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* KPI Metrics Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Total System Events</span>
            <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white">{summary.total_logs}</span>
            <span className="text-[11px] text-slate-500">recorded</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Critical Incidents</span>
            <div className="p-2 rounded-xl bg-rose-500/10 text-rose-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-400">{summary.critical_logs}</span>
            <span className="text-[11px] text-slate-500">high severity</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Warnings & Flags</span>
            <div className="p-2 rounded-xl bg-amber-500/10 text-amber-400">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-400">{summary.warning_logs}</span>
            <span className="text-[11px] text-slate-500">review advised</span>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/80 backdrop-blur-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400">Recent 24 Hours</span>
            <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-400">{summary.recent_24h}</span>
            <span className="text-[11px] text-slate-500">mutations</span>
          </div>
        </div>
      </div>

      {/* Filter Control Bar */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <form onSubmit={handleSearchSubmit} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, description, IP address, target..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
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
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              title="From Date"
            />

            <input
              type="date"
              value={dateTo}
              onChange={(e) => {
                setDateTo(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 bg-slate-950/80 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:border-indigo-500"
              title="To Date"
            />

            {(search || category !== 'all' || severity !== 'all' || dateFrom || dateTo) && (
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 transition-all"
              >
                <X className="w-3.5 h-3.5" />
                <span>Reset</span>
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Activity Log Table */}
      <div className="rounded-2xl bg-slate-900/60 border border-slate-800/80 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/70 text-[11px] uppercase tracking-wider text-slate-400 font-semibold border-b border-slate-800">
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
            <tbody className="divide-y divide-slate-800/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <RefreshCw className="w-6 h-6 animate-spin text-indigo-400" />
                      <span>Loading activity logs...</span>
                    </div>
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <ScrollText className="w-8 h-8 text-slate-600" />
                      <p className="text-sm font-medium text-slate-300">No activity logs found</p>
                      <p className="text-xs text-slate-500">Try adjusting your filters or date range</p>
                    </div>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px] text-slate-400 whitespace-nowrap">
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
                      <div className="font-semibold text-slate-100">{log.action}</div>
                      <div className="text-slate-400 truncate text-[11px] mt-0.5">{log.description}</div>
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.super_admin ? (
                        <div className="flex items-center gap-1.5 text-slate-300">
                          <User className="w-3.5 h-3.5 text-indigo-400" />
                          <span>{log.super_admin.name}</span>
                        </div>
                      ) : (
                        <span className="text-slate-500">System Engine</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {log.tenant ? (
                        <div className="flex items-center gap-1.5 text-cyan-400">
                          <Building2 className="w-3.5 h-3.5" />
                          <span className="font-medium">{log.tenant.name}</span>
                        </div>
                      ) : log.target_type ? (
                        <span className="text-slate-400 font-mono text-[11px]">
                          {log.target_type} #{log.target_id}
                        </span>
                      ) : (
                        <span className="text-slate-600">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-3 text-right whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedLog(log);
                        }}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
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
        <div className="flex items-center justify-between px-4 py-3 bg-slate-950/60 border-t border-slate-800 text-xs text-slate-400">
          <div>
            Showing <span className="font-semibold text-slate-200">{logs.length}</span> of{' '}
            <span className="font-semibold text-slate-200">{totalCount}</span> entries
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-2 font-medium text-slate-300">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || loading}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 disabled:opacity-40 disabled:hover:bg-slate-800 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Slide-over Detail Drawer */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex justify-end bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full flex flex-col shadow-2xl overflow-y-auto">
            {/* Drawer Header */}
            <div className="sticky top-0 z-10 bg-slate-900/95 backdrop-blur-md px-6 py-4 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                  <FileJson className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">Audit Event Details</h3>
                  <p className="text-[11px] font-mono text-slate-400">Log ID: #{selectedLog.id}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Drawer Body */}
            <div className="p-6 space-y-6 flex-1 text-xs">
              {/* Event Summary Box */}
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    {getSeverityBadge(selectedLog.severity)}
                    {getCategoryBadge(selectedLog.category)}
                  </div>
                  <span className="font-mono text-[11px] text-slate-400">
                    {new Date(selectedLog.created_at).toUTCString()}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{selectedLog.action}</h4>
                  <p className="text-slate-300 mt-1 text-xs leading-relaxed">{selectedLog.description}</p>
                </div>
              </div>

              {/* Context Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Actor</span>
                  <div className="mt-1 font-semibold text-slate-200 flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{selectedLog.super_admin ? selectedLog.super_admin.name : 'System'}</span>
                  </div>
                  {selectedLog.super_admin?.email && (
                    <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                      {selectedLog.super_admin.email}
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[11px] text-slate-400 block">Target Organization</span>
                  <div className="mt-1 font-semibold text-slate-200 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-cyan-400" />
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
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80 space-y-2">
                <h5 className="font-semibold text-slate-300 text-xs flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-indigo-400" />
                  <span>Request Diagnostics</span>
                </h5>
                <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-[11px] text-slate-400">
                  <div>
                    <span className="text-slate-500">Method: </span>
                    <span className="text-indigo-300 font-bold">{selectedLog.request_method || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="text-slate-500">IP: </span>
                    <span className="text-slate-200">{selectedLog.ip_address || '127.0.0.1'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-slate-500">Path: </span>
                    <span className="text-slate-300">{selectedLog.request_path || 'N/A'}</span>
                  </div>
                  {selectedLog.user_agent && (
                    <div className="col-span-2">
                      <span className="text-slate-500">Agent: </span>
                      <span className="text-slate-400 break-all text-[10px]">{selectedLog.user_agent}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* State Diffs (Before vs After) */}
              {(selectedLog.before_data || selectedLog.after_data) && (
                <div className="space-y-3">
                  <h5 className="font-semibold text-slate-300 text-xs flex items-center gap-2">
                    <Code className="w-3.5 h-3.5 text-indigo-400" />
                    <span>State Mutation Diff</span>
                  </h5>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {selectedLog.before_data && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-rose-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-rose-500" />
                          Before State
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-56">
                          {JSON.stringify(selectedLog.before_data, null, 2)}
                        </pre>
                      </div>
                    )}

                    {selectedLog.after_data && (
                      <div className="space-y-1.5">
                        <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
                          <span className="w-2 h-2 rounded-full bg-emerald-500" />
                          After State
                        </span>
                        <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-56">
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
                  <h5 className="font-semibold text-slate-300 text-xs">Extended Metadata</h5>
                  <pre className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-[10px] text-slate-300 font-mono overflow-x-auto max-h-48">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* Security Masking Notice */}
              <div className="p-3 rounded-xl bg-indigo-500/5 border border-indigo-500/20 flex items-center gap-2.5 text-indigo-300 text-[11px]">
                <Shield className="w-4 h-4 text-indigo-400 shrink-0" />
                <span>Zero Sensitive Exposure Guarantee: Passwords, tokens, and credentials are redacted automatically.</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
