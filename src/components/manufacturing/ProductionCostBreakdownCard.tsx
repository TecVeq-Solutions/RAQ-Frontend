'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { ProductionCostBreakdown } from '@/types/manufacturing';
import {
  PieChart,
  DollarSign,
  Layers,
  Scissors,
  Users,
  Zap,
  PackageCheck,
  Building,
  Loader2,
  AlertCircle,
  TrendingUp,
  Percent,
  CheckCircle2,
  RefreshCw,
} from 'lucide-react';

interface ProductionCostBreakdownCardProps {
  orderId: number;
  onRefresh?: () => void;
}

export default function ProductionCostBreakdownCard({ orderId, onRefresh }: ProductionCostBreakdownCardProps) {
  const [breakdown, setBreakdown] = useState<ProductionCostBreakdown | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<string | null>(null);

  const fetchBreakdown = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await apiClient.get(`/production-orders/${orderId}/cost-breakdown`);
      if (res.data?.success) {
        setBreakdown(res.data.data);
      }
    } catch (err: any) {
      console.error('Failed to load cost breakdown', err);
      setError(err.response?.data?.message || 'Failed to fetch production cost breakdown.');
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    fetchBreakdown();
  }, [fetchBreakdown]);

  const formatCurrency = (val: number | string | undefined) => {
    const num = typeof val === 'number' ? val : parseFloat(String(val || 0));
    return `Rs. ${num.toLocaleString('en-PK', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center rounded-2xl border border-slate-200 bg-white p-8 shadow-xs dark:border-slate-800 dark:bg-slate-900">
        <Loader2 className="h-6 w-6 animate-spin text-emerald-600" />
        <span className="ml-2.5 text-xs font-semibold text-slate-500">
          Calculating manufacturing cost breakdown...
        </span>
      </div>
    );
  }

  if (error || !breakdown) {
    return (
      <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 dark:border-rose-900/60 dark:bg-rose-950/30 dark:text-rose-300">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error || 'Unable to load cost breakdown.'}</span>
        </div>
        <button
          onClick={fetchBreakdown}
          className="inline-flex items-center gap-1 rounded-lg border border-rose-300 bg-white px-2.5 py-1 text-xs font-bold text-rose-700 hover:bg-rose-50 dark:border-rose-800 dark:bg-slate-900 dark:text-rose-300"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry</span>
        </button>
      </div>
    );
  }

  const totalCost = Number(breakdown.total_manufacturing_cost) || 0;
  const materialCost = Number(breakdown.material_cost_subtotal) || 0;
  const laborCost = Number(breakdown.labor_cost) || 0;
  const bindingCost = Number(breakdown.binding_cost) || 0;
  const electricityCost = Number(breakdown.electricity_cost) || 0;
  const consumablesCost = Number(breakdown.consumables_cost) || 0;
  const overheadCost = Number(breakdown.overhead_cost) || 0;
  const wastageCost = Number(breakdown.wastage_cost) || 0;

  // Slices for Donut Chart
  const slices = [
    { label: 'Raw Materials', value: materialCost, color: '#3B82F6', id: 'materials' },
    { label: 'Direct Labor', value: laborCost, color: '#0D9488', id: 'labor' },
    { label: 'Binding Contract', value: bindingCost, color: '#8B5CF6', id: 'binding' },
    { label: 'Electricity / Power', value: electricityCost, color: '#EAB308', id: 'electricity' },
    { label: 'Consumables', value: consumablesCost, color: '#06B6D4', id: 'consumables' },
    { label: 'Overhead', value: overheadCost, color: '#F43F5E', id: 'overhead' },
  ].filter((s) => s.value > 0);

  // Calculate SVG Pie/Donut paths
  let cumulativeAngle = 0;
  const radius = 60;
  const innerRadius = 40;
  const center = 75;

  const donutSegments = slices.map((slice) => {
    const fraction = totalCost > 0 ? slice.value / totalCost : 0;
    const angle = fraction * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;
    cumulativeAngle += angle;

    const x1 = center + radius * Math.sin(startAngle);
    const y1 = center - radius * Math.cos(startAngle);
    const x2 = center + radius * Math.sin(endAngle);
    const y2 = center - radius * Math.cos(endAngle);

    const ix1 = center + innerRadius * Math.sin(startAngle);
    const iy1 = center - innerRadius * Math.cos(startAngle);
    const ix2 = center + innerRadius * Math.sin(endAngle);
    const iy2 = center - innerRadius * Math.cos(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    // Full 360 case guard
    const pathData =
      fraction >= 0.999
        ? `M ${center} ${center - radius} A ${radius} ${radius} 0 1 0 ${center} ${
            center + radius
          } A ${radius} ${radius} 0 1 0 ${center} ${center - radius} M ${center} ${
            center - innerRadius
          } A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${
            center + innerRadius
          } A ${innerRadius} ${innerRadius} 0 1 1 ${center} ${center - innerRadius} Z`
        : `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2} L ${ix2} ${iy2} A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${ix1} ${iy1} Z`;

    const percent = totalCost > 0 ? ((slice.value / totalCost) * 100).toFixed(1) : '0';

    return {
      ...slice,
      pathData,
      percent,
    };
  });

  return (
    <div className="space-y-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-3 dark:border-slate-800">
        <div>
          <h4 className="flex items-center gap-2 text-sm font-bold text-slate-900 dark:text-white">
            <PieChart className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
            Manufacturing Cost Analysis & Unit Cost Breakdown
          </h4>
          <p className="text-[11px] text-slate-500 dark:text-slate-400">
            Authoritative production order costing combining raw material consumption, cutting scrap, and stage costs.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            fetchBreakdown();
            if (onRefresh) onRefresh();
          }}
          className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
          title="Recalculate Cost Breakdown"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          <span>Recalculate</span>
        </button>
      </div>

      {/* KPI Top Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 dark:border-emerald-900/60 dark:bg-emerald-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
            Total Production Cost
          </span>
          <p className="mt-1 text-sm font-extrabold text-emerald-700 dark:text-emerald-300">
            {formatCurrency(totalCost)}
          </p>
          <span className="text-[10px] text-emerald-600/80 dark:text-emerald-400">
            Material + Stage Overheads
          </span>
        </div>

        <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-3 dark:border-blue-900/60 dark:bg-blue-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-blue-800 dark:text-blue-300">
            Unit Manufacturing Cost
          </span>
          <p className="mt-1 text-sm font-extrabold text-blue-700 dark:text-blue-300">
            {formatCurrency(breakdown.unit_manufacturing_cost)}
          </p>
          <span className="text-[10px] text-blue-600/80 dark:text-blue-400">
            Per {breakdown.finished_product?.unit_name || 'Register'} ({breakdown.effective_quantity} Units)
          </span>
        </div>

        <div className="rounded-xl border border-indigo-200 bg-indigo-50/50 p-3 dark:border-indigo-900/60 dark:bg-indigo-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-800 dark:text-indigo-300">
            Raw Material Subtotal
          </span>
          <p className="mt-1 text-sm font-extrabold text-indigo-700 dark:text-indigo-300">
            {formatCurrency(materialCost)}
          </p>
          <span className="text-[10px] text-indigo-600/80 dark:text-indigo-400">
            {totalCost > 0 ? ((materialCost / totalCost) * 100).toFixed(1) : 0}% of Total Cost
          </span>
        </div>

        <div className="rounded-xl border border-purple-200 bg-purple-50/50 p-3 dark:border-purple-900/60 dark:bg-purple-950/20">
          <span className="text-[10px] font-bold uppercase tracking-wider text-purple-800 dark:text-purple-300">
            Labor & Binding Subtotal
          </span>
          <p className="mt-1 text-sm font-extrabold text-purple-700 dark:text-purple-300">
            {formatCurrency(breakdown.labor_and_binding_subtotal)}
          </p>
          <span className="text-[10px] text-purple-600/80 dark:text-purple-400">
            Direct Wages & Contracts
          </span>
        </div>
      </div>

      {/* Visual Donut Chart + Proportions */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center rounded-2xl bg-slate-50/70 p-4 dark:bg-slate-800/40 border border-slate-200/80 dark:border-slate-800">
        {/* SVG Donut */}
        <div className="md:col-span-5 flex flex-col items-center justify-center relative">
          <svg width="150" height="150" viewBox="0 0 150 150" className="drop-shadow-xs">
            {donutSegments.length === 0 ? (
              <circle cx="75" cy="75" r="50" fill="none" stroke="#CBD5E1" strokeWidth="20" />
            ) : (
              donutSegments.map((segment) => (
                <path
                  key={segment.id}
                  d={segment.pathData}
                  fill={segment.color}
                  className="transition-transform duration-200 cursor-pointer hover:opacity-90"
                  onMouseEnter={() => setHoveredSlice(segment.id)}
                  onMouseLeave={() => setHoveredSlice(null)}
                />
              ))
            )}
          </svg>
          <div className="absolute flex flex-col items-center justify-center pointer-events-none text-center">
            <span className="text-[10px] font-bold text-slate-400 uppercase">Cost/Unit</span>
            <span className="text-xs font-black text-slate-900 dark:text-white">
              {formatCurrency(breakdown.unit_manufacturing_cost)}
            </span>
          </div>
        </div>

        {/* Legend Breakdown */}
        <div className="md:col-span-7 space-y-2">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block mb-2">
            Cost Proportions & Categories
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {donutSegments.map((seg) => (
              <div
                key={seg.id}
                className={`flex items-center justify-between p-2 rounded-xl border transition-all ${
                  hoveredSlice === seg.id
                    ? 'border-slate-400 bg-white shadow-xs dark:bg-slate-800'
                    : 'border-slate-200/70 bg-white/70 dark:border-slate-700/60 dark:bg-slate-800/40'
                }`}
                onMouseEnter={() => setHoveredSlice(seg.id)}
                onMouseLeave={() => setHoveredSlice(null)}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="h-3 w-3 rounded-md shrink-0"
                    style={{ backgroundColor: seg.color }}
                  />
                  <span className="font-semibold text-slate-800 dark:text-slate-200 truncate">
                    {seg.label}
                  </span>
                </div>
                <div className="text-right shrink-0 pl-2">
                  <span className="font-bold text-slate-900 dark:text-white">
                    {seg.percent}%
                  </span>
                </div>
              </div>
            ))}
          </div>

          {wastageCost > 0 && (
            <div className="mt-2 rounded-xl bg-amber-50 p-2.5 text-[11px] text-amber-800 border border-amber-200 dark:bg-amber-950/30 dark:text-amber-300 dark:border-amber-800/60 flex items-center justify-between">
              <span className="font-semibold flex items-center gap-1">
                <Scissors className="h-3.5 w-3.5 text-amber-600" />
                Cutting Stage Scrap Loss:
              </span>
              <span className="font-bold">{formatCurrency(wastageCost)}</span>
            </div>
          )}
        </div>
      </div>

      {/* Comprehensive Cost Breakdown Table */}
      <div className="overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
        <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
          <thead className="bg-slate-50 text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:bg-slate-800/80">
            <tr>
              <th className="px-4 py-2.5">Cost Category / Element</th>
              <th className="px-4 py-2.5 text-right">Quantity / Factor</th>
              <th className="px-4 py-2.5 text-right">Unit Rate</th>
              <th className="px-4 py-2.5 text-right">Cost Subtotal</th>
              <th className="px-4 py-2.5 text-right">% of Total</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
            {/* Raw Materials Section */}
            <tr className="bg-slate-100/50 font-bold text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <td colSpan={5} className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-blue-800 dark:text-blue-300">
                1. Direct Raw Materials & Substrates
              </td>
            </tr>
            {breakdown.materials_breakdown?.map((mat, idx) => {
              const pct = totalCost > 0 ? ((mat.subtotal / totalCost) * 100).toFixed(1) : '0';
              return (
                <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                  <td className="px-4 py-2 pl-6">
                    <span className="font-semibold text-slate-900 dark:text-white">{mat.name}</span>
                    <span className="ml-1 text-[10px] text-slate-400 font-mono">({mat.sku})</span>
                  </td>
                  <td className="px-4 py-2 text-right">
                    {mat.quantity} {mat.unit_name}
                  </td>
                  <td className="px-4 py-2 text-right text-slate-500">
                    {formatCurrency(mat.unit_purchase_price)}
                  </td>
                  <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                    {formatCurrency(mat.subtotal)}
                  </td>
                  <td className="px-4 py-2 text-right font-semibold text-blue-600 dark:text-blue-400">
                    {pct}%
                  </td>
                </tr>
              );
            })}

            {/* Stage Costs Section */}
            <tr className="bg-slate-100/50 font-bold text-slate-800 dark:bg-slate-800/50 dark:text-slate-200">
              <td colSpan={5} className="px-4 py-1.5 text-[11px] uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                2. Direct Labor, Binding & Stage Overheads
              </td>
            </tr>
            {breakdown.stage_costs_breakdown?.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-4 py-2 pl-6 text-slate-400 italic">
                  No stage costs recorded.
                </td>
              </tr>
            ) : (
              breakdown.stage_costs_breakdown?.map((sc, idx) => {
                const amt = Number(sc.amount) || 0;
                const pct = totalCost > 0 ? ((amt / totalCost) * 100).toFixed(1) : '0';
                return (
                  <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="px-4 py-2 pl-6">
                      <span className="font-semibold capitalize text-slate-900 dark:text-white">
                        {sc.cost_type.replace('_', ' ')}
                      </span>
                      <span className="ml-2 text-[10px] text-slate-400 capitalize">
                        ({sc.stage_name} stage{sc.vendor_or_worker_name ? ` — ${sc.vendor_or_worker_name}` : ''})
                      </span>
                    </td>
                    <td className="px-4 py-2 text-right text-slate-400">-</td>
                    <td className="px-4 py-2 text-right text-slate-400">-</td>
                    <td className="px-4 py-2 text-right font-bold text-slate-900 dark:text-white">
                      {formatCurrency(amt)}
                    </td>
                    <td className="px-4 py-2 text-right font-semibold text-emerald-600 dark:text-emerald-400">
                      {pct}%
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
          <tfoot className="border-t-2 border-slate-300 bg-slate-50 font-bold dark:border-slate-700 dark:bg-slate-800/80">
            <tr>
              <td colSpan={3} className="px-4 py-2.5 text-right uppercase text-slate-700 dark:text-slate-300">
                Total Manufacturing Cost:
              </td>
              <td className="px-4 py-2.5 text-right font-black text-emerald-700 dark:text-emerald-300 text-sm">
                {formatCurrency(totalCost)}
              </td>
              <td className="px-4 py-2.5 text-right font-bold text-slate-700 dark:text-slate-300">
                100.0%
              </td>
            </tr>
            <tr className="bg-emerald-50/60 dark:bg-emerald-950/40 border-t border-emerald-200 dark:border-emerald-800/60">
              <td colSpan={3} className="px-4 py-2 text-right uppercase text-emerald-900 dark:text-emerald-200 font-extrabold">
                Unit Manufacturing Cost ({breakdown.effective_quantity} Units):
              </td>
              <td className="px-4 py-2 text-right font-black text-emerald-700 dark:text-emerald-300 text-sm">
                {formatCurrency(breakdown.unit_manufacturing_cost)}
              </td>
              <td className="px-4 py-2 text-right text-[10px] text-emerald-700 dark:text-emerald-300">
                per register
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
