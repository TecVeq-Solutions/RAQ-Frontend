'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { Supplier } from '@/types/ledger';
import SupplierModal from '@/components/ledger/SupplierModal';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { Search, Building, UserCheck, FileText, Edit, Trash2, Eye, Loader2 } from 'lucide-react';

export default function SuppliersPage() {
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>(() => {
    return authService.getUserFromCookie()?.role || 'viewer';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchSuppliers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get('/suppliers', { params });
      if (res.data?.data) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load supplier list', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  const handleEdit = (supplier: Supplier) => {
    setSelectedSupplier(supplier);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedSupplier(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (supplier: Supplier) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete supplier "${supplier.name}"?`)) return;

    try {
      const res = await apiClient.delete(`/suppliers/${supplier.id}`);
      alert(res.data?.message || 'Supplier deleted successfully.');
      fetchSuppliers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete supplier.';
      if (err.response?.status === 422 && userRole === 'admin') {
        if (window.confirm(`${errorMsg}\n\nDo you want to permanently force-delete this supplier?`)) {
          try {
            const forceRes = await apiClient.delete(`/suppliers/${supplier.id}?force=1`);
            alert(forceRes.data?.message || 'Supplier permanently deleted.');
            fetchSuppliers();
          } catch (forceErr: any) {
            alert(forceErr.response?.data?.message || 'Force delete blocked.');
          }
        }
      } else {
        alert(errorMsg);
      }
    }
  };

  const isWriteAllowed = userRole === 'admin' || userRole === 'staff';
  const isAdmin = userRole === 'admin';

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Supplier Directories & Khata</h1>
          <p className="text-sm text-slate-500">
            Monitor vendor details, contact persons, opening balances, current payables, and Khata statements
          </p>
        </div>

        {isWriteAllowed && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white hover:bg-[#059669] transition-all shadow-sm"
          >
            <Building className="w-4 h-4" />
            <span>Register Supplier</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search company, contact person, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3">Supplier Name</th>
                <th className="px-6 py-3">Contact Person</th>
                <th className="px-6 py-3">Opening Balance</th>
                <th className="px-6 py-3 text-right">Current Payable</th>
                <th className="px-6 py-3 text-center">Status</th>
                <th className="px-6 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading suppliers...</span>
                    </div>
                  </td>
                </tr>
              ) : suppliers.length > 0 ? (
                suppliers.map((s) => (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{s.name}</div>
                      <div className="text-xs text-slate-400">{s.email || 'No email registered'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">
                      <div>{s.contact_person || '-'}</div>
                      <div className="text-[11px] text-slate-400">{s.phone}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      Rs. {Number(s.opening_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-amber-700">
                      Rs. {Number(s.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          s.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {s.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/suppliers/${s.id}/khata`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Khata</span>
                        </Link>

                        {isWriteAllowed && (
                          <button
                            onClick={() => handleEdit(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#16A34A] hover:bg-slate-50 transition-colors"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(s)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-rose-600 hover:bg-slate-50 transition-colors"
                            title="Delete / Deactivate"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">
                    No suppliers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <SupplierModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchSuppliers}
        supplierToEdit={selectedSupplier}
      />
    </div>
  );
}
