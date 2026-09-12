'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import {
  ProductionOrder,
  ProductionStageCost,
  ProductionCostSummary,
  StageCostFormData,
  ProductionStageName,
  ProductionCostType,
} from '@/types/manufacturing';
import {
  DollarSign,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Layers,
  Sparkles,
  Users,
  Zap,
  PackageCheck,
  Building,
  Scissors,
  FileText,
} from 'lucide-react';

interface StageCostTableProps {
  order: ProductionOrder;
  onCostUpdated?: () => void;
}

const STAGE_OPTIONS: { value: ProductionStageName; label: string }[] = [
  { value: 'cutting', label: 'Cutting' },
  { value: 'stitching', label: 'Stitching' },
  { value: 'pasting', label: 'Pasting' },
  { value: 'binding', label: 'Binding' },
  { value: 'finishing', label: 'Finishing' },
  { value: 'other', label: 'Other / Misc' },
];

const COST_TYPE_OPTIONS: { value: ProductionCostType; label: string }[] = [
  { value: 'labor', label: 'Direct Labor' },
  { value: 'binding_contract', label: 'Binding Contract' },
  { value: 'electricity', label: 'Electricity / Power' },
  { value: 'consumables', label: 'Consumables & Supplies' },
  { value: 'overhead', label: 'Overhead / Machine' },
];

function BookOpenIcon(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" />
    </svg>
  );
}

