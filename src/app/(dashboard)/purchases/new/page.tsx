'use client';

import React, { useEffect, useState, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import apiClient from '@/lib/api';
import {
  ArrowLeft,
  CheckCircle2,
  Plus,
  Trash2,
  Receipt,
  Truck,
  Layers,
  AlertCircle,
  Loader2,
  Building2,
  Calendar,
  FileText,
  DollarSign,
  TrendingUp,
  PackageCheck
} from 'lucide-react';

interface Supplier {
  id: number;
  name: string;
  contact_person?: string;
  phone?: string;
  current_balance: number;
  is_active: boolean;
}

interface ProductUnit {
  id: number;
  name: string;
  short_name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  unit?: ProductUnit;
  secondary_unit_id?: number | null;
  secondary_unit?: ProductUnit;
  conversion_ratio?: number | null;
}

interface PurchaseItemRow {
  product_id: number | '';
  quantity: number;
  purchase_rate: number;
  unit_id: number | '';
  is_secondary_unit: boolean;
}

export default function NewPurchasePage() {
  const router = useRouter();

  // Reference data
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [supplierId, setSupplierId] = useState<number | ''>('');
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [purchaseNo, setPurchaseNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Dynamic Line Items
  const [items, setItems] = useState<PurchaseItemRow[]>([
    { product_id: '', quantity: 1, purchase_rate: 0, unit_id: '', is_secondary_unit: false },
  ]);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Load suppliers and products on mount
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [supRes, prodRes] = await Promise.all([
          apiClient.get('/suppliers', { params: { is_active: true } }),
          apiClient.get('/products', { params: { is_active: true } }),
        ]);

        if (supRes.data?.data) {
          setSuppliers(supRes.data.data);
        }
        if (prodRes.data?.data) {
          setProducts(prodRes.data.data);
        }
      } catch (err: any) {
        console.error('Failed to load initial purchase data', err);
        setErrorMsg('Failed to load active suppliers and products from the server.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Selected Supplier helper
  const selectedSupplier = useMemo(() => {
    return suppliers.find((s) => s.id === Number(supplierId));
  }, [suppliers, supplierId]);

  // Product map for quick lookup
  const productMap = useMemo(() => {
    const map = new Map<number, Product>();
    products.forEach((p) => map.set(p.id, p));
    return map;
  }, [products]);

  // Calculations
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => {
      const line = (Number(item.quantity) || 0) * (Number(item.purchase_rate) || 0);
      return sum + line;
    }, 0);
  }, [items]);

  const grandTotal = useMemo(() => {
    const total = subtotal - (Number(discount) || 0) + (Number(tax) || 0);
    return Math.max(0, total);
  }, [subtotal, discount, tax]);

  const totalItemCount = useMemo(() => {
    return items.filter((i) => i.product_id !== '').length;
  }, [items]);

  // Line item change handlers
  const handleProductChange = (index: number, pId: number | '') => {
    setItems((prev) => {
      const updated = [...prev];
      if (pId === '') {
        updated[index] = {
          product_id: '',
          quantity: 1,
          purchase_rate: 0,
          unit_id: '',
          is_secondary_unit: false,
        };
      } else {
        const prod = productMap.get(Number(pId));
        updated[index] = {
          product_id: Number(pId),
          quantity: updated[index].quantity > 0 ? updated[index].quantity : 1,
          purchase_rate: prod?.purchase_price ? Number(prod.purchase_price) : 0,
          unit_id: prod?.unit?.id || '',
          is_secondary_unit: false,
        };
      }
      return updated;
    });
  };

  const handleUnitChange = (index: number, isSecondary: boolean) => {
    setItems((prev) => {
      const updated = [...prev];
      const prod = productMap.get(Number(updated[index].product_id));
      updated[index].is_secondary_unit = isSecondary;
      if (isSecondary && prod?.secondary_unit_id) {
        updated[index].unit_id = prod.secondary_unit_id;
      } else if (prod?.unit?.id) {
        updated[index].unit_id = prod.unit.id;
      }
      return updated;
    });
  };

  const handleQuantityChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].quantity = val;
      return updated;
    });
  };

  const handleRateChange = (index: number, val: number) => {
    setItems((prev) => {
      const updated = [...prev];
      updated[index].purchase_rate = val;
      return updated;
    });
  };

  const addItemRow = () => {
    setItems((prev) => [
      ...prev,
      { product_id: '', quantity: 1, purchase_rate: 0, unit_id: '', is_secondary_unit: false },
    ]);
  };

  const removeItemRow = (index: number) => {
    if (items.length <= 1) return;
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    // Validation
    if (!supplierId) {
      setErrorMsg('Please select a supplier from the list.');
      return;
    }

    const validItems = items.filter((i) => i.product_id !== '');
    if (validItems.length === 0) {
      setErrorMsg('Please add at least one product to the purchase bill.');
      return;
    }

    for (let idx = 0; idx < validItems.length; idx++) {
      const itm = validItems[idx];
      if (!itm.quantity || itm.quantity <= 0) {
        setErrorMsg(`Item #${idx + 1}: Quantity must be greater than zero.`);
        return;
      }
      if (itm.purchase_rate < 0) {
        setErrorMsg(`Item #${idx + 1}: Purchase rate cannot be negative.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        supplier_id: Number(supplierId),
        purchase_date: purchaseDate,
        purchase_no: purchaseNo.trim() || undefined,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        notes: notes.trim() || undefined,
        items: validItems.map((itm) => ({
          product_id: Number(itm.product_id),
          quantity: Number(itm.quantity),
          purchase_rate: Number(itm.purchase_rate),
          unit_id: itm.unit_id ? Number(itm.unit_id) : undefined,
          is_secondary_unit: itm.is_secondary_unit,
        })),
      };

      const res = await apiClient.post('/purchases', payload);

      if (res.data?.success) {
        setSuccessMsg(
          `Purchase Order #${res.data.data?.purchase_no || ''} recorded successfully! Inventory stock auto-incremented and supplier ledger updated.`
        );
        setTimeout(() => {
          router.push('/purchases');
        }, 1200);
      }
    } catch (err: any) {
      console.error('Failed to create purchase order', err);
      const backendErr =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to record purchase order. Please check inputs and try again.');
      setErrorMsg(backendErr);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <Loader2 className="w-8 h-8 animate-spin text-[#16A34A]" />
        <p className="text-sm font-medium text-slate-500">Loading suppliers & inventory catalog...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fadeIn max-w-5xl pb-16">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/purchases"
            className="p-2.5 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 transition-colors shadow-xs"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#0F172A]">New Purchase Requisition & Bill</h1>
            <p className="text-sm text-slate-500">
              Procure stock from supplier with atomic inventory increase and ledger credit
            </p>
          </div>
        </div>
      </div>

      {/* Alert Banners */}
      {errorMsg && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-red-700 text-sm flex items-start gap-3 shadow-xs">
          <AlertCircle className="w-5 h-5 shrink-0 text-red-600 mt-0.5" />
          <div>
            <div className="font-bold">Submission Error</div>
            <div>{errorMsg}</div>
          </div>
        </div>
      )}

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm flex items-start gap-3 shadow-xs">
          <CheckCircle2 className="w-5 h-5 shrink-0 text-emerald-600 mt-0.5" />
          <div>
            <div className="font-bold">Success!</div>
            <div>{successMsg}</div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Section 1: Supplier & Bill Metadata */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100 font-bold text-base text-[#0F172A]">
            <Building2 className="w-5 h-5 text-[#16A34A]" />
            <span>Supplier & Invoice Details</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {/* Supplier Selector */}
            <div className="space-y-1.5 md:col-span-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Supplier *
              </label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                required
              >
                <option value="">-- Select Supplier --</option>
                {suppliers.map((sup) => (
                  <option key={sup.id} value={sup.id}>
                    {sup.name} {sup.phone ? `(${sup.phone})` : ''}
                  </option>
                ))}
              </select>

              {selectedSupplier && (
                <div className="pt-1.5 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Current Payable:</span>
                  <span className="font-bold text-amber-600">
                    Rs. {Number(selectedSupplier.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              )}
            </div>

            {/* Purchase Date */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Purchase Date *
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={purchaseDate}
                  onChange={(e) => setPurchaseDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
                  required
                />
              </div>
            </div>

            {/* Bill / Reference Number */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                Bill / PO Number <span className="text-slate-400 font-normal lowercase">(optional)</span>
              </label>
              <input
                type="text"
                placeholder="Auto-generated if empty"
                value={purchaseNo}
                onChange={(e) => setPurchaseNo(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all font-mono"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Line Items */}
        <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
            <div className="flex items-center gap-2 font-bold text-base text-[#0F172A]">
              <Layers className="w-5 h-5 text-[#16A34A]" />
              <span>Procured Products & Quantities</span>
            </div>
            <button
              type="button"
              onClick={addItemRow}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-[#16A34A] hover:bg-emerald-100 font-bold text-xs transition-colors border border-emerald-200"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Another Product</span>
            </button>
          </div>

          <div className="space-y-4">
            {items.map((row, index) => {
              const selectedProd = row.product_id ? productMap.get(Number(row.product_id)) : null;
              const hasSecondary = !!(selectedProd?.secondary_unit_id && selectedProd?.conversion_ratio);
              const lineTotal = (Number(row.quantity) || 0) * (Number(row.purchase_rate) || 0);

              // Converted base units preview
              let convertedPreview = null;
              if (row.is_secondary_unit && selectedProd?.conversion_ratio) {
                const baseQty = (Number(row.quantity) || 0) * Number(selectedProd.conversion_ratio);
                convertedPreview = `= ${baseQty} ${selectedProd.unit?.short_name || 'Units'} base stock`;
              }

              return (
                <div
                  key={index}
                  className="p-4 rounded-xl bg-slate-50/80 border border-slate-200 hover:border-slate-300 transition-all space-y-3"
                >
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                    {/* Item # & Product selector */}
                    <div className="md:col-span-5 space-y-1">
                      <div className="flex items-center justify-between text-xs font-bold text-slate-600 uppercase">
                        <span>Item #{index + 1} - Product *</span>
                        {selectedProd && (
                          <span className="text-slate-400 font-normal normal-case">
                            Cur. Stock: {selectedProd.stock_quantity} {selectedProd.unit?.short_name || ''}
                          </span>
                        )}
                      </div>
                      <select
                        value={row.product_id}
                        onChange={(e) =>
                          handleProductChange(index, e.target.value ? Number(e.target.value) : '')
                        }
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                        required
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name} ({p.sku})
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Unit Selector (Base vs Secondary if available) */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Unit
                      </label>
                      {hasSecondary ? (
                        <select
                          value={row.is_secondary_unit ? 'secondary' : 'base'}
                          onChange={(e) => handleUnitChange(index, e.target.value === 'secondary')}
                          className="w-full px-2.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                        >
                          <option value="base">
                            {selectedProd?.unit?.short_name || 'Base'} (Base)
                          </option>
                          <option value="secondary">
                            {selectedProd?.secondary_unit?.short_name || 'Sec'} (1 = {selectedProd?.conversion_ratio} {selectedProd?.unit?.short_name})
                          </option>
                        </select>
                      ) : (
                        <div className="px-3 py-2 bg-slate-100 border border-slate-200 rounded-xl text-xs font-semibold text-slate-600 text-center">
                          {selectedProd?.unit?.short_name || selectedProd?.unit?.name || 'Units'}
                        </div>
                      )}
                    </div>

                    {/* Quantity */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Qty *
                      </label>
                      <input
                        type="number"
                        min="0.01"
                        step="any"
                        value={row.quantity}
                        onChange={(e) => handleQuantityChange(index, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                        required
                      />
                    </div>

                    {/* Rate / Unit */}
                    <div className="md:col-span-2 space-y-1">
                      <label className="block text-xs font-bold uppercase tracking-wider text-slate-600">
                        Rate (Rs.) *
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="any"
                        value={row.purchase_rate}
                        onChange={(e) => handleRateChange(index, Number(e.target.value))}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                        required
                      />
                    </div>

                    {/* Delete button */}
                    <div className="md:col-span-1 flex justify-center pb-1">
                      <button
                        type="button"
                        onClick={() => removeItemRow(index)}
                        disabled={items.length <= 1}
                        className="p-2 rounded-xl text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors disabled:opacity-30 disabled:hover:text-slate-400 disabled:hover:bg-transparent"
                        title="Remove Item"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Converted Subtotal & Stock Breakdown Row */}
                  <div className="flex flex-wrap items-center justify-between text-xs pt-1 border-t border-slate-200/60 text-slate-500">
                    <div className="font-medium text-emerald-700">
                      {convertedPreview && (
                        <span className="inline-flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200 font-semibold">
                          <PackageCheck className="w-3 h-3" /> {convertedPreview}
                        </span>
                      )}
                    </div>
                    <div className="font-bold text-slate-700">
                      Line Total: <span className="text-[#0F172A] font-extrabold text-sm">Rs. {lineTotal.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Section 3: Notes & Financial Summary */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Notes */}
          <div className="md:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center gap-2 font-bold text-sm text-[#0F172A]">
              <FileText className="w-4 h-4 text-slate-500" />
              <span>Purchase Requisition Notes</span>
            </div>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Raw materials delivery against contract #PO-2026-09. Delivered by vehicle #LEA-8849."
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] transition-all"
            />
          </div>

          {/* Live Bill Summary Card */}
          <div className="md:col-span-6 bg-white rounded-2xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2 font-bold text-base text-[#0F172A]">
                <Receipt className="w-5 h-5 text-[#16A34A]" />
                <span>Live Bill Summary</span>
              </div>
              <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                {totalItemCount} {totalItemCount === 1 ? 'Item' : 'Items'}
              </span>
            </div>

            <div className="space-y-2.5 text-sm">
              <div className="flex justify-between items-center text-slate-600 font-medium">
                <span>Items Subtotal:</span>
                <span className="font-bold text-slate-800">
                  Rs. {subtotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <label htmlFor="discount-input" className="cursor-pointer">Discount (Rs.):</label>
                <input
                  id="discount-input"
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-2.5 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 font-medium">
                <label htmlFor="tax-input" className="cursor-pointer">Tax / Freight (Rs.):</label>
                <input
                  id="tax-input"
                  type="number"
                  min="0"
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
                  className="w-28 px-2.5 py-1 text-right bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold focus:bg-white focus:outline-none focus:border-[#16A34A]"
                />
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-center text-base font-extrabold text-[#0F172A]">
                <span className="text-slate-800">Grand Total:</span>
                <span className="text-xl font-black text-[#16A34A]">
                  Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </span>
              </div>
            </div>

            {/* Impact Callout */}
            {selectedSupplier && grandTotal > 0 && (
              <div className="p-3 bg-emerald-50/70 border border-emerald-200/80 rounded-xl text-xs space-y-1 text-slate-700">
                <div className="font-bold text-[#16A34A] flex items-center gap-1.5">
                  <TrendingUp className="w-3.5 h-3.5" />
                  <span>Ledger & Balance Impact:</span>
                </div>
                <div className="flex justify-between">
                  <span>{selectedSupplier.name} New Payable:</span>
                  <span className="font-bold text-slate-900">
                    Rs. {(Number(selectedSupplier.current_balance || 0) + grandTotal).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 4: Action Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="w-full py-4 rounded-2xl bg-[#16A34A] text-white font-extrabold text-base hover:bg-[#15803D] transition-all shadow-md hover:shadow-xl shadow-[#16A34A]/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>Saving Purchase & Updating Stock...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="w-5 h-5" />
                <span>Save Purchase & Auto-Increase Stock</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
