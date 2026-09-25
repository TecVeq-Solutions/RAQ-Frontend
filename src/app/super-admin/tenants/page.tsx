'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { licenseService } from '@/lib/licenseService';
import { License } from '@/types/license';
import StartSupportModal from '@/components/support/StartSupportModal';
import {
  Building2,
  Users,
  Search,
  RefreshCw,
  ArrowRight,
  PackageCheck,
  ShieldCheck,
  ShieldAlert,
  Layers,
  Sparkles,
  ExternalLink,
  Database,
  Headset,
  ChevronRight,
} from 'lucide-react';

export default function SuperAdminTenantsPage() {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [search, setSearch] = useState<string>('');
  const [supportTenant, setSupportTenant] = useState<{ id: number; name: string } | null>(null);

  const fetchTenants = async () => {
    try {
      setLoading(true);
      const data = await licenseService.getLicenses();
      setLicenses(data);
    } catch (err) {
      console.error('Failed to load tenants:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTenants();
  }, []);

  const filtered = licenses.filter((lic) => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      lic.tenant?.name?.toLowerCase().includes(s) ||
      lic.tenant?.email?.toLowerCase().includes(s) ||
      lic.package?.name?.toLowerCase().includes(s)
    );
  });

  return (
    <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
            <Link href="/super-admin/dashboard" className="hover:text-emerald-600 transition-colors">
              Super Admin
            </Link>
            <ChevronRight className="w-3.5 h-3.5" />
            <span className="text-emerald-600 font-bold">Tenants Directory</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>SaaS Organizations</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Manage organization subscriptions, package allotments, and tenant user administration.
          </p>
        </div>

        <button
          type="button"
          onClick={fetchTenants}
          className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white font-bold text-sm text-slate-700 hover:bg-slate-50 transition-colors flex items-center gap-2 shadow-2xs self-start cursor-pointer"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
          <span>Refresh</span>
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search organizations or packages..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-200 bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-slate-900 transition-all"
          />
        </div>
      </div>

      {/* Tenants Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
            <p className="font-semibold text-sm">Loading tenants directory...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center text-slate-400">
            <Building2 className="w-8 h-8 mx-auto mb-2 text-slate-300" />
            <p className="font-bold text-slate-700">No organizations found</p>
          </div>
        ) : (
          filtered.map((lic) => {
            const tenant = lic.tenant;
            if (!tenant) return null;

            return (
              <div
                key={lic.id}
                className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between space-y-4"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-emerald-50 border border-emerald-100 text-emerald-700 font-black text-sm flex items-center justify-center shrink-0">
                        {tenant.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <h3 className="font-bold text-slate-900 text-base leading-tight truncate max-w-[180px]">
                          {tenant.name}
                        </h3>
                        <span className="text-xs text-slate-400 font-mono">ID: #{tenant.id}</span>
                      </div>
                    </div>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold uppercase border ${
                        tenant.status === 'active'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {tenant.status}
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-slate-50/70 border border-slate-100 space-y-1.5 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">Package:</span>
                      <strong className="text-slate-900 font-bold">{lic.package?.name || 'Standard'}</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400">License:</span>
                      <span className="font-mono text-[11px] text-slate-700">{lic.license_key}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2 flex-wrap">
                  <div className="flex items-center gap-3">
                    <Link
                      href={`/super-admin/licenses`}
                      className="text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors"
                    >
                      License
                    </Link>
                    <Link
                      href={`/super-admin/tenants/${tenant.id}/data`}
                      className="text-xs font-bold text-amber-600 hover:text-amber-800 transition-colors flex items-center gap-1"
                    >
                      <Database className="w-3 h-3" />
                      <span>Data</span>
                    </Link>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setSupportTenant({ id: tenant.id, name: tenant.name })}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-amber-50 text-amber-800 hover:bg-amber-100 border border-amber-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02]"
                      title="Start time-bounded Support Mode session"
                    >
                      <Headset className="w-3.5 h-3.5 text-amber-700" />
                      <span>Support</span>
                    </button>

                    <Link
                      href={`/super-admin/tenants/${tenant.id}/users`}
                      className="px-3 py-2 rounded-xl text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 transition-all flex items-center gap-1.5 cursor-pointer shadow-2xs hover:scale-[1.02]"
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Users</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Start Support Session Modal */}
      {supportTenant && (
        <StartSupportModal
          isOpen={!!supportTenant}
          onClose={() => setSupportTenant(null)}
          tenantId={supportTenant.id}
          tenantName={supportTenant.name}
        />
      )}
    </div>
  );
}
