'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldAlert,
  Clock,
  LogOut,
  Sparkles,
  AlertTriangle,
  User,
  Building2,
  Info,
} from 'lucide-react';
import { supportSessionService } from '@/lib/supportSessionService';
import { ActiveSupportContext } from '@/types/supportSession';

export default function SupportModeBanner() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [context, setContext] = useState<ActiveSupportContext | null>(null);
  const [timeLeft, setTimeLeft] = useState<string>('');
  const [isEnding, setIsEnding] = useState<boolean>(false);
  const [isWarningNear, setIsWarningNear] = useState<boolean>(false);

  useEffect(() => {
    setMounted(true);
    // Check initial support mode status
    const ctx = supportSessionService.getActiveSupportContext();
    setContext(ctx);

    if (!ctx) return;

    const updateTimer = () => {
      const now = Date.now();
      const expires = new Date(ctx.expiresAt).getTime();
      const diff = expires - now;

      if (diff <= 0) {
        setTimeLeft('Session Expired');
        supportSessionService.clearActiveSupportContext();
        window.location.href = '/super-admin/tenants';
        return;
      }

      // Warning when less than 5 minutes remain
      if (diff < 5 * 60 * 1000) {
        setIsWarningNear(true);
      } else {
        setIsWarningNear(false);
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (hours > 0) {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      } else {
        setTimeLeft(`${minutes}m ${seconds}s`);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, []);

  if (!mounted || !context) return null;

  const handleExitSupport = async () => {
    try {
      setIsEnding(true);
      await supportSessionService.endSession(context.sessionId, 'Manual exit by Super Admin');
    } catch (err) {
      console.error('Error ending support session via API:', err);
    } finally {
      supportSessionService.clearActiveSupportContext();
      window.location.href = '/super-admin/tenants';
    }
  };

  return (
    <div className="sticky top-0 z-50 w-full bg-gradient-to-r from-amber-600 via-orange-600 to-amber-700 text-white shadow-lg border-b border-amber-500/50 backdrop-blur-md px-4 py-2.5 sm:px-6">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Left: Prominent Headline */}
        <div className="flex items-center gap-2.5 text-center sm:text-left flex-wrap justify-center sm:justify-start">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-black/20 border border-white/20 font-black text-xs uppercase tracking-wider text-amber-200">
            <ShieldAlert className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Support Mode</span>
          </div>

          <div className="text-xs sm:text-sm font-semibold flex items-center gap-1.5 flex-wrap justify-center">
            <span>You are accessing</span>
            <span className="font-extrabold text-white underline decoration-amber-300 decoration-2 underline-offset-2">
              {context.tenantName}
            </span>
            <span>as Support</span>
            <span className="text-white/80 font-normal text-xs">
              ({context.userName} &bull; {context.userRole.toUpperCase()})
            </span>
          </div>
        </div>

        {/* Right: Countdown Timer & Exit Action */}
        <div className="flex items-center gap-3 shrink-0 flex-wrap justify-center">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold border transition-colors ${
              isWarningNear
                ? 'bg-rose-950/60 border-rose-400 text-rose-200 animate-pulse'
                : 'bg-black/25 border-white/20 text-white'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-amber-300" />
            <span>{timeLeft}</span>
          </div>

          <button
            type="button"
            onClick={handleExitSupport}
            disabled={isEnding}
            className="px-3.5 py-1.5 rounded-xl bg-white text-amber-900 hover:bg-amber-50 font-extrabold text-xs shadow-md hover:shadow-lg transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            {isEnding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-amber-900 border-t-transparent rounded-full animate-spin" />
                <span>Exiting...</span>
              </>
            ) : (
              <>
                <LogOut className="w-3.5 h-3.5" />
                <span>Exit Support Mode</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
