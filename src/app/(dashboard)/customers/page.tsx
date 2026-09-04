'use client';

import React, { useEffect, useState, useCallback } from 'react';
import apiClient from '@/lib/api';
import { Customer } from '@/types/ledger';
import CustomerModal from '@/components/ledger/CustomerModal';
import Link from 'next/link';
import { authService } from '@/lib/auth';
import { Search, UserPlus, FileText, Edit, Trash2, Eye, ShieldAlert, Loader2 } from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string>(() => {
    return authService.getUserFromCookie()?.role || 'viewer';
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCustomers = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;

      const res = await apiClient.get('/customers', { params });
      if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customer list', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setIsModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedCustomer(null);
    setIsModalOpen(true);
  };

  const handleDelete = async (customer: Customer) => {
    if (!window.confirm(`Are you sure you want to deactivate/delete customer "${customer.name}"?`)) return;

    try {
      // Standard soft delete/deactivate
      const res = await apiClient.delete(`/customers/${customer.id}`);
      alert(res.data?.message || 'Customer deleted successfully.');
      fetchCustomers();
    } catch (err: any) {
      const errorMsg = err.response?.data?.message || 'Failed to delete customer.';
      if (err.response?.status === 422 && userRole === 'admin') {
        // Offer Admin permanent force delete if no other ledger rows exist
        if (window.confirm(`${errorMsg}\n\nDo you want to permanently force-delete this customer?`)) {
          try {
            const forceRes = await apiClient.delete(`/customers/${customer.id}?force=1`);
            alert(forceRes.data?.message || 'Customer permanently deleted.');
            fetchCustomers();
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
          <h1 className="text-2xl font-bold text-[#0F172A]">Customer Directories & Khata</h1>
          <p className="text-sm text-slate-500">
            Monitor client directories, opening balances, current outstanding, and detailed Khata ledgers
          </p>
        </div>

        {isWriteAllowed && (
          <button
            onClick={handleCreate}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-[#16A34A] text-white hover:bg-[#059669] transition-all shadow-sm"
          >
            <UserPlus className="w-4 h-4" />
            <span>Register Customer</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            placeholder="Search name, phone, email..."
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
                <th className="px-6 py-3">Customer Info</th>
                <th className="px-6 py-3">Phone</th>
                <th className="px-6 py-3">Opening Balance</th>
                <th className="px-6 py-3 text-right">Current Receivable</th>
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
                      <span>Loading customers...</span>
                    </div>
                  </td>
                </tr>
              ) : customers.length > 0 ? (
                customers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-[#0F172A]">{c.name}</div>
                      <div className="text-xs text-slate-400">{c.email || 'No email registered'}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold text-slate-600">{c.phone || '-'}</td>
                    <td className="px-6 py-4 text-slate-600 font-medium">
                      Rs. {Number(c.opening_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-extrabold text-[#16A34A]">
                      Rs. {Number(c.current_balance).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                          c.is_active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-rose-50 text-rose-800 border-rose-200'
                        }`}
                      >
                        {c.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2.5">
                        <Link
                          href={`/customers/${c.id}/khata`}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition-colors"
                        >
                          <FileText className="w-3.5 h-3.5" />
                          <span>View Khata</span>
                        </Link>

                        {isWriteAllowed && (
                          <button
                            onClick={() => handleEdit(c)}
                            className="p-1.5 rounded-lg border border-slate-200 text-slate-500 hover:text-[#16A34A] hover:bg-slate-50 transition-colors"
                            title="Edit Details"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        )}

                        {isAdmin && (
                          <button
                            onClick={() => handleDelete(c)}
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
                    No customers registered.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Customer Modals */}
      <CustomerModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchCustomers}
        customerToEdit={selectedCustomer}
      />
    </div>
  );
}
