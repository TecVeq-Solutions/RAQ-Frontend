'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient, { getCachedData, invalidateCache } from '@/lib/api';
import { authService } from '@/lib/auth';
import { Category, Product, ProductType, ProductUnit } from '@/types/inventory';
import ProductModal from '@/components/inventory/ProductModal';
import CategoryModal from '@/components/inventory/CategoryModal';
import StockBadge from '@/components/inventory/StockBadge';
import {
  Boxes,
  Plus,
  Search,
  Filter,
  Edit2,
  Trash2,
  Tag,
  Loader2,
  RefreshCw,
  Layers,
  Package,
  Scissors,
  Wrench,
  CheckCircle2,
} from 'lucide-react';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<ProductUnit[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [productTypeTab, setProductTypeTab] = useState<'all' | ProductType>('all');
  const [stockStatusTab, setStockStatusTab] = useState<'all' | 'normal' | 'low_stock' | 'out_of_stock'>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // RBAC checks (Stock & Products is strictly View-Only for Staff)
  const canManage = authService.isAdmin();
  const canDelete = authService.isAdmin();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCategories = useCallback(async (forceFresh = false) => {
    try {
      const data = await getCachedData<Category[]>('/categories', forceFresh);
      if (data) setCategories(data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const fetchUnits = useCallback(async (forceFresh = false) => {
    try {
      const data = await getCachedData<ProductUnit[]>('/product-units', forceFresh);
      if (data) setUnits(data);
    } catch (err) {
      console.error('Failed to load product units', err);
    }
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCategory) params.category_id = selectedCategory;
      if (productTypeTab !== 'all') params.product_type = productTypeTab;
      if (stockStatusTab !== 'all') params.stock_status = stockStatusTab;

      const res = await apiClient.get('/products', { params });
      if (res.data?.data) {
        setProducts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load products', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCategory, productTypeTab, stockStatusTab]);

  useEffect(() => {
    // Parallel non-blocking master data load
    Promise.all([fetchCategories(), fetchUnits()]);
  }, [fetchCategories, fetchUnits]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Are you sure you want to delete "${product.name}"? Historical stock movement records will be preserved.`)) {
      return;
    }

    try {
      await apiClient.delete(`/products/${product.id}`);
      fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete product.');
    }
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return;
    }

    try {
      await apiClient.delete(`/categories/${category.id}`);
      invalidateCache('/categories');
      if (String(selectedCategory) === String(category.id)) {
        setSelectedCategory('');
      }
      await fetchCategories(true);
      await fetchProducts();
    } catch (err: any) {
      alert(err.response?.data?.message || 'Failed to delete category. Make sure no products are assigned.');
    }
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Products & Inventory Catalog</h1>
          <p className="text-sm text-slate-500">
            Manage master product catalog, multi-unit conversions, and low-stock indicators
          </p>
        </div>

        {canManage && (
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCategoryModalOpen(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-xs text-sm cursor-pointer"
            >
              <Tag className="w-4 h-4 text-[#16A34A]" /> Manage Categories
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm cursor-pointer"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* Classification Tabs Bar */}
      <div className="flex flex-wrap items-center gap-2 bg-slate-100 p-1.5 rounded-2xl w-fit">
        {[
          { key: 'all', label: 'All Items', icon: Boxes },
          { key: 'finished_good', label: 'Finished Goods', icon: Package },
          { key: 'raw_material', label: 'Raw Materials', icon: Scissors },
          { key: 'consumable', label: 'Consumables', icon: Layers },
          { key: 'machinery', label: 'Machinery', icon: Wrench },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = productTypeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => setProductTypeTab(tab.key as any)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isActive
                  ? 'bg-white text-slate-900 shadow-sm'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-[#16A34A]' : 'text-slate-400'}`} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, SKU, barcode, paper spec..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        {/* Filters & Refresh */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Dropdown & Delete Icon */}
          <div className="flex items-center gap-1.5">
            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} {c.products_count !== undefined ? `(${c.products_count})` : ''}
                </option>
              ))}
            </select>
            {canDelete && selectedCategory && (
              <button
                type="button"
                onClick={() => {
                  const cat = categories.find((c) => String(c.id) === String(selectedCategory));
                  if (cat) handleDeleteCategory(cat);
                }}
                className="p-2 rounded-xl border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 hover:text-rose-700 transition-colors shadow-xs cursor-pointer"
                title="Delete selected category"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Stock Status Tab Buttons */}
          <div className="inline-flex p-1 bg-slate-100 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStockStatusTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockStatusTab === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStockStatusTab('normal')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockStatusTab === 'normal' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Normal
            </button>
            <button
              onClick={() => setStockStatusTab('low_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockStatusTab === 'low_stock' ? 'bg-white text-amber-800 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Low Stock
            </button>
            <button
              onClick={() => setStockStatusTab('out_of_stock')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                stockStatusTab === 'out_of_stock' ? 'bg-white text-rose-700 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              Out of Stock
            </button>
          </div>

          <button
            onClick={fetchProducts}
            className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-500 transition-colors"
            title="Refresh Products Catalog"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Products Directory Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <Boxes className="w-4 h-4 text-[#16A34A]" />
            <span>Catalog Items ({products.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Product Name & Specs</th>
                <th className="px-6 py-3">Type</th>
                <th className="px-6 py-3">SKU / Barcode</th>
                <th className="px-6 py-3">Category</th>
                <th className="px-6 py-3 text-right">Purchase Rate</th>
                <th className="px-6 py-3 text-right">Selling Rate</th>
                <th className="px-6 py-3 text-center">Stock & Multi-Unit</th>
                <th className="px-6 py-3 text-center">Status</th>
                {canManage && <th className="px-6 py-3 text-right">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading inventory catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => {
                  const pType = p.product_type || 'finished_good';
                  const typeBadgeClass =
                    pType === 'raw_material'
                      ? 'bg-amber-100 text-amber-800 border-amber-200'
                      : pType === 'consumable'
                      ? 'bg-teal-100 text-teal-800 border-teal-200'
                      : pType === 'machinery'
                      ? 'bg-purple-100 text-purple-800 border-purple-200'
                      : 'bg-blue-100 text-blue-800 border-blue-200';

                  const typeLabel =
                    pType === 'raw_material'
                      ? 'Raw Material'
                      : pType === 'consumable'
                      ? 'Consumable'
                      : pType === 'machinery'
                      ? 'Machinery'
                      : 'Finished Good';

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A]">{p.name}</div>
                        {(p.paper_size || p.gsm || p.sheets_per_unit || p.pages_count || p.material_type) && (
                          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-1">
                            {p.material_type && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {p.material_type}
                              </span>
                            )}
                            {p.paper_size && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                Size: {p.paper_size}
                              </span>
                            )}
                            {p.gsm && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {p.gsm} GSM
                              </span>
                            )}
                            {p.sheets_per_unit && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {p.sheets_per_unit} sheets
                              </span>
                            )}
                            {p.pages_count && (
                              <span className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-700 font-medium">
                                {p.pages_count} pgs
                              </span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${typeBadgeClass}`}>
                          {typeLabel}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-mono text-xs text-slate-600">{p.sku}</div>
                        {p.barcode && <div className="text-xs text-slate-400">{p.barcode}</div>}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                          <Layers className="w-3 h-3 text-slate-400" />
                          {p.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right font-medium">
                        <div className="text-slate-900 font-bold">
                          Rs. {Number(p.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                        {pType === 'finished_good' && (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 mt-1">
                            Unit Mfg Cost
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right font-bold text-[#16A34A]">
                        Rs. {Number(p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <div className="font-extrabold text-slate-900">
                          {p.stock_display?.full_display || `${p.stock_quantity} ${p.unit?.short_name || ''}`}
                        </div>
                        <div className="text-xs text-slate-400">
                          Alert Limit: {p.alert_quantity} {p.unit?.short_name || ''}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <StockBadge
                          status={p.stock_display?.status}
                          stockQuantity={p.stock_quantity}
                          alertQuantity={p.alert_quantity}
                        />
                      </td>
                      {canManage && (
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => {
                                setEditingProduct(p);
                                setIsProductModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-[#16A34A] hover:bg-emerald-50 transition-colors"
                              title="Edit Product"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            {canDelete && (
                              <button
                                onClick={() => handleDeleteProduct(p)}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                                title="Delete Product (Soft Delete)"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      )}
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={canManage ? 9 : 8} className="px-6 py-12 text-center text-slate-400">
                    No products found matching the selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        onSuccess={fetchProducts}
        productToEdit={editingProduct}
        categories={categories}
        units={units}
      />

      <CategoryModal
        isOpen={isCategoryModalOpen}
        onClose={() => setIsCategoryModalOpen(false)}
        onSuccess={() => {
          fetchCategories();
          fetchProducts();
        }}
      />
    </div>
  );
}
