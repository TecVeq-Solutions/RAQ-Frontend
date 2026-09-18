'use client';

import React from 'react';
import { useTenantContext } from '@/context/TenantContext';
import { AlertTriangle, Clock, AlertOctagon, Sparkles, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export const LicenseExpiryBanner: React.FC = () => {
    const { license, package: pkg, loading, refreshTenantContext } = useTenantContext();

    if (loading || !license) {
        return null;
    }

    const { status, grace_period, days_remaining, is_expiring_soon, is_valid, validation_message } = license;

    // 1. Critical / Terminal State (Expired past grace period, suspended, revoked, or invalid)
    if (!is_valid || status === 'expired' || status === 'suspended' || status === 'revoked') {
        return (
            <div className="bg-gradient-to-r from-rose-900/90 via-red-900/90 to-rose-950 text-white px-4 py-3 border-b border-rose-700/60 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-rose-500/20 rounded-lg shrink-0 border border-rose-400/30">
                            <AlertOctagon className="w-4 h-4 text-rose-300 animate-pulse" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold">Subscription Access Restricted:</span>{' '}
                            <span className="text-rose-200">
                                {validation_message || `Your license is currently ${status}. Please contact your platform administrator.`}
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => refreshTenantContext()}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Refresh
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 2. Grace Period Warning State
    if (grace_period) {
        return (
            <div className="bg-gradient-to-r from-amber-900/90 via-orange-900/90 to-amber-950 text-white px-4 py-3 border-b border-amber-700/60 shadow-md">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1.5 bg-amber-500/20 rounded-lg shrink-0 border border-amber-400/30">
                            <Clock className="w-4 h-4 text-amber-300 animate-spin" style={{ animationDuration: '6s' }} />
                        </div>
                        <div className="min-w-0">
                            <span className="font-bold">License in Grace Period:</span>{' '}
                            <span className="text-amber-100">
                                Your subscription has expired and is operating under a temporary grace period. Please renew promptly to prevent automated lockout.
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                        <button
                            type="button"
                            onClick={() => refreshTenantContext()}
                            className="px-2.5 py-1 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-semibold transition flex items-center gap-1"
                        >
                            <RefreshCw className="w-3.5 h-3.5" /> Re-check
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    // 3. Expiring Soon Warning State (e.g. <= 14 days)
    if (is_expiring_soon || (days_remaining > 0 && days_remaining <= 14)) {
        return (
            <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900/90 text-indigo-100 px-4 py-2.5 border-b border-indigo-800/60 shadow-sm">
                <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="flex items-center gap-2.5 min-w-0">
                        <div className="p-1 bg-indigo-500/20 rounded-md shrink-0 border border-indigo-400/30">
                            <AlertTriangle className="w-3.5 h-3.5 text-indigo-300" />
                        </div>
                        <div className="min-w-0">
                            <span className="font-semibold text-white">License Expiring Soon:</span>{' '}
                            <span className="text-indigo-200">
                                Your {pkg?.name || 'SaaS'} subscription license expires in{' '}
                                <strong className="text-amber-300 font-bold">{days_remaining} day{days_remaining === 1 ? '' : 's'}</strong>{' '}
                                ({license.expires_at}).
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    // Normal active license: no banner needed
    return null;
};
