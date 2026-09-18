'use client';

import React, { useState } from 'react';
import { useModuleAccess } from '@/hooks/useModuleAccess';
import UpgradeModuleDialog from './UpgradeModuleDialog';
import { Lock, Sparkles, ShieldAlert, ArrowUpRight } from 'lucide-react';

interface ModuleGuardProps {
  module: string;
  children: React.ReactNode;
  fallback?: React.ReactNode;
  loadingFallback?: React.ReactNode;
  showLockCard?: boolean;
}

export default function ModuleGuard({
  module,
  children,
  fallback,
  loadingFallback,
  showLockCard = true,
}: ModuleGuardProps) {
  const { hasAccess, getModule, currentPackage, loading } = useModuleAccess();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  if (loading) {
    if (loadingFallback) {
      return <>{loadingFallback}</>;
    }
    return (
      <div className="w-full p-8 flex flex-col items-center justify-center animate-pulse">
        <div className="w-12 h-12 bg-slate-200 rounded-2xl mb-4"></div>
        <div className="h-4 bg-slate-200 rounded w-48 mb-2"></div>
        <div className="h-3 bg-slate-100 rounded w-64"></div>
      </div>
    );
  }

  const isAllowed = hasAccess(module);
  const resolved = getModule(module);

  if (isAllowed) {
    return <>{children}</>;
  }

  if (fallback) {
    return <>{fallback}</>;
  }

  if (!showLockCard) {
    return null;
  }

  return (
    <>
      <div className="w-full max-w-2xl mx-auto my-8 p-8 rounded-3xl bg-white border border-slate-200 shadow-xl text-center space-y-6 animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-gradient-to-br from-amber-400 to-orange-500 p-0.5 shadow-xl shadow-orange-500/20 flex items-center justify-center text-slate-950 font-bold">
          <Lock className="w-8 h-8 text-slate-950" />
        </div>

        <div className="space-y-2">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-bold border border-amber-200">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <span>Premium Module</span>
          </div>

          <h3 className="text-2xl font-black text-slate-900 tracking-tight">
            {resolved?.module_name || module.toUpperCase()} is Locked
          </h3>

          <p className="text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
            {resolved?.reason ||
              'This module is not included in your organization’s current subscription plan. Upgrade your subscription to gain instant access.'}
          </p>
        </div>

        {resolved?.available_in && resolved.available_in.length > 0 && (
          <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 max-w-md mx-auto text-left">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 block mb-1.5">
              Available in Plans:
            </span>
            <div className="flex flex-wrap gap-2">
              {resolved.available_in.map((pkg) => (
                <span
                  key={pkg.id}
                  className="px-2.5 py-1 rounded-lg bg-white border border-indigo-200 font-bold text-xs text-indigo-950 shadow-2xs"
                >
                  {pkg.name}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2 flex items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setShowUpgradeModal(true)}
            className="px-6 py-3 rounded-2xl font-bold text-sm bg-gradient-to-r from-indigo-600 to-indigo-700 hover:from-indigo-700 hover:to-indigo-800 text-white shadow-lg shadow-indigo-600/25 flex items-center gap-2 transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>Unlock this Module</span>
            <ArrowUpRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <UpgradeModuleDialog
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal}
        module={resolved}
        currentPackage={currentPackage}
      />
    </>
  );
}