export default function StageCostTable({ order, onCostUpdated }: StageCostTableProps) {
  const [costs, setCosts] = useState<ProductionStageCost[]>([]);
  const [summary, setSummary] = useState<ProductionCostSummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Form modal state
  const [isAddModalOpen, setIsAddModalOpen] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const [formData, setFormData] = useState<StageCostFormData>({
    stage_name: 'binding',
    cost_type: 'labor',
    amount: '',
    vendor_or_worker_name: '',
    notes: '',
  });

  const canAdd = (authService.isAdmin() || authService.isStaff()) && order.status !== 'cancelled';
  const canDelete = authService.isAdmin() && order.status !== 'cancelled';

  const fetchCosts = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/production-orders/${order.id}/costs`);
      if (res.data?.success) {
        setCosts(res.data.data || []);
        setSummary(res.data.summary || null);
      }
    } catch (err: any) {
      console.error('Failed to load stage costs', err);
      setError(err.response?.data?.message || 'Failed to fetch production costs.');
    } finally {
      setLoading(false);
    }
  }, [order.id]);

  useEffect(() => {
    fetchCosts();
  }, [fetchCosts]);

  const handleAddCost = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const amt = parseFloat(String(formData.amount));
    if (isNaN(amt) || amt <= 0) {
      setFormError('Please enter a valid amount greater than 0.');
      return;
    }

    if (!formData.stage_name) {
      setFormError('Please select a manufacturing stage.');
      return;
    }

    if (!formData.cost_type) {
      setFormError('Please select a cost type.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        stage_name: formData.stage_name,
        cost_type: formData.cost_type,
        amount: amt,
        vendor_or_worker_name: formData.vendor_or_worker_name?.trim() || null,
        notes: formData.notes?.trim() || null,
      };

      const res = await apiClient.post(`/production-orders/${order.id}/costs`, payload);
      if (res.data?.success) {
        setFormData({
          stage_name: 'binding',
          cost_type: 'labor',
          amount: '',
          vendor_or_worker_name: '',
          notes: '',
        });
        setIsAddModalOpen(false);
        await fetchCosts();
        if (onCostUpdated) onCostUpdated();
      }
    } catch (err: any) {
      console.error('Failed to add stage cost', err);
      setFormError(err.response?.data?.message || 'Failed to record stage cost.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteCost = async (costId: number) => {
    if (!window.confirm('Are you sure you want to remove this cost entry?')) {
      return;
    }

    setDeletingId(costId);
    try {
      const res = await apiClient.delete(`/production-orders/${order.id}/costs/${costId}`);
      if (res.data?.success) {
        await fetchCosts();
        if (onCostUpdated) onCostUpdated();
      }
    } catch (err: any) {
      console.error('Failed to delete stage cost', err);
      alert(err.response?.data?.message || 'Failed to delete stage cost.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val: number | string | undefined) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
    return `Rs. ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  const getStageBadgeColor = (stage: ProductionStageName) => {
    switch (stage) {
      case 'cutting':
        return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800';
      case 'stitching':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800';
      case 'pasting':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800';
      case 'binding':
        return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800';
      case 'finishing':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  const getCostTypeBadgeColor = (costType: ProductionCostType) => {
    switch (costType) {
      case 'labor':
        return 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950/50 dark:text-teal-300 dark:border-teal-800';
      case 'binding_contract':
        return 'bg-violet-50 text-violet-700 border-violet-200 dark:bg-violet-950/50 dark:text-violet-300 dark:border-violet-800';
      case 'electricity':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/50 dark:text-yellow-300 dark:border-yellow-800';
      case 'consumables':
        return 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-950/50 dark:text-cyan-300 dark:border-cyan-800';
      case 'overhead':
        return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800';
      default:
        return 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700';
    }
  };

  return (
    <div className="space-y-4">
      {/* Header & Add Button */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-3 dark:border-slate-800">
        <div>
          <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
            <DollarSign className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Stage 2 — Assembly, Binding & Finishing Costs
          </h4>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Direct labor wages, binding contractor charges, electricity & stage consumables.
          </p>
        </div>

        {canAdd && (
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Stage Cost</span>
          </button>
        )}
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Cost Summary Cards */}
      {summary && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
          <div className="rounded-xl border border-teal-200 bg-teal-50/40 p-2.5 dark:border-teal-900/60 dark:bg-teal-950/20">
            <div className="flex items-center justify-between text-teal-700 dark:text-teal-400">
              <span className="text-xs font-bold uppercase tracking-wider">Labor</span>
              <Users className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.by_cost_type?.labor || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-violet-200 bg-violet-50/40 p-2.5 dark:border-violet-900/60 dark:bg-violet-950/20">
            <div className="flex items-center justify-between text-violet-700 dark:text-violet-400">
              <span className="text-xs font-bold uppercase tracking-wider">Binding Cont.</span>
              <BookOpenIcon className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.by_cost_type?.binding_contract || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-yellow-200 bg-yellow-50/40 p-2.5 dark:border-yellow-900/60 dark:bg-yellow-950/20">
            <div className="flex items-center justify-between text-yellow-800 dark:text-yellow-400">
              <span className="text-xs font-bold uppercase tracking-wider">Electricity</span>
              <Zap className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.by_cost_type?.electricity || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-cyan-200 bg-cyan-50/40 p-2.5 dark:border-cyan-900/60 dark:bg-cyan-950/20">
            <div className="flex items-center justify-between text-cyan-700 dark:text-cyan-400">
              <span className="text-xs font-bold uppercase tracking-wider">Consumables</span>
              <PackageCheck className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.by_cost_type?.consumables || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-rose-200 bg-rose-50/40 p-2.5 dark:border-rose-900/60 dark:bg-rose-950/20">
            <div className="flex items-center justify-between text-rose-700 dark:text-rose-400">
              <span className="text-xs font-bold uppercase tracking-wider">Overhead</span>
              <Building className="h-3.5 w-3.5 opacity-70" />
            </div>
            <p className="mt-1 text-xs font-bold text-slate-900 dark:text-white">
              {formatCurrency(summary.by_cost_type?.overhead || 0)}
            </p>
          </div>

          <div className="rounded-xl border border-emerald-300 bg-emerald-500/10 p-2.5 dark:border-emerald-700 dark:bg-emerald-950/40">
            <div className="flex items-center justify-between text-emerald-700 dark:text-emerald-300">
              <span className="text-xs font-extrabold uppercase tracking-wider">Total Stage Cost</span>
              <DollarSign className="h-3.5 w-3.5 opacity-80" />
            </div>
            <p className="mt-1 text-xs font-extrabold text-emerald-700 dark:text-emerald-300">
              {formatCurrency(summary.total_stage_cost || 0)}
            </p>
          </div>
        </div>
      )}

      {/* Itemized Cost Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
        {loading ? (
          <div className="flex items-center justify-center py-8 text-slate-400">
            <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
            <span className="ml-2 text-xs">Loading production costs...</span>
          </div>
        ) : costs.length === 0 ? (
          <div className="py-8 text-center text-xs text-slate-400">
            <p>No stage costs recorded for this production order yet.</p>
            {canAdd && (
              <p className="mt-1 text-xs text-slate-500">
                Click <span className="font-semibold text-emerald-600">"Add Stage Cost"</span> to record labor, binding, or overhead expenses.
              </p>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80">
                <tr>
                  <th className="px-4 py-2.5">Stage</th>
                  <th className="px-4 py-2.5">Cost Type</th>
                  <th className="px-4 py-2.5">Vendor / Worker</th>
                  <th className="px-4 py-2.5">Notes</th>
                  <th className="px-4 py-2.5 text-right">Amount</th>
                  {canDelete && <th className="px-4 py-2.5 text-center">Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {costs.map((cost) => (
                  <tr key={cost.id} className="hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold capitalize ${getStageBadgeColor(
                          cost.stage_name
                        )}`}
                      >
                        {cost.stage_name}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 whitespace-nowrap">
                      <span
                        className={`inline-block rounded-md border px-2 py-0.5 text-xs font-bold capitalize ${getCostTypeBadgeColor(
                          cost.cost_type
                        )}`}
                      >
                        {cost.cost_type.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 text-slate-800 dark:text-slate-200 font-medium">
                      {cost.vendor_or_worker_name || <span className="text-slate-400 italic">Unspecified</span>}
                    </td>
                    <td className="px-4 py-2.5 text-slate-500 dark:text-slate-400 max-w-xs truncate">
                      {cost.notes || '-'}
                    </td>
                    <td className="px-4 py-2.5 text-right font-bold text-slate-900 dark:text-white whitespace-nowrap">
                      {formatCurrency(cost.amount)}
                    </td>
                    {canDelete && (
                      <td className="px-4 py-2.5 text-center whitespace-nowrap">
                        <button
                          type="button"
                          disabled={deletingId === cost.id}
                          onClick={() => handleDeleteCost(cost.id)}
                          className="rounded-lg p-1 text-rose-500 hover:bg-rose-50 hover:text-rose-700 dark:hover:bg-rose-950/50 disabled:opacity-40 transition-all"
                          title="Delete erroneous cost entry (Admin only)"
                        >
                          {deletingId === cost.id ? (
                            <Loader2 className="h-3.5 w-3.5 animate-spin text-rose-600" />
                          ) : (
                            <Trash2 className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
              {costs.length > 0 && (
                <tfoot className="bg-slate-50/80 font-bold dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800">
                  <tr>
                    <td colSpan={4} className="px-4 py-2.5 text-right text-slate-700 dark:text-slate-300">
                      Total Stage Costs:
                    </td>
                    <td className="px-4 py-2.5 text-right text-emerald-600 dark:text-emerald-400 font-extrabold">
                      {formatCurrency(summary?.total_stage_cost || 0)}
                    </td>
                    {canDelete && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        )}
      </div>

      {/* Add Stage Cost Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
                  <DollarSign className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    Record Stage Cost
                  </h3>
                  <p className="text-xs text-slate-500">
                    Order: <span className="font-semibold text-slate-700 dark:text-slate-300">{order.order_no}</span>
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="mt-4 flex items-center gap-2 rounded-xl bg-rose-50 p-3 text-xs text-rose-700 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleAddCost} className="mt-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Manufacturing Stage <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.stage_name}
                    onChange={(e) =>
                      setFormData({ ...formData, stage_name: e.target.value as ProductionStageName })
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {STAGE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Cost Type <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.cost_type}
                    onChange={(e) =>
                      setFormData({ ...formData, cost_type: e.target.value as ProductionCostType })
                    }
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    {COST_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Amount (PKR) <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-xs font-bold text-slate-400">
                    Rs.
                  </span>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    placeholder="0.00"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    required
                    className="w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 py-2 text-xs font-bold text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Vendor / Contractor / Worker Name <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <input
                  type="text"
                  placeholder="e.g. Master Rashid (Stitcher), Lahore Binderies"
                  value={formData.vendor_or_worker_name || ''}
                  onChange={(e) => setFormData({ ...formData, vendor_or_worker_name: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Notes / Details <span className="text-slate-400 font-normal">(Optional)</span>
                </label>
                <textarea
                  rows={2}
                  placeholder="Rate details, contract voucher number, breakdown notes..."
                  value={formData.notes || ''}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs text-slate-900 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="rounded-xl border border-slate-300 px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-700 disabled:opacity-50 shadow-md shadow-emerald-500/20 transition-all"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving Cost...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Save Stage Cost</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
