'use client';

import React, { useEffect, useState, useCallback } from 'react';
import { licenseService } from '@/lib/licenseService';
import { packageService } from '@/lib/packageService';
import {
  License,
  LicenseEvent,
  LicenseValidationResult,
} from '@/types/license';
import { Package } from '@/types/package';
import {
  KeyRound,
  Plus,
  Search,
  RefreshCw,
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Clock,
  Calendar,
  Building2,
  Lock,
  History,
  RotateCw,
  PlusCircle,
  PauseCircle,
  PlayCircle,
  XCircle,
  AlertOctagon,
  X,
  Info,
  ChevronRight,
  ShieldAlert,
} from 'lucide-react';

export default function SuperAdminLicensesPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [packages, setPackages] = useState<Package[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [search, setSearch] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [packageFilter, setPackageFilter] = useState<string>('all');

  // Copied Key Toast
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Action Modals State
  const [generatingOpen, setGeneratingOpen] = useState<boolean>(false);
  const [generateForm, setGenerateForm] = useState({
    tenant_id: 1,
    package_id: 1,
    starts_at: new Date().toISOString().split('T')[0],
    status: 'active' as 'active' | 'pending',
  });

  const [suspendingLicense, setSuspendingLicense] = useState<License | null>(null);
  const [suspendReason, setSuspendReason] = useState<string>('');

  const [revokingLicense, setRevokingLicense] = useState<License | null>(null);
  const [revokeReason, setRevokeReason] = useState<string>('');
  const [revokeConfirmText, setRevokeConfirmText] = useState<string>('');

  const [renewingLicense, setRenewingLicense] = useState<License | null>(null);
  const [renewCycle, setRenewCycle] = useState<string>('monthly');

  const [extendingLicense, setExtendingLicense] = useState<License | null>(null);
  const [extendDays, setExtendDays] = useState<number>(30);
  const [extendReason, setExtendReason] = useState<string>('');

  const [timelineLicense, setTimelineLicense] = useState<License | null>(null);
  const [licenseEvents, setLicenseEvents] = useState<LicenseEvent[]>([]);
  const [eventsLoading, setEventsLoading] = useState<boolean>(false);

  const [actionLoading, setActionLoading] = useState<boolean>(false);

  // Load Data
  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [lics, pkgs] = await Promise.all([
        licenseService.getLicenses({
          status: statusFilter,
          package_id: packageFilter !== 'all' ? Number(packageFilter) : undefined,
          search: search.trim() || undefined,
        }),
        packageService.getAllPackages({ status: 'active' }),
      ]);
      setLicenses(lics);
      setPackages(pkgs);
      if (pkgs.length > 0 && !generateForm.package_id) {
        setGenerateForm((prev) => ({ ...prev, package_id: pkgs[0].id }));
      }
    } catch (err: any) {
      setError(
        err.response?.data?.message || 'Failed to load licenses. Please check network connection.'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter, packageFilter, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Copy License Key
  const handleCopyKey = (key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // 1. Generate License
  const handleGenerateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await licenseService.generateLicense({
        tenant_id: Number(generateForm.tenant_id),
        package_id: Number(generateForm.package_id),
        starts_at: generateForm.starts_at,
        status: generateForm.status,
      });
      setGeneratingOpen(false);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to generate license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 2. Activate License
  const handleActivate = async (license: License) => {
    setActionLoading(true);
    try {
      await licenseService.activateLicense(license.id);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to activate license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 3. Suspend License
  const handleSuspendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!suspendingLicense || !suspendReason.trim()) return;
    setActionLoading(true);
    try {
      await licenseService.suspendLicense(suspendingLicense.id, suspendReason);
      setSuspendingLicense(null);
      setSuspendReason('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to suspend license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 4. Revoke License
  const handleRevokeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!revokingLicense || !revokeReason.trim() || revokeConfirmText !== 'REVOKE') return;
    setActionLoading(true);
    try {
      await licenseService.revokeLicense(revokingLicense.id, revokeReason);
      setRevokingLicense(null);
      setRevokeReason('');
      setRevokeConfirmText('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to revoke license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 5. Renew License
  const handleRenewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!renewingLicense) return;
    setActionLoading(true);
    try {
      await licenseService.renewLicense(renewingLicense.id, renewCycle);
      setRenewingLicense(null);
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to renew license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 6. Extend License
  const handleExtendSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!extendingLicense || extendDays <= 0 || !extendReason.trim()) return;
    setActionLoading(true);
    try {
      await licenseService.extendLicense(extendingLicense.id, extendDays, extendReason);
      setExtendingLicense(null);
      setExtendDays(30);
      setExtendReason('');
      await fetchData();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to extend license.');
    } finally {
      setActionLoading(false);
    }
  };

  // 7. Open History Timeline Drawer
  const handleOpenTimeline = async (license: License) => {
    setTimelineLicense(license);
    setEventsLoading(true);
    try {
      const events = await licenseService.getLicenseEvents(license.id);
      setLicenseEvents(events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to fetch lifecycle events.');
    } finally {
      setEventsLoading(false);
    }
  };

  // Calculate status visual
  const getLicenseStatusBadge = (license: License) => {
    const now = new Date();
    const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
    const isPast = expiresAt && now > expiresAt;
    const isGrace =
      license.status === 'active' &&
      isPast &&
      expiresAt &&
      now.getTime() - expiresAt.getTime() <= 3 * 24 * 60 * 60 * 1000;

    if (license.status === 'revoked') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-1">
          <XCircle className="w-3 h-3" />
          Revoked
        </span>
      );
    }

    if (license.status === 'suspended') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/10 text-amber-400 border border-amber-500/20 flex items-center gap-1">
          <PauseCircle className="w-3 h-3" />
          Suspended
        </span>
      );
    }

    if (license.status === 'expired' || (license.status === 'active' && isPast && !isGrace)) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-500/10 text-rose-400 border border-rose-500/20 flex items-center gap-1">
          <AlertOctagon className="w-3 h-3" />
          Expired
        </span>
      );
    }

    if (isGrace) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-orange-500/20 text-orange-300 border border-orange-500/40 flex items-center gap-1 animate-pulse">
          <AlertTriangle className="w-3 h-3" />
          Grace Period
        </span>
      );
    }

    if (expiresAt && expiresAt.getTime() - now.getTime() <= 14 * 24 * 60 * 60 * 1000) {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
          <Clock className="w-3 h-3" />
          Expiring Soon
        </span>
      );
    }

    if (license.status === 'pending') {
      return (
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-800 text-slate-300 border border-slate-700 flex items-center gap-1">
          Pending
        </span>
      );
    }

    return (
      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
        <ShieldCheck className="w-3 h-3" />
        Active
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Header Banner & Quick Controls */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-900/90 to-indigo-950/40 p-5 sm:p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-sm">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              SaaS License Lifecycle Manager
            </h1>
            <span className="flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-xs font-semibold">
              <KeyRound className="w-3.5 h-3.5 text-indigo-400" />
              Automated Engine
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Centralized validation, renewals, extensions, grace periods, and immutable audit history.
          </p>
        </div>

        {/* Action Toolbar */}
        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <button
            onClick={() => setGeneratingOpen(true)}
            type="button"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-500 hover:to-indigo-600 text-white text-xs font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Generate License</span>
          </button>
        </div>
      </div>

      {/* 2. Filters & Search Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by license key, tenant name or package..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
        </div>

        <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap">
          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active Only</option>
            <option value="expiring_soon">Expiring Soon (&le;14d)</option>
            <option value="grace_period">In Grace Period</option>
            <option value="expired">Expired</option>
            <option value="suspended">Suspended</option>
            <option value="revoked">Revoked</option>
          </select>

          {/* Package Filter */}
          <select
            value={packageFilter}
            onChange={(e) => setPackageFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-indigo-500 cursor-pointer"
          >
            <option value="all">All Packages</option>
            {packages.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>

          <button
            onClick={fetchData}
            type="button"
            className="p-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
            title="Reload Licenses"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* 3. License Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-72 bg-slate-900/50 border border-slate-800 rounded-2xl p-6" />
          ))}
        </div>
      ) : licenses.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 rounded-2xl border border-slate-800 space-y-3">
          <KeyRound className="w-10 h-10 text-slate-600 mx-auto" />
          <h3 className="text-base font-bold text-white">No Licenses Found</h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            {search || statusFilter !== 'all' || packageFilter !== 'all'
              ? 'No license records match your active search filter.'
              : 'Issue a new license to get started.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {licenses.map((license) => {
            const now = new Date();
            const expiresAt = license.expires_at ? new Date(license.expires_at) : null;
            const daysRemaining = expiresAt
              ? Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
              : null;

            return (
              <div
                key={license.id}
                className="bg-slate-900/80 border border-slate-800 hover:border-slate-700/80 rounded-2xl p-5 shadow-xl flex flex-col justify-between transition-all"
              >
                {/* Header: Tenant & Status */}
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5 text-indigo-400 shrink-0" />
                        <h3 className="font-bold text-sm text-white truncate">
                          {license.tenant?.name || `Tenant #${license.tenant_id}`}
                        </h3>
                      </div>
                      <span className="text-[11px] text-slate-400 truncate block mt-0.5">
                        {license.tenant?.email || 'No email associated'}
                      </span>
                    </div>

                    {getLicenseStatusBadge(license)}
                  </div>

                  {/* License Key Box */}
                  <div className="mt-3.5 p-2.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold text-indigo-300 tracking-wider select-all truncate">
                      {license.license_key}
                    </span>
                    <button
                      onClick={() => handleCopyKey(license.license_key)}
                      type="button"
                      className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors cursor-pointer shrink-0"
                      title="Copy Key"
                    >
                      {copiedKey === license.license_key ? (
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <Copy className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {/* Package & Pricing info */}
                  <div className="mt-3.5 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Package Tier:</span>
                    <span className="font-bold text-white">
                      {license.package?.name || `Package #${license.package_id}`} &bull;{' '}
                      <span className="text-indigo-400 capitalize">{license.package?.billing_cycle}</span>
                    </span>
                  </div>

                  {/* Expiration Dates */}
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-slate-400">Expiration:</span>
                    <div className="text-right">
                      <span className="font-medium text-slate-200 block">
                        {expiresAt ? expiresAt.toLocaleDateString() : 'Lifetime Access'}
                      </span>
                      {daysRemaining !== null && (
                        <span
                          className={`text-[10px] font-bold ${
                            daysRemaining > 14
                              ? 'text-emerald-400'
                              : daysRemaining > 0
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }`}
                        >
                          {daysRemaining > 0 ? `${daysRemaining} days remaining` : `${Math.abs(daysRemaining)} days ago`}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions Row */}
                <div className="mt-5 pt-3 border-t border-slate-800 flex items-center justify-between gap-2 text-xs">
                  {/* History button */}
                  <button
                    onClick={() => handleOpenTimeline(license)}
                    type="button"
                    className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors flex items-center gap-1 cursor-pointer"
                    title="Audit History"
                  >
                    <History className="w-3.5 h-3.5 text-indigo-400" />
                    <span className="text-[11px] hidden sm:inline">{license.events_count || 0} Events</span>
                  </button>

                  <div className="flex items-center gap-1.5 flex-wrap justify-end">
                    {/* Activate (if pending/suspended) */}
                    {(license.status === 'pending' || license.status === 'suspended') && (
                      <button
                        onClick={() => handleActivate(license)}
                        disabled={actionLoading}
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Activate
                      </button>
                    )}

                    {/* Suspend (if active) */}
                    {license.status === 'active' && (
                      <button
                        onClick={() => {
                          setSuspendingLicense(license);
                          setSuspendReason('');
                        }}
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Suspend
                      </button>
                    )}

                    {/* Renew (if active or expired) */}
                    {(license.status === 'active' || license.status === 'expired') && (
                      <button
                        onClick={() => {
                          setRenewingLicense(license);
                          setRenewCycle(license.package?.billing_cycle || 'monthly');
                        }}
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Renew
                      </button>
                    )}

                    {/* Extend (if active or expired) */}
                    {(license.status === 'active' || license.status === 'expired') && (
                      <button
                        onClick={() => {
                          setExtendingLicense(license);
                          setExtendDays(30);
                          setExtendReason('');
                        }}
                        type="button"
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 font-semibold text-[11px] transition-colors cursor-pointer"
                      >
                        Extend
                      </button>
                    )}

                    {/* Revoke (if not revoked) */}
                    {license.status !== 'revoked' && (
                      <button
                        onClick={() => {
                          setRevokingLicense(license);
                          setRevokeReason('');
                          setRevokeConfirmText('');
                        }}
                        type="button"
                        className="p-1 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-colors cursor-pointer"
                        title="Revoke License"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. Generate License Modal                                                 */}
      {/* ========================================================================= */}
      {generatingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleGenerateSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-400" />
                <h3 className="font-bold text-base text-white">Generate SaaS License</h3>
              </div>
              <button
                type="button"
                onClick={() => setGeneratingOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Tenant ID</label>
              <input
                type="number"
                min="1"
                required
                value={generateForm.tenant_id}
                onChange={(e) => setGenerateForm({ ...generateForm, tenant_id: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
              />
              <span className="text-[10px] text-slate-500 mt-0.5 block">
                Target organization tenant numerical ID (e.g. 1 for Default Business).
              </span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Package Subscription Tier</label>
              <select
                value={generateForm.package_id}
                onChange={(e) => setGenerateForm({ ...generateForm, package_id: parseInt(e.target.value) || 1 })}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.name} ({pkg.currency} {Number(pkg.price).toLocaleString()} / {pkg.billing_cycle})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={generateForm.starts_at}
                  onChange={(e) => setGenerateForm({ ...generateForm, starts_at: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Initial Status</label>
                <select
                  value={generateForm.status}
                  onChange={(e) => setGenerateForm({ ...generateForm, status: e.target.value as any })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
                >
                  <option value="active">Active (Immediate)</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setGeneratingOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Issuing...' : 'Issue License'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. Suspend License Modal                                                  */}
      {/* ========================================================================= */}
      {suspendingLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleSuspendSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-amber-400">
              <PauseCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Suspend License</h3>
            </div>
            <p className="text-xs text-slate-300">
              Suspending <strong>{suspendingLicense.license_key}</strong> will restrict tenant system operations until reactivated.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reason for Suspension <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={3}
                required
                placeholder="e.g. Non-payment, terms violation, or requested hold..."
                value={suspendReason}
                onChange={(e) => setSuspendReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setSuspendingLicense(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !suspendReason.trim()}
                className="px-5 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-lg shadow-amber-600/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Suspending...' : 'Suspend License'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 6. Revoke License Modal (High-Security Typed Confirmation)                */}
      {/* ========================================================================= */}
      {revokingLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRevokeSubmit}
            className="bg-slate-900 border border-red-500/40 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-red-400">
              <ShieldAlert className="w-6 h-6" />
              <h3 className="font-bold text-base text-white">Permanently Revoke License?</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              This action is permanent and terminal. Once revoked, <strong>{revokingLicense.license_key}</strong> cannot be reactivated or renewed.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Revocation Reason <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="Reason for permanent license termination..."
                value={revokeReason}
                onChange={(e) => setRevokeReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-red-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Type <span className="text-red-400 font-mono">REVOKE</span> to confirm:
              </label>
              <input
                type="text"
                required
                value={revokeConfirmText}
                onChange={(e) => setRevokeConfirmText(e.target.value)}
                placeholder="REVOKE"
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-mono text-white text-center tracking-widest focus:outline-none focus:border-red-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRevokingLicense(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || !revokeReason.trim() || revokeConfirmText !== 'REVOKE'}
                className="px-5 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-lg shadow-red-600/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Revoking...' : 'Revoke License'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 7. Renew License Modal                                                    */}
      {/* ========================================================================= */}
      {renewingLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleRenewSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-indigo-400">
              <RotateCw className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Renew License</h3>
            </div>
            <p className="text-xs text-slate-300">
              Extends subscription validity for <strong>{renewingLicense.license_key}</strong> based on package billing cycle without overlapping periods.
            </p>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">Billing Period</label>
              <select
                value={renewCycle}
                onChange={(e) => setRenewCycle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                <option value="monthly">+1 Month (Monthly Cycle)</option>
                <option value="yearly">+1 Year (Annual Cycle)</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setRenewingLicense(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading}
                className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Renewing...' : 'Confirm Renewal'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 8. Extend License Modal                                                   */}
      {/* ========================================================================= */}
      {extendingLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleExtendSubmit}
            className="bg-slate-900 border border-slate-800 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl animate-in fade-in zoom-in-95"
          >
            <div className="flex items-center gap-2 text-cyan-400">
              <PlusCircle className="w-5 h-5" />
              <h3 className="font-bold text-base text-white">Extend License Validity</h3>
            </div>
            <p className="text-xs text-slate-300">
              Add custom days to the expiration date of <strong>{extendingLicense.license_key}</strong>.
            </p>

            {/* Quick Duration Chips */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Extension Duration</label>
              <div className="flex items-center gap-2 mb-2">
                {[7, 14, 30, 90].map((d) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => setExtendDays(d)}
                    className={`px-3 py-1 rounded-lg text-xs font-bold border transition-colors cursor-pointer ${
                      extendDays === d
                        ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                        : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                    }`}
                  >
                    +{d}d
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                max="3650"
                required
                value={extendDays}
                onChange={(e) => setExtendDays(parseInt(e.target.value) || 1)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Reason for Extension <span className="text-red-400">*</span>
              </label>
              <textarea
                rows={2}
                required
                placeholder="e.g. Promotional extension or onboarding grace period..."
                value={extendReason}
                onChange={(e) => setExtendReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="flex items-center justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => setExtendingLicense(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={actionLoading || extendDays <= 0 || !extendReason.trim()}
                className="px-5 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-bold shadow-lg shadow-cyan-600/20 disabled:opacity-50 cursor-pointer"
              >
                {actionLoading ? 'Extending...' : `Extend +${extendDays} Days`}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 9. Lifecycle Event History Drawer                                         */}
      {/* ========================================================================= */}
      {timelineLicense && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-end">
          <div className="bg-slate-900 border-l border-slate-800 max-w-lg w-full h-full p-6 flex flex-col shadow-2xl overflow-hidden animate-in slide-in-from-right">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div>
                <div className="flex items-center gap-2">
                  <History className="w-5 h-5 text-indigo-400" />
                  <h3 className="font-bold text-base text-white">License Audit Timeline</h3>
                </div>
                <p className="text-xs text-slate-400 font-mono mt-0.5">{timelineLicense.license_key}</p>
              </div>

              <button
                type="button"
                onClick={() => setTimelineLicense(null)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-6 space-y-4">
              {eventsLoading ? (
                <div className="text-center py-12 text-slate-400 text-xs animate-pulse">Loading event history...</div>
              ) : licenseEvents.length === 0 ? (
                <div className="text-center py-12 text-slate-500 text-xs">No lifecycle events recorded.</div>
              ) : (
                <div className="relative pl-6 space-y-6 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-800">
                  {licenseEvents.map((evt) => (
                    <div key={evt.id} className="relative group">
                      {/* Timeline dot */}
                      <span className="absolute -left-6 top-1 w-3 h-3 rounded-full bg-slate-900 border-2 border-indigo-400 group-hover:scale-125 transition-transform" />

                      <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-1.5">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                            {evt.event_type}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(evt.created_at).toLocaleString()}
                          </span>
                        </div>

                        {evt.event_data?.reason && (
                          <p className="text-xs text-slate-300">
                            <strong>Reason:</strong> {evt.event_data.reason}
                          </p>
                        )}

                        {evt.event_data?.new_expiry && (
                          <p className="text-[11px] text-slate-400">
                            New Expiration: {new Date(evt.event_data.new_expiry).toLocaleDateString()}
                          </p>
                        )}

                        {evt.ip_address && (
                          <p className="text-[10px] text-slate-500 font-mono">IP: {evt.ip_address}</p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800 flex justify-end">
              <button
                type="button"
                onClick={() => setTimelineLicense(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold cursor-pointer"
              >
                Close Timeline
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
