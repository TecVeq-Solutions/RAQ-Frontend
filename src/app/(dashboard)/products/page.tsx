'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { authService } from '@/lib/auth';
import { Category, Product, ProductUnit } from '@/types/inventory';
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
  const [stockStatusTab, setStockStatusTab] = useState<'all' | 'normal' | 'low_stock' | 'out_of_stock'>('all');

  // Modal States
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // RBAC checks
  const canManage = authService.isAdmin() || authService.isStaff();
  const canDelete = authService.isAdmin();

  // Debounce search input
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCategories = useCallback(async () => {
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.data) setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories', err);
    }
  }, []);

  const fetchUnits = useCallback(async () => {
    try {
      const res = await apiClient.get('/product-units');
      if (res.data?.data) setUnits(res.data.data);
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
  }, [debouncedSearch, selectedCategory, stockStatusTab]);

  useEffect(() => {
    fetchCategories();
    fetchUnits();
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
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 text-slate-700 font-semibold hover:bg-slate-50 transition-all shadow-xs text-sm"
            >
              <Tag className="w-4 h-4 text-[#16A34A]" /> Add Category
            </button>
            <button
              onClick={() => {
                setEditingProduct(null);
                setIsProductModalOpen(true);
              }}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-[#16A34A] text-white font-semibold hover:bg-[#059669] transition-all shadow-sm text-sm"
            >
              <Plus className="w-4 h-4" /> Add Product
            </button>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Search Input */}
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, SKU, barcode..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>

        {/* Filters & Refresh */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          {/* Category Dropdown */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3.5 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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
                <th className="px-6 py-3">Product Name</th>
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
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading inventory catalog...</span>
                    </div>
                  </td>
                </tr>
              ) : products.length > 0 ? (
                products.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-bold text-[#0F172A]">{p.name}</td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-xs text-slate-600">{p.sku}</div>
                      {p.barcode && <div className="text-[11px] text-slate-400">{p.barcode}</div>}
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
                        <Layers className="w-3 h-3 text-slate-400" />
                        {p.category?.name || 'Uncategorized'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      Rs. {Number(p.purchase_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-[#16A34A]">
                      Rs. {Number(p.selling_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="font-extrabold text-slate-900">
                        {p.stock_display?.full_display || `${p.stock_quantity} ${p.unit?.short_name || ''}`}
                      </div>
                      <div className="text-[11px] text-slate-400">
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
                ))
              ) : (
                <tr>
                  <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-slate-400">
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
