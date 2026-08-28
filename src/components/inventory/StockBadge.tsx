'use client';

import React from 'react';
import { AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';

interface StockBadgeProps {
  status?: 'normal' | 'low_stock' | 'out_of_stock';
  stockQuantity: number;
  alertQuantity: number;
}

export default function StockBadge({ status, stockQuantity, alertQuantity }: StockBadgeProps) {
  let computedStatus = status;

  if (!computedStatus) {
    if (stockQuantity <= 0) {
      computedStatus = 'out_of_stock';
    } else if (stockQuantity <= alertQuantity) {
      computedStatus = 'low_stock';
    } else {
      computedStatus = 'normal';
    }
  }

  switch (computedStatus) {
    case 'out_of_stock':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
          <XCircle className="w-3.5 h-3.5 text-rose-600" /> Out of Stock
        </span>
      );
    case 'low_stock':
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 animate-pulse">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Low Stock
        </span>
      );
    case 'normal':
    default:
      return (
        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-[#16A34A]" /> Normal
        </span>
      );
  }
}
