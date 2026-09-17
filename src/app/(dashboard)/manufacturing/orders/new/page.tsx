'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import apiClient from '@/lib/api';
import { Product } from '@/types/inventory';
import { Bom, MaterialCalculationItem } from '@/types/manufacturing';
import {
  Factory,
  ArrowLeft,
  Boxes,
  Layers,
  Scale,
  Calendar,
  AlertCircle,
  CheckCircle2,
  AlertTriangle,
  PlayCircle,
  FileText,
  Loader2,
} from 'lucide-react';

export default function NewProductionOrderPage() {
  const router = useRouter();

  const [finishedProducts, setFinishedProducts] = useState<Product[]>([]);
  const [selectedProductId, setSelectedProductId] = useState<number | ''>('');
  const [activeBom, setActiveBom] = useState<Bom | null>(null);
  const [plannedQuantity, setPlannedQuantity] = useState<string>('500');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [completionDate, setCompletionDate] = useState<string>('');
  const [notes, setNotes] = useState<string>('');

  const [materials, setMaterials] = useState<MaterialCalculationItem[]>([]);
  const [loadingInitial, setLoadingInitial] = useState<boolean>(true);
  const [loadingBom, setLoadingBom] = useState<boolean>(false);
  const [calculating, setCalculating] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch finished goods
  useEffect(() => {
    const fetchFinishedGoods = async () => {
      setLoadingInitial(true);
      try {
        const res = await apiClient.get('/products', {
          params: { product_type: 'finished_good', is_active: 1 },
        });
        setFinishedProducts(res.data?.data || []);
      } catch (err) {
        console.error('Failed to load finished goods', err);
        setError('Failed to load finished goods catalog.');
      } finally {
        setLoadingInitial(false);
      }
    };
    fetchFinishedGoods();
  }, []);

  // Fetch BOM when finished product changes
  useEffect(() => {
    if (!selectedProductId) {
      setActiveBom(null);
      setMaterials([]);
      return;
    }

    const fetchBom = async () => {
      setLoadingBom(true);
      setError(null);
      try {
        const res = await apiClient.get(`/boms/for-product/${selectedProductId}`);
        if (res.data?.data) {
          const bom = res.data.data;
          setActiveBom(bom);
          // Set default planned quantity to BOM batch quantity if not customized
          if (!plannedQuantity || plannedQuantity === '500') {
            setPlannedQuantity(String(bom.batch_quantity || '500'));
          }
        } else {
          setActiveBom(null);
          setMaterials([]);
          setError('No active Bill of Materials recipe found for this product. Please create a BOM first.');
        }
      } catch (err: any) {
        console.error('Failed to fetch BOM for product', err);
        setActiveBom(null);
        setMaterials([]);
        setError(
          err.response?.data?.message ||
          'No active Bill of Materials formula configured for this finished product.'
        );
      } finally {
        setLoadingBom(false);
      }
    };

    fetchBom();
  }, [selectedProductId]);

  // Recalculate material requirements on plannedQuantity or activeBom change
  useEffect(() => {
    if (!activeBom || !plannedQuantity) {
      setMaterials([]);
      return;
    }

    const qtyNum = parseFloat(plannedQuantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setMaterials([]);
      return;
    }

    const calculate = async () => {
      setCalculating(true);
      try {
        const res = await apiClient.post('/production-orders/calculate-materials', {
          bom_id: activeBom.id,
          planned_quantity: qtyNum,
        });
        setMaterials(res.data?.data?.items || []);
      } catch (err: any) {
        console.error('Material calculation error', err);
      } finally {
        setCalculating(false);
      }
    };

    calculate();
  }, [activeBom, plannedQuantity]);

  // Check overall stock sufficiency
  const hasShortages = materials.some(
    (item) => Number(item.current_stock) < Number(item.planned_quantity)
  );

  const handleSubmit = async (targetStatus: 'draft' | 'in_progress') => {
    setError(null);

    if (!selectedProductId) {
      setError('Please select a target finished good.');
      return;
    }

    const qtyNum = parseFloat(plannedQuantity);
    if (isNaN(qtyNum) || qtyNum <= 0) {
      setError('Planned target quantity must be a positive number greater than zero.');
      return;
    }

    if (materials.length === 0) {
      setError('Cannot create production order without raw material requirements.');
      return;
    }

    if (targetStatus === 'in_progress' && hasShortages) {
      setError('Cannot start production with raw material stock shortages. Please save as draft or replenish stock.');
      return;
    }

    const payload = {
      finished_product_id: Number(selectedProductId),
      bom_id: activeBom?.id,
      planned_quantity: qtyNum,
      status: targetStatus,
      start_date: startDate || null,
      completion_date: completionDate || null,
      notes: notes.trim() || null,
      items: materials.map((m) => ({
        raw_material_product_id: m.raw_material_product_id,
        planned_quantity: m.planned_quantity,
        unit_id: m.unit_id,
        unit_cost: m.unit_cost,
      })),
    };

    setSubmitting(true);
    try {
      await apiClient.post('/production-orders', payload);
      router.push('/manufacturing/orders');
    } catch (err: any) {
      console.error('Failed to create production order', err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to create production order.');
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };


  return (
    <div className="max-w-5xl space-y-6 pb-12">
      {/* Navigation & Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/manufacturing/orders"
          className="rounded-xl border border-slate-200 p-2 text-slate-500 hover:bg-slate-100 dark:border-slate-800 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2.5">
            <Factory className="h-7 w-7 text-blue-600 dark:text-blue-400" />
            Launch Production Order
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Select target finished good, auto-scale BOM formulas, verify raw materials, and schedule the batch.
          </p>
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-3 rounded-2xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
          <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
          <div className="font-semibold">{error}</div>
        </div>
      )}

      {loadingInitial ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
          <span>Loading catalog specifications...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Form Configuration & Materials Review */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Finished Good & Target Output */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Boxes className="h-5 w-5 text-blue-600" />
                <span>1. Select Finished Good & Batch Output</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Finished Product <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={(e) => setSelectedProductId(Number(e.target.value) || '')}
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  >
                    <option value="">-- Choose Finished Good --</option>
                    {finishedProducts.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.sku})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                    Target Output Quantity <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={plannedQuantity}
                    onChange={(e) => setPlannedQuantity(e.target.value)}
                    placeholder="e.g. 500"
                    className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                  />
                </div>
              </div>

              {/* Active BOM Banner */}
              {loadingBom ? (
                <div className="flex items-center gap-2 text-xs text-slate-500 py-2">
                  <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                  <span>Fetching standard Bill of Materials formula...</span>
                </div>
              ) : activeBom ? (
                <div className="rounded-xl bg-blue-50/80 p-3.5 border border-blue-100 dark:bg-blue-950/40 dark:border-blue-900 flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    <Layers className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    <div>
                      <div className="text-xs font-bold text-blue-900 dark:text-blue-200">
                        BOM Formula: {activeBom.bom_code} — {activeBom.name}
                      </div>
                      <div className="text-xs text-blue-700 dark:text-blue-400">
                        Standard Batch: {parseFloat(String(activeBom.batch_quantity)).toLocaleString()}{' '}
                        {activeBom.unit?.short_name || 'Units'}
                      </div>
                    </div>
                  </div>
                  <span className="rounded-full bg-blue-600/10 px-2.5 py-0.5 text-xs font-bold text-blue-700 dark:text-blue-300">
                    BOM Linked
                  </span>
                </div>
              ) : null}
            </div>

            {/* Step 2: Scaled Raw Materials & Stock Availability */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                  <Scale className="h-5 w-5 text-emerald-600" />
                  <span>2. Raw Material Requirements & Stock Check</span>
                </div>
                {calculating && (
                  <span className="flex items-center gap-1.5 text-xs text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Scaling quantities...
                  </span>
                )}
              </div>

              {materials.length === 0 ? (
                <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-slate-400 dark:border-slate-800 text-xs">
                  Select a finished product with an active BOM to review scaled component requirements.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-4 py-3 font-semibold">Raw Material</th>
                        <th className="px-4 py-3 font-semibold text-right">Required (Gross)</th>
                        <th className="px-4 py-3 font-semibold text-right">In Stock</th>
                        <th className="px-4 py-3 font-semibold text-center">Sufficiency</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {materials.map((m, idx) => {
                        const isShort = Number(m.current_stock) < Number(m.planned_quantity);
                        const shortage = isShort
                          ? (Number(m.planned_quantity) - Number(m.current_stock)).toFixed(2)
                          : 0;

                        return (
                          <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="px-4 py-3">
                              <div className="font-semibold text-slate-900 dark:text-white">
                                {m.product_name}
                              </div>
                              <div className="text-xs text-slate-400">SKU: {m.sku}</div>
                            </td>
                            <td className="px-4 py-3 text-right font-bold text-slate-900 dark:text-white">
                              {m.planned_quantity} {m.unit_name}
                              {Number(m.wastage_allowance_percent) > 0 && (
                                <span className="block text-xs text-slate-400 font-normal">
                                  incl. {m.wastage_allowance_percent}% scrap
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-3 text-right font-medium text-slate-700 dark:text-slate-300">
                              {parseFloat(String(m.current_stock)).toLocaleString()} {m.unit_name}
                            </td>
                            <td className="px-4 py-3 text-center">
                              {isShort ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-rose-50 px-2 py-1 text-xs font-bold text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
                                  <AlertTriangle className="h-3 w-3" />
                                  Shortage ({shortage} {m.unit_name})
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Sufficient
                                </span>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Col: Production Schedule & Actions */}
          <div className="space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 dark:text-white text-base">
                <Calendar className="h-5 w-5 text-indigo-600" />
                <span>3. Schedule & Notes</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>




              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Target Completion Date
                </label>
                <input
                  type="date"
                  value={completionDate}
                  onChange={(e) => setCompletionDate(e.target.value)}
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                  Batch Notes / Instructions
                </label>
                <textarea
                  rows={3}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Urgent wholesale order for Apex Stationers. Quality check binding."
                  className="w-full rounded-xl border border-slate-300 bg-white px-3.5 py-2.5 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white resize-none"
                />
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-2.5">
                <button
                  type="button"
                  disabled={submitting || !selectedProductId || materials.length === 0}
                  onClick={() => handleSubmit('draft')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700/80 transition-all disabled:opacity-50"
                >
                  <FileText className="h-4 w-4" />
                  Save as Draft Order
                </button>

                <button
                  type="button"
                  disabled={submitting || !selectedProductId || materials.length === 0 || hasShortages}
                  onClick={() => handleSubmit('in_progress')}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-bold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all disabled:opacity-40"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      <span>Launching...</span>
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4" />
                      <span>Start Production Directly</span>
                    </>
                  )}
                </button>

                {hasShortages && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium text-center">
                    Direct start is disabled due to raw material shortages. Save as Draft to allocate materials.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
