'use client';

import React, { useState, useEffect, useCallback } from 'react';
import apiClient from '@/lib/api';
import { Category } from '@/types/inventory';
import { X, Loader2, Tag, Plus, Edit2, Trash2, Search, AlertCircle, CheckCircle2, ListFilter } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  categoryToEdit?: Category | null;
}

export default function CategoryModal({
  isOpen,
  onClose,
  onSuccess,
  categoryToEdit,
}: CategoryModalProps) {
  const [activeTab, setActiveTab] = useState<'list' | 'form'>('list');
  const [categories, setCategories] = useState<Category[]>([]);
  const [fetchingList, setFetchingList] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Form State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [listError, setListError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const fetchCategories = useCallback(async () => {
    setFetchingList(true);
    setListError(null);
    try {
      const res = await apiClient.get('/categories');
      if (res.data?.data) {
        setCategories(res.data.data);
      }
    } catch (err: any) {
      setListError(err.response?.data?.message || 'Failed to load categories.');
    } finally {
      setFetchingList(false);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchCategories();
      setSuccessMessage(null);
      setListError(null);
      setFormError(null);
      setSearchQuery('');

      if (categoryToEdit) {
        setEditingCategory(categoryToEdit);
        setName(categoryToEdit.name || '');
        setDescription(categoryToEdit.description || '');
        setIsActive(categoryToEdit.is_active ?? true);
        setActiveTab('form');
      } else {
        setEditingCategory(null);
        setName('');
        setDescription('');
        setIsActive(true);
        setActiveTab('list');
      }
    }
  }, [isOpen, categoryToEdit, fetchCategories]);

  if (!isOpen) return null;

  const handleStartCreate = () => {
    setEditingCategory(null);
    setName('');
    setDescription('');
    setIsActive(true);
    setFormError(null);
    setSuccessMessage(null);
    setActiveTab('form');
  };

  const handleStartEdit = (category: Category) => {
    setEditingCategory(category);
    setName(category.name || '');
    setDescription(category.description || '');
    setIsActive(category.is_active ?? true);
    setFormError(null);
    setSuccessMessage(null);
    setActiveTab('form');
  };

  const handleDeleteCategory = async (category: Category) => {
    if (!confirm(`Are you sure you want to delete category "${category.name}"?`)) {
      return;
    }

    setDeletingId(category.id);
    setListError(null);
    setSuccessMessage(null);

    try {
      const res = await apiClient.delete(`/categories/${category.id}`);
      setSuccessMessage(res.data?.message || `Category "${category.name}" deleted successfully.`);
      await fetchCategories();
      onSuccess();
    } catch (err: any) {
      setListError(
        err.response?.data?.message ||
          'Failed to delete category. Ensure no products are assigned to this category.'
      );
    } finally {
      setDeletingId(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setFormError('Category name is required.');
      return;
    }

    setSubmitting(true);
    setFormError(null);

    try {
      if (editingCategory) {
        await apiClient.put(`/categories/${editingCategory.id}`, {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
        });
        setSuccessMessage(`Category "${name.trim()}" updated successfully.`);
      } else {
        await apiClient.post('/categories', {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
        });
        setSuccessMessage(`Category "${name.trim()}" created successfully.`);
      }
      await fetchCategories();
      onSuccess();
      setActiveTab('list');
    } catch (err: any) {
      setFormError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCategories = categories.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return c.name.toLowerCase().includes(q) || (c.description && c.description.toLowerCase().includes(q));
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-2xl bg-white rounded-2xl border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2.5 font-bold text-[#0F172A] text-base">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-[#16A34A] flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <div>
              <div className="leading-tight">Category Management</div>
              <div className="text-xs text-slate-500 font-normal mt-0.5">
                Manage, create, edit, or delete product inventory categories
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher & Action Bar */}
        <div className="px-6 pt-3 pb-2 border-b border-slate-100 flex flex-wrap items-center justify-between gap-3 bg-white">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => {
                setActiveTab('list');
                setFormError(null);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'list'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ListFilter className="w-3.5 h-3.5" />
              <span>All Categories ({categories.length})</span>
            </button>
            <button
              type="button"
              onClick={handleStartCreate}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === 'form' && !editingCategory
                  ? 'bg-white text-[#16A34A] shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add New</span>
            </button>
          </div>

          {activeTab === 'list' && (
            <div className="relative w-full sm:w-56">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search categories..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
              />
            </div>
          )}
        </div>

        {/* Notifications */}
        {successMessage && (
          <div className="mx-6 mt-3 p-3 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{successMessage}</span>
            </div>
            <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {listError && activeTab === 'list' && (
          <div className="mx-6 mt-3 p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center justify-between animate-fadeIn">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{listError}</span>
            </div>
            <button onClick={() => setListError(null)} className="text-rose-600 hover:text-rose-900">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {activeTab === 'list' ? (
            <div className="space-y-3">
              {fetchingList ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                  <span className="text-xs font-medium">Loading categories...</span>
                </div>
              ) : filteredCategories.length === 0 ? (
                <div className="py-12 text-center text-slate-400">
                  <Tag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="text-xs font-semibold">No categories found.</p>
                  <button
                    type="button"
                    onClick={handleStartCreate}
                    className="mt-3 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#16A34A] text-white text-xs font-bold hover:bg-[#059669] transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add First Category
                  </button>
                </div>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden shadow-xs bg-white">
                  {filteredCategories.map((category) => {
                    const count = category.products_count ?? 0;
                    const isDeleting = deletingId === category.id;

                    return (
                      <div
                        key={category.id}
                        className="p-3.5 flex items-center justify-between hover:bg-slate-50/80 transition-colors gap-3"
                      >
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-[#0F172A] truncate">
                              {category.name}
                            </span>
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                category.is_active
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-slate-100 text-slate-600 border border-slate-200'
                              }`}
                            >
                              {category.is_active ? 'Active' : 'Inactive'}
                            </span>
                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600 border border-slate-200">
                              {count} {count === 1 ? 'product' : 'products'}
                            </span>
                          </div>
                          {category.description && (
                            <p className="text-xs text-slate-500 truncate mt-0.5">
                              {category.description}
                            </p>
                          )}
                        </div>

                        {/* Actions (Edit & Delete) */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleStartEdit(category)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-emerald-700 hover:bg-emerald-50 transition-colors"
                            title={`Edit "${category.name}"`}
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteCategory(category)}
                            disabled={isDeleting}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors disabled:opacity-50"
                            title={`Delete Category "${category.name}"`}
                          >
                            {isDeleting ? (
                              <Loader2 className="w-4 h-4 animate-spin text-rose-600" />
                            ) : (
                              <Trash2 className="w-4 h-4 text-rose-500" />
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* Form Mode (Add / Edit) */
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-slate-100">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  {editingCategory ? `Editing: ${editingCategory.name}` : 'New Category Details'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
                >
                  ← Back to List
                </button>
              </div>

              {formError && (
                <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Category Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stationery, Raw Material, Paper, Finished Goods"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
                  Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Brief details about products in this category..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="categoryIsActive"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="w-4 h-4 rounded text-[#16A34A] focus:ring-[#16A34A]"
                />
                <label htmlFor="categoryIsActive" className="text-xs font-semibold text-slate-700 cursor-pointer">
                  Active Category (Visible in catalogs & dropdowns)
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setActiveTab('list')}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-[#16A34A] text-white hover:bg-[#059669] transition-all shadow-sm disabled:opacity-50"
                >
                  {submitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{editingCategory ? 'Save Changes' : 'Create Category'}</span>
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs text-slate-500">
          <span>Safety Rule: Categories assigned to active products cannot be deleted.</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 rounded-lg border border-slate-200 font-semibold text-slate-700 bg-white hover:bg-slate-100 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
