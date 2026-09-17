'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import {
  ProductionOrder,
  ProductionOrderStatus,
  ProductionOrderStage,
} from '@/types/manufacturing';
import ProductionStatusBadge from '@/components/manufacturing/ProductionStatusBadge';
import CompleteProductionModal from '@/components/manufacturing/CompleteProductionModal';
import CuttingStageModal from '@/components/manufacturing/CuttingStageModal';
import StageCostTable from '@/components/manufacturing/StageCostTable';
import ProductionCostBreakdownCard from '@/components/manufacturing/ProductionCostBreakdownCard';
import {
  Factory,
  Plus,
  Search,
  Filter,
  Eye,
  Trash2,
  PlayCircle,
  Scissors,
  BookOpen,
  Sparkles,
  CheckCircle2,
  XCircle,
  Loader2,
  RefreshCw,
  Layers,
  Calendar,
  Clock,
  AlertCircle,
  AlertTriangle,
  X,
  FileSpreadsheet,
  TrendingDown,
  DollarSign,
} from 'lucide-react';

export default function ProductionOrdersPage() {
  const [orders, setOrders] = useState<ProductionOrder[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [debouncedSearch, setDebouncedSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [stageFilter, setStageFilter] = useState<string>('all');

  // Modal / Inspection state
  const [inspectingOrder, setInspectingOrder] = useState<ProductionOrder | null>(null);
  const [actionLoadingId, setActionLoadingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Phase 5 Output Logging Modal
  const [completingOrder, setCompletingOrder] = useState<ProductionOrder | null>(null);

  // Phase 6 Cutting & Wastage Modal
  const [cuttingOrder, setCuttingOrder] = useState<ProductionOrder | null>(null);



  // RBAC checks
  const canManage = authService.isAdmin() || authService.isStaff();
  const isAdmin = authService.isAdmin();

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params: any = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter !== 'all') {
        params.status = statusFilter;
      }
      if (stageFilter !== 'all') {
        params.current_stage = stageFilter;
      }

      const res = await apiClient.get('/production-orders', { params });
      setOrders(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch production orders', err);
      setActionError(err.response?.data?.message || 'Failed to load production orders.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter, stageFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Stage Advancement Handler
  const handleTransition = async (
    order: ProductionOrder,
    nextStatus?: ProductionOrderStatus,
    nextStage?: ProductionOrderStage,
    actualQty?: number
  ) => {
    if (!canManage) return;

    setActionLoadingId(order.id);
    setActionError(null);
    try {
      const payload: any = {};
      if (nextStatus) payload.status = nextStatus;
      if (nextStage) payload.current_stage = nextStage;
      if (actualQty !== undefined) payload.actual_quantity = actualQty;

      await apiClient.patch(`/production-orders/${order.id}/status`, payload);
      await fetchOrders();
      if (inspectingOrder && inspectingOrder.id === order.id) {
        const refreshed = await apiClient.get(`/production-orders/${order.id}`);
        setInspectingOrder(refreshed.data?.data);
      }
    } catch (err: any) {
      console.error('Transition error', err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to update production stage.');
      setActionError(serverMsg);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Delete Draft Order
  const handleDeleteDraft = async (order: ProductionOrder) => {
    if (!isAdmin) return;

    if (!confirm(`Are you sure you want to delete draft order "${order.order_no}"?`)) {
      return;
    }

    setActionLoadingId(order.id);
    setActionError(null);
    try {
      await apiClient.delete(`/production-orders/${order.id}`);
      await fetchOrders();
      if (inspectingOrder?.id === order.id) setInspectingOrder(null);
    } catch (err: any) {
      console.error('Delete error', err);
      setActionError(err.response?.data?.message || 'Failed to delete draft order.');
    } finally {
      setActionLoadingId(null);
    }
  };


  // Stats calculation
  const totalCount = orders.length;
  const inProgressCount = orders.filter((o) => o.status === 'in_progress').length;
  const draftCount = orders.filter((o) => o.status === 'draft').length;
  const completedCount = orders.filter((o) => o.status === 'completed').length;

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Factory className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Manufacturing Orders
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Track batch manufacturing lifecycle, stage transitions (Cutting, Binding, Finishing), and output logs.
          </p>
        </div>

        {canManage && (
          <Link
            href="/manufacturing/orders/new"
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            Launch Production Order
          </Link>
        )}
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Total Batches
            </span>
            <div className="rounded-xl bg-slate-100 p-2 text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalCount}</p>
          <span className="text-xs text-slate-400">Scheduled runs</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              In Production
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <PlayCircle className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{inProgressCount}</p>
          <span className="text-xs text-slate-400">Active floor batches</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Draft / Planning
            </span>
            <div className="rounded-xl bg-amber-50 p-2 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{draftCount}</p>
          <span className="text-xs text-slate-400">Ready to launch</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Completed Runs
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{completedCount}</p>
          <span className="text-xs text-slate-400">Finished goods ready</span>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center justify-between gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 shrink-0" />
            <span>{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="text-rose-400 hover:text-rose-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}


      {/* Filter Toolbar */}
      <div className="rounded-2xl border border-slate-200 bg-white p-3 sm:p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col gap-3">
        <div className="relative w-full">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search Order #, finished good..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2.5 sm:py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full">
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex-1 min-w-[130px] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="draft">Drafts Only</option>
            <option value="in_progress">In Production</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>



          {/* Stage filter */}
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="flex-1 min-w-[120px] rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-xs font-semibold text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
          >
            <option value="all">All Stages</option>
            <option value="planning">Planning</option>
            <option value="cutting">Cutting</option>
            <option value="binding">Binding</option>
            <option value="finishing">Finishing</option>
            <option value="completed">Completed</option>
          </select>

          <button
            onClick={fetchOrders}
            className="rounded-xl border border-slate-200 p-2.5 sm:p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors shrink-0"
            title="Refresh Orders"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Orders Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden min-w-0">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Loading Production Orders...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-3">
              <Factory className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Production Orders Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {searchTerm
                ? 'No manufacturing orders match your filter criteria.'
                : 'Launch your first manufacturing batch to schedule and monitor floor operations.'}
            </p>
            {canManage && (
              <Link
                href="/manufacturing/orders/new"
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Launch First Order
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">Order No</th>
                  <th className="px-6 py-3.5">Finished Product</th>
                  <th className="px-6 py-3.5 text-center">Batch Target</th>
                  <th className="px-6 py-3.5 text-center">Actual Output</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-center">Stage</th>
                  <th className="px-6 py-3.5 text-right">Actions / Transition</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {orders.map((order) => {
                  const finishedProd = order.finishedProduct || order.finished_product;
                  const unitName = finishedProd?.unit?.short_name || 'Units';
                  const isActionLoading = actionLoadingId === order.id;

                  return (
                    <tr
                      key={order.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* Order No & Dates */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {order.order_no}
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Calendar className="h-3 w-3" />
                          {order.start_date || 'Not started'}
                        </div>
                      </td>

                      {/* Finished Product */}
                      <td className="px-6 py-4">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {finishedProd?.name || `Product #${order.finished_product_id}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          SKU: {finishedProd?.sku || 'N/A'}
                        </div>
                      </td>

                      {/* Target Planned Quantity */}
                      <td className="px-6 py-4 text-center">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {parseFloat(String(order.planned_quantity)).toLocaleString()}{' '}
                          <span className="text-xs text-slate-400 font-normal">{unitName}</span>
                        </span>
                      </td>

                      {/* Actual Output */}
                      <td className="px-6 py-4 text-center">
                        {order.status === 'completed' ? (
                          <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {parseFloat(String(order.actual_quantity)).toLocaleString()}{' '}
                            <span className="text-xs font-normal">{unitName}</span>
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic">In progress</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        <ProductionStatusBadge status={order.status} type="status" />
                      </td>

                      {/* Current Stage */}
                      <td className="px-6 py-4 text-center">
                        <ProductionStatusBadge stage={order.current_stage} type="stage" />
                      </td>

                      {/* Actions & Stage Progression Controls */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {/* Inspect / View Material Lines */}
                          <button
                            onClick={() => setInspectingOrder(order)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Inspect Order Details & Materials"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Interactive Stage Advancements for Staff/Admin */}
                          {canManage && (
                            <>
                              {order.status === 'draft' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => handleTransition(order, 'in_progress', 'cutting')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-blue-700 disabled:opacity-50 transition-all shadow-sm"
                                  title="Validate stock and start cutting"
                                >
                                  {isActionLoading ? (
                                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                  ) : (
                                    <PlayCircle className="h-3.5 w-3.5" />
                                  )}
                                  <span>Start Floor Run</span>
                                </button>
                              )}

                              {order.status === 'in_progress' && order.current_stage === 'cutting' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => setCuttingOrder(order)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2.5 py-1 text-xs font-bold text-blue-700 hover:bg-blue-100 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800 transition-all shadow-sm"
                                  title="Log Paper Cutting Metrics & Advance to Binding"
                                >
                                  <Scissors className="h-3.5 w-3.5" />
                                  <span>Log Cutting & Advance</span>
                                </button>
                              )}

                              {order.status === 'in_progress' && order.current_stage === 'binding' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => handleTransition(order, undefined, 'finishing')}
                                  className="inline-flex items-center gap-1 rounded-lg bg-purple-50 border border-purple-200 px-2.5 py-1 text-xs font-bold text-purple-700 hover:bg-purple-100 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800 transition-all"
                                  title="Advance to Finishing"
                                >
                                  <Sparkles className="h-3.5 w-3.5" />
                                  <span>Move to Finishing</span>
                                </button>
                              )}

                              {order.status !== 'draft' && order.status !== 'cancelled' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => setInspectingOrder(order)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-teal-50 border border-teal-200 px-2.5 py-1 text-xs font-bold text-teal-700 hover:bg-teal-100 dark:bg-teal-950/60 dark:text-teal-300 dark:border-teal-800 transition-all"
                                  title="Track Direct Labor & Stage Costs"
                                >
                                  <DollarSign className="h-3.5 w-3.5" />
                                  <span>Costs</span>
                                </button>
                              )}

                              {order.status === 'in_progress' && order.current_stage === 'finishing' && (
                                <button
                                  disabled={isActionLoading}
                                  onClick={() => setCompletingOrder(order)}
                                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-600 px-2.5 py-1 text-xs font-bold text-white hover:bg-emerald-700 transition-all shadow-sm"
                                  title="Complete Batch & Stock Transformation"
                                >
                                  <CheckCircle2 className="h-3.5 w-3.5" />
                                  <span>Complete Batch</span>
                                </button>
                              )}
                            </>
                          )}

                          {/* Delete Draft (Admin only) */}
                          {isAdmin && order.status === 'draft' && (
                            <button
                              disabled={isActionLoading}
                              onClick={() => handleDeleteDraft(order)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 disabled:opacity-30 transition-colors"
                              title="Delete Draft Order"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect Order Modal */}
      {inspectingOrder && (
        <div className="fixed inset-0 z-50 flex items-start sm:items-center justify-center overflow-y-auto bg-slate-900/60 p-3 sm:p-4 backdrop-blur-sm">
          <div className="relative w-[95%] sm:w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-2xl bg-white p-4 sm:p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4 sm:space-y-6 mt-4 sm:mt-0">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-blue-50 p-2.5 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
                  <Factory className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {inspectingOrder.order_no}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Target: {inspectingOrder.finishedProduct?.name || 'Finished Good'} —{' '}
                    {parseFloat(String(inspectingOrder.planned_quantity)).toLocaleString()}{' '}
                    {inspectingOrder.finishedProduct?.unit?.short_name || 'Units'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setInspectingOrder(null)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Status</span>
                <div className="mt-1">
                  <ProductionStatusBadge status={inspectingOrder.status} type="status" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Stage</span>
                <div className="mt-1">
                  <ProductionStatusBadge stage={inspectingOrder.current_stage} type="stage" />
                </div>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Start Date</span>
                <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
                  {inspectingOrder.start_date || 'N/A'}
                </p>
              </div>

              <div className="rounded-xl bg-slate-50 p-3 dark:bg-slate-800/50">
                <span className="text-[11px] font-semibold text-slate-400 uppercase">Actual Output</span>
                <p className="mt-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                  {inspectingOrder.status === 'completed'
                    ? `${parseFloat(String(inspectingOrder.actual_quantity)).toLocaleString()} Units`
                    : 'Pending completion'}
                </p>
              </div>
            </div>

            {/* Stage 1 Cutting Performance Metric (Phase 6) */}
            {((inspectingOrder.cuttingLogs && inspectingOrder.cuttingLogs.length > 0) || inspectingOrder.cuttingLog) && (
              <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 dark:border-blue-900/60 dark:bg-blue-950/20 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-blue-900 dark:text-blue-300 flex items-center gap-1.5">
                    <Scissors className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    Stage 1 — Paper Cutting Performance & Wastage
                  </h4>
                  {inspectingOrder.cuttingLog?.wastage_percentage !== undefined && (
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-extrabold ${Number(inspectingOrder.cuttingLog.wastage_percentage) > 10.0
                        ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 border border-rose-300'
                        : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 border border-emerald-300'
                        }`}
                    >
                      {Number(inspectingOrder.cuttingLog.wastage_percentage) > 10.0 && (
                        <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
                      )}
                      Wastage: {Number(inspectingOrder.cuttingLog.wastage_percentage).toFixed(2)}%
                    </span>
                  )}
                </div>

                {inspectingOrder.cuttingLogs?.map((log, lIdx) => (
                  <div key={lIdx} className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                    <div className="rounded-xl bg-white p-2.5 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Input Paper</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {parseFloat(String(log.input_quantity)).toLocaleString()}{' '}
                        <span className="text-[10px] text-slate-400 font-normal">
                          {log.rawMaterialProduct?.unit?.short_name || 'Reams'}
                        </span>
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Expected Sheets</span>
                      <p className="font-bold text-slate-900 dark:text-white mt-0.5">
                        {log.expected_output_sheets.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Actual Usable</span>
                      <p className="font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                        {log.actual_output_sheets.toLocaleString()}
                      </p>
                    </div>

                    <div className="rounded-xl bg-white p-2.5 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
                      <span className="text-[10px] text-slate-400 uppercase font-semibold">Trim Wastage</span>
                      <p className="font-bold text-amber-600 dark:text-amber-400 mt-0.5">
                        {log.wastage_sheets.toLocaleString()} sheets
                      </p>
                    </div>

                    {(log.operator_name || log.cutting_machine_id || log.notes) && (
                      <div className="col-span-2 sm:col-span-4 rounded-xl bg-white/70 p-2 text-[11px] text-slate-600 dark:bg-slate-800/50 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                        {log.operator_name && <span className="font-semibold mr-3">Operator: {log.operator_name}</span>}
                        {log.cutting_machine_id && <span className="font-semibold mr-3">Machine #{log.cutting_machine_id}</span>}
                        {log.notes && <span>Notes: {log.notes}</span>}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Material Requirements */}
            <div className="space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Allocated Raw Materials & Consumables
              </h4>
              <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                  <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-slate-500 dark:bg-slate-800/80">
                    <tr>
                      <th className="px-4 py-2.5 font-semibold">Component</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Planned Requirement</th>
                      <th className="px-4 py-2.5 font-semibold text-right">Unit Rate</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                    {inspectingOrder.items?.map((item, idx) => {
                      const rawProd = item.rawMaterialProduct || item.raw_material_product;
                      const unit = item.unit;
                      return (
                        <tr key={idx}>
                          <td className="px-4 py-2.5">
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {rawProd?.name || 'Raw Material'}
                            </span>
                            <div className="text-[10px] text-slate-400">SKU: {rawProd?.sku}</div>
                          </td>
                          <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white">
                            {parseFloat(String(item.planned_quantity)).toLocaleString()}{' '}
                            {unit?.short_name || 'Units'}
                          </td>
                          <td className="px-4 py-2.5 text-right text-slate-600 dark:text-slate-400">
                            Rs. {parseFloat(String(item.unit_cost)).toFixed(2)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Stage 2 Direct Labor, Binding & Overhead Tracking (Phase 7) */}
            <StageCostTable order={inspectingOrder} onCostUpdated={fetchOrders} />

            {/* Phase 8: Manufacturing Cost Calculation & Unit Cost Breakdown */}
            <ProductionCostBreakdownCard orderId={inspectingOrder.id} onRefresh={fetchOrders} />

            {inspectingOrder.notes && (
              <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 dark:bg-slate-800/50 dark:text-slate-300">
                <span className="font-bold text-slate-700 dark:text-slate-200">Notes: </span>
                {inspectingOrder.notes}
              </div>
            )}

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-2">
              <div className="flex flex-wrap items-center gap-2">
                {canManage && inspectingOrder.status === 'in_progress' && inspectingOrder.current_stage === 'cutting' && (
                  <button
                    type="button"
                    onClick={() => {
                      const toCut = inspectingOrder;
                      setInspectingOrder(null);
                      setCuttingOrder(toCut);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-4 py-2 text-xs font-bold text-white hover:bg-blue-700 shadow-md shadow-blue-500/20 transition-all"
                  >
                    <Scissors className="h-4 w-4" />
                    <span>Log Cutting & Advance</span>
                  </button>
                )}

                {canManage && inspectingOrder.status === 'in_progress' && (
                  <button
                    type="button"
                    onClick={() => {
                      const toComplete = inspectingOrder;
                      setInspectingOrder(null);
                      setCompletingOrder(toComplete);
                    }}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 shadow-md shadow-emerald-600/20 transition-all"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>Complete Batch & Transform Stock</span>
                  </button>
                )}
              </div>
              <button
                type="button"
                onClick={() => setInspectingOrder(null)}
                className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Phase 6 Paper Cutting Stage Modal */}
      {cuttingOrder && (
        <CuttingStageModal
          order={cuttingOrder}
          isOpen={!!cuttingOrder}
          onClose={() => setCuttingOrder(null)}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}

      {/* Phase 5 Complete Production & Stock Transformation Modal */}
      {completingOrder && (
        <CompleteProductionModal
          order={completingOrder}
          isOpen={!!completingOrder}
          onClose={() => setCompletingOrder(null)}
          onSuccess={() => {
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}


