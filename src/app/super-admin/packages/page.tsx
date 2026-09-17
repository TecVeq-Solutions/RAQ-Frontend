'use client';

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { packageService } from '@/lib/packageService';
import {
  CanonicalModule,
  Package,
  PackageComparisonData,
  PackageFormData,
} from '@/types/package';
import {
  PackageCheck,
  Plus,
  Search,
  Check,
  X,
  Edit2,
  Trash2,
  Layers,
  Users,
  HardDrive,
  Sparkles,
  Database,
  ShoppingBag,
  AlertTriangle,
  RefreshCw,
  Scale,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Eye,
  SlidersHorizontal,
  Info,
} from 'lucide-react';

const STANDARD_LIMIT_LABELS: Record<string, { label: string; unit: string }> = {
  max_users: { label: 'Max Users', unit: 'users' },
  max_products: { label: 'Max Products', unit: 'items' },
  max_storage_mb: { label: 'Storage Space', unit: 'MB' },
  max_ai_requests: { label: 'AI Copilot Requests', unit: 'requests/mo' },
  max_backups: { label: 'Automated Backups', unit: 'snapshots' },
};

export default function SuperAdminPackagesPage() {
  const [packages, setPackages] = useState<Package[]>([]);
  const [modules, setModules] = useState<CanonicalModule[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [billingFilter, setBillingFilter] = useState<string>('all');

  // Comparison Selection
  const [selectedForCompare, setSelectedForCompare] = useState<number[]>([]);
  const [isCompareModalOpen, setIsCompareModalOpen] = useState<boolean>(false);
  const [comparisonData, setComparisonData] = useState<PackageComparisonData | null>(null);
  const [comparingLoading, setComparingLoading] = useState<boolean>(false);

  // Builder Modal (Create / Edit)
  const [isBuilderOpen, setIsBuilderOpen] = useState<boolean>(false);
  const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
  const [formData, setFormData] = useState<PackageFormData>({
    name: '',
    code: '',
    description: '',
    price: 0,
    billing_cycle: 'monthly',
    currency: 'PKR',
    trial_days: 14,
    is_active: true,
    sort_order: 0,
    limits: {
      max_users: 5,
      max_products: 1000,
      max_storage_mb: 2048,
      max_ai_requests: 100,
      max_backups: 5,
    },
    module_ids: [],
  });
  const [builderStep, setBuilderStep] = useState<number>(1);
  const [saving, setSaving] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Safety Delete & Deactivate Modals
  const [deletingPackage, setDeletingPackage] = useState<Package | null>(null);
  const [safetyAlert, setSafetyAlert] = useState<{ title: string; message: string } | null>(null);
  const [togglingPackage, setTogglingPackage] = useState<Package | null>(null);

  // Load Initial Packages & Modules
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [pkgs, mods] = await Promise.all([
        packageService.getAllPackages({
          status: statusFilter,
          billing_cycle: billingFilter,
          search: search.trim() || undefined,
        }),
        packageService.getCanonicalModules(),
      ]);
      setPackages(pkgs);
      setModules(mods);
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load packages. Please check connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, billingFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Open Create Builder
  const handleOpenCreate = () => {
    setEditingPackageId(null);
    setFormData({
      name: '',
      code: '',
      description: '',
      price: 5000,
      billing_cycle: 'monthly',
      currency: 'PKR',
      trial_days: 14,
      is_active: true,
      sort_order: (packages.length || 0) + 1,
      limits: {
        max_users: 5,
        max_products: 1000,
        max_storage_mb: 2048,
        max_ai_requests: 100,
        max_backups: 5,
      },
      module_ids: modules.slice(0, 10).map((m) => m.id),
    });
    setFormErrors({});
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  // Open Edit Builder
  const handleOpenEdit = async (pkg: Package) => {
    setEditingPackageId(pkg.id);
    const existingLimits: Record<string, number> = {
      max_users: -1,
      max_products: -1,
      max_storage_mb: -1,
      max_ai_requests: -1,
      max_backups: -1,
    };

    if (pkg.limits) {
      pkg.limits.forEach((l) => {
        existingLimits[l.limit_key] = l.limit_value;
      });
    }

    setFormData({
      name: pkg.name,
      code: pkg.code,
      description: pkg.description || '',
      price: Number(pkg.price),
      billing_cycle: pkg.billing_cycle,
      currency: pkg.currency || 'PKR',
      trial_days: pkg.trial_days,
      is_active: pkg.is_active,
      sort_order: pkg.sort_order,
      limits: {
        max_users: existingLimits.max_users ?? -1,
        max_products: existingLimits.max_products ?? -1,
        max_storage_mb: existingLimits.max_storage_mb ?? -1,
        max_ai_requests: existingLimits.max_ai_requests ?? -1,
        max_backups: existingLimits.max_backups ?? -1,
      },
      module_ids: pkg.modules ? pkg.modules.map((m) => m.id) : [],
    });
    setFormErrors({});
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  // Save Package (Create or Update)
  const handleSavePackage = async () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) errors.name = 'Package name is required';
    if (formData.price < 0) errors.price = 'Price must be greater than or equal to 0';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setBuilderStep(1);
      return;
    }

    setSaving(true);
    setFormErrors({});

    try {
      if (editingPackageId) {
        await packageService.updatePackage(editingPackageId, formData);
      } else {
        await packageService.createPackage(formData);
      }
      setIsBuilderOpen(false);
      await fetchData();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.errors) {
        const fieldErrors: Record<string, string> = {};
        Object.keys(resp.errors).forEach((key) => {
          fieldErrors[key] = resp.errors[key][0];
        });
        setFormErrors(fieldErrors);
      } else {
        setError(resp?.message || 'Failed to save package.');
      }
    } finally {
      setSaving(false);
    }
  };

  // Toggle Active Status
  const handleConfirmToggleStatus = async () => {
    if (!togglingPackage) return;
    try {
      await packageService.togglePackageStatus(togglingPackage.id);
      setTogglingPackage(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to update package status.');
    }
  };

  // Safe Delete Action
  const handleConfirmDelete = async () => {
    if (!deletingPackage) return;
    try {
      const res = await packageService.deletePackage(deletingPackage.id);
      setDeletingPackage(null);
      await fetchData();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.code === 'PACKAGE_IN_USE') {
        setSafetyAlert({
          title: 'Package In Use',
          message: resp.message,
        });
      } else {
        setError(resp?.message || 'Failed to delete package.');
      }
      setDeletingPackage(null);
    }
  };

  // Open Compare Modal
  const handleOpenCompare = async (customIds?: number[]) => {
    const idsToCompare = customIds || (selectedForCompare.length > 0 ? selectedForCompare : undefined);
    setComparingLoading(true);
    setIsCompareModalOpen(true);
    try {
      const data = await packageService.comparePackages(idsToCompare);
      setComparisonData(data);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate comparison matrix.');
      setIsCompareModalOpen(false);
    } finally {
      setComparingLoading(false);
    }
  };

  // Toggle Comparison Selection Checkbox
  const toggleCompareSelection = (pkgId: number) => {
    setSelectedForCompare((prev) =>
      prev.includes(pkgId) ? prev.filter((id) => id !== pkgId) : [...prev, pkgId]
    );
  };

  // Helper format limit
  const formatLimit = (value: number, unit: string) => {
    if (value === -1) return 'Unlimited';
    if (unit === 'MB' && value >= 1024) {
      return `${(value / 1024).toFixed(0)} GB (${value.toLocaleString()} MB)`;
    }
    return `${value.toLocaleString()} ${unit}`;
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SaaS Packages & Limit Management
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
              <PackageCheck className="w-3.5 h-3.5 text-indigo-400" />
              Dynamic Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Configure dynamic subscription tiers, resource quotas, and modular feature assignments.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => handleOpenCompare()}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-slate-800/90 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium flex items-center gap-2 transition-all cursor-pointer shadow-sm"
          >
            <Scale className="w-3.5 h-3.5 text-indigo-400" />
            <span>Compare Matrix</span>
            {selectedForCompare.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
                {selectedForCompare.length}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreate}
            type="button"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Package</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packages by name, code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Billing Cycle Filter */}
          <select
            value={billingFilter}
            onChange={(e) => setBillingFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <button
            onClick={fetchData}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Reload Packages"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. Package Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-96 bg-slate-900/50 border border-slate-800 rounded-2xl p-6" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <PackageCheck className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Packages Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || billingFilter !== 'all'
              ? 'No packages match the current filter criteria. Try clearing search filters.'
              : 'Get started by creating the first subscription tier.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {packages.map((pkg) => {
            const isSelected = selectedForCompare.includes(pkg.id);
            const userLimit = pkg.limits?.find((l) => l.limit_key === 'max_users')?.limit_value ?? -1;
            const productLimit = pkg.limits?.find((l) => l.limit_key === 'max_products')?.limit_value ?? -1;
            const storageLimit = pkg.limits?.find((l) => l.limit_key === 'max_storage_mb')?.limit_value ?? -1;
            const aiLimit = pkg.limits?.find((l) => l.limit_key === 'max_ai_requests')?.limit_value ?? -1;
            const backupLimit = pkg.limits?.find((l) => l.limit_key === 'max_backups')?.limit_value ?? -1;

            return (
              <div
                key={pkg.id}
                className={`bg-slate-900/80 border rounded-2xl p-6 shadow-xl flex flex-col justify-between transition-all relative overflow-hidden group ${
                  pkg.is_active ? 'border-slate-800 hover:border-slate-700' : 'border-slate-800/40 opacity-75'
                }`}
              >
                {/* Top Row: Name, Status & Compare Checkbox */}
                <div>
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleCompareSelection(pkg.id)}
                        className="w-4 h-4 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 focus:ring-offset-0 cursor-pointer"
                        title="Select for Comparison"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-white">{pkg.name}</h3>
                          <span className="text-[10px] font-mono text-slate-400">({pkg.code})</span>
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">
                          {pkg.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full border ${
                        pkg.is_active
                          ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                          : 'bg-slate-800 text-slate-400 border-slate-700'
                      }`}
                    >
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Price & Billing */}
                  <div className="mt-4 pb-4 border-b border-slate-800/80 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-white">
                        {pkg.currency} {Number(pkg.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 ml-1.5">/ {pkg.billing_cycle}</span>
                    </div>

                    <span className="text-[11px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                      {pkg.trial_days} Days Trial
                    </span>
                  </div>

                  {/* Quotas & Limits */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block">
                      Resource Quotas
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <span className="truncate text-slate-300 font-medium">
                          {userLimit === -1 ? <strong className="text-cyan-400">Unlimited</strong> : `${userLimit} Users`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="truncate text-slate-300 font-medium">
                          {productLimit === -1 ? <strong className="text-cyan-400">Unlimited</strong> : `${productLimit.toLocaleString()} Items`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span className="truncate text-slate-300 font-medium">
                          {storageLimit === -1
                            ? <strong className="text-cyan-400">Unlimited</strong>
                            : storageLimit >= 1024
                            ? `${(storageLimit / 1024).toFixed(0)} GB`
                            : `${storageLimit} MB`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span className="truncate text-slate-300 font-medium">
                          {aiLimit === -1 ? <strong className="text-cyan-400">Unlimited</strong> : `${aiLimit} AI req`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Modules Attached */}
                  <div className="mt-4 pt-4 border-t border-slate-800/80">
                    <div className="flex items-center justify-between text-xs mb-2">
                      <span className="font-bold text-slate-300">Feature Modules</span>
                      <span className="text-[11px] text-cyan-400 font-semibold">
                        {pkg.modules?.length || 0} / {modules.length} Enabled
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-1.5 max-h-16 overflow-hidden">
                      {pkg.modules && pkg.modules.length > 0 ? (
                        pkg.modules.slice(0, 6).map((m) => (
                          <span
                            key={m.id}
                            className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60"
                          >
                            {m.name}
                          </span>
                        ))
                      ) : (
                        <span className="text-[11px] text-slate-500">No modules attached</span>
                      )}
                      {pkg.modules && pkg.modules.length > 6 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800/60 text-slate-400">
                          +{pkg.modules.length - 6} more
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-6 pt-4 border-t border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 text-slate-400">
                    <ShieldCheck className="w-3.5 h-3.5 text-indigo-400" />
                    <span>{pkg.active_licenses_count || 0} Active Tenants</span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Toggle Status Button */}
                    <button
                      onClick={() => setTogglingPackage(pkg)}
                      type="button"
                      className={`px-2.5 py-1.5 rounded-lg border text-xs font-medium transition-colors cursor-pointer ${
                        pkg.is_active
                          ? 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border-amber-500/20'
                          : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border-emerald-500/20'
                      }`}
                      title={pkg.is_active ? 'Deactivate Package' : 'Activate Package'}
                    >
                      {pkg.is_active ? 'Deactivate' : 'Activate'}
                    </button>

                    {/* Edit Button */}
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      type="button"
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                      title="Edit Package"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    {/* Delete Button */}
                    <button
                      onClick={() => setDeletingPackage(pkg)}
                      type="button"
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                      title="Delete Package"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Package Builder Modal (Create / Edit Guided Wizard)                    */}
      {/* ========================================================================= */}
      {isBuilderOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-white">
                  {editingPackageId ? 'Edit Package & Quotas' : 'Create New SaaS Package'}
                </h2>
                <p className="text-xs text-slate-400 mt-0.5">
                  Step {builderStep} of 4 &bull;{' '}
                  {builderStep === 1
                    ? 'General Information'
                    : builderStep === 2
                    ? 'Pricing & Billing'
                    : builderStep === 3
                    ? 'Resource Limits'
                    : 'Module Access'}
                </p>
              </div>

              <button
                onClick={() => setIsBuilderOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Step 1: General Info */}
              {builderStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Package Name <span className="text-red-400">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="e.g. Growth Manufacturing Suite"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                    {formErrors.name && <p className="text-red-400 text-[11px] mt-1">{formErrors.name}</p>}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">
                      Package Code / Slug <span className="text-slate-500 font-normal">(optional, auto-generated)</span>
                    </label>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                      placeholder="e.g. growth-suite"
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-300 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short summary of target business scale and core benefits..."
                      className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Billing */}
              {builderStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">
                        Price (PKR) <span className="text-red-400">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                      {formErrors.price && <p className="text-red-400 text-[11px] mt-1">{formErrors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Billing Cycle</label>
                      <select
                        value={formData.billing_cycle}
                        onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="monthly">Monthly</option>
                        <option value="yearly">Yearly</option>
                        <option value="lifetime">Lifetime</option>
                        <option value="custom">Custom</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Trial Period (Days)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-300 mb-1">Sort Order</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Dynamic Limits */}
              {builderStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-xl flex items-center gap-2 text-xs text-indigo-300">
                    <Info className="w-4 h-4 shrink-0" />
                    <span>Set numeric caps or toggle <strong>Unlimited (-1)</strong> for unlimited allocation.</span>
                  </div>

                  {Object.entries(STANDARD_LIMIT_LABELS).map(([key, def]) => {
                    const currentVal = (formData.limits as any)[key] ?? -1;
                    const isUnlimited = currentVal === -1;

                    return (
                      <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-950/60 border border-slate-800">
                        <div>
                          <span className="font-bold text-xs text-white block">{def.label}</span>
                          <span className="text-[10px] text-slate-400">
                            Unit: {def.unit} &bull; Current: {isUnlimited ? 'Unlimited' : currentVal.toLocaleString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min="-1"
                            disabled={isUnlimited}
                            value={isUnlimited ? '' : currentVal}
                            placeholder="Unlimited"
                            onChange={(e) => {
                              const val = parseInt(e.target.value);
                              setFormData({
                                ...formData,
                                limits: {
                                  ...formData.limits,
                                  [key]: isNaN(val) ? 0 : val,
                                },
                              });
                            }}
                            className={`w-28 bg-slate-900 border rounded-lg px-2.5 py-1.5 text-xs text-white text-right focus:outline-none focus:border-indigo-500 ${
                              isUnlimited ? 'border-slate-800 text-slate-500 placeholder:text-cyan-400' : 'border-slate-700'
                            }`}
                          />

                          <button
                            type="button"
                            onClick={() => {
                              setFormData({
                                ...formData,
                                limits: {
                                  ...formData.limits,
                                  [key]: isUnlimited ? 10 : -1,
                                },
                              });
                            }}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                              isUnlimited
                                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                                : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                            }`}
                          >
                            {isUnlimited ? 'Unlimited' : 'Cap'}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Step 4: Modules Selector */}
              {builderStep === 4 && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                    <span className="text-xs font-bold text-slate-300">
                      {formData.module_ids.length} of {modules.length} Modules Selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, module_ids: modules.map((m) => m.id) })}
                        className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-700">|</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, module_ids: [] })}
                        className="text-xs text-slate-400 hover:text-slate-300 font-semibold cursor-pointer"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-72 overflow-y-auto pr-1">
                    {modules.map((m) => {
                      const isChecked = formData.module_ids.includes(m.id);
                      return (
                        <label
                          key={m.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-2.5 text-xs transition-all cursor-pointer select-none ${
                            isChecked
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-white font-medium'
                              : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => {
                              setFormData({
                                ...formData,
                                module_ids: isChecked
                                  ? formData.module_ids.filter((id) => id !== m.id)
                                  : [...formData.module_ids, m.id],
                              });
                            }}
                            className="w-3.5 h-3.5 rounded border-slate-700 bg-slate-950 text-indigo-600 focus:ring-0 cursor-pointer"
                          />
                          <span className="truncate">{m.name}</span>
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Controls */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/40 flex items-center justify-between">
              <div>
                {builderStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setBuilderStep((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-colors cursor-pointer"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-transparent hover:bg-slate-800 text-slate-400 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {builderStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setBuilderStep((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSavePackage}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition-all shadow-lg shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
                  >
                    {saving ? 'Saving Package...' : editingPackageId ? 'Update Package' : 'Save Package'}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Package Comparison Matrix Modal                                       */}
      {/* ========================================================================= */}
      {isCompareModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95">
            <div className="p-6 border-b border-slate-800 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-indigo-400" />
                  <h2 className="text-lg font-bold text-white">Package Comparison Matrix</h2>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Side-by-side comparative analysis of subscription pricing, quotas, and feature modules.
                </p>
              </div>

              <button
                onClick={() => setIsCompareModalOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-6">
              {comparingLoading || !comparisonData ? (
                <div className="h-64 flex items-center justify-center text-slate-400 text-xs animate-pulse">
                  Generating comparison matrix...
                </div>
              ) : comparisonData.packages.length === 0 ? (
                <div className="text-center py-12 text-slate-400 text-xs">No packages selected for comparison.</div>
              ) : (
                <table className="w-full text-xs text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800">
                      <th className="p-3 font-extrabold text-slate-400 w-1/4">Specification</th>
                      {comparisonData.packages.map((pkg) => (
                        <th key={pkg.id} className="p-3 font-extrabold text-white text-center">
                          <div className="text-sm font-black">{pkg.name}</div>
                          <span className="text-[10px] text-indigo-400 font-mono">
                            {pkg.currency} {pkg.price.toLocaleString()} / {pkg.billing_cycle}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-800/60">
                    {/* Section 1: Resource Quotas */}
                    <tr className="bg-slate-950/60">
                      <td colSpan={comparisonData.packages.length + 1} className="p-2.5 font-bold text-indigo-300 text-[11px] uppercase tracking-wider">
                        Resource Quotas
                      </td>
                    </tr>
                    {comparisonData.comparison.limits.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-800/30">
                        <td className="p-3 font-semibold text-slate-300">{row.label}</td>
                        {comparisonData.packages.map((pkg) => {
                          const val = row.values[pkg.id];
                          return (
                            <td key={pkg.id} className="p-3 text-center">
                              {val?.is_unlimited ? (
                                <span className="font-bold text-cyan-400">Unlimited</span>
                              ) : (
                                <span className="text-slate-200">{val?.formatted}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Section 2: Modules Matrix */}
                    <tr className="bg-slate-950/60">
                      <td colSpan={comparisonData.packages.length + 1} className="p-2.5 font-bold text-cyan-300 text-[11px] uppercase tracking-wider">
                        Included Modules
                      </td>
                    </tr>
                    {comparisonData.comparison.modules.map((mod) => (
                      <tr key={mod.module_id} className="hover:bg-slate-800/30">
                        <td className="p-3 font-medium text-slate-300 flex items-center gap-2">
                          <span>{mod.name}</span>
                          <span className="text-[10px] font-mono text-slate-500">({mod.code})</span>
                        </td>
                        {comparisonData.packages.map((pkg) => {
                          const included = mod.availability[pkg.id]?.included;
                          return (
                            <td key={pkg.id} className="p-3 text-center">
                              {included ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-700 mx-auto" />
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. Lifecycle Deactivate / Activate Confirmation Dialog                   */}
      {/* ========================================================================= */}
      {togglingPackage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="text-base font-bold text-white">
              {togglingPackage.is_active ? 'Deactivate Package?' : 'Activate Package?'}
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              {togglingPackage.is_active
                ? `Deactivating '${togglingPackage.name}' will remove it from new tenant subscription options. Existing tenants subscribed to this tier will remain active and unaffected.`
                : `Activating '${togglingPackage.name}' will make it immediately available for new tenant registrations and upgrades.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTogglingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg cursor-pointer ${
                  togglingPackage.is_active ? 'bg-amber-600 hover:bg-amber-500' : 'bg-emerald-600 hover:bg-emerald-500'
                }`}
              >
                {togglingPackage.is_active ? 'Deactivate' : 'Activate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Delete Confirmation & Safety Alert Dialog                             */}
      {/* ========================================================================= */}
      {deletingPackage && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Delete Package '{deletingPackage.name}'?</h3>
              <p className="text-xs text-slate-400 mt-1">
                This action is permanent. Packages referenced by active licenses cannot be deleted and must be deactivated instead.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 cursor-pointer"
              >
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Alert (PACKAGE_IN_USE) */}
      {safetyAlert && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-500/40 rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-10 h-10 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">{safetyAlert.title}</h3>
              <p className="text-xs text-slate-300 mt-1.5 leading-relaxed">{safetyAlert.message}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSafetyAlert(null)}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
