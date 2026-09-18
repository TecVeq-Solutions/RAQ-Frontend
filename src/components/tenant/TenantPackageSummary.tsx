'use client';

import React from 'react';
import { useTenantContext } from '@/context/TenantContext';
import { UsageMeter } from './UsageMeter';
import {
    Users,
    Boxes,
    Building2,
    HardDrive,
    Database,
    Sparkles,
    ShieldCheck,
    CheckCircle2,
    Lock,
    RefreshCw,
    Clock,
    CreditCard,
    Layers,
} from 'lucide-react';

interface TenantPackageSummaryProps {
    className?: string;
    showMeters?: boolean;
    showModules?: boolean;
}

export const TenantPackageSummary: React.FC<TenantPackageSummaryProps> = ({
    className = '',
    showMeters = true,
    showModules = true,
}) => {
    const {
        package: pkg,
        license,
        tenant,
        limits,
        usage,
        moduleDetails,
        loading,
        refreshTenantContext,
    } = useTenantContext();

    if (loading && !tenant) {
        return (
            <div className={`p-6 rounded-2xl bg-white border border-slate-200 shadow-2xs text-center text-slate-400 ${className}`}>
                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-500" />
                <p className="text-xs font-semibold">Loading subscription context...</p>
            </div>
        );
    }

    if (!tenant) return null;

    const getLicenseStatusBadge = () => {
        if (!license) return null;
        if (license.grace_period) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Grace Period
                </span>
            );
        }
        if (license.is_expiring_soon) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 shadow-2xs">
                    <Clock className="w-3.5 h-3.5 text-amber-600" /> Expiring Soon ({license.days_remaining}d)
                </span>
            );
        }
        if (license.status === 'active' && license.is_valid) {
            return (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Active License
                </span>
            );
        }
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                <Lock className="w-3.5 h-3.5 text-rose-600" /> {license.status.toUpperCase()}
            </span>
        );
    };

    return (
        <div className={`rounded-2xl bg-white border border-slate-200 shadow-2xs overflow-hidden ${className}`}>
            {/* Header / Plan Overview */}
            <div className="p-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-400/30 flex items-center justify-center text-indigo-300 shadow-inner">
                        <Layers className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-2.5 flex-wrap">
                            <h3 className="text-lg sm:text-xl font-bold tracking-tight text-white">
                                {pkg?.name || 'SaaS Subscription Plan'}
                            </h3>
                            {getLicenseStatusBadge()}
                        </div>
                        <p className="text-xs text-slate-300 mt-1 flex items-center gap-2">
                            <span>Tenant: <strong>{tenant.name}</strong></span>
                            <span>&bull;</span>
                            <span className="capitalize">Billing: <strong>{pkg?.billing_cycle || 'monthly'}</strong></span>
                            {license?.expires_at && (
                                <>
                                    <span>&bull;</span>
                                    <span>Expires: <strong>{license.expires_at}</strong></span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-3 self-end md:self-center">
                    <button
                        type="button"
                        onClick={() => refreshTenantContext()}
                        className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl transition text-xs font-semibold flex items-center gap-1.5"
                        title="Refresh Tenant Context"
                    >
                        <RefreshCw className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Sync</span>
                    </button>
                </div>
            </div>

            {/* Content: Usage Meters Grid */}
            {showMeters && limits && usage && (
                <div className="p-6 border-b border-slate-100 bg-slate-50/50">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Resource Usage & Quota Limits
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Enforced by backend license tier
                        </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                        <UsageMeter
                            label="User Accounts"
                            current={usage.users || 0}
                            max={limits.max_users}
                            unit="users"
                            icon={<Users className="w-4 h-4" />}
                        />
                        <UsageMeter
                            label="Catalog Products"
                            current={usage.products || 0}
                            max={limits.max_products}
                            unit="items"
                            icon={<Boxes className="w-4 h-4" />}
                        />
                        <UsageMeter
                            label="Customer Directory"
                            current={usage.customers || 0}
                            max={limits.max_customers}
                            unit="clients"
                            icon={<Users className="w-4 h-4" />}
                        />
                        <UsageMeter
                            label="Supplier Directory"
                            current={usage.suppliers || 0}
                            max={limits.max_suppliers}
                            unit="vendors"
                            icon={<Building2 className="w-4 h-4" />}
                        />
                        <UsageMeter
                            label="Cloud Backups"
                            current={usage.backups || 0}
                            max={limits.max_backups}
                            unit="snapshots"
                            icon={<Database className="w-4 h-4" />}
                        />
                        <UsageMeter
                            label="Storage Consumption"
                            current={usage.storage_mb || 0}
                            max={limits.max_storage_mb}
                            unit="MB"
                            icon={<HardDrive className="w-4 h-4" />}
                        />
                    </div>
                </div>
            )}

            {/* Content: Effective Modules Grid */}
            {showModules && moduleDetails && moduleDetails.length > 0 && (
                <div className="p-6">
                    <div className="flex items-center justify-between gap-2 mb-4">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                            Module Availability
                        </h4>
                        <span className="text-[11px] text-slate-400 font-medium">
                            Derived from active package & administrative overrides
                        </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5">
                        {moduleDetails.map((mod) => (
                            <div
                                key={mod.module}
                                className={`p-2.5 rounded-xl border flex items-center gap-2 transition-all ${
                                    mod.allowed
                                        ? 'bg-emerald-50/50 border-emerald-200/80 text-emerald-900 shadow-2xs'
                                        : 'bg-slate-50 border-slate-200/60 text-slate-400 opacity-60'
                                }`}
                            >
                                {mod.allowed ? (
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                                ) : (
                                    <Lock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                )}
                                <span className="text-xs font-bold truncate">{mod.module_name}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};
