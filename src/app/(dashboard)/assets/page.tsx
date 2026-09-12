'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import { Asset, AssetType, AssetStatus, AssetMetrics, AssetDepreciation } from '@/types/assets';
import AssetModal from '@/components/assets/AssetModal';
import AssetMaintenanceModal from '@/components/assets/AssetMaintenanceModal';
import AssetDepreciationConfigModal from '@/components/assets/AssetDepreciationConfigModal';
import AssetDisposalModal from '@/components/assets/AssetDisposalModal';
import {
  Wrench,
  Plus,
  Search,
  Edit2,
  Trash2,
  Eye,
  Loader2,
  RefreshCw,
  Truck,
  Building,
  Armchair,
  Tv,
  HelpCircle,
  DollarSign,
  Calendar,
  MapPin,
  FileText,
  UserCheck,
  Building2,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertCircle,
  CheckCircle2,
  Sparkles,
  History,
  X,
  TrendingDown,
  TrendingUp,
  BookOpen,
  Receipt,
  Layers,
  Check,
  Clock,
  Coins,
} from 'lucide-react';

const ASSET_TYPE_ICONS: Record<AssetType, any> = {
  machinery: Wrench,
  vehicle: Truck,
  building: Building,
  furniture: Armchair,
  electronics: Tv,
  other: HelpCircle,
};

const ASSET_TYPE_LABELS: Record<AssetType, string> = {
  machinery: 'Machinery',
  vehicle: 'Vehicle',
  building: 'Building',
  furniture: 'Furniture',
  electronics: 'Electronics',
  other: 'Other Asset',
};

const STATUS_CONFIG: Record<AssetStatus, { label: string; bg: string; text: string; border: string }> = {
  active: {
    label: 'Active',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
  },
  under_maintenance: {
    label: 'Under Maintenance',
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
  },
  retired: {
    label: 'Retired',
    bg: 'bg-slate-100',
    text: 'text-slate-600',
    border: 'border-slate-200',
  },
  disposed: {
    label: 'Disposed',
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
  },
};

