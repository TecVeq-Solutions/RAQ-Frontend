'use client';

import React from 'react';
import { ProductionOrderStatus, ProductionOrderStage } from '@/types/manufacturing';
import {
  Clock,
  PlayCircle,
  CheckCircle2,
  XCircle,
  Scissors,
  BookOpen,
  Sparkles,
  ClipboardList,
} from 'lucide-react';

interface ProductionStatusBadgeProps {
  status?: ProductionOrderStatus;
  stage?: ProductionOrderStage;
  type?: 'status' | 'stage';
  size?: 'sm' | 'md';
}

export default function ProductionStatusBadge({
  status,
  stage,
  type = 'status',
  size = 'sm',
}: ProductionStatusBadgeProps) {
  const sizeClasses = size === 'sm' ? 'px-2.5 py-0.5 text-xs' : 'px-3 py-1 text-sm';

  if (type === 'stage' && stage) {
    switch (stage) {
      case 'planning':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${sizeClasses}`}
          >
            <ClipboardList className="h-3.5 w-3.5" />
            Planning
          </span>
        );
      case 'cutting':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800 ${sizeClasses}`}
          >
            <Scissors className="h-3.5 w-3.5" />
            Cutting Stage
          </span>
        );
      case 'binding':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/50 dark:text-indigo-300 dark:border-indigo-800 ${sizeClasses}`}
          >
            <BookOpen className="h-3.5 w-3.5" />
            Binding Stage
          </span>
        );
      case 'finishing':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/50 dark:text-purple-300 dark:border-purple-800 ${sizeClasses}`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            Finishing Stage
          </span>
        );
      case 'completed':
        return (
          <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium bg-emerald-50 text-emerald-700 border border-emerald-200/60 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800 ${sizeClasses}`}
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            Production Done
          </span>
        );
      default:
        return (
          <span className={`inline-flex items-center rounded-full font-medium bg-slate-100 text-slate-600 ${sizeClasses}`}>
            {stage}
          </span>
        );
    }
  }

  // Status Badge
  switch (status) {
    case 'draft':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 ${sizeClasses}`}
        >
          <Clock className="h-3.5 w-3.5 text-slate-500" />
          Draft
        </span>
      );
    case 'in_progress':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-900 ${sizeClasses}`}
        >
          <PlayCircle className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400 animate-pulse" />
          In Production
        </span>
      );
    case 'completed':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-900 ${sizeClasses}`}
        >
          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
          Completed
        </span>
      );
    case 'cancelled':
      return (
        <span
          className={`inline-flex items-center gap-1.5 rounded-full font-semibold bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-900 ${sizeClasses}`}
        >
          <XCircle className="h-3.5 w-3.5 text-rose-600 dark:text-rose-400" />
          Cancelled
        </span>
      );
    default:
      return (
        <span className={`inline-flex items-center rounded-full font-semibold bg-slate-100 text-slate-600 ${sizeClasses}`}>
          {status || 'Unknown'}
        </span>
      );
  }
}
