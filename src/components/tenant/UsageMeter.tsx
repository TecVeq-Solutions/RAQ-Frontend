'use client';

import React from 'react';
import { Infinity as InfinityIcon, AlertTriangle, AlertCircle, CheckCircle2 } from 'lucide-react';

interface UsageMeterProps {
    label: string;
    current: number;
    max: number;
    unit?: string;
    icon?: React.ReactNode;
    className?: string;
}

export const UsageMeter: React.FC<UsageMeterProps> = ({
    label,
    current,
    max,
    unit = '',
    icon,
    className = '',
}) => {
    const isUnlimited = max === -1 || max === undefined;

    let percentage = 0;
    if (!isUnlimited) {
        if (max <= 0) {
            percentage = 100;
        } else {
            percentage = Math.min(100, Math.round((current / max) * 100));
        }
    }

    // State determination
    let state: 'normal' | 'warning' | 'limit_reached' | 'unlimited' = 'normal';
    if (isUnlimited) {
        state = 'unlimited';
    } else if (percentage >= 100 || current >= max) {
        state = 'limit_reached';
    } else if (percentage >= 80) {
        state = 'warning';
    }

    // Progress bar and badge styling based on state
    const getTheme = () => {
        switch (state) {
            case 'unlimited':
                return {
                    barBg: 'bg-emerald-500',
                    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
                    border: 'border-slate-200',
                    text: 'text-emerald-600',
                };
            case 'limit_reached':
                return {
                    barBg: 'bg-rose-500',
                    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
                    border: 'border-rose-200',
                    text: 'text-rose-600',
                };
            case 'warning':
                return {
                    barBg: 'bg-amber-500',
                    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
                    border: 'border-amber-200',
                    text: 'text-amber-600',
                };
            case 'normal':
            default:
                return {
                    barBg: 'bg-indigo-600',
                    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
                    border: 'border-slate-200',
                    text: 'text-indigo-600',
                };
        }
    };

    const theme = getTheme();

    return (
        <div className={`p-4 rounded-xl border bg-white shadow-2xs transition-all ${theme.border} ${className}`}>
            <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2 min-w-0">
                    {icon && <div className="text-slate-400 shrink-0">{icon}</div>}
                    <span className="text-xs font-bold text-slate-700 truncate">{label}</span>
                </div>

                {isUnlimited ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <InfinityIcon className="w-3 h-3" /> Unlimited
                    </span>
                ) : (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold border ${theme.badgeBg}`}>
                        {state === 'limit_reached' && <AlertCircle className="w-3 h-3" />}
                        {state === 'warning' && <AlertTriangle className="w-3 h-3" />}
                        {state === 'normal' && <CheckCircle2 className="w-3 h-3" />}
                        {percentage}%
                    </span>
                )}
            </div>

            {/* Current vs Max Numbers */}
            <div className="flex items-baseline justify-between text-xs mb-2">
                <span className="font-bold text-slate-900 text-sm">
                    {current.toLocaleString()} {unit}
                </span>
                <span className="text-slate-500 text-[11px]">
                    {isUnlimited ? 'No quota limit' : `of ${max.toLocaleString()} ${unit} max`}
                </span>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-2 rounded-full bg-slate-100 overflow-hidden">
                <div
                    className={`h-full rounded-full transition-all duration-500 ${theme.barBg}`}
                    style={{ width: isUnlimited ? '100%' : `${percentage}%` }}
                />
            </div>
        </div>
    );
};
