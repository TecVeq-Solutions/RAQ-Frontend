'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  ShoppingCart,
  Plus,
  Receipt,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  Calendar,
  Building2,
  Package,
  Eye,
  X,
  Printer,
  CircleDollarSign,
  Clock,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

interface SaleItem {
  id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: {
    id: number;
    name: string;
    sku: string;
    unit?: { id: number; name: string; short_name: string };
  };
}

interface Sale {
  id: number;
  invoice_no: string;
  customer_id: number;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: 'paid' | 'partial' | 'due';
  notes?: string | null;
  created_at: string;
  customer?: {
    id: number;
    name: string;
    phone?: string;
    email?: string;
    address?: string;
  };
  items?: SaleItem[];
  user?: {
    id: number;
    name: string;
  };
  payments?: Array<{
    id: number;
    payment_no: string;
    amount: number;
    payment_method: string;
  }>;
}

interface Customer {
  id: number;
  name: string;
}

export default function SalesPage() {
  const [sales, setSales] = useState<Sale[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState({
    total_count: 0,
    total_amount: 0,
    total_paid: 0,
    total_due: 0,
  });

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedCustomer, setSelectedCustomer] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [selectedStatus, setSelectedStatus] = useState<string>('');

  // Print & Details Modal State
  const [activeSale, setActiveSale] = useState<Sale | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  // Debounce search
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearch(searchTerm), 300);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  const fetchCustomers = useCallback(async () => {
    try {
      const res = await apiClient.get('/customers');
      if (res.data?.data) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load customers for filter', err);
    }
  }, []);

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (debouncedSearch) params.search = debouncedSearch;
      if (selectedCustomer) params.customer_id = selectedCustomer;
      if (startDate) params.start_date = startDate;
      if (endDate) params.end_date = endDate;
      if (selectedStatus) params.payment_status = selectedStatus;

      const res = await apiClient.get('/sales', { params });
      if (res.data?.data) {
        setSales(res.data.data);
      }
      if (res.data?.summary) {
        setSummary(res.data.summary);
      }
    } catch (err) {
      console.error('Failed to load sales', err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, selectedCustomer, startDate, endDate, selectedStatus]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  useEffect(() => {
    fetchSales();
  }, [fetchSales]);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-[#0F172A]">Sales Invoices & POS Receipts</h1>
          <p className="text-sm text-slate-500 mt-0.5">
            Manage counter bills, customer billing history, and print tax invoices
          </p>
        </div>

        <Link
          href="/sales/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#16A34A] text-white font-bold hover:bg-[#15803D] transition-all shadow-md hover:shadow-lg shadow-[#16A34A]/20 text-sm cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>New Sale (POS Counter)</span>
        </Link>
      </div>

      {/* Metric Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Receipt className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Sales Invoices</div>
            <div className="text-2xl font-black text-[#0F172A]">{summary.total_count}</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center font-bold">
            <CircleDollarSign className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Billed Revenue</div>
            <div className="text-2xl font-black text-[#16A34A]">
              Rs. {Number(summary.total_amount || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
            <Clock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Credit Receivables</div>
            <div className="text-2xl font-black text-purple-600">
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
              placeholder="Search Invoice #, Customer, Notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A]"
            />
          </div>

          {/* Customer Filter */}
          <div>
            <select
              value={selectedCustomer}
              onChange={(e) => setSelectedCustomer(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Customers</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Status Filter */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] bg-white text-slate-700"
            >
              <option value="">All Statuses</option>
              <option value="paid">Paid (Cash)</option>
              <option value="due">Payable Due (Credit)</option>
              <option value="partial">Partial</option>
            </select>
          </div>

          {/* Refresh Button */}
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              title="From Date"
              className="w-full px-3 py-2 rounded-xl border border-slate-200 text-xs font-semibold focus:outline-none focus:border-[#16A34A] bg-white text-slate-700"
            />
            <button
              onClick={fetchSales}
              className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors shrink-0"
              title="Refresh List"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Sales Invoices Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-[#0F172A] text-sm">
            <ShoppingCart className="w-4 h-4 text-[#16A34A]" />
            <span>Sales Invoices History ({sales.length})</span>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500 border-b border-slate-100">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Customer</th>
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
                      <span>Loading sales records...</span>
                    </div>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => {
                  const itemCount = sale.items?.length || 0;
                  return (
                    <tr key={sale.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">
                        {sale.invoice_no}
                      </td>
                      <td className="px-6 py-4 text-slate-600 font-medium">{sale.sale_date}</td>
                      <td className="px-6 py-4">
                        <div className="font-bold text-[#0F172A]">
                          {sale.customer?.name || 'Walk-in Customer'}
                        </div>
                        {sale.customer?.phone && (
                          <div className="text-xs text-slate-400">{sale.customer.phone}</div>
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
                          Rs. {Number(sale.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {sale.payment_status === 'paid' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <CheckCircle2 className="w-3 h-3" /> Paid (Cash)
                          </span>
                        ) : sale.payment_status === 'partial' ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
                            Partial Paid
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-purple-50 text-purple-700 border border-purple-200">
                            Credit Due
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => setActiveSale(sale)}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>View & Print</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-slate-400">
                    No sales invoices found matching your filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Invoice Details & Print Modal */}
      {activeSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-xs z-10">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center">
                  <Receipt className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-[#0F172A]">Sale Invoice #{activeSale.invoice_no}</h3>
                  <p className="text-xs text-slate-400">Date: {activeSale.sale_date}</p>
                </div>
              </div>

              {/* Format Toggle Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  type="button"
                  onClick={() => setPrintFormat('thermal')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'thermal'
                      ? 'bg-white text-[#16A34A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  80mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1 rounded-lg text-xs font-bold transition-all ${
                    printFormat === 'a4'
                      ? 'bg-white text-[#16A34A] shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  A4 Standard
                </button>
              </div>

              <button
                onClick={() => setActiveSale(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Preview */}
            <div className="p-6 bg-slate-50/50 flex justify-center">
              {printFormat === 'thermal' ? (
                <div className="w-[300px] bg-white p-4 border border-slate-200 shadow-sm text-xs font-mono space-y-3 rounded-xl text-slate-800">
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                    <div className="font-black text-sm uppercase text-slate-900">SALES ERP STORE</div>
                    <div className="text-[10px] text-slate-500">Retail & Wholesale Billing</div>
                    <div className="text-[10px] text-slate-500">Tel: +92 300 1234567</div>
                  </div>

                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice:</span>
                      <span className="font-bold">{activeSale.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span>{activeSale.sale_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold truncate max-w-[170px]">{activeSale.customer?.name || 'Walk-in'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Status:</span>
                      <span className="uppercase font-bold">{activeSale.payment_status}</span>
                    </div>
                  </div>

                  <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                    {activeSale.items?.map((itm, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-bold text-slate-900 truncate">{itm.product?.name}</div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>{itm.quantity} x Rs. {Number(itm.unit_price).toFixed(2)}</span>
                          <span className="font-bold text-slate-900">Rs. {Number(itm.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs. {Number(activeSale.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(activeSale.discount) > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Discount:</span>
                        <span>- Rs. {Number(activeSale.discount).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(activeSale.tax) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax / Extra:</span>
                        <span>+ Rs. {Number(activeSale.tax).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-1 text-slate-900">
                      <span>TOTAL:</span>
                      <span>Rs. {Number(activeSale.grand_total).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-700">Thank you for your visit!</div>
                    <div className="text-[9px] text-slate-400">Software by Sales, Purchase & Stock ERP</div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white p-6 border border-slate-200 shadow-sm rounded-xl space-y-4 text-xs">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-base font-black text-[#0F172A]">SALES & INVENTORY ERP</h2>
                      <p className="text-slate-500 text-[11px]">Retail, Procurement & Financial Accounting</p>
                      <p className="text-slate-400 text-[11px]">Phone: +92 300 1234567 | Email: info@saleserp.com</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-[#16A34A] border border-emerald-200">
                        TAX INVOICE
                      </span>
                      <div className="font-mono font-bold text-sm text-[#0F172A] mt-1">{activeSale.invoice_no}</div>
                      <div className="text-slate-400 text-[11px]">Date: {activeSale.sale_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Customer</div>
                      <div className="font-bold text-slate-800 text-xs">{activeSale.customer?.name || 'Walk-in'}</div>
                      <div className="text-slate-500 text-[11px]">{activeSale.customer?.phone || ''}</div>
                      <div className="text-slate-500 text-[11px]">{activeSale.customer?.address || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Payment Status</div>
                      <div className="font-bold text-slate-800 text-xs uppercase">{activeSale.payment_status}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Product Description</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Unit Rate</th>
                        <th className="p-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSale.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td className="p-2 text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800">
                            {item.product?.name}
                            <span className="block font-mono text-[10px] text-slate-400">{item.product?.sku}</span>
                          </td>
                          <td className="p-2 text-center font-semibold">{item.quantity} {item.product?.unit?.short_name || 'Units'}</td>
                          <td className="p-2 text-right">Rs. {Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold text-slate-900">Rs. {Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-2">
                    <div className="w-60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-bold">Rs. {Number(activeSale.subtotal).toFixed(2)}</span>
                      </div>
                      {Number(activeSale.discount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>Discount:</span>
                          <span>- Rs. {Number(activeSale.discount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(activeSale.tax) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax / Extra:</span>
                          <span>+ Rs. {Number(activeSale.tax).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1.5 text-[#0F172A]">
                        <span>Grand Total:</span>
                        <span className="text-[#16A34A]">Rs. {Number(activeSale.grand_total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setActiveSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700 transition-colors"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] font-bold text-xs text-white transition-all shadow-md flex items-center gap-2 cursor-pointer"
              >
                <Printer className="w-4 h-4" />
                <span>Print ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