export default function AssetsPage() {
  const [assets, setAssets] = useState<Asset[]>([]);
  const [metrics, setMetrics] = useState<AssetMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);

  // Modals & Drawers
  const [isAssetModalOpen, setIsAssetModalOpen] = useState(false);
  const [isMaintenanceModalOpen, setIsMaintenanceModalOpen] = useState(false);
  const [isDeprecConfigOpen, setIsDeprecConfigOpen] = useState(false);
  const [isDisposalOpen, setIsDisposalOpen] = useState(false);

  const [selectedAsset, setSelectedAsset] = useState<Asset | null>(null);
  const [detailAsset, setDetailAsset] = useState<Asset | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);
  const [activeDetailTab, setActiveDetailTab] = useState<'maintenance' | 'depreciation' | 'journals' | 'disposal'>('depreciation');

  // Deletion & Action state
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [postingPeriodId, setPostingPeriodId] = useState<number | null>(null);
  const [postingDue, setPostingDue] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // RBAC permissions
  const isAdmin = authService.isAdmin();
  const isStaff = authService.isStaff();
  const canCreateOrEdit = isAdmin;
  const canDelete = isAdmin;
  const canConfigureDepreciation = isAdmin;
  const canPostDepreciation = isAdmin;
  const canDispose = isAdmin;
  const canRecordMaintenance = isAdmin || isStaff;

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setCurrentPage(1);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchAssets = useCallback(async () => {
    setLoading(true);
    setActionError(null);
    try {
      const params: any = {
        page: currentPage,
        per_page: 12,
      };
      if (debouncedSearch.trim()) params.search = debouncedSearch.trim();
      if (typeFilter !== 'all') params.asset_type = typeFilter;
      if (statusFilter !== 'all') params.status = statusFilter;

      const res = await apiClient.get('/assets', { params });
      setAssets(res.data?.data || []);
      if (res.data?.pagination) {
        setTotalPages(res.data.pagination.last_page || 1);
        setTotalItems(res.data.pagination.total || 0);
      }
      if (res.data?.metrics) {
        setMetrics(res.data.metrics);
      }
    } catch (err: any) {
      console.error('Failed to fetch capital assets', err);
      setActionError(err.response?.data?.message || 'Failed to load assets.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, typeFilter, statusFilter]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // Load single asset detail with full maintenance history & depreciation schedule
  const handleOpenDetail = async (asset: Asset, defaultTab: 'maintenance' | 'depreciation' | 'journals' | 'disposal' = 'depreciation') => {
    setIsDetailOpen(true);
    setActiveDetailTab(defaultTab);
    setLoadingDetail(true);
    try {
      const res = await apiClient.get(`/assets/${asset.id}`);
      setDetailAsset(res.data?.data || asset);
    } catch (err: any) {
      console.error('Failed to fetch asset detail', err);
      setDetailAsset(asset);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleOpenCreate = () => {
    setSelectedAsset(null);
    setIsAssetModalOpen(true);
  };

  const handleOpenEdit = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsAssetModalOpen(true);
  };

  const handleOpenMaintenance = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsMaintenanceModalOpen(true);
  };

  const handleOpenDeprecConfig = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDeprecConfigOpen(true);
  };

  const handleOpenDisposal = (asset: Asset) => {
    setSelectedAsset(asset);
    setIsDisposalOpen(true);
  };

  const handlePostPeriod = async (assetId: number, deprecId: number) => {
    if (!canPostDepreciation) return;
    setPostingPeriodId(deprecId);
    setActionError(null);
    try {
      await apiClient.post(`/assets/${assetId}/depreciation/post/${deprecId}`);
      setActionSuccess('Depreciation period posted and journal entry generated.');
      setTimeout(() => setActionSuccess(null), 4000);
      if (detailAsset) {
        handleOpenDetail(detailAsset, 'depreciation');
      }
      fetchAssets();
    } catch (err: any) {
      console.error('Failed to post depreciation', err);
      setActionError(err.response?.data?.message || 'Failed to post depreciation.');
    } finally {
      setPostingPeriodId(null);
    }
  };

  const handlePostAllDue = async (assetId: number) => {
    if (!canPostDepreciation) return;
    setPostingDue(true);
    setActionError(null);
    try {
      const res = await apiClient.post(`/assets/${assetId}/depreciation/post-due`);
      setActionSuccess(res.data?.message || 'Due depreciation periods posted successfully.');
      setTimeout(() => setActionSuccess(null), 4000);
      if (detailAsset) {
        handleOpenDetail(detailAsset, 'depreciation');
      }
      fetchAssets();
    } catch (err: any) {
      console.error('Failed to post due depreciation', err);
      setActionError(err.response?.data?.message || 'Failed to post due depreciation.');
    } finally {
      setPostingDue(false);
    }
  };

  const handleDeleteAsset = async (asset: Asset) => {
    if (!canDelete) return;

    if (!confirm(`Are you sure you want to soft delete asset "${asset.asset_code} - ${asset.name}"? Historical maintenance and depreciation records will remain safely archived.`)) {
      return;
    }

    setDeletingId(asset.id);
    setActionError(null);
    try {
      await apiClient.delete(`/assets/${asset.id}`);
      setActionSuccess(`Asset ${asset.asset_code} has been soft deleted.`);
      setTimeout(() => setActionSuccess(null), 4000);
      if (detailAsset?.id === asset.id) {
        setIsDetailOpen(false);
      }
      fetchAssets();
    } catch (err: any) {
      console.error('Failed to delete asset', err);
      setActionError(err.response?.data?.message || 'Failed to delete asset.');
    } finally {
      setDeletingId(null);
    }
  };

  const formatCurrency = (val: number | string) => {
    const num = Number(val || 0);
    return `PKR ${num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A] flex items-center gap-2.5">
            Assets & Machinery Ledger
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-50 border border-amber-200 text-amber-800 font-semibold">
              Depreciation & Capital Assets
            </span>
          </h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage capital assets, auto-generate straight-line depreciation schedules, process disposals & sales, and track repairs
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchAssets}
            disabled={loading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs disabled:opacity-50 cursor-pointer"
            title="Refresh Asset Register"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#16A34A]' : ''}`} />
          </button>

          {canCreateOrEdit && (
            <button
              onClick={handleOpenCreate}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Register Capital Asset</span>
            </button>
          )}
        </div>
      </div>

      {/* Notifications */}
      {actionSuccess && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 flex items-center justify-between text-sm animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span className="font-medium">{actionSuccess}</span>
          </div>
          <button onClick={() => setActionSuccess(null)} className="p-1 text-emerald-600 hover:text-emerald-900 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {actionError && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-center justify-between text-sm animate-fadeIn shadow-xs">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
            <span className="font-medium">{actionError}</span>
          </div>
          <button onClick={() => setActionError(null)} className="p-1 text-rose-600 hover:text-rose-900 rounded-lg">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Capital Investment */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Capital Cost</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-[#0F172A] font-mono tracking-tight">
              {formatCurrency(metrics?.total_purchase_value || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Initial asset acquisition cost</p>
          </div>
        </div>

        {/* Accumulated Depreciation */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Accumulated Depreciation</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600">
              <TrendingDown className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-purple-700 font-mono tracking-tight">
              {formatCurrency(metrics?.total_accumulated_depreciation || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Total posted depreciation</p>
          </div>
        </div>

        {/* Current Book Value */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Net Book Value (NBV)</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700 font-mono tracking-tight">
              {formatCurrency(metrics?.total_current_value || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Cost - Accumulated Depreciation</p>
          </div>
        </div>

        {/* Maintenance Expended */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs hover:shadow-sm transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Total Maintenance</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600">
              <Wrench className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700 font-mono tracking-tight">
              {formatCurrency(metrics?.total_maintenance_cost || 0)}
            </div>
            <p className="text-xs text-slate-400 mt-1 font-medium">Accumulated machine repairs</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search asset name, code (e.g. AST-MACH-001), location..."
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-800 placeholder-slate-400"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Type Filter */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">All Asset Types</option>
              <option value="machinery">Machinery & Equipment</option>
              <option value="vehicle">Vehicles</option>
              <option value="building">Buildings</option>
              <option value="furniture">Furniture</option>
              <option value="electronics">Electronics</option>
              <option value="other">Other Assets</option>
            </select>
          </div>

          {/* Status Filter */}
          <div className="flex items-center gap-1.5">
            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700 cursor-pointer"
            >
              <option value="all">All Statuses</option>
              <option value="active">Active</option>
              <option value="under_maintenance">Under Maintenance</option>
              <option value="retired">Retired</option>
              <option value="disposed">Disposed</option>
            </select>
          </div>
        </div>
      </div>

      {/* Assets Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3.5 px-4">Asset Identification</th>
                <th className="py-3.5 px-4">Classification</th>
                <th className="py-3.5 px-4">Purchase Cost</th>
                <th className="py-3.5 px-4">Acc. Depreciation</th>
                <th className="py-3.5 px-4">Net Book Value</th>
                <th className="py-3.5 px-4">Maint. Cost</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto text-[#16A34A] mb-2" />
                    <span className="text-xs font-semibold">Loading capital equipment ledger...</span>
                  </td>
                </tr>
              ) : assets.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center text-slate-500">
                    <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                      <Wrench className="w-6 h-6" />
                    </div>
                    <p className="font-bold text-slate-800 text-base">No capital assets found</p>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
                      {searchTerm || typeFilter !== 'all' || statusFilter !== 'all'
                        ? 'Try adjusting your search criteria or filters.'
                        : 'Register your first machine or capital asset using the button above.'}
                    </p>
                    {canCreateOrEdit && !searchTerm && typeFilter === 'all' && statusFilter === 'all' && (
                      <button
                        type="button"
                        onClick={handleOpenCreate}
                        className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#16A34A] text-white text-xs font-bold hover:bg-[#059669] transition-all shadow-xs"
                      >
                        <Plus className="w-4 h-4" /> Register Capital Asset
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                assets.map((asset) => {
                  const TypeIcon = ASSET_TYPE_ICONS[asset.asset_type] || HelpCircle;
                  const statusConf = STATUS_CONFIG[asset.status] || STATUS_CONFIG.active;
                  const isDisposed = asset.status === 'disposed' || Boolean(asset.disposed_at);

                  return (
                    <tr
                      key={asset.id}
                      className="hover:bg-slate-50/80 transition-colors group cursor-pointer"
                      onClick={() => handleOpenDetail(asset, 'depreciation')}
                    >
                      {/* Name & Code */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-xl bg-emerald-50 border border-emerald-100 text-[#16A34A] flex items-center justify-center shrink-0">
                            <TypeIcon className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-bold text-[#0F172A] group-hover:text-[#16A34A] transition-colors">
                              {asset.name}
                            </div>
                            <div className="flex items-center gap-2 mt-0.5">
                              <span className="font-mono text-xs text-slate-600 px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200">
                                {asset.asset_code}
                              </span>
                              {asset.depreciation_method === 'straight_line' && (
                                <span className="text-xs px-2 py-0.5 rounded-md bg-purple-50 text-purple-700 border border-purple-200 font-semibold">
                                  SLM ({asset.useful_life_years}y)
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Classification */}
                      <td className="py-3.5 px-4">
                        <span className="text-xs font-semibold text-slate-700">
                          {ASSET_TYPE_LABELS[asset.asset_type] || asset.asset_type}
                        </span>
                      </td>

                      {/* Purchase Cost */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                        {formatCurrency(asset.purchase_cost)}
                      </td>

                      {/* Accumulated Depreciation */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-purple-700">
                        {formatCurrency(asset.accumulated_depreciation || 0)}
                      </td>

                      {/* Net Book Value */}
                      <td className="py-3.5 px-4 font-mono font-bold text-emerald-700">
                        {formatCurrency(asset.current_value)}
                      </td>

                      {/* Maintenance Cost */}
                      <td className="py-3.5 px-4 font-mono font-semibold text-amber-700">
                        {formatCurrency(asset.maintenance_cost)}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${statusConf.bg} ${statusConf.text} ${statusConf.border}`}
                        >
                          {statusConf.label}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right" onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1">
                          {/* Inspect / Detail */}
                          <button
                            onClick={() => handleOpenDetail(asset, 'depreciation')}
                            className="p-1.5 text-slate-500 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                            title="View Depreciation Schedule & Ledger"
                          >
                            <Eye className="w-4 h-4" />
                          </button>

                          {/* Record Maintenance (Admin & Staff) */}
                          {canRecordMaintenance && !isDisposed && (
                            <button
                              onClick={() => handleOpenMaintenance(asset)}
                              className="p-1.5 text-slate-500 hover:text-amber-700 hover:bg-amber-50 rounded-lg transition-colors cursor-pointer"
                              title="Record Maintenance / Repair"
                            >
                              <Wrench className="w-4 h-4" />
                            </button>
                          )}

                          {/* Configure Depreciation (Admin) */}
                          {canConfigureDepreciation && !isDisposed && (
                            <button
                              onClick={() => handleOpenDeprecConfig(asset)}
                              className="p-1.5 text-slate-500 hover:text-purple-700 hover:bg-purple-50 rounded-lg transition-colors cursor-pointer"
                              title="Configure Straight-Line Depreciation"
                            >
                              <TrendingDown className="w-4 h-4" />
                            </button>
                          )}

                          {/* Dispose / Sell Asset (Admin) */}
                          {canDispose && !isDisposed && (
                            <button
                              onClick={() => handleOpenDisposal(asset)}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Dispose or Sell Capital Asset"
                            >
                              <Coins className="w-4 h-4" />
                            </button>
                          )}

                          {/* Edit (Admin) */}
                          {canCreateOrEdit && !isDisposed && (
                            <button
                              onClick={() => handleOpenEdit(asset)}
                              className="p-1.5 text-slate-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                              title="Edit Capital Asset"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          )}

                          {/* Delete (Admin) */}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteAsset(asset)}
                              disabled={deletingId === asset.id}
                              className="p-1.5 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors disabled:opacity-50 cursor-pointer"
                              title="Soft Delete Asset"
                            >
                              {deletingId === asset.id ? (
                                <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                              ) : (
                                <Trash2 className="w-4 h-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-slate-50/60 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500 font-medium">
          <div>
            Showing <span className="font-bold text-slate-800">{assets.length}</span> of{' '}
            <span className="font-bold text-slate-800">{totalItems}</span> capital assets
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="px-3 py-1 bg-white border border-slate-200 rounded-xl font-bold text-slate-800 shadow-xs">
              Page {currentPage} of {totalPages || 1}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="p-2 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors shadow-xs"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Comprehensive Asset Detail, Depreciation Schedule & Journal Entries Drawer */}
      {isDetailOpen && detailAsset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto animate-fadeIn">
          <div className="relative w-full max-w-5xl my-8 bg-white border border-slate-200 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/70 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-100/80 text-[#16A34A] flex items-center justify-center font-bold">
                  <Wrench className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h2 className="text-lg font-bold text-[#0F172A]">{detailAsset.name}</h2>
                    <span className="px-2.5 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-800 font-mono text-xs font-bold">
                      {detailAsset.asset_code}
                    </span>
                    {detailAsset.status === 'disposed' && (
                      <span className="px-2.5 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold">
                        Disposed / Realized
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Capital asset specifications, straight-line depreciation schedule & accounting journal
                  </p>
                </div>
              </div>
              <button
                onClick={() => setIsDetailOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Financial Overview Cards */}
            <div className="px-6 py-4 bg-slate-50/50 border-b border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-3 shrink-0">
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block">Purchase Cost</span>
                <span className="text-sm font-bold text-slate-900 font-mono mt-0.5 block">
                  {formatCurrency(detailAsset.purchase_cost)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block">Acc. Depreciation</span>
                <span className="text-sm font-bold text-purple-700 font-mono mt-0.5 block">
                  {formatCurrency(detailAsset.accumulated_depreciation || 0)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block">Net Book Value</span>
                <span className="text-sm font-bold text-emerald-700 font-mono mt-0.5 block">
                  {formatCurrency(detailAsset.current_value)}
                </span>
              </div>
              <div className="p-3 rounded-xl bg-white border border-slate-200 shadow-xs">
                <span className="text-xs font-semibold text-slate-500 block">Residual Value</span>
                <span className="text-sm font-bold text-amber-700 font-mono mt-0.5 block">
                  {formatCurrency(detailAsset.salvage_value || 0)}
                </span>
              </div>
            </div>

            {/* Sub-Tabs Bar */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-100 bg-white shrink-0">
              <button
                onClick={() => setActiveDetailTab('depreciation')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeDetailTab === 'depreciation'
                    ? 'border-[#16A34A] text-[#16A34A]'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <TrendingDown className="w-4 h-4" />
                Depreciation Schedule
              </button>

              <button
                onClick={() => setActiveDetailTab('maintenance')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeDetailTab === 'maintenance'
                    ? 'border-amber-600 text-amber-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Wrench className="w-4 h-4" />
                Maintenance & Repairs ({detailAsset.maintenances?.length || 0})
              </button>

              <button
                onClick={() => setActiveDetailTab('journals')}
                className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                  activeDetailTab === 'journals'
                    ? 'border-blue-600 text-blue-700'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <Receipt className="w-4 h-4" />
                Journal Entries ({detailAsset.journalEntries?.length || detailAsset.journal_entries?.length || 0})
              </button>

              {detailAsset.disposal && (
                <button
                  onClick={() => setActiveDetailTab('disposal')}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 flex items-center gap-2 transition-all cursor-pointer ${
                    activeDetailTab === 'disposal'
                      ? 'border-rose-600 text-rose-700'
                      : 'border-transparent text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <Coins className="w-4 h-4" />
                  Disposal Record
                </button>
              )}
            </div>

            {/* Tab Contents */}
            <div className="p-6 space-y-6 overflow-y-auto flex-1">
              {/* TAB 1: Depreciation Schedule */}
              {activeDetailTab === 'depreciation' && (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <TrendingDown className="w-4 h-4 text-purple-600" />
                        Straight-Line Depreciation Schedule
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        {detailAsset.depreciation_method === 'straight_line'
                          ? `Useful Life: ${detailAsset.useful_life_years} Years | Frequency: ${detailAsset.depreciation_frequency}`
                          : 'Depreciation is currently not configured for this asset.'}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {canConfigureDepreciation && detailAsset.status !== 'disposed' && (
                        <button
                          onClick={() => handleOpenDeprecConfig(detailAsset)}
                          className="px-3.5 py-1.5 rounded-xl border border-purple-200 bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                        >
                          <Sparkles className="w-3.5 h-3.5" />
                          Configure Parameters
                        </button>
                      )}

                      {canPostDepreciation && detailAsset.status !== 'disposed' && detailAsset.depreciations && detailAsset.depreciations.length > 0 && (
                        <button
                          onClick={() => handlePostAllDue(detailAsset.id)}
                          disabled={postingDue}
                          className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm disabled:opacity-50 transition-all cursor-pointer"
                        >
                          {postingDue ? (
                            <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          ) : (
                            <CheckCircle2 className="w-3.5 h-3.5" />
                          )}
                          Post All Due Periods
                        </button>
                      )}
                    </div>
                  </div>

                  {!detailAsset.depreciations || detailAsset.depreciations.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                      <TrendingDown className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                      <p className="text-slate-700 font-bold">No depreciation schedule generated</p>
                      <p className="text-slate-500 mt-1">
                        Click &quot;Configure Parameters&quot; above to set useful life and generate the schedule.
                      </p>
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3">Period</th>
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Opening Book Value</th>
                            <th className="py-2.5 px-3">Depreciation</th>
                            <th className="py-2.5 px-3">Accumulated</th>
                            <th className="py-2.5 px-3">Closing Book Value</th>
                            <th className="py-2.5 px-3">Status</th>
                            {canPostDepreciation && detailAsset.status !== 'disposed' && (
                              <th className="py-2.5 px-3 text-right">Action</th>
                            )}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailAsset.depreciations.map((p) => (
                            <tr
                              key={p.id}
                              className={`hover:bg-slate-50/80 transition-colors ${
                                p.is_posted ? 'bg-purple-50/30' : ''
                              }`}
                            >
                              <td className="py-2.5 px-3 font-bold text-slate-800">
                                {p.period_label}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {new Date(p.period_date).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                {formatCurrency(p.opening_book_value)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-purple-700">
                                {formatCurrency(p.depreciation_amount)}
                              </td>
                              <td className="py-2.5 px-3 font-mono text-slate-700">
                                {formatCurrency(p.accumulated_depreciation)}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">
                                {formatCurrency(p.closing_book_value)}
                              </td>
                              <td className="py-2.5 px-3">
                                {p.is_posted ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-[11px] font-bold">
                                    <Check className="w-3 h-3" />
                                    Posted
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200 text-[11px] font-medium">
                                    <Clock className="w-3 h-3" />
                                    Scheduled
                                  </span>
                                )}
                              </td>
                              {canPostDepreciation && detailAsset.status !== 'disposed' && (
                                <td className="py-2.5 px-3 text-right">
                                  {!p.is_posted && (
                                    <button
                                      onClick={() => handlePostPeriod(detailAsset.id, p.id)}
                                      disabled={postingPeriodId === p.id}
                                      className="px-3 py-1 rounded-lg bg-purple-100 text-purple-800 hover:bg-purple-200 text-xs font-bold transition-all disabled:opacity-50 cursor-pointer"
                                    >
                                      {postingPeriodId === p.id ? (
                                        <Loader2 className="w-3 h-3 animate-spin mx-auto" />
                                      ) : (
                                        'Post'
                                      )}
                                    </button>
                                  )}
                                </td>
                              )}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: Maintenance & Repairs */}
              {activeDetailTab === 'maintenance' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                        <History className="w-4 h-4 text-amber-600" />
                        Maintenance & Service History
                      </h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Log of all repairs, preventative maintenance, and service costs
                      </p>
                    </div>

                    {canRecordMaintenance && detailAsset.status !== 'disposed' && (
                      <button
                        onClick={() => {
                          setSelectedAsset(detailAsset);
                          setIsMaintenanceModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 hover:bg-amber-100 font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Record Maintenance
                      </button>
                    )}
                  </div>

                  {!detailAsset.maintenances || detailAsset.maintenances.length === 0 ? (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                      <Wrench className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                      No maintenance records logged for this asset yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Work Done / Description</th>
                            <th className="py-2.5 px-3">Cost</th>
                            <th className="py-2.5 px-3">Vendor / Workshop</th>
                            <th className="py-2.5 px-3">Performed By</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {detailAsset.maintenances.map((m) => (
                            <tr key={m.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {new Date(m.maintenance_date).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3 text-slate-800 font-medium max-w-xs">
                                {m.description}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-amber-700">
                                {formatCurrency(m.cost)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {m.vendor_name || '—'}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600">
                                {m.performed_by || '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-slate-50 font-bold text-slate-800 border-t border-slate-200">
                            <td colSpan={2} className="py-2.5 px-3 text-right text-slate-600">
                              Total Accumulated Maintenance:
                            </td>
                            <td colSpan={3} className="py-2.5 px-3 font-mono text-amber-700">
                              {formatCurrency(detailAsset.maintenance_cost)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: Journal Entries */}
              {activeDetailTab === 'journals' && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-blue-600" />
                      Double-Entry Accounting Journal Ledger
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Immutable double-entry records for depreciation expenses, cost derecognition, and disposal gains/losses
                    </p>
                  </div>

                  {(!detailAsset.journal_entries && !detailAsset.journalEntries) ||
                  ((detailAsset.journal_entries || detailAsset.journalEntries || []).length === 0) ? (
                    <div className="p-8 rounded-xl bg-slate-50 border border-slate-200 text-center text-slate-500 text-xs">
                      <Receipt className="w-6 h-6 mx-auto text-slate-400 mb-2" />
                      No accounting journal entries posted for this asset yet.
                    </div>
                  ) : (
                    <div className="border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="bg-slate-50/80 border-b border-slate-100 font-bold uppercase tracking-wider text-slate-500">
                            <th className="py-2.5 px-3">Date</th>
                            <th className="py-2.5 px-3">Type</th>
                            <th className="py-2.5 px-3">Debit Account</th>
                            <th className="py-2.5 px-3">Credit Account</th>
                            <th className="py-2.5 px-3">Amount</th>
                            <th className="py-2.5 px-3">Description</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {(detailAsset.journal_entries || detailAsset.journalEntries || []).map((j) => (
                            <tr key={j.id} className="hover:bg-slate-50/80">
                              <td className="py-2.5 px-3 font-mono text-slate-600">
                                {new Date(j.entry_date).toLocaleDateString()}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="px-2 py-0.5 rounded text-xs uppercase font-bold bg-blue-50 text-blue-700 border border-blue-200">
                                  {j.entry_type}
                                </span>
                              </td>
                              <td className="py-2.5 px-3 text-emerald-700 font-semibold font-mono">
                                Dr. {j.debit_account}
                              </td>
                              <td className="py-2.5 px-3 text-rose-700 font-semibold font-mono">
                                Cr. {j.credit_account}
                              </td>
                              <td className="py-2.5 px-3 font-mono font-bold text-slate-900">
                                {formatCurrency(j.amount)}
                              </td>
                              <td className="py-2.5 px-3 text-slate-600 max-w-xs truncate">
                                {j.description}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 4: Disposal Record */}
              {activeDetailTab === 'disposal' && detailAsset.disposal && (
                <div className="space-y-4">
                  <div>
                    <h3 className="text-sm font-bold text-[#0F172A] flex items-center gap-2">
                      <Coins className="w-4 h-4 text-rose-600" />
                      Asset Disposal & Settlement Record
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Final settlement, Net Book Value at disposal, and realized Gain/Loss
                    </p>
                  </div>

                  <div className="p-5 rounded-2xl bg-slate-50 border border-slate-200 space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-500 font-medium block">Disposal Date:</span>
                        <span className="text-slate-800 font-bold">
                          {new Date(detailAsset.disposal.disposal_date).toLocaleDateString()}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Disposal Type:</span>
                        <span className="text-slate-800 font-bold uppercase">
                          {detailAsset.disposal.disposal_type}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Net Book Value:</span>
                        <span className="font-mono text-slate-800 font-bold">
                          {formatCurrency(detailAsset.disposal.net_book_value)}
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-500 font-medium block">Sale Proceeds:</span>
                        <span className="font-mono text-emerald-700 font-bold">
                          {formatCurrency(detailAsset.disposal.sale_proceeds)}
                        </span>
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2 font-bold text-xs">
                        {detailAsset.disposal.gain_or_loss === 'gain' ? (
                          <>
                            <TrendingUp className="w-4 h-4 text-emerald-600" />
                            <span className="text-emerald-700">Recognized Capital Gain on Sale:</span>
                          </>
                        ) : detailAsset.disposal.gain_or_loss === 'loss' ? (
                          <>
                            <TrendingDown className="w-4 h-4 text-rose-600" />
                            <span className="text-rose-700">Recognized Loss on Disposal:</span>
                          </>
                        ) : (
                          <span className="text-slate-700">Net Disposal Impact:</span>
                        )}
                      </div>
                      <span
                        className={`font-mono font-bold text-sm ${
                          detailAsset.disposal.gain_or_loss === 'gain'
                            ? 'text-emerald-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {formatCurrency(detailAsset.disposal.gain_loss_amount)}
                      </span>
                    </div>

                    <div className="text-xs text-slate-600 space-y-1">
                      <div>
                        <span className="text-slate-500 font-medium">Reason: </span>
                        <span className="text-slate-800 font-medium">{detailAsset.disposal.reason}</span>
                      </div>
                      {detailAsset.disposal.buyer_name && (
                        <div>
                          <span className="text-slate-500 font-medium">Buyer: </span>
                          <span className="text-slate-800 font-medium">{detailAsset.disposal.buyer_name}</span>
                        </div>
                      )}
                      {detailAsset.disposal.notes && (
                        <div>
                          <span className="text-slate-500 font-medium">Notes: </span>
                          <span className="text-slate-800 font-medium">{detailAsset.disposal.notes}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-end px-6 py-4 border-t border-slate-100 bg-slate-50/70 shrink-0">
              <button
                type="button"
                onClick={() => setIsDetailOpen(false)}
                className="px-5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 text-sm font-semibold transition-colors cursor-pointer shadow-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asset Create/Edit Modal */}
      <AssetModal
        isOpen={isAssetModalOpen}
        onClose={() => setIsAssetModalOpen(false)}
        onSuccess={() => {
          fetchAssets();
          setActionSuccess(selectedAsset ? 'Asset updated successfully.' : 'Capital asset registered successfully.');
          setTimeout(() => setActionSuccess(null), 4000);
        }}
        asset={selectedAsset}
      />

      {/* Record Maintenance Modal */}
      <AssetMaintenanceModal
        isOpen={isMaintenanceModalOpen}
        onClose={() => setIsMaintenanceModalOpen(false)}
        onSuccess={async () => {
          fetchAssets();
          if (detailAsset && selectedAsset?.id === detailAsset.id) {
            handleOpenDetail(detailAsset, 'maintenance');
          }
          setActionSuccess('Maintenance record added and asset accumulated cost incremented.');
          setTimeout(() => setActionSuccess(null), 4000);
        }}
        asset={selectedAsset}
      />

      {/* Configure Depreciation Modal */}
      <AssetDepreciationConfigModal
        isOpen={isDeprecConfigOpen}
        onClose={() => setIsDeprecConfigOpen(false)}
        onSuccess={async () => {
          fetchAssets();
          if (detailAsset && selectedAsset?.id === detailAsset.id) {
            handleOpenDetail(detailAsset, 'depreciation');
          }
          setActionSuccess('Depreciation parameters configured and schedule generated.');
          setTimeout(() => setActionSuccess(null), 4000);
        }}
        asset={selectedAsset}
      />

      {/* Dispose / Sell Modal */}
      <AssetDisposalModal
        isOpen={isDisposalOpen}
        onClose={() => setIsDisposalOpen(false)}
        onSuccess={async () => {
          fetchAssets();
          if (detailAsset && selectedAsset?.id === detailAsset.id) {
            handleOpenDetail(detailAsset, 'disposal');
          }
          setActionSuccess('Asset disposal processed and accounting entries recorded.');
          setTimeout(() => setActionSuccess(null), 4000);
        }}
        asset={selectedAsset}
      />
    </div>
  );
}
