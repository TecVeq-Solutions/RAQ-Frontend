'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import { Bom } from '@/types/manufacturing';
import BomModal from '@/components/manufacturing/BomModal';
import {
  Factory,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Layers,
  Scale,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
  AlertCircle,
} from 'lucide-react';

export default function BomsPage() {
  const [boms, setBoms] = useState<Bom[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBom, setSelectedBom] = useState<Bom | null>(null);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // RBAC checks
  const canManage = authService.isAdmin();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchBoms = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params: any = {};
      if (debouncedSearch.trim()) {
        params.search = debouncedSearch.trim();
      }
      if (statusFilter === 'active') {
        params.is_active = 1;
      } else if (statusFilter === 'inactive') {
        params.is_active = 0;
      }

      const res = await apiClient.get('/boms', { params });
      setBoms(res.data?.data || []);
    } catch (err: any) {
      console.error('Failed to fetch BOM formulas', err);
      setActionError(err.response?.data?.message || 'Failed to load BOM formulas.');
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, statusFilter]);

  useEffect(() => {
    fetchBoms();
  }, [fetchBoms]);

  // Handlers
  const handleOpenCreate = () => {
    setSelectedBom(null);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (bom: Bom) => {
    setSelectedBom(bom);
    setIsReadOnly(false);
    setIsModalOpen(true);
  };

  const handleOpenInspect = (bom: Bom) => {
    setSelectedBom(bom);
    setIsReadOnly(true);
    setIsModalOpen(true);
  };

  const handleDeleteBom = async (bom: Bom) => {
    if (!canManage) return;

    if (!confirm(`Are you sure you want to delete BOM formula "${bom.bom_code} - ${bom.name}"? This action cannot be undone.`)) {
      return;
    }

    setDeletingId(bom.id);
    setActionError(null);
    try {
      await apiClient.delete(`/boms/${bom.id}`);
      await fetchBoms();
    } catch (err: any) {
      console.error('Failed to delete BOM formula', err);
      setActionError(err.response?.data?.message || 'Failed to delete BOM formula.');
    } finally {
      setDeletingId(null);
    }
  };

  // Stats
  const totalBoms = boms.length;
  const activeBoms = boms.filter((b) => b.is_active).length;
  const totalComponents = boms.reduce(
    (acc, b) => acc + (b.bomItems?.length || b.bom_items?.length || 0),
    0
  );

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Factory className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Bill of Materials (BOM)
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Manufacturing recipes, raw material consumption formulas, and scrap allowances.
          </p>
        </div>

        {canManage && (
          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all"
          >
            <Plus className="h-4 w-4" />
            Create BOM Recipe
          </button>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Total Formulas
            </span>
            <div className="rounded-xl bg-blue-50 p-2 text-blue-600 dark:bg-blue-950/50 dark:text-blue-400">
              <Layers className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalBoms}</p>
          <span className="text-xs text-slate-400">Defined product recipes</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Active Recipes
            </span>
            <div className="rounded-xl bg-emerald-50 p-2 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400">
              <CheckCircle2 className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{activeBoms}</p>
          <span className="text-xs text-slate-400">Ready for production orders</span>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider dark:text-slate-400">
              Total Component Lines
            </span>
            <div className="rounded-xl bg-indigo-50 p-2 text-indigo-600 dark:bg-indigo-950/50 dark:text-indigo-400">
              <Scale className="h-5 w-5" />
            </div>
          </div>
          <p className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">{totalComponents}</p>
          <span className="text-xs text-slate-400">Raw materials & consumables mapped</span>
        </div>
      </div>

      {actionError && (
        <div className="flex items-center gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Search & Filters */}
      <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col sm:flex-row gap-3 items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search BOM Code, name, or product..."
            className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-9 pr-4 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-800 dark:bg-slate-800/50 dark:text-white"
          />
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e: any) => setStatusFilter(e.target.value)}
            className="rounded-xl border border-slate-200 bg-slate-50/50 px-3 py-2 text-sm text-slate-700 focus:border-blue-500 focus:outline-none dark:border-slate-800 dark:bg-slate-800/50 dark:text-slate-300"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          <button
            onClick={fetchBoms}
            className="rounded-xl border border-slate-200 p-2 text-slate-600 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
            title="Refresh BOM list"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* BOM Directory Table */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900 overflow-hidden">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-16 text-slate-400">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
            <p className="text-sm">Loading Bill of Materials formulas...</p>
          </div>
        ) : boms.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center text-slate-500 dark:text-slate-400">
            <div className="rounded-full bg-slate-100 p-4 dark:bg-slate-800 mb-3">
              <Factory className="h-8 w-8 text-slate-400" />
            </div>
            <h3 className="text-base font-semibold text-slate-900 dark:text-white">
              No Bill of Materials Found
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mt-1 mb-4">
              {searchTerm
                ? 'No manufacturing formulas match your search criteria.'
                : 'Create your first Bill of Materials recipe to standardize production quantities and scrap allowances.'}
            </p>
            {canManage && (
              <button
                onClick={handleOpenCreate}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700 transition-colors"
              >
                <Plus className="h-3.5 w-3.5" />
                Create First BOM
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600 dark:text-slate-300">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-3.5">BOM Code & Recipe</th>
                  <th className="px-6 py-3.5">Target Finished Good</th>
                  <th className="px-6 py-3.5 text-center">Batch Size</th>
                  <th className="px-6 py-3.5">Raw Material Components</th>
                  <th className="px-6 py-3.5 text-center">Status</th>
                  <th className="px-6 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {boms.map((bom) => {
                  const items = bom.bomItems || bom.bom_items || [];
                  const finishedProd = bom.finishedProduct || bom.finished_product;
                  const unit = bom.unit;

                  return (
                    <tr
                      key={bom.id}
                      className="hover:bg-slate-50/70 dark:hover:bg-slate-800/50 transition-colors"
                    >
                      {/* BOM Code & Recipe */}
                      <td className="px-6 py-4">
                        <div className="font-bold text-slate-900 dark:text-white">
                          {bom.bom_code}
                        </div>
                        <div className="text-xs text-slate-500 dark:text-slate-400">
                          {bom.name}
                        </div>
                      </td>

                      {/* Finished Product */}
                      <td className="px-6 py-4">
                        {finishedProd ? (
                          <div>
                            <span className="font-semibold text-slate-900 dark:text-white">
                              {finishedProd.name}
                            </span>
                            <div className="text-xs text-slate-400">
                              SKU: {finishedProd.sku}
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-slate-400">ID: {bom.finished_product_id}</span>
                        )}
                      </td>

                      {/* Batch Size */}
                      <td className="px-6 py-4 text-center">
                        <span className="inline-flex items-center gap-1 rounded-lg bg-blue-50 px-2.5 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
                          {parseFloat(String(bom.batch_quantity)).toLocaleString()}{' '}
                          {unit?.short_name || 'Units'}
                        </span>
                      </td>

                      {/* Raw Material Components Preview */}
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                            {items.length} {items.length === 1 ? 'Component' : 'Components'}
                          </span>
                          <div className="flex flex-wrap gap-1 max-w-xs">
                            {items.slice(0, 3).map((item, idx) => {
                              const rawProd = item.rawMaterialProduct || item.raw_material_product;
                              const itemUnit = item.unit;
                              return (
                                <span
                                  key={idx}
                                  className="inline-flex items-center rounded-md bg-slate-100 px-1.5 py-0.5 text-[11px] text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                                >
                                  {rawProd?.name || 'Item'}: {item.quantity} {itemUnit?.short_name || ''}
                                  {Number(item.wastage_allowance_percent) > 0 && (
                                    <span className="ml-1 text-[10px] text-amber-600 dark:text-amber-400 font-semibold">
                                      (+{item.wastage_allowance_percent}%)
                                    </span>
                                  )}
                                </span>
                              );
                            })}
                            {items.length > 3 && (
                              <span className="text-[11px] text-slate-400 font-medium self-center">
                                +{items.length - 3} more
                              </span>
                            )}
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-6 py-4 text-center">
                        {bom.is_active ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
                            <CheckCircle2 className="h-3 w-3" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                            <XCircle className="h-3 w-3" />
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Inspect / View Button */}
                          <button
                            onClick={() => handleOpenInspect(bom)}
                            className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200 transition-colors"
                            title="Inspect BOM recipe"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {/* Edit Button (Admin only) */}
                          {canManage && (
                            <button
                              onClick={() => handleOpenEdit(bom)}
                              className="rounded-lg p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-950/50 transition-colors"
                              title="Edit BOM recipe"
                            >
                              <Edit2 className="h-4 w-4" />
                            </button>
                          )}

                          {/* Delete Button (Admin only) */}
                          {canManage && (
                            <button
                              disabled={deletingId === bom.id}
                              onClick={() => handleDeleteBom(bom)}
                              className="rounded-lg p-1.5 text-rose-600 hover:bg-rose-50 dark:text-rose-400 dark:hover:bg-rose-950/50 disabled:opacity-30 transition-colors"
                              title="Delete BOM recipe"
                            >
                              {deletingId === bom.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Trash2 className="h-4 w-4" />
                              )}
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

      {/* BOM Modal (Create / Edit / Inspect) */}
      <BomModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchBoms}
        bomToEdit={selectedBom}
        readOnly={isReadOnly}
      />
    </div>
  );
}
