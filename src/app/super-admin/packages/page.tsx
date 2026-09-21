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
  const [isCodeCustomized, setIsCodeCustomized] = useState<boolean>(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [modalError, setModalError] = useState<string | null>(null);
  const [successToast, setSuccessToast] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setSuccessToast(msg);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  // Open Create Builder
  const handleOpenCreate = () => {
    setEditingPackageId(null);
    setIsCodeCustomized(false);
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
      module_ids: modules.map((m) => m.id),
    });
    setFormErrors({});
    setModalError(null);
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  // Open Edit Builder
  const handleOpenEdit = async (pkg: Package) => {
    setEditingPackageId(pkg.id);
    setIsCodeCustomized(true);
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
    setModalError(null);
    setBuilderStep(1);
    setIsBuilderOpen(true);
  };

  // Save Package (Create or Update)
  const handleSavePackage = async () => {
    const errors: Record<string, string> = {};
    if (!formData.name.trim()) {
      errors.name = 'Package name is required';
    }
    if (formData.price < 0) {
      errors.price = 'Price must be greater than or equal to 0';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setModalError('Please fix the required fields before saving.');
      if (errors.name) setBuilderStep(1);
      else if (errors.price) setBuilderStep(2);
      return;
    }

    setSaving(true);
    setFormErrors({});
    setModalError(null);

    const payload: PackageFormData = {
      name: formData.name.trim(),
      code: formData.code?.trim() ? formData.code.trim() : undefined,
      description: formData.description?.trim() || undefined,
      price: Number(formData.price) || 0,
      billing_cycle: formData.billing_cycle,
      currency: formData.currency || 'PKR',
      trial_days: Number(formData.trial_days) >= 0 ? Number(formData.trial_days) : 14,
      is_active: formData.is_active ?? true,
      sort_order: Number(formData.sort_order) || 0,
      limits: {
        max_users: Number(formData.limits?.max_users ?? -1),
        max_products: Number(formData.limits?.max_products ?? -1),
        max_storage_mb: Number(formData.limits?.max_storage_mb ?? -1),
        max_ai_requests: Number(formData.limits?.max_ai_requests ?? -1),
        max_backups: Number(formData.limits?.max_backups ?? -1),
      },
      module_ids: Array.isArray(formData.module_ids) ? formData.module_ids : [],
    };

    try {
      if (editingPackageId) {
        await packageService.updatePackage(editingPackageId, payload);
        showToast(`Package '${payload.name}' updated successfully!`);
      } else {
        await packageService.createPackage(payload);
        showToast(`Package '${payload.name}' created successfully!`);
      }
      setIsBuilderOpen(false);
      await fetchData();
    } catch (err: any) {
      const resp = err.response?.data;
      if (resp?.errors) {
        const fieldErrors: Record<string, string> = {};
        const messages: string[] = [];
        Object.keys(resp.errors).forEach((key) => {
          const msg = resp.errors[key][0];
          fieldErrors[key] = msg;
          messages.push(msg);
        });
        setFormErrors(fieldErrors);
        setModalError(messages.join(' '));
        if (fieldErrors.name || fieldErrors.code) {
          setBuilderStep(1);
        } else if (fieldErrors.price || fieldErrors.billing_cycle) {
          setBuilderStep(2);
        }
      } else {
        setModalError(resp?.message || 'Failed to save package. Please check connection and try again.');
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
    <div className="space-y-6 font-sans">
      {/* Toast Notification */}
      {successToast && (
        <div className="fixed top-6 right-6 z-50 bg-emerald-700 text-white px-5 py-3 rounded-2xl shadow-xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 font-sans text-xs font-bold border border-emerald-500">
          <CheckCircle2 className="w-5 h-5 text-emerald-200 shrink-0" />
          <span>{successToast}</span>
          <button
            type="button"
            onClick={() => setSuccessToast(null)}
            className="ml-2 text-emerald-200 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Error Banner */}
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-2xl flex items-center justify-between text-xs text-rose-800">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            type="button"
            onClick={() => setError(null)}
            className="text-rose-600 hover:text-rose-900 cursor-pointer font-bold"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 1. Header Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-2xl border border-slate-200/90 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-100">
              <PackageCheck className="w-5 h-5" />
            </div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
              SaaS Packages & Limit Management
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              Dynamic Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Configure dynamic subscription tiers, resource quotas, and modular feature assignments.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => handleOpenCompare()}
            type="button"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-xs font-bold flex items-center gap-2 transition-all cursor-pointer shadow-xs"
          >
            <Scale className="w-3.5 h-3.5 text-emerald-600" />
            <span>Compare Matrix</span>
            {selectedForCompare.length > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] font-bold flex items-center justify-center">
                {selectedForCompare.length}
              </span>
            )}
          </button>

          <button
            onClick={handleOpenCreate}
            type="button"
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Create Package</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-slate-200/90 shadow-xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search packages by name, code or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:bg-white focus:border-emerald-500 transition-colors font-medium"
          />
        </div>

        <div className="flex items-center gap-2.5">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="inactive">Inactive Only</option>
          </select>

          {/* Billing Cycle Filter */}
          <select
            value={billingFilter}
            onChange={(e) => setBillingFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-700 focus:outline-none focus:bg-white focus:border-emerald-500 cursor-pointer font-medium"
          >
            <option value="all">All Cycles</option>
            <option value="monthly">Monthly</option>
            <option value="yearly">Yearly</option>
            <option value="lifetime">Lifetime</option>
          </select>

          <button
            onClick={fetchData}
            type="button"
            className="p-2 rounded-xl bg-white hover:bg-slate-50 text-slate-600 border border-slate-200 transition-colors cursor-pointer shadow-xs"
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
            <div key={i} className="h-96 bg-white border border-slate-200 rounded-2xl p-6 shadow-xs" />
          ))}
        </div>
      ) : packages.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-slate-200 space-y-3 shadow-xs">
          <PackageCheck className="w-10 h-10 text-slate-400 mx-auto" />
          <h3 className="text-base font-bold text-slate-900">No Packages Found</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
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
                className={`bg-white border rounded-2xl p-6 shadow-xs flex flex-col justify-between transition-all relative overflow-hidden group hover:shadow-sm ${
                  pkg.is_active ? 'border-slate-200/90 hover:border-emerald-300' : 'border-slate-200 opacity-75'
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
                        className="w-4 h-4 rounded border-slate-300 bg-white text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                        title="Select for Comparison"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-extrabold text-base text-slate-900">{pkg.name}</h3>
                          <span className="text-[10px] font-mono text-slate-500 font-bold">({pkg.code})</span>
                        </div>
                        <p className="text-xs text-slate-500 mt-0.5 line-clamp-2">
                          {pkg.description || 'No description provided.'}
                        </p>
                      </div>
                    </div>

                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${
                        pkg.is_active
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                    >
                      {pkg.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Price & Billing */}
                  <div className="mt-4 pb-4 border-b border-slate-100 flex items-baseline justify-between">
                    <div>
                      <span className="text-2xl font-black text-slate-900 font-mono">
                        {pkg.currency} {Number(pkg.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-500 ml-1.5 font-medium">/ {pkg.billing_cycle}</span>
                    </div>

                    <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                      {pkg.trial_days} Days Trial
                    </span>
                  </div>

                  {/* Quotas & Limits */}
                  <div className="mt-4 space-y-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 block">
                      Resource Quotas
                    </span>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                        <Users className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">
                          {userLimit === -1 ? <strong className="text-emerald-700">Unlimited</strong> : `${userLimit} Users`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                        <ShoppingBag className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">
                          {productLimit === -1 ? <strong className="text-emerald-700">Unlimited</strong> : `${productLimit.toLocaleString()} Items`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                        <HardDrive className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">
                          {storageLimit === -1
                            ? <strong className="text-emerald-700">Unlimited</strong>
                            : storageLimit >= 1024
                            ? `${(storageLimit / 1024).toFixed(0)} GB`
                            : `${storageLimit} MB`}
                        </span>
                      </div>

                      <div className="p-2 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center gap-2">
                        <Sparkles className="w-3.5 h-3.5 text-purple-600 shrink-0" />
                        <span className="truncate text-slate-700 font-medium">
                          {aiLimit === -1 ? <strong className="text-emerald-700">Unlimited</strong> : `${aiLimit} AI req/mo`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Included Modules Count */}
                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-500 font-medium">
                      Enabled Features:
                    </span>
                    <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded-md border border-slate-200">
                      {pkg.modules?.length || 0} Modules
                    </span>
                  </div>
                </div>

                {/* Bottom Actions Row */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between gap-2">
                  <button
                    onClick={() => setTogglingPackage(pkg)}
                    type="button"
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      pkg.is_active
                        ? 'border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700'
                        : 'border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {pkg.is_active ? 'Disable' : 'Activate'}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleOpenEdit(pkg)}
                      type="button"
                      className="p-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 transition-colors cursor-pointer"
                      title="Edit Package"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>

                    <button
                      onClick={() => setDeletingPackage(pkg)}
                      type="button"
                      className="p-1.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 transition-colors cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-2xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-sans">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-bold text-slate-900">
                  {editingPackageId ? 'Edit Package & Quotas' : 'Create New SaaS Package'}
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
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
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              {/* Validation / API Error Banner inside modal */}
              {modalError && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl flex items-start gap-2.5 text-xs text-rose-800">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="font-bold">Validation Error</p>
                    <p className="text-[11px] text-rose-700 mt-0.5">{modalError}</p>
                  </div>
                </div>
              )}

              {/* Step 1: General Info */}
              {builderStep === 1 && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">
                      Package Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => {
                        const val = e.target.value;
                        const autoSlug = val
                          .toLowerCase()
                          .trim()
                          .replace(/[^a-z0-9]+/g, '-')
                          .replace(/(^-|-$)/g, '');
                        setFormData((prev) => ({
                          ...prev,
                          name: val,
                          code: isCodeCustomized ? prev.code : autoSlug,
                        }));
                        if (formErrors.name) {
                          setFormErrors((prev) => ({ ...prev, name: '' }));
                        }
                      }}
                      placeholder="e.g. Starter Suite, Growth Manufacturing Plan"
                      className={`w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition-all ${
                        formErrors.name
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                    {formErrors.name && <p className="text-rose-600 text-[11px] mt-1 font-semibold">{formErrors.name}</p>}
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-xs font-bold text-slate-700">
                        Package Code / Slug <span className="text-slate-400 font-normal">(must be unique)</span>
                      </label>
                      {formData.name && (
                        <button
                          type="button"
                          onClick={() => {
                            const autoSlug = formData.name
                              .toLowerCase()
                              .trim()
                              .replace(/[^a-z0-9]+/g, '-')
                              .replace(/(^-|-$)/g, '');
                            setIsCodeCustomized(false);
                            setFormData((prev) => ({ ...prev, code: autoSlug }));
                            if (formErrors.code) {
                              setFormErrors((prev) => ({ ...prev, code: '' }));
                            }
                          }}
                          className="text-[11px] text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                        >
                          Auto-generate from Name
                        </button>
                      )}
                    </div>
                    <input
                      type="text"
                      value={formData.code || ''}
                      onChange={(e) => {
                        setIsCodeCustomized(true);
                        setFormData({ ...formData, code: e.target.value });
                        if (formErrors.code) {
                          setFormErrors((prev) => ({ ...prev, code: '' }));
                        }
                      }}
                      placeholder="e.g. testing-plan, starter, enterprise"
                      className={`w-full bg-slate-50/50 border rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 font-mono transition-all ${
                        formErrors.code
                          ? 'border-rose-300 focus:ring-rose-500/20 focus:border-rose-500'
                          : 'border-slate-200 focus:ring-emerald-500/20 focus:border-emerald-500'
                      }`}
                    />
                    {formErrors.code ? (
                      <p className="text-rose-600 text-[11px] mt-1 font-semibold">{formErrors.code}</p>
                    ) : (
                      <p className="text-[11px] text-slate-400 mt-1">
                        Unique identifier (e.g. <code>starter</code>, <code>testing-phase</code>). Must be unique across all packages.
                      </p>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows={3}
                      value={formData.description || ''}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Short summary of target business scale and core benefits..."
                      className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                    />
                  </div>
                </div>
              )}

              {/* Step 2: Pricing & Billing */}
              {builderStep === 2 && (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Price (PKR) <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="100"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                      {formErrors.price && <p className="text-rose-600 text-[11px] mt-1">{formErrors.price}</p>}
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Billing Cycle</label>
                      <select
                        value={formData.billing_cycle}
                        onChange={(e) => setFormData({ ...formData, billing_cycle: e.target.value as any })}
                        className="w-full bg-white border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                      <label className="block text-xs font-bold text-slate-700 mb-1">Trial Period (Days)</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.trial_days}
                        onChange={(e) => setFormData({ ...formData, trial_days: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Sort Order</label>
                      <input
                        type="number"
                        min="0"
                        value={formData.sort_order}
                        onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                        className="w-full bg-slate-50/50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Step 3: Dynamic Limits */}
              {builderStep === 3 && (
                <div className="space-y-4">
                  <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-xs text-emerald-800">
                    <Info className="w-4 h-4 shrink-0 text-emerald-600" />
                    <span>Set numeric caps or toggle <strong>Unlimited (-1)</strong> for unlimited allocation.</span>
                  </div>

                  {Object.entries(STANDARD_LIMIT_LABELS).map(([key, def]) => {
                    const currentVal = (formData.limits as any)[key] ?? -1;
                    const isUnlimited = currentVal === -1;

                    return (
                      <div key={key} className="flex items-center justify-between gap-4 p-3 rounded-xl bg-slate-50 border border-slate-200/80">
                        <div>
                          <span className="font-bold text-xs text-slate-900 block">{def.label}</span>
                          <span className="text-[10px] text-slate-500">
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
                            className={`w-28 bg-white border rounded-lg px-2.5 py-1.5 text-xs text-slate-900 text-right focus:outline-none focus:ring-2 focus:ring-emerald-500/20 ${
                              isUnlimited ? 'border-slate-200 text-slate-400 placeholder:text-emerald-600 font-bold' : 'border-slate-200'
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
                                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                : 'bg-slate-100 text-slate-700 border-slate-200 hover:bg-slate-200'
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
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                    <span className="text-xs font-bold text-slate-700">
                      {formData.module_ids.length} of {modules.length} Modules Selected
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, module_ids: modules.map((m) => m.id) })}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-bold cursor-pointer"
                      >
                        Select All
                      </button>
                      <span className="text-slate-300">|</span>
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, module_ids: [] })}
                        className="text-xs text-slate-500 hover:text-slate-700 font-semibold cursor-pointer"
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
                              ? 'bg-emerald-50 border-emerald-200 text-emerald-900 font-bold'
                              : 'bg-slate-50/50 border-slate-200 text-slate-600 hover:border-slate-300'
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
                            className="w-3.5 h-3.5 rounded border-slate-300 bg-white text-emerald-600 focus:ring-0 cursor-pointer accent-emerald-600"
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
            <div className="p-6 border-t border-slate-100 bg-slate-50/70 flex items-center justify-between">
              <div>
                {builderStep > 1 && (
                  <button
                    type="button"
                    onClick={() => setBuilderStep((prev) => prev - 1)}
                    className="px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer shadow-2xs"
                  >
                    Back
                  </button>
                )}
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsBuilderOpen(false)}
                  className="px-4 py-2 rounded-xl bg-transparent hover:bg-slate-100 text-slate-600 text-xs font-semibold transition-colors cursor-pointer"
                >
                  Cancel
                </button>

                {builderStep < 4 ? (
                  <button
                    type="button"
                    onClick={() => setBuilderStep((prev) => prev + 1)}
                    className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  >
                    Next Step
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={saving}
                    onClick={handleSavePackage}
                    className="px-6 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer"
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 font-sans">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <Scale className="w-5 h-5 text-emerald-600" />
                  <h2 className="text-lg font-bold text-slate-900">Package Comparison Matrix</h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Side-by-side comparative analysis of subscription pricing, quotas, and feature modules.
                </p>
              </div>

              <button
                onClick={() => setIsCompareModalOpen(false)}
                type="button"
                className="p-2 rounded-xl bg-slate-50 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
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
                    <tr className="border-b border-slate-200/80 bg-slate-50/70">
                      <th className="p-3 font-extrabold text-slate-600 w-1/4">Specification</th>
                      {comparisonData.packages.map((pkg) => (
                        <th key={pkg.id} className="p-3 font-extrabold text-slate-900 text-center">
                          <div className="text-sm font-black">{pkg.name}</div>
                          <span className="text-[10px] text-emerald-700 font-mono">
                            {pkg.currency} {pkg.price.toLocaleString()} / {pkg.billing_cycle}
                          </span>
                        </th>
                      ))}
                    </tr>
                  </thead>

                  <tbody className="divide-y divide-slate-100">
                    {/* Section 1: Resource Quotas */}
                    <tr className="bg-slate-50/90">
                      <td colSpan={comparisonData.packages.length + 1} className="p-2.5 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                        Resource Quotas
                      </td>
                    </tr>
                    {comparisonData.comparison.limits.map((row) => (
                      <tr key={row.key} className="hover:bg-slate-50/60">
                        <td className="p-3 font-semibold text-slate-700">{row.label}</td>
                        {comparisonData.packages.map((pkg) => {
                          const val = row.values[pkg.id];
                          return (
                            <td key={pkg.id} className="p-3 text-center">
                              {val?.is_unlimited ? (
                                <span className="font-bold text-emerald-600">Unlimited</span>
                              ) : (
                                <span className="text-slate-700 font-semibold">{val?.formatted}</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    ))}

                    {/* Section 2: Modules Matrix */}
                    <tr className="bg-slate-50/90">
                      <td colSpan={comparisonData.packages.length + 1} className="p-2.5 font-bold text-slate-900 text-[11px] uppercase tracking-wider">
                        Included Modules
                      </td>
                    </tr>
                    {comparisonData.comparison.modules.map((mod) => (
                      <tr key={mod.module_id} className="hover:bg-slate-50/60">
                        <td className="p-3 font-medium text-slate-700 flex items-center gap-2">
                          <span>{mod.name}</span>
                          <span className="text-[10px] font-mono text-slate-400">({mod.code})</span>
                        </td>
                        {comparisonData.packages.map((pkg) => {
                          const included = mod.availability[pkg.id]?.included;
                          return (
                            <td key={pkg.id} className="p-3 text-center">
                              {included ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 mx-auto" />
                              ) : (
                                <XCircle className="w-4 h-4 text-slate-300 mx-auto" />
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-sans">
            <h3 className="text-base font-bold text-slate-900">
              {togglingPackage.is_active ? 'Deactivate Package?' : 'Activate Package?'}
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              {togglingPackage.is_active
                ? `Deactivating '${togglingPackage.name}' will remove it from new tenant subscription options. Existing tenants subscribed to this tier will remain active and unaffected.`
                : `Activating '${togglingPackage.name}' will make it immediately available for new tenant registrations and upgrades.`}
            </p>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setTogglingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmToggleStatus}
                className={`px-4 py-2 rounded-xl text-xs font-bold text-white shadow-md cursor-pointer ${
                  togglingPackage.is_active ? 'bg-amber-600 hover:bg-amber-700' : 'bg-emerald-600 hover:bg-emerald-700'
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-sans">
            <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete Package '{deletingPackage.name}'?</h3>
              <p className="text-xs text-slate-600 mt-1">
                This action is permanent. Packages referenced by active licenses cannot be deleted and must be deactivated instead.
              </p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setDeletingPackage(null)}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 cursor-pointer"
              >
                Delete Package
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Safety Alert (PACKAGE_IN_USE) */}
      {safetyAlert && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-amber-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95 font-sans">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">{safetyAlert.title}</h3>
              <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{safetyAlert.message}</p>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSafetyAlert(null)}
                className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/20 cursor-pointer"
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
