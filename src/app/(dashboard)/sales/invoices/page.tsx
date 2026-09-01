'use client';

import React, { useEffect, useState } from 'react';
import apiClient from '@/lib/api';
import { Receipt, Printer, Eye, CheckCircle2, X, Loader2 } from 'lucide-react';

export default function InvoicesPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeSale, setActiveSale] = useState<any | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  useEffect(() => {
    apiClient
      .get('/sales')
      .then((res) => {
        if (res.data?.data) {
          setSales(res.data.data);
        }
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0F172A]">Sales Receipts & Invoices Archive</h1>
          <p className="text-sm text-slate-500">Print or inspect generated customer invoices (Phase 5 Printing Engine)</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2 font-semibold text-[#0F172A] text-sm">
            <Receipt className="w-4 h-4 text-[#16A34A]" />
            Generated Invoices Archive ({sales.length})
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-600">
            <thead className="bg-slate-50 text-xs uppercase font-semibold text-slate-500">
              <tr>
                <th className="px-6 py-3.5">Invoice #</th>
                <th className="px-6 py-3.5">Customer</th>
                <th className="px-6 py-3.5">Date</th>
                <th className="px-6 py-3.5">Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center gap-2">
                      <Loader2 className="w-6 h-6 animate-spin text-[#16A34A]" />
                      <span>Loading invoices...</span>
                    </div>
                  </td>
                </tr>
              ) : sales.length > 0 ? (
                sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-mono font-bold text-[#0F172A]">{sale.invoice_no}</td>
                    <td className="px-6 py-4 font-medium text-slate-800">{sale.customer?.name || 'Walk-in Customer'}</td>
                    <td className="px-6 py-4 text-slate-500">{sale.sale_date}</td>
                    <td className="px-6 py-4 font-extrabold text-[#16A34A]">
                      Rs. {Number(sale.grand_total || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        onClick={() => setActiveSale(sale)}
                        className="px-3.5 py-1.5 rounded-xl bg-emerald-50 text-[#16A34A] hover:bg-[#16A34A] hover:text-white font-bold text-xs border border-emerald-200 transition-all inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" /> Print Receipt
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">
                    No invoices generated yet.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details & Print Modal */}
      {activeSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleIn">
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
                  </div>

                  <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                    {activeSale.items?.map((itm: any, idx: number) => (
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
                    <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-1 text-slate-900">
                      <span>TOTAL:</span>
                      <span>Rs. {Number(activeSale.grand_total).toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="text-center border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-700">Thank you for your visit!</div>
                  </div>
                </div>
              ) : (
                <div className="w-full bg-white p-6 border border-slate-200 shadow-sm rounded-xl space-y-4 text-xs">
                  <div className="flex justify-between items-start border-b border-slate-200 pb-4">
                    <div>
                      <h2 className="text-base font-black text-[#0F172A]">SALES & INVENTORY ERP</h2>
                      <p className="text-slate-500 text-[11px]">Retail & Financial Accounting</p>
                    </div>
                    <div className="text-right">
                      <span className="px-3 py-1 rounded-full text-xs font-black uppercase bg-emerald-100 text-[#16A34A]">
                        TAX INVOICE
                      </span>
                      <div className="font-mono font-bold text-sm text-[#0F172A] mt-1">{activeSale.invoice_no}</div>
                      <div className="text-slate-400 text-[11px]">Date: {activeSale.sale_date}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Customer</div>
                      <div className="font-bold text-slate-800 text-xs">{activeSale.customer?.name || 'Walk-in'}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Status</div>
                      <div className="font-bold text-slate-800 text-xs uppercase">{activeSale.payment_status}</div>
                    </div>
                  </div>

                  <table className="w-full text-left text-xs border border-slate-200 rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 text-slate-600 uppercase font-bold text-[10px]">
                      <tr>
                        <th className="p-2">#</th>
                        <th className="p-2">Product</th>
                        <th className="p-2 text-center">Qty</th>
                        <th className="p-2 text-right">Rate</th>
                        <th className="p-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {activeSale.items?.map((item: any, idx: number) => (
                        <tr key={idx}>
                          <td className="p-2 text-slate-400">{idx + 1}</td>
                          <td className="p-2 font-bold text-slate-800">{item.product?.name}</td>
                          <td className="p-2 text-center">{item.quantity}</td>
                          <td className="p-2 text-right">Rs. {Number(item.unit_price).toFixed(2)}</td>
                          <td className="p-2 text-right font-bold">Rs. {Number(item.subtotal).toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>

                  <div className="flex justify-end pt-2">
                    <div className="w-56 space-y-1 text-xs">
                      <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1 text-[#0F172A]">
                        <span>Grand Total:</span>
                        <span className="text-[#16A34A]">Rs. {Number(activeSale.grand_total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 flex items-center justify-between bg-slate-50 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setActiveSale(null)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 font-bold text-xs text-slate-700"
              >
                Close
              </button>

              <button
                type="button"
                onClick={handlePrint}
                className="px-5 py-2 rounded-xl bg-[#16A34A] hover:bg-[#15803D] font-bold text-xs text-white shadow-md flex items-center gap-2"
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
