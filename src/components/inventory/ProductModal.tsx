'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Category, Product, ProductUnit } from '@/types/inventory';
import { X, Loader2, Boxes, Calculator, AlertCircle } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  productToEdit?: Product | null;
  categories: Category[];
  units: ProductUnit[];
}

export default function ProductModal({
  isOpen,
  onClose,
  onSuccess,
  productToEdit,
  categories,
  units,
}: ProductModalProps) {
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [barcode, setBarcode] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [unitId, setUnitId] = useState<string>('');
  const [hasSecondaryUnit, setHasSecondaryUnit] = useState(false);
  const [secondaryUnitId, setSecondaryUnitId] = useState<string>('');
  const [conversionRatio, setConversionRatio] = useState<string>('');
  const [purchasePrice, setPurchasePrice] = useState<string>('0');
  const [sellingPrice, setSellingPrice] = useState<string>('0');
  const [stockQuantity, setStockQuantity] = useState<string>('0');
  const [alertQuantity, setAlertQuantity] = useState<string>('5');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name || '');
      setSku(productToEdit.sku || '');
      setBarcode(productToEdit.barcode || '');
      setCategoryId(productToEdit.category_id ? String(productToEdit.category_id) : '');
      setUnitId(productToEdit.unit_id ? String(productToEdit.unit_id) : '');

      if (productToEdit.secondary_unit_id && productToEdit.conversion_ratio) {
        setHasSecondaryUnit(true);
        setSecondaryUnitId(String(productToEdit.secondary_unit_id));
        setConversionRatio(String(productToEdit.conversion_ratio));
      } else {
        setHasSecondaryUnit(false);
        setSecondaryUnitId('');
        setConversionRatio('');
      }

      setPurchasePrice(String(productToEdit.purchase_price || '0'));
      setSellingPrice(String(productToEdit.selling_price || '0'));
      setStockQuantity(String(productToEdit.stock_quantity || '0'));
      setAlertQuantity(String(productToEdit.alert_quantity || '5'));
      setDescription(productToEdit.description || '');
      setIsActive(productToEdit.is_active ?? true);
    } else {
      setName('');
      setSku(`SKU-${Math.floor(100000 + Math.random() * 900000)}`);
      setBarcode('');
      setCategoryId(categories.length > 0 ? String(categories[0].id) : '');
      setUnitId(units.length > 0 ? String(units[0].id) : '');
      setHasSecondaryUnit(false);
      setSecondaryUnitId('');
      setConversionRatio('');
      setPurchasePrice('0');
      setSellingPrice('0');
      setStockQuantity('0');
      setAlertQuantity('5');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [productToEdit, isOpen, categories, units]);

  if (!isOpen) return null;

  // Selected Units helper names
  const baseUnitObj = units.find((u) => String(u.id) === unitId);
  const baseUnitName = baseUnitObj?.short_name || baseUnitObj?.name || 'Base Unit';

  const secUnitObj = units.find((u) => String(u.id) === secondaryUnitId);
  const secUnitName = secUnitObj?.short_name || secUnitObj?.name || 'Secondary Unit';

  const ratioVal = parseFloat(conversionRatio) || 0;
  const stockVal = parseFloat(stockQuantity) || 0;
  const secondaryStockCalc = ratioVal > 0 ? (stockVal / ratioVal).toFixed(2) : null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError('Product name is required.');
    if (!sku.trim()) return setError('Product SKU is required.');
    if (!unitId) return setError('Base Unit is required.');

    if (hasSecondaryUnit) {
      if (!secondaryUnitId) return setError('Please select a Secondary Unit.');
      if (secondaryUnitId === unitId) return setError('Secondary Unit cannot be identical to Base Unit.');
      if (!ratioVal || ratioVal <= 0) return setError('Conversion ratio must be greater than 0.');
    }

    setLoading(true);
    setError(null);

    const payload: any = {
      name: name.trim(),
      sku: sku.trim(),
      barcode: barcode.trim() || null,
      category_id: categoryId ? parseInt(categoryId, 10) : null,
      unit_id: parseInt(unitId, 10),
      secondary_unit_id: hasSecondaryUnit && secondaryUnitId ? parseInt(secondaryUnitId, 10) : null,
      conversion_ratio: hasSecondaryUnit && ratioVal > 0 ? ratioVal : null,
      purchase_price: parseFloat(purchasePrice) || 0,
      selling_price: parseFloat(sellingPrice) || 0,
      stock_quantity: parseFloat(stockQuantity) || 0,
      alert_quantity: parseFloat(alertQuantity) || 0,
      description: description.trim() || null,
      is_active: isActive,
    };

    try {
      if (productToEdit) {
        await apiClient.put(`/products/${productToEdit.id}`, payload);
      } else {
        await apiClient.post('/products', payload);
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save product.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 flex-shrink-0">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-base">
            <Boxes className="w-5 h-5 text-[#16A34A]" />
            <span>{productToEdit ? 'Edit Product Catalog Item' : 'Add New Product to Catalog'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form Body */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto space-y-4 flex-1 scrollbar-thin">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Row 1: Name & SKU */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Product Name *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Super Basmati Rice"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                SKU / Product Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. RICE-001"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Row 2: Category & Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Category
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white"
              >
                <option value="">Uncategorized</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Barcode (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. 890123456789"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Unit Section Header */}
          <div className="pt-2">
            <label className="block text-xs font-extrabold uppercase tracking-wider text-[#16A34A]">
              Unit Configuration & Multi-Unit Setup
            </label>
          </div>

          {/* Base Unit Field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Base Unit (Single Source of Truth) *
              </label>
              <select
                required
                value={unitId}
                onChange={(e) => setUnitId(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white"
              >
                <option value="">Select Base Unit</option>
                {units.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.short_name})
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={hasSecondaryUnit}
                  onChange={(e) => setHasSecondaryUnit(e.target.checked)}
                  className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]"
                />
                <span className="text-xs font-bold text-slate-800">
                  Enable Secondary Unit (e.g. 1 Bag = 25 KG)
                </span>
              </label>
            </div>
          </div>

          {/* Dynamic Multi-Unit Fields */}
          {hasSecondaryUnit && (
            <div className="p-4 bg-emerald-50/50 border border-emerald-100 rounded-xl space-y-3 animate-fadeIn">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Secondary Unit *
                  </label>
                  <select
                    value={secondaryUnitId}
                    onChange={(e) => setSecondaryUnitId(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white"
                  >
                    <option value="">Select Secondary Unit</option>
                    {units
                      .filter((u) => String(u.id) !== unitId)
                      .map((u) => (
                        <option key={u.id} value={u.id}>
                          {u.name} ({u.short_name})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wider text-slate-700 mb-1">
                    Conversion Ratio (1 {secUnitName} = ? {baseUnitName}) *
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    min="0.0001"
                    placeholder="e.g. 25.00"
                    value={conversionRatio}
                    onChange={(e) => setConversionRatio(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                  />
                </div>
              </div>

              {/* Conversion Helper Calculation Preview */}
              {ratioVal > 0 && secondaryUnitId && (
                <div className="p-2.5 bg-white rounded-lg border border-emerald-200 text-xs text-slate-700 flex items-center gap-2">
                  <Calculator className="w-4 h-4 text-[#16A34A] flex-shrink-0" />
                  <span>
                    <strong>Helper Preview:</strong> 1 {secUnitName} = {ratioVal} {baseUnitName}.
                    {stockVal > 0 && (
                      <> Initial stock of <strong>{stockVal} {baseUnitName}</strong> equals <strong>{secondaryStockCalc} {secUnitName}</strong>.</>
                    )}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Pricing & Stock Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Purchase Price (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Selling Price (Rs.)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Stock Quantity (in {baseUnitName})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={stockQuantity}
                onChange={(e) => setStockQuantity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1">
                Alert Threshold (in {baseUnitName})
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={alertQuantity}
                onChange={(e) => setAlertQuantity(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3 flex-shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#16A34A] text-white hover:bg-[#059669] transition-all shadow-sm disabled:opacity-50"
            >
              {loading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
              <span>{productToEdit ? 'Save Changes' : 'Create Product'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
