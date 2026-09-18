'use client';

import React from 'react';
import { ResolvedModule, CurrentPackageInfo } from '@/types/moduleAccess';
import {
  Lock,
  Sparkles,
  ShieldAlert,
  ArrowRight,
  CheckCircle2,
  X,
  Layers,
  Zap,
} from 'lucide-react';

interface UpgradeModuleDialogProps {
  isOpen: boolean;
  onClose: () => void;
  module: ResolvedModule | null;
  currentPackage: CurrentPackageInfo | null;
  onComparePackages?: () => void;
}

export default function UpgradeModuleDialog({
  isOpen,
  onClose,
  module,
  currentPackage,
  onComparePackages,
}: UpgradeModuleDialogProps) {
  if (!isOpen || !module) return null;

  const availableIn = module.available_in || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden text-slate-900 animate-in zoom-in-95 duration-200"
        role="dialog"
        aria-modal="true"
      >
        {/* Top Decorative Gradient Header */}
        <div className="relative px-6 pt-8 pb-6 bg-gradient-to-br from-slate-900 via-slate-800 to-indigo-950 text-white">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-300 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-lg shadow-orange-500/30 flex items-center justify-center text-slate-950 font-bold">
              <Lock className="w-6 h-6 text-slate-950" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
                  Feature Locked
                </span>
                {currentPackage && (
                  <span className="text-xs font-medium text-slate-300">
                    Current: <strong className="text-white">{currentPackage.name}</strong>
                  </span>
                )}
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-1">
                {module.module_name}
              </h2>
            </div>
          </div>

          <p className="text-sm text-slate-300 leading-relaxed">
            {module.reason ||
              `The '${module.module_name}' module is not available in your current subscription tier. Upgrade your package to instantly unlock this capability.`}
          </p>
        </div>

        {/* Modal Body: Available Plans & Dynamic Pricing */}
        <div className="p-6 space-y-5">
          {availableIn.length > 0 ? (
            <div>
              <label className="text-xs font-bold uppercase tracking-wider text-slate-400 block mb-2.5">
                Available in Higher Packages
              </label>
              <div className="space-y-2.5">
                {availableIn.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="flex items-center justify-between p-3.5 rounded-2xl border border-indigo-100 bg-indigo-50/40 hover:bg-indigo-50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                        <Zap className="w-4 h-4" />
                      </div>
                      <div>
                        <h4 className="font-bold text-slate-900 text-sm">{pkg.name}</h4>
                        <p className="text-xs text-slate-500 capitalize">
                          Tier: <strong className="text-slate-700">{pkg.code}</strong> • Billing: {pkg.billing_cycle}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-extrabold text-indigo-700">
                        PKR {Number(pkg.price).toLocaleString()}
                      </span>
                      <span className="text-xs text-slate-400 block">/{pkg.billing_cycle}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-3">
              <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-xs leading-relaxed">
                <strong className="block font-bold mb-0.5">Admin Notice</strong>
                This module is currently controlled by platform administrators or unavailable in public tiers. Please contact your Super Administrator for activation.
              </div>
            </div>
          )}

          {/* Value Highlights */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" /> Why Upgrade?
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Zero data migration required</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Instant automated activation</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Multi-user collaboration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Enterprise SLA support</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl font-bold text-sm text-slate-600 hover:bg-slate-200/80 transition-colors cursor-pointer"
          >
            Dismiss
          </button>

          <div className="flex items-center gap-2">
            {onComparePackages ? (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onComparePackages();
                }}
                className="px-4 py-2.5 rounded-xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-md shadow-indigo-600/20 flex items-center gap-2 transition-all cursor-pointer"
              >
                <span>Compare Packages</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl font-bold text-sm bg-slate-900 hover:bg-slate-800 text-white transition-colors cursor-pointer"
              >
                Close
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
