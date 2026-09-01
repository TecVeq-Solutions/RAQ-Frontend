'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  Receipt,
  Plus,
  Truck,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  Building2,
  Package,
  Layers,
  ChevronRight,
  Eye,
  X,
  FileSpreadsheet,
  BadgePercent,
  CircleDollarSign,
  AlertCircle
} from 'lucide-react';

interface PurchaseItem {
  id: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: { id: number; name: string; short_name: string };
    secondary_unit?: { id: number; name: string; short_name: string };
  };
}

interface Purchase {
  id: number;
  purchase_no: string;
  supplier_id: number;
  user_id?: number | null;
  purchase_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'paid' | 'partial' | 'due';
  notes?: string | null;
  created_at: string;
  supplier?: {
    id: number;
    name: string;
    contact_person?: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items?: PurchaseItem[];
  user?: {
    id: number;
    name: string;
    email: string;
  };
}

interface Supplier {
  id: number;
  name: string;
}

export default function PurchasesPage() {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_count: 0,
    total_amount: 0,
    total_due: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Details Modal State
  const [activePurchase, setActivePurchase] = useState<Purchase | null>(null);

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  // Load suppliers for filter
  const fetchSuppliers = useCallback(async () => {
    try {
      const res = await apiClient.get('/suppliers');
      if (res.data?.data) {
        setSuppliers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load suppliers for filter', err);
    }
  }, []);

  // Fetch purchases list
  const fetchPurchases = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedSupplier) params.supplier_id = selectedSupplier;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedStatus) params.payment_status = selectedStatus;

      const res = await apiClient.get('/purchases', { params });
      if (res.data?.data) {
        setPurchases(res.data.data);
      }
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load purchases', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedSupplier, startDate, endDate, selectedStatus]);

  useEffect(() => {
    fetchSuppliers();
  }, [fetchSuppliers]);

