'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Category, Product, ProductType, ProductUnit } from '@/types/inventory';
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
  const [productType, setProductType] = useState<ProductType>('finished_good');
  const [paperSize, setPaperSize] = useState('');
  const [gsm, setGsm] = useState('');
  const [sheetsPerUnit, setSheetsPerUnit] = useState('');
  const [pagesCount, setPagesCount] = useState('');
  const [materialType, setMaterialType] = useState('');
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
      setProductType(productToEdit.product_type || 'finished_good');
      setPaperSize(productToEdit.paper_size || '');
      setGsm(productToEdit.gsm ? String(productToEdit.gsm) : '');
      setSheetsPerUnit(productToEdit.sheets_per_unit ? String(productToEdit.sheets_per_unit) : '');
      setPagesCount(productToEdit.pages_count ? String(productToEdit.pages_count) : '');
      setMaterialType(productToEdit.material_type || '');
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
      setProductType('finished_good');
      setPaperSize('');
      setGsm('');
      setSheetsPerUnit('');
      setPagesCount('');
      setMaterialType('');
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
      product_type: productType,
      paper_size: paperSize.trim() || null,
      gsm: gsm ? parseInt(gsm, 10) : null,
      sheets_per_unit: sheetsPerUnit ? parseInt(sheetsPerUnit, 10) : null,
      pages_count: pagesCount ? parseInt(pagesCount, 10) : null,
      material_type: materialType.trim() || null,
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
                placeholder={
                  productType === 'finished_good'
                    ? 'e.g. A4 Copy 100 Pages'
                    : productType === 'raw_material'
                    ? 'e.g. A4 Offset Paper 80 GSM'
                    : productType === 'consumable'
                    ? 'e.g. Packing Tape'
                    : 'e.g. Paper Cutting Machine'
                }
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
                placeholder={
                  productType === 'finished_good'
                    ? 'e.g. COPY-A4-100'
                    : productType === 'raw_material'
                    ? 'e.g. RAW-PPR-80'
                    : productType === 'consumable'
                    ? 'e.g. CONS-TAPE'
                    : 'e.g. MACH-CUT-01'
                }
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium font-mono focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          </div>

          {/* Row 2: Product Type Classification */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Product Classification (Type) *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                { type: 'finished_good', label: 'Finished Good', desc: 'Registers, Copies, Notebooks, School Copies, A4 Registers' },
                { type: 'raw_material', label: 'Raw Material', desc: 'Paper, Card / Grey Board, Glue, Binding Thread' },
                { type: 'consumable', label: 'Consumable', desc: 'Packaging Material, Packing Tape, Operational Supplies' },
                { type: 'machinery', label: 'Machinery', desc: 'Paper Cutting Machine, Binding Machine, Production Machines' },
              ].map((item) => (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setProductType(item.type as ProductType)}
                  className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                    productType === item.type
                      ? 'border-[#16A34A] bg-emerald-50/70 ring-1 ring-[#16A34A]'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className={`text-xs font-bold ${productType === item.type ? 'text-[#16A34A]' : 'text-slate-800'}`}>
                    {item.label}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5 leading-tight">{item.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Conditional Manufacturing & Paper Attributes */}
          {(productType === 'raw_material' || productType === 'finished_good') && (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-xl space-y-3 animate-fadeIn">
              <div className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5 text-[#16A34A]" />
                <span>Manufacturing & Paper Specifications (Optional)</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Material / Paper Type
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Offset Paper, Art Card, Grey Board"
                    value={materialType}
                    onChange={(e) => setMaterialType(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Paper Size
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. A4, A5, Legal"
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    GSM (Weight)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 70, 80, 100, 120"
                    value={gsm}
                    onChange={(e) => setGsm(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A] bg-white"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Sheets Per Unit (e.g. 500/Ream)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50, 100, 500"
                    value={sheetsPerUnit}
                    onChange={(e) => setSheetsPerUnit(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A] bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-600 mb-1">
                    Pages Count (for Finished Books)
                  </label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 80, 100, 120, 160"
                    value={pagesCount}
                    onChange={(e) => setPagesCount(e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#16A34A] bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* Row 3: Category & Barcode */}
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
                placeholder="e.g. 8901234567890"
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
                  Enable Secondary Unit (e.g. 1 Box = 50 Pieces or 1 Pack = 500 Sheets)
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
                    placeholder="e.g. 50.00 or 500.00"
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
