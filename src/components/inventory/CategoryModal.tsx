'use client';

import React, { useState, useEffect } from 'react';
import apiClient from '@/lib/api';
import { Category } from '@/types/inventory';
import { X, Loader2, Tag } from 'lucide-react';

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
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isActive, setIsActive] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (categoryToEdit) {
      setName(categoryToEdit.name || '');
      setDescription(categoryToEdit.description || '');
      setIsActive(categoryToEdit.is_active ?? true);
    } else {
      setName('');
      setDescription('');
      setIsActive(true);
    }
    setError(null);
  }, [categoryToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Category name is required.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (categoryToEdit) {
        await apiClient.put(`/categories/${categoryToEdit.id}`, {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
        });
      } else {
        await apiClient.post('/categories', {
          name: name.trim(),
          description: description.trim(),
          is_active: isActive,
        });
      }
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to save category.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-base">
            <Tag className="w-5 h-5 text-[#16A34A]" />
            <span>{categoryToEdit ? 'Edit Category' : 'Create New Category'}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 mb-1.5">
              Category Name *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Grains, Beverages, Hardware"
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
            <label htmlFor="categoryIsActive" className="text-xs font-semibold text-slate-700">
              Active Category
            </label>
          </div>

          {/* Action Buttons */}
          <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
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
              <span>{categoryToEdit ? 'Save Changes' : 'Create Category'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
