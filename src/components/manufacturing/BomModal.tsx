'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Product, ProductUnit } from '@/types/inventory';
import { Bom, BomItemFormData } from '@/types/manufacturing';
import {
  X,
  Loader2,
  Factory,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  FileText,
  Layers,
  Scale,
  Percent,
} from 'lucide-react';

interface BomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  bomToEdit?: Bom | null;
  readOnly?: boolean;
}

export default function BomModal({
  isOpen,
  onClose,
  onSuccess,
  bomToEdit,
  readOnly = false,
}: BomModalProps) {
  const [finishedProductId, setFinishedProductId] = useState<number | ''>('');
  const [bomCode, setBomCode] = useState('');
  const [name, setName] = useState('');
  const [batchQuantity, setBatchQuantity] = useState<string>('1.00');
  const [unitId, setUnitId] = useState<number | ''>('');
  const [isActive, setIsActive] = useState<boolean>(true);
  const [notes, setNotes] = useState<string>('');
  const [items, setItems] = useState<BomItemFormData[]>([
    {
      raw_material_product_id: '',
      quantity: '',
      unit_id: '',
      wastage_allowance_percent: '0.00',
      notes: '',
    },
  ]);

  const [products, setProducts] = useState<Product[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch products and units
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        setLoadingData(true);
        try {
          const [prodRes, unitRes] = await Promise.all([
            apiClient.get('/products'),
            apiClient.get('/product-units'),
          ]);
          setProducts(prodRes.data?.data || []);
          setUnits(unitRes.data?.data || []);
        } catch (err) {
          console.error('Failed to load dependencies for BOM modal', err);
          setError('Failed to load products or units. Please try again.');
        } finally {
          setLoadingData(false);
        }
      };
      fetchData();
    }
  }, [isOpen]);

  // Reset or populate fields when modal opens or bomToEdit changes
  useEffect(() => {
    if (bomToEdit) {
      setFinishedProductId(bomToEdit.finished_product_id);
      setBomCode(bomToEdit.bom_code || '');
      setName(bomToEdit.name || '');
      setBatchQuantity(String(bomToEdit.batch_quantity || '1.00'));
      setUnitId(bomToEdit.unit_id);
      setIsActive(bomToEdit.is_active ?? true);
      setNotes(bomToEdit.notes || '');

      const existingItems = bomToEdit.bomItems || bomToEdit.bom_items || [];
      if (existingItems.length > 0) {
        setItems(
          existingItems.map((item) => ({
            id: item.id,
            raw_material_product_id: item.raw_material_product_id,
            quantity: String(item.quantity),
            unit_id: item.unit_id,
            wastage_allowance_percent: String(item.wastage_allowance_percent ?? '0.00'),
            notes: item.notes || '',
          }))
        );
      } else {
        setItems([
          {
            raw_material_product_id: '',
            quantity: '',
            unit_id: '',
            wastage_allowance_percent: '0.00',
            notes: '',
          },
        ]);
      }
    } else {
      setFinishedProductId('');
      setBomCode('');
      setName('');
      setBatchQuantity('1.00');
      setUnitId('');
      setIsActive(true);
      setNotes('');
      setItems([
        {
          raw_material_product_id: '',
          quantity: '',
          unit_id: '',
          wastage_allowance_percent: '0.00',
          notes: '',
        },
      ]);
    }
    setError(null);
  }, [bomToEdit, isOpen]);

  if (!isOpen) return null;

  // Filtered lists
  const finishedGoods = products.filter(
    (p) => (p.product_type === 'finished_good' || !p.product_type) && p.is_active
  );

  const rawMaterials = products.filter(
    (p) =>
      (p.product_type === 'raw_material' || p.product_type === 'consumable') &&
      p.is_active &&
      p.id !== finishedProductId
  );

  // Handle finished product change
  const handleFinishedProductChange = (prodId: number) => {
    setFinishedProductId(prodId);
    const selectedProd = products.find((p) => p.id === prodId);
    if (selectedProd) {
      if (!unitId || !bomToEdit) {
        setUnitId(selectedProd.unit_id);
      }
      if (!bomCode || !bomToEdit) {
        setBomCode(`BOM-${selectedProd.sku || selectedProd.id}`);
      }
      if (!name || !bomToEdit) {
        setName(`BOM Formula - ${selectedProd.name}`);
      }
    }
  };

  // Raw material line item handling
  const handleItemChange = (index: number, field: keyof BomItemFormData, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };

    // Auto-set unit when raw material is selected
    if (field === 'raw_material_product_id' && value) {
      const selectedMaterial = products.find((p) => p.id === Number(value));
      if (selectedMaterial && selectedMaterial.unit_id) {
        updated[index].unit_id = selectedMaterial.unit_id;
      }
    }

    setItems(updated);
  };

  const handleAddItem = () => {
    setItems([
      ...items,
      {
        raw_material_product_id: '',
        quantity: '',
        unit_id: '',
        wastage_allowance_percent: '0.00',
        notes: '',
      },
    ]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length <= 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  // Submit Handler
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (readOnly) return;

    setError(null);

    if (!finishedProductId) {
      setError('Please select a finished product.');
      return;
    }

    if (!bomCode.trim()) {
      setError('BOM Code is required (e.g. BOM-REG-200A4).');
      return;
    }

    if (!name.trim()) {
      setError('BOM Recipe Name is required.');
      return;
    }

    const batchQtyNum = parseFloat(batchQuantity);
    if (isNaN(batchQtyNum) || batchQtyNum <= 0) {
      setError('Batch quantity must be a positive number greater than zero.');
      return;
    }

    if (!unitId) {
      setError('Please select a batch unit.');
      return;
    }

    // Validate Items
    if (items.length === 0) {
      setError('A BOM must include at least one raw material or consumable.');
      return;
    }

    const formattedItems = [];
    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (!item.raw_material_product_id) {
        setError(`Row #${i + 1}: Please select a raw material or consumable.`);
        return;
      }

      if (Number(item.raw_material_product_id) === Number(finishedProductId)) {
        setError(`Row #${i + 1}: Circular reference detected. Finished good cannot be its own raw material.`);
        return;
      }

      const qtyNum = parseFloat(String(item.quantity));
      if (isNaN(qtyNum) || qtyNum <= 0) {
        setError(`Row #${i + 1}: Quantity must be greater than zero.`);
        return;
      }

      if (!item.unit_id) {
        setError(`Row #${i + 1}: Please select a unit for the raw material.`);
        return;
      }

      const wastageNum = parseFloat(String(item.wastage_allowance_percent || '0'));
      if (isNaN(wastageNum) || wastageNum < 0 || wastageNum > 100) {
        setError(`Row #${i + 1}: Wastage allowance must be between 0% and 100%.`);
        return;
      }

      formattedItems.push({
        raw_material_product_id: Number(item.raw_material_product_id),
        quantity: qtyNum,
        unit_id: Number(item.unit_id),
        wastage_allowance_percent: wastageNum,
        notes: item.notes || null,
      });
    }

    const payload = {
      finished_product_id: Number(finishedProductId),
      bom_code: bomCode.trim(),
      name: name.trim(),
      batch_quantity: batchQtyNum,
      unit_id: Number(unitId),
      is_active: isActive,
      notes: notes.trim() || null,
      items: formattedItems,
    };

    setSubmitting(true);
    try {
      if (bomToEdit) {
        await apiClient.put(`/boms/${bomToEdit.id}`, payload);
      } else {
        await apiClient.post('/boms', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('BOM submission error:', err);
      const serverMsg =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(' ')
          : 'Failed to save Bill of Materials formula.');
      setError(serverMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-900/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-4xl rounded-2xl bg-white shadow-2xl transition-all dark:bg-slate-900 border border-slate-200 dark:border-slate-800 my-8">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-4 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400">
              <Factory className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                {readOnly
                  ? 'Inspect Bill of Materials (BOM)'
                  : bomToEdit
                  ? 'Edit Bill of Materials (BOM)'
                  : 'Create Bill of Materials (BOM)'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Define standard manufacturing recipe, raw material ratios & scrap allowances
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content / Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 max-h-[78vh] overflow-y-auto">
          {error && (
            <div className="flex items-start gap-3 rounded-xl bg-rose-50 p-4 text-sm text-rose-600 dark:bg-rose-950/40 dark:text-rose-400 border border-rose-200 dark:border-rose-900">
              <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
              <div className="font-medium">{error}</div>
            </div>
          )}

          {loadingData ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-500">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mb-2" />
              <span>Loading products and units...</span>
            </div>
          ) : (
            <>
              {/* Top Configuration Card */}
              <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-4 dark:border-slate-800 dark:bg-slate-800/40 space-y-4">
                <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                  <Layers className="h-4 w-4 text-blue-500" />
                  <span>Finished Good & Batch Configuration</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Finished Good */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Finished Product <span className="text-rose-500">*</span>
                    </label>
                    <select
                      disabled={readOnly || !!bomToEdit}
                      value={finishedProductId}
                      onChange={(e) => handleFinishedProductChange(Number(e.target.value))}
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                      required
                    >
                      <option value="">-- Select Finished Product --</option>
                      {finishedGoods.map((prod) => (
                        <option key={prod.id} value={prod.id}>
                          {prod.name} ({prod.sku})
                        </option>
                      ))}
                    </select>
                    <span className="text-xs text-slate-500 dark:text-slate-400 mt-1 block">
                      Only active finished goods are eligible for BOM formulas.
                    </span>
                  </div>

                  {/* BOM Code */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      BOM Code / Formula ID <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={bomCode}
                      onChange={(e) => setBomCode(e.target.value)}
                      placeholder="e.g. BOM-REG-200A4"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                      required
                    />
                  </div>

                  {/* Formula Name */}
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Formula / Recipe Name <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Standard Recipe for 500 A4 Registers"
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                      required
                    />
                  </div>

                  {/* Batch Output Quantity & Unit */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Batch Output Qty <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        disabled={readOnly}
                        value={batchQuantity}
                        onChange={(e) => setBatchQuantity(e.target.value)}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                        Batch Unit <span className="text-rose-500">*</span>
                      </label>
                      <select
                        disabled={readOnly}
                        value={unitId}
                        onChange={(e) => setUnitId(Number(e.target.value))}
                        className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                        required
                      >
                        <option value="">-- Unit --</option>
                        {units.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.name} ({u.short_name})
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Active Toggle & Notes */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                  <div className="md:col-span-2">
                    <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
                      Formula Specifications / Notes
                    </label>
                    <input
                      type="text"
                      disabled={readOnly}
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="e.g. Requires 70 GSM paper sheets, 18-No stitching wire and grey board."
                      className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                    />
                  </div>
                  <div className="flex items-center gap-2 pt-6">
                    <input
                      type="checkbox"
                      id="is_active"
                      disabled={readOnly}
                      checked={isActive}
                      onChange={(e) => setIsActive(e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500 dark:border-slate-700"
                    />
                    <label htmlFor="is_active" className="text-sm font-medium text-slate-700 dark:text-slate-300 cursor-pointer">
                      Formula is Active
                    </label>
                  </div>
                </div>
              </div>

              {/* Dynamic Raw Materials & Consumables Table */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-slate-200 text-sm">
                    <Scale className="h-4 w-4 text-emerald-500" />
                    <span>Raw Materials, Consumables & Scrap Allowances</span>
                    <span className="ml-2 rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                      {items.length} items
                    </span>
                  </div>

                  {!readOnly && (
                    <button
                      type="button"
                      onClick={handleAddItem}
                      className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-400 dark:hover:bg-emerald-900/60 transition-colors"
                    >
                      <Plus className="h-3.5 w-3.5" />
                      Add Component
                    </button>
                  )}
                </div>

                <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-800">
                  <table className="w-full text-left text-xs text-slate-600 dark:text-slate-300">
                    <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500 dark:bg-slate-800/80 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
                      <tr>
                        <th className="px-3 py-2.5 font-semibold w-10 text-center">#</th>
                        <th className="px-3 py-2.5 font-semibold min-w-[220px]">
                          Raw Material / Consumable <span className="text-rose-500">*</span>
                        </th>
                        <th className="px-3 py-2.5 font-semibold w-32">
                          Quantity <span className="text-rose-500">*</span>
                        </th>
                        <th className="px-3 py-2.5 font-semibold w-28">
                          Unit <span className="text-rose-500">*</span>
                        </th>
                        <th className="px-3 py-2.5 font-semibold w-32">
                          Wastage / Scrap %
                        </th>
                        <th className="px-3 py-2.5 font-semibold min-w-[140px]">Notes</th>
                        {!readOnly && <th className="px-3 py-2.5 font-semibold w-12 text-center">Action</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-800 bg-white dark:bg-slate-900">
                      {items.map((item, idx) => (
                        <tr key={idx} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                          <td className="px-3 py-2.5 text-center font-medium text-slate-400">
                            {idx + 1}
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              disabled={readOnly}
                              value={item.raw_material_product_id}
                              onChange={(e) =>
                                handleItemChange(idx, 'raw_material_product_id', Number(e.target.value))
                              }
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                              required
                            >
                              <option value="">-- Select Material / Consumable --</option>
                              {rawMaterials.map((rm) => (
                                <option key={rm.id} value={rm.id}>
                                  {rm.name} ({rm.sku}) [{rm.product_type === 'consumable' ? 'Consumable' : 'Raw Material'}]
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="number"
                              step="0.0001"
                              min="0.0001"
                              disabled={readOnly}
                              value={item.quantity}
                              onChange={(e) => handleItemChange(idx, 'quantity', e.target.value)}
                              placeholder="Qty"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                              required
                            />
                          </td>
                          <td className="px-3 py-2.5">
                            <select
                              disabled={readOnly}
                              value={item.unit_id}
                              onChange={(e) => handleItemChange(idx, 'unit_id', Number(e.target.value))}
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                              required
                            >
                              <option value="">-- Unit --</option>
                              {units.map((u) => (
                                <option key={u.id} value={u.id}>
                                  {u.short_name}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 py-2.5">
                            <div className="relative">
                              <input
                                type="number"
                                step="0.1"
                                min="0"
                                max="100"
                                disabled={readOnly}
                                value={item.wastage_allowance_percent}
                                onChange={(e) =>
                                  handleItemChange(idx, 'wastage_allowance_percent', e.target.value)
                                }
                                placeholder="0.00"
                                className="w-full rounded-lg border border-slate-300 bg-white pr-6 pl-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                              />
                              <span className="absolute right-2 top-1.5 text-slate-400 text-xs font-bold">
                                %
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5">
                            <input
                              type="text"
                              disabled={readOnly}
                              value={item.notes || ''}
                              onChange={(e) => handleItemChange(idx, 'notes', e.target.value)}
                              placeholder="e.g. 2% trim loss"
                              className="w-full rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs text-slate-900 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-slate-700 dark:bg-slate-800 dark:text-white disabled:opacity-60"
                            />
                          </td>
                          {!readOnly && (
                            <td className="px-3 py-2.5 text-center">
                              <button
                                type="button"
                                disabled={items.length <= 1}
                                onClick={() => handleRemoveItem(idx)}
                                className="rounded p-1 text-slate-400 hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/40 dark:hover:text-rose-400 disabled:opacity-30 transition-colors"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-200 pt-4 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              {readOnly ? 'Close' : 'Cancel'}
            </button>
            {!readOnly && (
              <button
                type="submit"
                disabled={submitting || loadingData}
                className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 transition-all"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span>Saving Formula...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    <span>{bomToEdit ? 'Update BOM Recipe' : 'Save BOM Recipe'}</span>
                  </>
                )}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
