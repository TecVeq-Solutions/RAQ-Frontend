'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { tenantDataResetService } from '@/lib/tenantDataResetService';
import {
    TenantDataSummaryResponse,
    ResetOperationResult,
} from '@/types/tenantDataReset';
import {
    Building2,
    RefreshCw,
    AlertTriangle,
    ShieldAlert,
    Trash2,
    Archive,
    RotateCcw,
    CheckCircle2,
    XCircle,
    ShoppingCart,
    Boxes,
    Users,
    KeyRound,
    Check,
    ArrowLeft,
    Layers,
    Database,
    ChevronRight,
} from 'lucide-react';

export default function TenantDataManagementPage() {
    const params = useParams();
    const router = useRouter();
    const tenantId = (params?.id as string) || '';

    const [summary, setSummary] = useState<TenantDataSummaryResponse | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [refreshing, setRefreshing] = useState<boolean>(false);
    const [actionLoading, setActionLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    // Modal state
    const [activeModal, setActiveModal] = useState<
        'operational_reset' | 'full_reset' | 'archive' | 'delete' | null
    >(null);

    // Form inputs for modals
    const [confirmationPhrase, setConfirmationPhrase] = useState<string>('');
    const [adminPassword, setAdminPassword] = useState<string>('');
    const [acknowledged, setAcknowledged] = useState<boolean>(false);
    const [modalError, setModalError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<ResetOperationResult | null>(null);

    const fetchSummary = async (isManualRefresh = false) => {
        try {
            if (isManualRefresh) setRefreshing(true);
            else setLoading(true);
            setError(null);
            const data = await tenantDataResetService.getSummary(tenantId);
            setSummary(data);
        } catch (err: any) {
            console.error('Failed to load tenant data summary:', err);
            setError(
                err.response?.data?.message ||
                err.message ||
                'Unable to fetch tenant data summary. Please check your permissions.'
            );
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    };

    useEffect(() => {
        if (tenantId) {
            fetchSummary();
        }
    }, [tenantId]);

    const resetModalForm = () => {
        setConfirmationPhrase('');
        setAdminPassword('');
        setAcknowledged(false);
        setModalError(null);
    };

    const openModal = (
        type: 'operational_reset' | 'full_reset' | 'archive' | 'delete'
    ) => {
        resetModalForm();
        setActiveModal(type);
    };

    const closeModal = () => {
        if (actionLoading) return;
        setActiveModal(null);
        resetModalForm();
    };

    // 1. Handle Operational Reset
    const handleOperationalReset = async () => {
        if (confirmationPhrase.trim() !== 'RESET OPERATIONAL DATA') {
            setModalError('Please type exact confirmation phrase: RESET OPERATIONAL DATA');
            return;
        }

        try {
            setActionLoading(true);
            setModalError(null);
            const res = await tenantDataResetService.resetOperational(tenantId, {
                confirmation_phrase: confirmationPhrase.trim(),
            });

            if (res.success) {
                setLastResult(res.data || null);
                setSuccessMessage(
                    res.message || 'Operational reset completed successfully.'
                );
                closeModal();
                await fetchSummary(true);
            } else {
                setModalError(res.message || 'Operational reset failed.');
            }
        } catch (err: any) {
            setModalError(
                err.response?.data?.message ||
                err.message ||
                'Operation failed. Transaction rolled back.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    // 2. Handle Full Business Reset
    const handleFullReset = async () => {
        if (!adminPassword) {
            setModalError('Super Admin password is required.');
            return;
        }
        if (confirmationPhrase.trim() !== 'RESET FULL BUSINESS') {
            setModalError('Please type exact confirmation phrase: RESET FULL BUSINESS');
            return;
        }
        if (!acknowledged) {
            setModalError('You must acknowledge that this action is irreversible.');
            return;
        }

        try {
            setActionLoading(true);
            setModalError(null);
            const res = await tenantDataResetService.resetFull(tenantId, {
                password: adminPassword,
                confirmation_phrase: confirmationPhrase.trim(),
            });

            if (res.success) {
                setLastResult(res.data || null);
                setSuccessMessage(
                    res.message || 'Full business reset completed successfully.'
                );
                closeModal();
                await fetchSummary(true);
            } else {
                setModalError(res.message || 'Full business reset failed.');
            }
        } catch (err: any) {
            setModalError(
                err.response?.data?.message ||
                err.message ||
                'Operation failed. Transaction rolled back.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    // 3. Handle Archive Tenant
    const handleArchive = async () => {
        if (!adminPassword) {
            setModalError('Super Admin password is required.');
            return;
        }
        if (confirmationPhrase.trim() !== 'ARCHIVE TENANT') {
            setModalError('Please type exact confirmation phrase: ARCHIVE TENANT');
            return;
        }

        try {
            setActionLoading(true);
            setModalError(null);
            const res = await tenantDataResetService.archiveTenant(tenantId, {
                password: adminPassword,
                confirmation_phrase: confirmationPhrase.trim(),
            });

            if (res.success) {
                setLastResult(res.data || null);
                setSuccessMessage(
                    res.message ||
                    'Tenant archived successfully. Active sessions revoked and licenses suspended.'
                );
                closeModal();
                await fetchSummary(true);
            } else {
                setModalError(res.message || 'Tenant archive failed.');
            }
        } catch (err: any) {
            setModalError(
                err.response?.data?.message ||
                err.message ||
                'Archive operation failed.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    // 4. Handle Delete Tenant
    const handleDelete = async () => {
        if (!adminPassword) {
            setModalError('Super Admin password is required.');
            return;
        }
        if (confirmationPhrase.trim() !== 'DELETE TENANT') {
            setModalError('Please type exact confirmation phrase: DELETE TENANT');
            return;
        }
        if (!acknowledged) {
            setModalError('You must explicitly confirm deletion acknowledgement.');
            return;
        }

        try {
            setActionLoading(true);
            setModalError(null);
            const res = await tenantDataResetService.deleteTenant(tenantId, {
                password: adminPassword,
                confirmation_phrase: confirmationPhrase.trim(),
            });

            if (res.success) {
                setSuccessMessage(
                    res.message || 'Tenant organization has been safely deleted.'
                );
                closeModal();
                setTimeout(() => {
                    router.push('/super-admin/tenants');
                }, 1500);
            } else {
                setModalError(res.message || 'Tenant deletion failed.');
            }
        } catch (err: any) {
            setModalError(
                err.response?.data?.message ||
                err.message ||
                'Delete operation failed.'
            );
        } finally {
            setActionLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="p-8 max-w-7xl mx-auto flex flex-col items-center justify-center min-h-[60vh] font-sans">
                <RefreshCw className="w-10 h-10 text-emerald-600 animate-spin mb-4" />
                <h2 className="text-xl font-bold text-slate-800">
                    Loading Tenant Data Summary...
                </h2>
                <p className="text-slate-500 text-sm mt-1">
                    Inspecting schema counts and dependency mapping for Tenant #{tenantId}
                </p>
            </div>
        );
    }

    if (error && !summary) {
        return (
            <div className="p-8 max-w-4xl mx-auto space-y-4 font-sans">
                <Link
                    href="/super-admin/tenants"
                    className="inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-900 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Tenants Directory</span>
                </Link>
                <div className="p-6 rounded-3xl bg-rose-50 border border-rose-200 text-rose-800 space-y-3">
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-6 h-6 text-rose-600 shrink-0" />
                        <h2 className="text-lg font-bold">Failed to Load Tenant Data</h2>
                    </div>
                    <p className="text-sm">{error}</p>
                    <button
                        type="button"
                        onClick={() => fetchSummary()}
                        className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors cursor-pointer"
                    >
                        Retry Inspection
                    </button>
                </div>
            </div>
        );
    }

    const tenant = summary?.tenant;
    const counts = summary?.counts;

    return (
        <div className="p-6 sm:p-8 space-y-8 max-w-7xl mx-auto font-sans">
            {/* Header & Breadcrumbs */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                        <Link
                            href="/super-admin/dashboard"
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Super Admin
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <Link
                            href="/super-admin/tenants"
                            className="hover:text-emerald-600 transition-colors"
                        >
                            Tenants
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-emerald-600 font-bold">Data & Resets</span>
                    </div>
                    <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                        <Database className="w-7 h-7 text-emerald-600" />
                        <span>Tenant Data Management & Resets</span>
                    </h1>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Inspect tenant-owned database records, execute dependency-aware operational/business resets, or safely archive organization.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Link
                        href="/super-admin/tenants"
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        <span>Back</span>
                    </Link>
                    <button
                        type="button"
                        onClick={() => fetchSummary(true)}
                        disabled={refreshing}
                        className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                        <RefreshCw
                            className={`w-4 h-4 text-emerald-600 ${refreshing ? 'animate-spin' : ''}`}
                        />
                        <span>{refreshing ? 'Refreshing...' : 'Refresh Summary'}</span>
                    </button>
                </div>
            </div>

            {/* Notification Alerts */}
            {successMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                        <span className="text-sm font-semibold">{successMessage}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setSuccessMessage(null)}
                        className="text-emerald-700 hover:text-emerald-900 text-xs font-bold cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {error && (
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 flex items-start justify-between gap-3 shadow-xs">
                    <div className="flex items-center gap-3">
                        <XCircle className="w-5 h-5 text-rose-600 shrink-0" />
                        <span className="text-sm font-semibold">{error}</span>
                    </div>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="text-rose-700 hover:text-rose-900 text-xs font-bold cursor-pointer"
                    >
                        Dismiss
                    </button>
                </div>
            )}

            {/* Tenant Identity Summary Card */}
            {tenant && (
                <div className="p-6 rounded-3xl bg-slate-900 text-white shadow-xl relative overflow-hidden">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 backdrop-blur-md flex items-center justify-center text-white font-black text-xl shrink-0 shadow-inner">
                                {tenant.name.slice(0, 2).toUpperCase()}
                            </div>
                            <div className="space-y-1">
                                <div className="flex items-center gap-3 flex-wrap">
                                    <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                                        {tenant.name}
                                    </h2>
                                    <span
                                        className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider border ${
                                            tenant.status === 'active'
                                                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                                                : tenant.status === 'archived'
                                                ? 'bg-purple-500/20 text-purple-300 border-purple-500/40'
                                                : 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                        }`}
                                    >
                                        {tenant.status}
                                    </span>
                                </div>
                                <div className="flex items-center gap-4 text-xs text-slate-300 flex-wrap">
                                    <span className="font-mono">ID: #{tenant.id}</span>
                                    <span>•</span>
                                    <span className="font-mono">UUID: {tenant.uuid.slice(0, 13)}...</span>
                                    <span>•</span>
                                    <span>Slug: <strong className="text-emerald-300">{tenant.slug}</strong></span>
                                </div>
                            </div>
                        </div>

                        {/* Metadata Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-white/5 border border-white/10 rounded-2xl p-4 backdrop-blur-md text-xs">
                            <div>
                                <span className="text-slate-400 block mb-0.5">Package</span>
                                <strong className="text-emerald-300 font-bold">
                                    {tenant.package?.name || 'Standard'}
                                </strong>
                            </div>
                            <div>
                                <span className="text-slate-400 block mb-0.5">License Status</span>
                                <strong
                                    className={`font-bold ${
                                        tenant.active_license?.status === 'active'
                                            ? 'text-emerald-300'
                                            : 'text-amber-300'
                                    }`}
                                >
                                    {tenant.active_license?.status || 'No License'}
                                </strong>
                            </div>
                            <div className="col-span-2 sm:col-span-1">
                                <span className="text-slate-400 block mb-0.5">Created Date</span>
                                <strong className="text-slate-200 font-medium">
                                    {new Date(tenant.created_at).toLocaleDateString()}
                                </strong>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section: Data Overview Record Counts */}
            {counts && (
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                                <Layers className="w-5 h-5 text-emerald-600" />
                                <span>Tenant Data Footprint</span>
                            </h2>
                            <p className="text-xs text-slate-500">
                                Live breakdown of all records stored for this tenant in database.
                            </p>
                        </div>
                        <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                            Total Records: {(counts?.grand_total ?? ((counts?.operational?.total ?? 0) + (counts?.master?.total ?? 0) + (counts?.saas?.total ?? 0))).toLocaleString()}
                        </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {/* 1. Operational / Transactional Data */}
                        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                        <ShoppingCart className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            Operational Activity
                                        </h3>
                                        <span className="text-[11px] text-slate-400">
                                            Transactional Records
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    {(counts?.operational?.total ?? 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Sales</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.sales ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Sale Items</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.sale_items ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Purchases</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.purchases ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Purchase Items</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.purchase_items ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Payments</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.payments ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Expenses</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.expenses ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Production</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.production_orders ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Stock Moves</span>
                                    <strong className="text-slate-900 font-bold">{counts?.operational?.stock_movements ?? 0}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 2. Master Business Data */}
                        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                                        <Boxes className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            Master Configuration
                                        </h3>
                                        <span className="text-[11px] text-slate-400">
                                            Definitions & Ledgers
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg">
                                    {(counts?.master?.total ?? 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Products</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.products ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Categories</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.categories ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Units</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.units ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Customers</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.customers ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Suppliers</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.suppliers ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">BOMs</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.boms ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Machinery/Assets</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.assets ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Accounts</span>
                                    <strong className="text-slate-900 font-bold">{counts?.master?.financial_accounts ?? 0}</strong>
                                </div>
                            </div>
                        </div>

                        {/* 3. SaaS Platform Records */}
                        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs space-y-4">
                            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                                <div className="flex items-center gap-2.5">
                                    <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                                        <Users className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-slate-900 text-sm">
                                            SaaS Identity & Auth
                                        </h3>
                                        <span className="text-[11px] text-slate-400">
                                            Users & Licenses
                                        </span>
                                    </div>
                                </div>
                                <span className="text-xs font-black text-amber-700 bg-amber-50 px-2.5 py-1 rounded-lg">
                                    {(counts?.saas?.total ?? 0).toLocaleString()}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Tenant Users</span>
                                    <strong className="text-slate-900 font-bold">{counts?.saas?.users ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Licenses</span>
                                    <strong className="text-slate-900 font-bold">{counts?.saas?.licenses ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">License Events</span>
                                    <strong className="text-slate-900 font-bold">{counts?.saas?.license_events ?? 0}</strong>
                                </div>
                                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100/80 flex items-center justify-between">
                                    <span className="text-slate-500">Overrides</span>
                                    <strong className="text-slate-900 font-bold">{counts?.saas?.module_overrides ?? 0}</strong>
                                </div>
                            </div>

                            <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-100 text-[11px] text-amber-900 leading-relaxed">
                                SaaS records protect tenant license status and administrative audit trails.
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Section: Action Cards Grid */}
            <div className="space-y-4">
                <h2 className="text-lg font-black text-slate-900 flex items-center gap-2">
                    <ShieldAlert className="w-5 h-5 text-emerald-600" />
                    <span>Administrative Reset & Lifecycle Controls</span>
                </h2>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Card 1: Operational Reset */}
                    <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-slate-300 transition-all">
                        <div className="space-y-3">
                            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 flex items-center justify-center">
                                <RotateCcw className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                Operational Reset
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Clears transactional and operational business data (sales, purchases, payments, expenses, production, stock movements) while preserving all master products, customers, suppliers, BOMs, assets, and users.
                            </p>
                            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 text-xs text-slate-700 space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Affected Records:</span>
                                    <span className="text-emerald-700 font-bold">
                                        {(counts?.operational?.total ?? 0).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[11px] text-slate-400">
                                    Master configuration & SaaS identities are preserved.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => openModal('operational_reset')}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.01]"
                        >
                            <RotateCcw className="w-4 h-4" />
                            <span>Reset Operational Data</span>
                        </button>
                    </div>

                    {/* Card 2: Full Business Reset */}
                    <div className="p-6 rounded-3xl bg-white border border-amber-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-amber-300 transition-all bg-gradient-to-b from-amber-50/20 to-transparent">
                        <div className="space-y-3">
                            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center">
                                <AlertTriangle className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                Full Business Reset
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Clears both transactional activity AND master business records (products, categories, customers, suppliers, BOMs, financial accounts) and returns tenant to a clean business state.
                            </p>
                            <div className="p-3 rounded-2xl bg-amber-50/80 border border-amber-100 text-xs text-amber-900 space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Total Records Removed:</span>
                                    <span className="text-amber-700 font-bold">
                                        {((counts?.operational?.total ?? 0) + (counts?.master?.total ?? 0)).toLocaleString()}
                                    </span>
                                </div>
                                <div className="text-[11px] text-amber-800/80">
                                    Tenant SaaS identity, packages & audit logs are preserved.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => openModal('full_reset')}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs hover:scale-[1.01]"
                        >
                            <AlertTriangle className="w-4 h-4" />
                            <span>Reset Full Business</span>
                        </button>
                    </div>

                    {/* Card 3: Archive Tenant */}
                    <div className="p-6 rounded-3xl bg-white border border-purple-200/80 shadow-xs flex flex-col justify-between space-y-5 hover:border-purple-300 transition-all bg-gradient-to-b from-purple-50/20 to-transparent">
                        <div className="space-y-3">
                            <div className="w-11 h-11 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 flex items-center justify-center">
                                <Archive className="w-5 h-5" />
                            </div>
                            <h3 className="text-base font-bold text-slate-900">
                                Archive Tenant
                            </h3>
                            <p className="text-xs text-slate-500 leading-relaxed">
                                Disables ERP login and revokes active tenant user sessions and suspends licenses, while keeping all business data, history, and audit logs completely intact for compliance.
                            </p>
                            <div className="p-3 rounded-2xl bg-purple-50/80 border border-purple-100 text-xs text-purple-900 space-y-1">
                                <div className="flex justify-between font-semibold">
                                    <span>Current Status:</span>
                                    <span className="font-mono uppercase font-bold text-purple-700">
                                        {tenant?.status}
                                    </span>
                                </div>
                                <div className="text-[11px] text-purple-800/80">
                                    Soft operation. Historical data remains safe.
                                </div>
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={() => openModal('archive')}
                            disabled={tenant?.status === 'archived'}
                            className="w-full py-2.5 px-4 rounded-xl text-xs font-bold bg-purple-50 text-purple-700 hover:bg-purple-100 border border-purple-200 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-2xs hover:scale-[1.01] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Archive className="w-4 h-4" />
                            <span>
                                {tenant?.status === 'archived' ? 'Tenant Already Archived' : 'Archive Tenant'}
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Danger Zone (Delete Tenant) */}
            <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-rose-50/70 via-rose-50/40 to-white border-2 border-rose-200/80 shadow-xs space-y-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 flex items-center justify-center shrink-0">
                            <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                            <span className="text-xs font-black tracking-wider uppercase text-rose-600">
                                Danger Zone
                            </span>
                            <h2 className="text-xl font-black text-slate-900">
                                Controlled Tenant Soft-Deletion
                            </h2>
                            <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-2xl">
                                Permanently deactivates tenant organization, revokes all user sessions and licenses. Adheres to strict audit integrity and never removes global SaaS platform records.
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={() => openModal('delete')}
                        className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs transition-all flex items-center gap-2 cursor-pointer shadow-sm hover:scale-[1.02] self-start sm:self-auto shrink-0"
                    >
                        <Trash2 className="w-4 h-4" />
                        <span>Delete Tenant Organization</span>
                    </button>
                </div>
            </div>

            {/* ========================================================================= */}
            {/* MODALS */}
            {/* ========================================================================= */}

            {/* 1. Modal: Operational Reset */}
            {activeModal === 'operational_reset' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-600 shrink-0">
                                <RotateCcw className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Confirm Operational Reset
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Organization: <strong className="text-slate-900">{tenant?.name}</strong> (ID: #{tenantId})
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-2 text-xs text-slate-700">
                            <strong className="text-slate-900 font-bold block">
                                The following data will be permanently cleared:
                            </strong>
                            <ul className="list-disc list-inside space-y-1 text-slate-600">
                                <li>{counts?.operational?.sales ?? 0} Sales & {counts?.operational?.sale_items ?? 0} Sale Items</li>
                                <li>{counts?.operational?.purchases ?? 0} Purchases & {counts?.operational?.purchase_items ?? 0} Purchase Items</li>
                                <li>{counts?.operational?.payments ?? 0} Payments & {counts?.operational?.expenses ?? 0} Expenses</li>
                                <li>{counts?.operational?.production_orders ?? 0} Production Orders & Stage Costs</li>
                                <li>{counts?.operational?.stock_movements ?? 0} Stock Movements (Recalculated to 0)</li>
                                <li>Customer & Supplier Ledgers & Transaction Balances</li>
                            </ul>
                            <div className="pt-2 border-t border-slate-200 text-emerald-700 font-semibold flex items-center gap-1.5">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>Master Products, Customers, BOMs, Users & Settings will be preserved.</span>
                            </div>
                        </div>

                        {modalError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-slate-700 block">
                                Type confirmation phrase: <span className="font-mono text-emerald-700 select-all font-black">RESET OPERATIONAL DATA</span>
                            </label>
                            <input
                                type="text"
                                value={confirmationPhrase}
                                onChange={(e) => setConfirmationPhrase(e.target.value)}
                                placeholder="RESET OPERATIONAL DATA"
                                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20 text-slate-900 bg-slate-50/50"
                            />
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleOperationalReset}
                                disabled={actionLoading || confirmationPhrase.trim() !== 'RESET OPERATIONAL DATA'}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Resetting...</span>
                                    </>
                                ) : (
                                    <>
                                        <RotateCcw className="w-3.5 h-3.5" />
                                        <span>Confirm Operational Reset</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 2. Modal: Full Business Reset */}
            {activeModal === 'full_reset' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-amber-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 shrink-0">
                                <AlertTriangle className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Confirm Full Business Reset
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Organization: <strong className="text-slate-900">{tenant?.name}</strong> (ID: #{tenantId})
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 space-y-2">
                            <strong className="text-amber-950 font-bold block">
                                Warning: High-Risk Destructive Action
                            </strong>
                            <p className="text-amber-900/90 leading-relaxed">
                                This will completely remove all transactional data (Sales, Purchases, Payments, Production) AND all master business records (Products, Categories, Customers, Suppliers, BOMs, Assets, Financial Accounts).
                            </p>
                            <p className="text-slate-600 pt-1 border-t border-amber-200">
                                Only tenant SaaS identity, licenses, and security audit logs will remain.
                            </p>
                        </div>

                        {modalError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Super Administrator Password</span>
                                </label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Enter your Super Admin password"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Type confirmation phrase: <span className="font-mono text-amber-700 select-all font-black">RESET FULL BUSINESS</span>
                                </label>
                                <input
                                    type="text"
                                    value={confirmationPhrase}
                                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                                    placeholder="RESET FULL BUSINESS"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-amber-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-amber-600 focus:ring-amber-500"
                                />
                                <span>I understand that this action is irreversible and will delete all operational and master business data for this tenant.</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleFullReset}
                                disabled={actionLoading || !adminPassword || confirmationPhrase.trim() !== 'RESET FULL BUSINESS' || !acknowledged}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Resetting Full Business...</span>
                                    </>
                                ) : (
                                    <>
                                        <AlertTriangle className="w-3.5 h-3.5" />
                                        <span>Execute Full Reset</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 3. Modal: Archive Tenant */}
            {activeModal === 'archive' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-purple-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="p-3 rounded-2xl bg-purple-50 border border-purple-200 text-purple-600 shrink-0">
                                <Archive className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Archive Tenant Organization
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Organization: <strong className="text-slate-900">{tenant?.name}</strong> (ID: #{tenantId})
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-purple-50/80 border border-purple-200 text-xs text-purple-900 space-y-2">
                            <strong className="text-purple-950 font-bold block">
                                Safe Archiving Operation:
                            </strong>
                            <p className="text-purple-900/90 leading-relaxed">
                                Archiving disables all user logins for this tenant, immediately revokes active Sanctum API tokens, and marks tenant licenses as suspended.
                            </p>
                            <p className="text-emerald-700 font-semibold flex items-center gap-1.5 pt-1 border-t border-purple-200">
                                <Check className="w-4 h-4 text-emerald-600" />
                                <span>All historical transactions, sales, and audit trails remain preserved.</span>
                            </p>
                        </div>

                        {modalError && (
                            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold flex items-center gap-2">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Super Administrator Password</span>
                                </label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Enter your Super Admin password"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Type confirmation phrase: <span className="font-mono text-purple-700 select-all font-black">ARCHIVE TENANT</span>
                                </label>
                                <input
                                    type="text"
                                    value={confirmationPhrase}
                                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                                    placeholder="ARCHIVE TENANT"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-purple-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleArchive}
                                disabled={actionLoading || !adminPassword || confirmationPhrase.trim() !== 'ARCHIVE TENANT'}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Archiving...</span>
                                    </>
                                ) : (
                                    <>
                                        <Archive className="w-3.5 h-3.5" />
                                        <span>Confirm Archive</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* 4. Modal: Delete Tenant */}
            {activeModal === 'delete' && (
                <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border-2 border-rose-200 space-y-5 animate-in fade-in zoom-in-95 duration-150">
                        <div className="flex items-start gap-3.5">
                            <div className="p-3 rounded-2xl bg-rose-100 border border-rose-200 text-rose-600 shrink-0">
                                <Trash2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-black text-slate-900">
                                    Delete Tenant Organization
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Organization: <strong className="text-slate-900">{tenant?.name}</strong> (ID: #{tenantId})
                                </p>
                            </div>
                        </div>

                        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-2">
                            <strong className="text-rose-950 font-bold block">
                                Critical Administrative Operation
                            </strong>
                            <p className="text-rose-900/90 leading-relaxed">
                                Soft-deletes the tenant organization, revokes all user sessions and licenses. System audit records are preserved for legal and security traceability.
                            </p>
                        </div>

                        {modalError && (
                            <div className="p-3 rounded-xl bg-rose-100 border border-rose-300 text-rose-800 text-xs font-semibold flex items-center gap-2">
                                <XCircle className="w-4 h-4 shrink-0" />
                                <span>{modalError}</span>
                            </div>
                        )}

                        <div className="space-y-3">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block flex items-center gap-1.5">
                                    <KeyRound className="w-3.5 h-3.5 text-slate-400" />
                                    <span>Super Administrator Password</span>
                                </label>
                                <input
                                    type="password"
                                    value={adminPassword}
                                    onChange={(e) => setAdminPassword(e.target.value)}
                                    placeholder="Enter your Super Admin password"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            <div className="space-y-1">
                                <label className="text-xs font-bold text-slate-700 block">
                                    Type confirmation phrase: <span className="font-mono text-rose-700 select-all font-black">DELETE TENANT</span>
                                </label>
                                <input
                                    type="text"
                                    value={confirmationPhrase}
                                    onChange={(e) => setConfirmationPhrase(e.target.value)}
                                    placeholder="DELETE TENANT"
                                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-rose-500/30 text-slate-900 bg-slate-50/50"
                                />
                            </div>

                            <label className="flex items-start gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-xs text-slate-700 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acknowledged}
                                    onChange={(e) => setAcknowledged(e.target.checked)}
                                    className="mt-0.5 rounded border-slate-300 text-rose-600 focus:ring-rose-500"
                                />
                                <span>I understand that this action will delete the tenant organization and deactivate all tenant users.</span>
                            </label>
                        </div>

                        <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={actionLoading}
                                className="px-4 py-2 text-xs font-bold text-slate-600 hover:text-slate-900 transition-colors cursor-pointer"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleDelete}
                                disabled={actionLoading || !adminPassword || confirmationPhrase.trim() !== 'DELETE TENANT' || !acknowledged}
                                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-rose-600 hover:bg-rose-700 text-white transition-all flex items-center gap-2 cursor-pointer shadow-xs disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {actionLoading ? (
                                    <>
                                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                        <span>Deleting Tenant...</span>
                                    </>
                                ) : (
                                    <>
                                        <Trash2 className="w-3.5 h-3.5" />
                                        <span>Confirm Delete Tenant</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