  useEffect(() => {
    fetchPurchases();
  }, [fetchPurchases]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Purchase Procurement & Bills</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage supplier purchase orders, stock inwards, and procurement invoices
          </p>
        </div>

        <Link
          href="/purchases/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold hover:bg-[#15803D] transition-all shadow-md hover:shadow-lg shadow-[#16A34A]/20 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Purchase Order</span>
        </Link>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Purchase Bills</div>
            <div className="text-2xl font-black text-[#0F172A]">{summary.total_count}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Procured Value</div>
            <div className="text-2xl font-black text-[#16A34A]">
              Rs. {Number(summary.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
            <Truck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Supplier Payable Due</div>
            <div className="text-2xl font-black text-amber-600">
              Rs. {Number(summary.total_due || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative md:col-span-2">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search Bill #, Supplier, Notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          {/* Supplier Filter */}
          <div>
            <select
              value={selectedSupplier}
              onChange={(e) => setSelectedSupplier(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Suppliers</option>
              {suppliers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          {/* Date Filter */}
          <div>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="From Date"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            />
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              title="To Date"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            />
            <button
              onClick={fetchPurchases}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Purchases Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <Receipt className="w-4 h-4 text-[#16A34A]" />
            <span>Purchase Order Log ({purchases.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Bill / PO #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Supplier</th>
                <th className="px-6 py-3.5">Items</th>
                <th className="px-6 py-3.5 text-right">Grand Total</th>
                <th className="px-6 py-3.5 text-center">Status</th>
                <th className="px-6 py-3.5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading purchase orders...</span>
                    </div>
                  </td>
                </tr>
              ) : purchases.length > 0 ? (
                purchases.map((po) => {
                  const itemCount = po.items?.length || 0;
                  return (
                    <tr key={po.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">
                        {po.purchase_no}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">
                        {po.purchase_date}
                      </td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A]">
                          {po.supplier?.name || 'Unknown Supplier'}
                        </div>
                        {po.supplier?.phone && (
                          <div className="text-xs text-slate-400">{po.supplier.phone}</div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 text-slate-700">
                          <Package className="w-3 h-3 text-slate-400" />
                          {itemCount} {itemCount === 1 ? 'Item' : 'Items'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="font-extrabold text-base text-[#16A34A]">
                          Rs. {Number(po.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {po.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            Paid
                          </span>
                        ) : po.payment_status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Partial
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                            Payable Due
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setActivePurchase(po)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View Bill</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No purchase orders found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details View Modal */}
      {activePurchase && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleIn">
            {/* Modal Header */}
            <div className="p-6 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-lg text-[#0F172A]">
                    Purchase Bill #{activePurchase.purchase_no}
                  </h3>
                  <p className="text-xs text-slate-500">Date: {activePurchase.purchase_date}</p>
                </div>
              </div>

              <button
                onClick={() => setActivePurchase(null)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 space-y-6">
              {/* Supplier Snapshot */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 grid grid-cols-2 gap-4 text-xs">
                <div>
                  <div className="text-slate-400 uppercase font-bold tracking-wider mb-1">Supplier Info</div>
                  <div className="font-bold text-sm text-[#0F172A]">{activePurchase.supplier?.name}</div>
                  <div className="text-slate-500">{activePurchase.supplier?.phone || 'No phone'}</div>
                  <div className="text-slate-500">{activePurchase.supplier?.address || ''}</div>
                </div>

                <div className="text-right">
                  <div className="text-slate-400 uppercase font-bold tracking-wider mb-1">Status & Reference</div>
                  <div>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase">
                      {activePurchase.payment_status}
                    </span>
                  </div>
                  {activePurchase.user && (
                    <div className="text-slate-500 mt-2">Recorded by: <strong>{activePurchase.user.name}</strong></div>
                  )}
                </div>
              </div>

              {/* Items Breakdown Table */}
              <div className="border border-slate-200 rounded-2xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="px-4 py-2.5">Product</th>
                      <th className="px-4 py-2.5 text-center">Qty</th>
                      <th className="px-4 py-2.5 text-right">Rate (Rs.)</th>
                      <th className="px-4 py-2.5 text-right">Subtotal (Rs.)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {activePurchase.items?.map((item) => (
                      <tr key={item.id}>
                        <td className="px-4 py-3 font-semibold text-slate-800">
                          {item.product?.name || 'Product'}
                          <span className="block text-[11px] text-slate-400 font-mono">
                            {item.product?.sku || ''}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-center font-bold text-slate-700">
                          {item.quantity} {item.product?.unit?.short_name || 'Units'}
                        </td>
                        <td className="px-4 py-3 text-right font-medium text-slate-600">
                          Rs. {Number(item.unit_price || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-[#0F172A]">
                          Rs. {Number(item.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bill Financial Summary */}
              <div className="p-4 rounded-2xl bg-emerald-50/50 border border-emerald-200/60 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600 font-medium">
                  <span>Subtotal:</span>
                  <span className="font-bold text-slate-800">
                    Rs. {Number(activePurchase.subtotal || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
                {Number(activePurchase.discount) > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Discount:</span>
                    <span className="font-bold text-red-600">
                      - Rs. {Number(activePurchase.discount).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                {Number(activePurchase.tax) > 0 && (
                  <div className="flex justify-between text-slate-600 font-medium">
                    <span>Tax / Freight:</span>
                    <span className="font-bold text-slate-800">
                      + Rs. {Number(activePurchase.tax).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </span>
                  </div>
                )}
                <div className="pt-2 border-t border-emerald-200 flex justify-between items-center text-sm font-black text-[#0F172A]">
                  <span>Grand Total:</span>
                  <span className="text-base text-[#16A34A]">
                    Rs. {Number(activePurchase.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {activePurchase.notes && (
                <div className="text-xs text-slate-500 bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <strong className="text-slate-700">Notes:</strong> {activePurchase.notes}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50 rounded-b-3xl">
              <button
                onClick={() => setActivePurchase(null)}
                className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors"
              >
                Close Bill
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
