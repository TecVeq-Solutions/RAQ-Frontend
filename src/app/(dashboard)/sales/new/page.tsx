'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ShoppingCart, Plus, Trash2, CheckCircle2, DollarSign } from 'lucide-react';

export default function NewSalePage() {
  const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash');
  const [customerName, setCustomerName] = useState('');
  const [product, setProduct] = useState('');
  const [quantity, setQuantity] = useState<number>(1);
  const [rate, setRate] = useState<number>(0);
  const [discount, setDiscount] = useState<number>(0);
  const [paidAmount, setPaidAmount] = useState<number>(0);

  const subtotal = quantity * rate;
  const grandTotal = Math.max(0, subtotal - discount);
  const remainingAmount = Math.max(0, grandTotal - paidAmount);

  return (
    <div className="space-y-6 animate-fadeIn max-w-4xl mx-auto pb-12">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/sales" className="p-2 rounded-xl bg-white border border-slate-200 text-slate-600 hover:bg-slate-50">
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-[#0F172A]">New Sale Invoice</h1>
            <p className="text-sm text-slate-500">Record cash or credit sale (PRD S-01, S-02, S-03)</p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-2xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6">
        {/* Sale Type Selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
            Sale Type
          </label>
          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => setSaleType('cash')}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                saleType === 'cash'
                  ? 'bg-emerald-50 text-[#16A34A] border-[#16A34A] shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <span>💵 Cash Sale</span>
            </button>

            <button
              type="button"
              onClick={() => setSaleType('credit')}
              className={`flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                saleType === 'credit'
                  ? 'bg-purple-50 text-purple-700 border-purple-300 shadow-xs'
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}
            >
              <span>💳 Credit Sale</span>
            </button>
          </div>
        </div>

        {/* Customer & Product Information */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Customer Name {saleType === 'credit' && <span className="text-rose-500">*</span>}
            </label>
            <input
              type="text"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Ali Ahmed"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Select Product *
            </label>
            <input
              type="text"
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              placeholder="e.g. Premium Basmati Rice 5kg"
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>
        </div>

        {/* Pricing & Quantities */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Quantity *
            </label>
            <input
              type="number"
              min={1}
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Rate (Rs.) *
            </label>
            <input
              type="number"
              min={0}
              value={rate}
              onChange={(e) => setRate(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Discount (Rs.)
            </label>
            <input
              type="number"
              min={0}
              value={discount}
              onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>
        </div>

        {/* Financial Calculation Box */}
        <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Subtotal:</span>
            <span className="font-semibold text-slate-800">Rs. {subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-500">Discount:</span>
            <span className="font-semibold text-rose-600">- Rs. {discount.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-base font-extrabold border-t border-slate-200 pt-2 text-[#0F172A]">
            <span>Grand Total:</span>
            <span className="text-[#16A34A]">Rs. {grandTotal.toFixed(2)}</span>
          </div>
        </div>

        {/* Payment Calculation */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Paid Amount (Rs.)
            </label>
            <input
              type="number"
              min={0}
              value={paidAmount}
              onChange={(e) => setPaidAmount(Math.max(0, Number(e.target.value)))}
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2">
              Remaining Balance (Rs.)
            </label>
            <div className="w-full px-4 py-2.5 bg-slate-100 border border-slate-200 rounded-xl text-sm font-bold text-slate-700">
              Rs. {remainingAmount.toFixed(2)}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="w-full py-3.5 rounded-xl bg-[#16A34A] text-white font-bold text-base hover:bg-[#059669] transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer"
        >
          <CheckCircle2 className="w-5 h-5" />
          <span>Save & Generate Invoice Receipt</span>
        </button>
      </div>
    </div>
  );
}
