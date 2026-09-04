'use client';

import React, { useEffect, useState, useMemo, useRef, useCallback } from 'react';
import Link from 'next/link';
import apiClient from '@/lib/api';
import {
  ArrowLeft,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  CheckCircle2,
  Printer,
  Barcode,
  Search,
  User,
  CreditCard,
  Banknote,
  DollarSign,
  AlertCircle,
  Loader2,
  Layers,
  RotateCcw,
  Sparkles,
  Receipt,
  X,
  FileText,
  TrendingUp,
  Package,
  Calendar,
  Building2,
  Percent
} from 'lucide-react';

interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  current_balance: number;
  is_active: boolean;
}

interface ProductUnit {
  id: number;
  name: string;
  short_name: string;
}

interface Product {
  id: number;
  name: string;
  sku: string;
  barcode?: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  alert_quantity: number;
  unit?: ProductUnit;
  secondary_unit_id?: number | null;
  secondary_unit?: ProductUnit;
  conversion_ratio?: number | null;
}

interface CartItem {
  product_id: number;
  product: Product;
  quantity: number;
  sale_rate: number;
  unit_id: number | '';
  is_secondary_unit: boolean;
  base_quantity: number;
}

interface CompletedSale {
  id: number;
  invoice_no: string;
  sale_date: string;
  subtotal: number;
  discount: number;
  tax: number;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  payment_status: string;
  notes?: string | null;
  payment_method?: string;
  payment_reference?: string;
  cash_received?: number;
  change_amount?: number;
  customer?: Customer;
  items?: Array<{
    id: number;
    quantity: number;
    unit_price: number;
    subtotal: number;
    product?: Product;
  }>;
}

export default function PosBillingPage() {
  // Reference data
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingInitial, setLoadingInitial] = useState(true);

  // Form State
  const [customerId, setCustomerId] = useState<number | ''>('');
  const [saleType, setSaleType] = useState<'cash' | 'credit'>('cash');
  const [paymentMethod, setPaymentMethod] = useState<
    'cash' | 'jazzcash' | 'easypaisa' | 'bank' | 'card' | 'qr' | 'paypal' | 'stripe' | 'cheque' | 'online'
  >('cash');
  const [paymentReference, setPaymentReference] = useState<string>('');
  const [saleDate, setSaleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [invoiceNo, setInvoiceNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [discount, setDiscount] = useState<number>(0);
  const [tax, setTax] = useState<number>(0);

  // Cash Tender State
  const [cashReceived, setCashReceived] = useState<number | ''>('');

  // Cart State
  const [cart, setCart] = useState<CartItem[]>([]);

  // Search & Barcode input
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Product[]>([]);
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // UI state
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [completedSale, setCompletedSale] = useState<CompletedSale | null>(null);
  const [printFormat, setPrintFormat] = useState<'thermal' | 'a4'>('thermal');

  // Input refs for keyboard navigation
  const searchInputRef = useRef<HTMLInputElement>(null);
  const customerSelectRef = useRef<HTMLSelectElement>(null);

  // Load initial data
  useEffect(() => {
    async function loadData() {
      try {
        setLoadingInitial(true);
        const [custRes, prodRes] = await Promise.all([
          apiClient.get('/customers', { params: { is_active: true } }),
          apiClient.get('/products', { params: { is_active: true } }),
        ]);

        if (custRes.data?.data) {
          setCustomers(custRes.data.data);
          // Default is empty string ("") which corresponds to Walk-in Customer
        }
        if (prodRes.data?.data) {
          setProducts(prodRes.data.data);
        }
      } catch (err) {
        console.error('Failed to load POS data', err);
        setErrorMsg('Failed to load active customers and product catalog.');
      } finally {
        setLoadingInitial(false);
      }
    }
    loadData();
  }, []);

  // Product search and barcode filter
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      setIsSearchOpen(false);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const matched = products.filter(
      (p) =>
        p.name.toLowerCase().includes(query) ||
        p.sku.toLowerCase().includes(query) ||
        (p.barcode && p.barcode.toLowerCase().includes(query))
    );

    setSearchResults(matched.slice(0, 8));
    setIsSearchOpen(true);
  }, [searchQuery, products]);

  // Selected customer helper
  const selectedCustomer = useMemo(() => {
    return customers.find((c) => c.id === Number(customerId));
  }, [customers, customerId]);

  // Financial calculations
  const subtotal = useMemo(() => {
    return cart.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.sale_rate) || 0), 0);
  }, [cart]);

  const grandTotal = useMemo(() => {
    return Math.max(0, subtotal - (Number(discount) || 0) + (Number(tax) || 0));
  }, [subtotal, discount, tax]);

  const changeAmount = useMemo(() => {
    if (cashReceived === '' || Number(cashReceived) < grandTotal) return 0;
    return Number(cashReceived) - grandTotal;
  }, [cashReceived, grandTotal]);

  const customerBalanceImpactText = useMemo(() => {
    const methodLabel =
      paymentMethod === 'cash'
        ? 'Cash'
        : paymentMethod === 'jazzcash'
          ? 'JazzCash'
          : paymentMethod === 'easypaisa'
            ? 'Easypaisa'
            : paymentMethod === 'bank'
              ? 'Bank Transfer'
              : paymentMethod === 'card'
                ? 'Card'
                : paymentMethod === 'qr'
                  ? 'QR Payment'
                  : paymentMethod === 'paypal'
                    ? 'PayPal'
                    : paymentMethod === 'stripe'
                      ? 'Stripe'
                      : paymentMethod;

    if (selectedCustomer) {
      if (saleType === 'cash') {
        return `Rs. 0.00 (Settled via ${methodLabel})`;
      }
      return `+ Rs. ${grandTotal.toFixed(2)} (Receivable / Udhaar)`;
    }

    if (saleType === 'cash') {
      return `Walk-in (Full ${methodLabel} Settlement)`;
    }
    return `⚠️ Customer Required for Credit`;
  }, [selectedCustomer, saleType, paymentMethod, grandTotal]);

  // Add Product to Cart
  const addToCart = useCallback((product: Product) => {
    setCart((prev) => {
      const existingIdx = prev.findIndex((item) => item.product_id === product.id && !item.is_secondary_unit);
      if (existingIdx > -1) {
        const updated = [...prev];
        const newQty = updated[existingIdx].quantity + 1;
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          base_quantity: newQty,
        };
        return updated;
      } else {
        return [
          ...prev,
          {
            product_id: product.id,
            product,
            quantity: 1,
            sale_rate: Number(product.selling_price) || 0,
            unit_id: product.unit?.id || '',
            is_secondary_unit: false,
            base_quantity: 1,
          },
        ];
      }
    });

    setSearchQuery('');
    setIsSearchOpen(false);
    searchInputRef.current?.focus();
  }, []);

  // Barcode / Enter key handler in search input
  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const query = searchQuery.trim();
      if (!query) return;

      // Exact barcode match first
      const exactBarcode = products.find((p) => p.barcode && p.barcode.toLowerCase() === query.toLowerCase());
      if (exactBarcode) {
        addToCart(exactBarcode);
        return;
      }

      // Exact SKU match second
      const exactSku = products.find((p) => p.sku.toLowerCase() === query.toLowerCase());
      if (exactSku) {
        addToCart(exactSku);
        return;
      }

      // Top search result fallback
      if (searchResults.length > 0) {
        addToCart(searchResults[0]);
      }
    } else if (e.key === 'Escape') {
      setIsSearchOpen(false);
    }
  };

  // Keyboard Shortcuts (F2: Search, F4: Customer, Ctrl+Enter: Submit)
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F2') {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      } else if (e.key === 'F4') {
        e.preventDefault();
        customerSelectRef.current?.focus();
      } else if (e.key === 'Enter' && e.ctrlKey) {
        e.preventDefault();
        handleCompleteSale();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => window.removeEventListener('keydown', handleGlobalKeyDown);
  }, [cart, customerId, saleType, discount, tax, grandTotal]);

  // Cart item modifications
  const updateQuantity = (index: number, newQty: number) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      const validQty = Math.max(0.01, newQty);
      let baseQty = validQty;

      if (item.is_secondary_unit && item.product.conversion_ratio) {
        baseQty = validQty * Number(item.product.conversion_ratio);
      }

      updated[index] = {
        ...item,
        quantity: validQty,
        base_quantity: baseQty,
      };
      return updated;
    });
  };

  const updateRate = (index: number, newRate: number) => {
    setCart((prev) => {
      const updated = [...prev];
      updated[index] = {
        ...updated[index],
        sale_rate: Math.max(0, newRate),
      };
      return updated;
    });
  };

  const toggleUnit = (index: number, isSecondary: boolean) => {
    setCart((prev) => {
      const updated = [...prev];
      const item = updated[index];
      let baseQty = item.quantity;

      if (isSecondary && item.product.conversion_ratio) {
        baseQty = item.quantity * Number(item.product.conversion_ratio);
      }

      updated[index] = {
        ...item,
        is_secondary_unit: isSecondary,
        unit_id: isSecondary && item.product.secondary_unit_id ? item.product.secondary_unit_id : item.product.unit?.id || '',
        base_quantity: baseQty,
      };
      return updated;
    });
  };

  const removeFromCart = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const clearCart = () => {
    setCart([]);
    setErrorMsg(null);
    setDiscount(0);
    setTax(0);
    setCashReceived('');
    setPaymentReference('');
    setPaymentMethod('cash');
  };

  // Complete Sale Action
  const handleCompleteSale = async () => {
    setErrorMsg(null);

    const calculatedDue = saleType === 'cash' ? 0 : grandTotal;
    if (calculatedDue > 0 && !customerId) {
      setErrorMsg('This sale has an outstanding balance. Please select or add a customer before completing the sale.');
      customerSelectRef.current?.focus();
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Cart is empty. Please add products to the sale.');
      searchInputRef.current?.focus();
      return;
    }

    // Check available stock before sending
    for (const item of cart) {
      if (item.base_quantity > Number(item.product.stock_quantity)) {
        const unitName = item.product.unit?.short_name || 'Units';
        setErrorMsg(
          `Insufficient stock for "${item.product.name}". Available: ${item.product.stock_quantity} ${unitName}, in cart: ${item.base_quantity} ${unitName}.`
        );
        return;
      }
    }

    setSubmitting(true);

    try {
      const payload = {
        customer_id: customerId ? Number(customerId) : null,
        sale_date: saleDate,
        invoice_no: invoiceNo.trim() || undefined,
        payment_type: saleType,
        payment_method: saleType === 'cash' ? paymentMethod : undefined,
        payment_reference: saleType === 'cash' && paymentReference.trim() ? paymentReference.trim() : undefined,
        discount: Number(discount) || 0,
        tax: Number(tax) || 0,
        paid_amount: saleType === 'cash' ? grandTotal : 0,
        notes: notes.trim() || undefined,
        items: cart.map((item) => ({
          product_id: item.product_id,
          quantity: item.quantity,
          sale_rate: item.sale_rate,
          unit_id: item.unit_id ? Number(item.unit_id) : undefined,
          is_secondary_unit: item.is_secondary_unit,
        })),
      };

      const res = await apiClient.post('/sales', payload);

      if (res.data?.success) {
        const createdSaleData: CompletedSale = {
          ...res.data.data,
          cash_received: saleType === 'cash' && paymentMethod === 'cash' && cashReceived !== '' ? Number(cashReceived) : grandTotal,
          change_amount: saleType === 'cash' && paymentMethod === 'cash' ? changeAmount : 0,
          payment_method: saleType === 'cash' ? paymentMethod : 'Credit',
          payment_reference: saleType === 'cash' && paymentReference.trim() ? paymentReference.trim() : undefined,
        };

        setCompletedSale(createdSaleData);
        clearCart();

        // Update local product stocks to keep POS catalog fresh
        setProducts((prev) =>
          prev.map((p) => {
            const soldItem = cart.find((ci) => ci.product_id === p.id);
            if (soldItem) {
              return {
                ...p,
                stock_quantity: Math.max(0, Number(p.stock_quantity) - soldItem.base_quantity),
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      console.error('Sale transaction failed', err);
      const backendErr =
        err.response?.data?.message ||
        (err.response?.data?.errors
          ? Object.values(err.response.data.errors).flat().join(', ')
          : 'Failed to complete sale. Please check inputs and stock.');
      setErrorMsg(backendErr);
    } finally {
      setSubmitting(false);
    }
  };

  const handleNativePrint = () => {
    window.print();
  };

  if (loadingInitial) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[450px] space-y-4">
        <Loader2 className="w-9 h-9 animate-spin text-[#16A34A]" />
        <p className="text-sm font-semibold text-slate-500">Initializing Fast POS Counter Billing Engine...</p>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fadeIn pb-12 max-w-[1900px]">
      {/* POS Top Bar */}
      <div className="bg-white/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:shadow-md transition-all duration-300">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div className="flex items-center gap-4">
            <Link
              href="/sales"
              className="p-3 rounded-2xl bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:scale-105 active:scale-95 transition-all shadow-xs"
              title="Back to Sales List"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-[#0F172A]">
                  Fast POS Counter Billing
                </h1>
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black bg-emerald-50 text-[#16A34A] border border-emerald-200 shadow-2xs">
                  <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse"></span>
                  Phase 5 Active
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 font-medium mt-1">
                Real-time checkout, atomic stock decrement & dual-format receipt printing
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts Hint Bar */}
          <div className="flex items-center gap-2.5 flex-wrap text-xs text-slate-600 font-semibold">
            <span className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors">
              <kbd className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs text-xs">F2</kbd>
              <span>Search / Barcode</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-200 shadow-xs hover:bg-slate-50 transition-colors">
              <kbd className="font-mono font-black text-slate-800 bg-slate-100 px-2 py-0.5 rounded-lg border border-slate-300 shadow-2xs text-xs">F4</kbd>
              <span>Customer</span>
            </span>
            <span className="inline-flex items-center gap-2 bg-emerald-50 px-3.5 py-2 rounded-xl border border-emerald-200 text-[#16A34A] shadow-xs hover:bg-emerald-100 transition-colors">
              <kbd className="font-mono font-black text-emerald-900 bg-white px-2 py-0.5 rounded-lg border border-emerald-300 shadow-2xs text-xs">Ctrl+Enter</kbd>
              <span className="font-bold">Checkout</span>
            </span>
          </div>
        </div>
      </div>

      {/* Alert Error Box */}
      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm flex items-start gap-3 shadow-xs animate-shake">
          <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
          <div className="flex-1">
            <span className="font-black text-rose-950">Checkout Blocked: </span>
            <span className="font-semibold text-rose-800">{errorMsg}</span>
          </div>
          <button
            onClick={() => setErrorMsg(null)}
            className="p-1.5 rounded-xl text-rose-500 hover:text-rose-800 hover:bg-rose-100 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Main POS Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 7 Columns: Product Search, Barcode, and Cart Items */}
        <div className="lg:col-span-7 space-y-6">
          {/* Barcode & Search Input */}
          <div className="relative bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 space-y-3">
            <div className="flex items-center justify-between">
              <label className="block text-xs sm:text-sm font-black uppercase tracking-wider text-[#0F172A] flex items-center gap-2">
                <Barcode className="w-4.5 h-4.5 text-[#16A34A]" />
                <span>Scan Barcode / Search Product</span>
              </label>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg">
                Press F2 to focus
              </span>
            </div>
            <div className="relative">
              <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4 transition-colors group-focus-within:text-[#16A34A]" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearchKeyDown}
                placeholder="Scan barcode with scanner gun or type product name / SKU (Press Enter to add)..."
                className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm sm:text-base font-bold text-[#0F172A] placeholder:text-slate-400 placeholder:font-normal focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all shadow-2xs"
                autoFocus
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 p-1 rounded-lg"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Live Autocomplete Dropdown */}
            {isSearchOpen && searchResults.length > 0 && (
              <div className="absolute left-6 right-6 top-full mt-2 bg-white rounded-3xl border border-slate-200 shadow-2xl z-40 max-h-80 overflow-y-auto divide-y divide-slate-100 backdrop-blur-md">
                <div className="p-3 bg-slate-50/90 border-b border-slate-100 text-xs font-black text-slate-600 uppercase tracking-wider flex justify-between">
                  <span>Matched Products ({searchResults.length})</span>
                  <span>Click or Press Enter to Add</span>
                </div>
                {searchResults.map((prod) => (
                  <button
                    key={prod.id}
                    type="button"
                    onClick={() => addToCart(prod)}
                    className="w-full p-4 text-left hover:bg-emerald-50/80 transition-all flex items-center justify-between group cursor-pointer"
                  >
                    <div className="space-y-1">
                      <div className="font-extrabold text-sm sm:text-base text-[#0F172A] group-hover:text-[#16A34A] transition-colors flex items-center gap-2.5">
                        <span>{prod.name}</span>
                        {prod.stock_quantity <= (prod.alert_quantity || 5) && (
                          <span className="text-xs font-bold px-2 py-0.5 rounded-md bg-amber-100 text-amber-800">
                            Low Stock
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-slate-500 font-mono flex items-center gap-2.5">
                        <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-800 font-bold">
                          SKU: {prod.sku}
                        </span>
                        {prod.barcode && (
                          <span className="text-slate-500">
                            Barcode: {prod.barcode}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <div className="font-black text-sm sm:text-base text-[#16A34A] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                        Rs. {Number(prod.selling_price || 0).toFixed(2)}
                      </div>
                      <div className={`text-xs font-bold ${prod.stock_quantity > 0 ? 'text-slate-600' : 'text-rose-600'}`}>
                        Avail: <span className="font-black">{prod.stock_quantity}</span> {prod.unit?.short_name || 'Units'}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Cart Table Container */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/80">
              <div className="flex items-center gap-3 font-black text-base text-[#0F172A]">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <ShoppingCart className="w-4.5 h-4.5" />
                </div>
                <span>Current Bill Items</span>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-slate-200 text-slate-800">
                  {cart.length}
                </span>
              </div>
              {cart.length > 0 && (
                <button
                  type="button"
                  onClick={clearCart}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs text-rose-600 hover:text-rose-800 hover:bg-rose-50 font-bold transition-colors border border-transparent hover:border-rose-200 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Clear Cart
                </button>
              )}
            </div>

            <div className="overflow-x-auto max-h-[480px] overflow-y-auto">
              <table className="w-full text-left text-sm text-slate-700">
                <thead className="bg-slate-50/90 text-slate-600 uppercase font-bold tracking-wider text-xs sticky top-0 border-b border-slate-200 z-10 backdrop-blur-xs">
                  <tr>
                    <th className="px-5 py-3.5">Product</th>
                    <th className="px-4 py-3.5 text-center">Unit</th>
                    <th className="px-4 py-3.5 text-center">Qty</th>
                    <th className="px-4 py-3.5 text-right">Rate (Rs.)</th>
                    <th className="px-5 py-3.5 text-right">Line Total</th>
                    <th className="px-3 py-3.5 text-center"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {cart.length > 0 ? (
                    cart.map((item, index) => {
                      const hasSecondary = !!(item.product.secondary_unit_id && item.product.conversion_ratio);
                      const lineTotal = item.quantity * item.sale_rate;
                      const isLowOrExceeds = item.base_quantity > Number(item.product.stock_quantity);

                      return (
                        <tr
                          key={index}
                          className={`hover:bg-emerald-50/30 transition-colors ${isLowOrExceeds ? 'bg-rose-50/50' : ''
                            }`}
                        >
                          <td className="px-5 py-4">
                            <div className="font-bold text-slate-900 text-sm sm:text-base">{item.product.name}</div>
                            <div className="text-xs text-slate-500 font-mono flex items-center gap-2 mt-1">
                              <span>SKU: {item.product.sku}</span>
                              <span>•</span>
                              <span className="font-semibold text-slate-600">
                                Avail: {item.product.stock_quantity} {item.product.unit?.short_name || ''}
                              </span>
                            </div>
                            {item.is_secondary_unit && item.product.conversion_ratio && (
                              <div className="text-xs text-emerald-800 font-bold mt-1 bg-emerald-50 px-2 py-0.5 rounded-md inline-block border border-emerald-200">
                                = {item.base_quantity} {item.product.unit?.short_name || ''} base unit
                              </div>
                            )}
                          </td>

                          {/* Unit Selector */}
                          <td className="px-4 py-4 text-center">
                            {hasSecondary ? (
                              <select
                                value={item.is_secondary_unit ? 'secondary' : 'base'}
                                onChange={(e) => toggleUnit(index, e.target.value === 'secondary')}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-2xs"
                              >
                                <option value="base">{item.product.unit?.short_name || 'Base'}</option>
                                <option value="secondary">
                                  {item.product.secondary_unit?.short_name || 'Sec'}
                                </option>
                              </select>
                            ) : (
                              <span className="inline-block px-3 py-1.5 rounded-xl bg-slate-100 font-bold text-slate-700 text-xs border border-slate-200/80">
                                {item.product.unit?.short_name || 'Units'}
                              </span>
                            )}
                          </td>

                          {/* Quantity Controls */}
                          <td className="px-4 py-4 text-center">
                            <div className="inline-flex items-center gap-1.5 bg-slate-100 p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 disabled:opacity-30 transition-all shadow-2xs cursor-pointer disabled:cursor-not-allowed"
                              >
                                <Minus className="w-3.5 h-3.5" />
                              </button>
                              <input
                                type="number"
                                min="0.01"
                                step="any"
                                value={item.quantity}
                                onChange={(e) => updateQuantity(index, Number(e.target.value))}
                                className="w-16 px-1.5 py-1 text-center bg-white border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-[#16A34A] shadow-2xs"
                              />
                              <button
                                type="button"
                                onClick={() => updateQuantity(index, item.quantity + 1)}
                                className="w-7 h-7 rounded-xl bg-white hover:bg-slate-200 flex items-center justify-center font-bold text-slate-700 transition-all shadow-2xs cursor-pointer"
                              >
                                <Plus className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>

                          {/* Sale Rate */}
                          <td className="px-4 py-4 text-right">
                            <div className="relative inline-block">
                              <input
                                type="number"
                                min="0"
                                step="any"
                                value={item.sale_rate}
                                onChange={(e) => updateRate(index, Number(e.target.value))}
                                className="w-28 px-3 py-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-2xs"
                              />
                            </div>
                          </td>

                          {/* Line Total */}
                          <td className="px-5 py-4 text-right font-black text-slate-900 text-sm sm:text-base">
                            <span className="text-[#0F172A]">Rs. </span>
                            <span className="text-[#16A34A] font-black">{lineTotal.toFixed(2)}</span>
                          </td>

                          {/* Remove */}
                          <td className="px-3 py-4 text-center">
                            <button
                              type="button"
                              onClick={() => removeFromCart(index)}
                              className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-20 text-center text-slate-400">
                        <div className="w-16 h-16 rounded-3xl bg-emerald-50 text-[#16A34A] mx-auto mb-3 flex items-center justify-center border border-emerald-100 shadow-2xs">
                          <ShoppingCart className="w-8 h-8" />
                        </div>
                        <div className="font-black text-base text-[#0F172A]">Your POS Cart is Empty</div>
                        <div className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                          Scan barcode with a barcode scanner gun or search items in the top bar to start billing
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Customer, Payment, live totals, checkout */}
        <div className="lg:col-span-5 space-y-6">
          {/* Customer & Sale Mode Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100">
              <div className="flex items-center gap-3 font-black text-base text-[#0F172A]">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <User className="w-4.5 h-4.5" />
                </div>
                <span>Customer & Billing Type</span>
              </div>
              <span className="text-xs font-bold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-lg font-mono">
                F4 Focus
              </span>
            </div>

            {/* Customer Dropdown */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                  Customer
                </label>
                <Link
                  href="/customers/new"
                  target="_blank"
                  className="text-xs font-bold text-[#16A34A] hover:text-[#059669] hover:underline flex items-center gap-1 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" /> Add New Customer
                </Link>
              </div>
              <select
                ref={customerSelectRef}
                value={customerId}
                onChange={(e) => setCustomerId(e.target.value ? Number(e.target.value) : '')}
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold text-[#0F172A] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] transition-all shadow-2xs"
              >
                <option value="">👤 Walk-in Customer (Counter Sale)</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.phone ? `(${c.phone})` : ''}
                  </option>
                ))}
              </select>

              {selectedCustomer ? (
                <div className="p-3 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between text-xs sm:text-sm animate-fadeIn">
                  <span className="text-blue-900 font-bold">Current Balance / Khata:</span>
                  <span className="font-black text-blue-900 bg-white px-3 py-1 rounded-xl border border-blue-200 shadow-2xs">
                    Rs. {Number(selectedCustomer.current_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </span>
                </div>
              ) : (
                <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-500 font-medium">
                  💡 <span className="font-bold text-slate-700">Walk-in sale:</span> Direct counter settlement without ledger tracking.
                </div>
              )}
            </div>

            {/* Sale Type: Immediate Payment vs Credit / Udhaar */}
            <div className="space-y-2.5">
              <label className="block text-xs sm:text-sm font-bold uppercase tracking-wider text-slate-700">
                Sale Type / Payment Mode
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setSaleType('cash')}
                  className={`py-3 px-3.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${saleType === 'cash'
                    ? 'bg-[#16A34A] text-white border-[#15803D] shadow-md shadow-[#16A34A]/25 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                  <Banknote className="w-4 h-4" />
                  <span>Immediate Payment</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSaleType('credit')}
                  className={`py-3 px-3.5 rounded-2xl border text-xs sm:text-sm font-black flex items-center justify-center gap-2 transition-all cursor-pointer ${saleType === 'credit'
                    ? 'bg-purple-600 text-white border-purple-700 shadow-md shadow-purple-600/25 scale-[1.02]'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Credit / Udhaar</span>
                </button>
              </div>

              {/* Dynamic Warning for Credit without Registered Customer */}
              {saleType === 'credit' && !customerId && (
                <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200 flex items-start gap-3 text-xs sm:text-sm text-amber-900 font-medium animate-fadeIn">
                  <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold">Customer Required for Credit:</span> This sale has an outstanding balance. Please select or add a customer before completing the sale.
                  </div>
                </div>
              )}
            </div>

            {/* Immediate Payment Method & Tender Options */}
            {saleType === 'cash' && (
              <div className="p-5 bg-emerald-50/70 rounded-3xl border border-emerald-200/80 space-y-4">
                {/* Payment Method Selector */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center text-xs sm:text-sm">
                    <span className="font-black text-slate-800">Payment Method:</span>
                    <span className="text-xs font-black text-emerald-800 uppercase px-3 py-1 bg-emerald-100 rounded-xl border border-emerald-200">
                      {paymentMethod === 'cash'
                        ? 'Cash Payment'
                        : paymentMethod === 'jazzcash'
                          ? 'JazzCash'
                          : paymentMethod === 'easypaisa'
                            ? 'Easypaisa'
                            : paymentMethod === 'bank'
                              ? 'Bank Transfer'
                              : paymentMethod === 'card'
                                ? 'Card Payment'
                                : paymentMethod === 'qr'
                                  ? 'QR Payment'
                                  : paymentMethod === 'paypal'
                                    ? 'PayPal'
                                    : paymentMethod === 'stripe'
                                      ? 'Stripe'
                                      : paymentMethod}
                    </span>
                  </div>

                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] shadow-2xs"
                  >
                    <optgroup label="🇵🇰 Pakistan Payment Methods">
                      <option value="cash">💵 Cash</option>
                      <option value="jazzcash">📱 JazzCash</option>
                      <option value="easypaisa">📲 Easypaisa</option>
                      <option value="bank">🏦 Bank Transfer</option>
                      <option value="card">💳 Card Payment / POS</option>
                      <option value="qr">📷 QR Payment</option>
                    </optgroup>
                    <optgroup label="🌐 International Payment Methods">
                      <option value="paypal">🅿️ PayPal</option>
                      <option value="stripe">💳 Stripe</option>
                    </optgroup>
                    <optgroup label="Legacy / Additional">
                      <option value="cheque">📝 Cheque</option>
                      <option value="online">🌐 Online Transfer</option>
                    </optgroup>
                  </select>
                </div>

                {/* Conditional Cash Tender or Transaction Reference */}
                {paymentMethod === 'cash' ? (
                  <div className="space-y-3 pt-2 border-t border-emerald-200/60">
                    {/* Quick Cash Tender Buttons */}
                    <div className="space-y-2">
                      <div className="text-xs font-black text-slate-700">Quick Cash Tender:</div>
                      <div className="grid grid-cols-4 gap-2">
                        <button
                          type="button"
                          onClick={() => setCashReceived(grandTotal)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#16A34A] transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Exact
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(500)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#16A34A] transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Rs. 500
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(1000)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#16A34A] transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Rs. 1,000
                        </button>
                        <button
                          type="button"
                          onClick={() => setCashReceived(5000)}
                          className="py-2 rounded-xl bg-white border border-slate-200 text-xs font-black text-slate-800 hover:bg-emerald-50 hover:border-emerald-300 hover:text-[#16A34A] transition-all shadow-2xs active:scale-95 cursor-pointer"
                        >
                          Rs. 5,000
                        </button>
                      </div>
                    </div>

                    {/* Received & Change Inputs */}
                    <div className="grid grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Cash Received</label>
                        <input
                          type="number"
                          min="0"
                          step="any"
                          placeholder="0.00"
                          value={cashReceived}
                          onChange={(e) => setCashReceived(e.target.value === '' ? '' : Number(e.target.value))}
                          className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-black text-[#0F172A] focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] shadow-2xs"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-700 mb-1.5">Change Due</label>
                        <div className="w-full px-3.5 py-2.5 bg-white border border-emerald-200 rounded-xl text-sm font-black text-[#16A34A] shadow-2xs flex items-center justify-between">
                          <span>Rs.</span>
                          <span>{changeAmount.toFixed(2)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2 pt-2 border-t border-emerald-200/60">
                    <label className="block text-xs font-black text-slate-800">
                      Transaction Reference <span className="text-slate-500 font-medium">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      value={paymentReference}
                      onChange={(e) => setPaymentReference(e.target.value)}
                      placeholder={
                        paymentMethod === 'jazzcash'
                          ? 'e.g. JazzCash TID / Reference ID (Optional)'
                          : paymentMethod === 'easypaisa'
                            ? 'e.g. Easypaisa TID / Reference ID (Optional)'
                            : paymentMethod === 'bank'
                              ? 'e.g. Bank Reference / Cheque No. (Optional)'
                              : paymentMethod === 'card'
                                ? 'e.g. Card Auth / Approval Code (Optional)'
                                : paymentMethod === 'qr'
                                  ? 'e.g. QR Payment Reference (Optional)'
                                  : paymentMethod === 'paypal'
                                    ? 'e.g. PayPal Transaction ID (Optional)'
                                    : paymentMethod === 'stripe'
                                      ? 'e.g. Stripe Payment ID (Optional)'
                                      : 'e.g. Transaction Reference (Optional)'
                      }
                      className="w-full px-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#16A34A]/25 focus:border-[#16A34A] shadow-2xs"
                    />
                    <p className="text-xs text-slate-500 font-medium italic">
                      Recorded in payment record and printable invoice without contacting external gateways.
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Financial Summary & Checkout Card */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all duration-300 space-y-5">
            <div className="flex items-center justify-between pb-3.5 border-b border-slate-100 font-black text-base text-[#0F172A]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl bg-emerald-100 text-[#16A34A] flex items-center justify-center font-bold">
                  <Receipt className="w-4.5 h-4.5" />
                </div>
                <span>Bill Totals</span>
              </div>
              <span className="text-xs font-black text-[#16A34A] bg-emerald-50 px-3 py-1 rounded-xl border border-emerald-200">
                POS Fast Checkout
              </span>
            </div>

            <div className="space-y-3.5 text-sm">
              <div className="flex justify-between items-center text-slate-600 font-bold">
                <span>Items Subtotal:</span>
                <span className="font-black text-slate-900 text-base">Rs. {subtotal.toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-slate-600 font-bold">
                <label htmlFor="sale-discount" className="cursor-pointer">Discount (Rs.):</label>
                <input
                  id="sale-discount"
                  type="number"
                  min="0"
                  step="any"
                  value={discount}
                  onChange={(e) => setDiscount(Math.max(0, Number(e.target.value)))}
                  className="w-32 px-3 py-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-2xs"
                />
              </div>

              <div className="flex justify-between items-center text-slate-600 font-bold">
                <label htmlFor="sale-tax" className="cursor-pointer">Tax / Extra (Rs.):</label>
                <input
                  id="sale-tax"
                  type="number"
                  min="0"
                  step="any"
                  value={tax}
                  onChange={(e) => setTax(Math.max(0, Number(e.target.value)))}
                  className="w-32 px-3 py-2 text-right bg-slate-50 border border-slate-200 rounded-xl text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#16A34A]/20 focus:border-[#16A34A] shadow-2xs"
                />
              </div>

              {/* Grand Total Highlight Card */}
              <div className="p-4 rounded-2xl bg-slate-950 text-white flex justify-between items-center shadow-lg border border-slate-800">
                <div>
                  <div className="text-xs uppercase font-black tracking-wider text-slate-400">Total Payable</div>
                  <div className="text-sm font-bold text-slate-300">Grand Total</div>
                </div>
                <div className="text-right">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400 drop-shadow-xs">
                    Rs. {grandTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </div>
                </div>
              </div>

              {/* Impact summary */}
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 text-xs sm:text-sm text-slate-600 flex justify-between items-center font-medium">
                <span>Customer Balance Impact:</span>
                <span className="font-extrabold text-slate-900">
                  {customerBalanceImpactText}
                </span>
              </div>
            </div>

            {/* Checkout Button */}
            <button
              type="button"
              onClick={handleCompleteSale}
              disabled={submitting || cart.length === 0 || (saleType === 'credit' && !customerId)}
              className=" w-full  py-4  px-6 rounded-2xl bg-[#16A34A] hover:bg-[#059669] text-white font-black text-base transition-all shadow-xl hover:shadow-2xl shadow-[#16A34A]/25 flex items-center justify-center gap-3 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.01] active:scale-[0.99]"
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Processing Sale & Decrementing Stock...</span>
                </>
              ) : saleType === 'credit' && !customerId ? (
                <>
                  <AlertCircle className="w-5 h-5" />
                  <span>Select Customer to Complete Credit Sale</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Complete Sale & Print Receipt (Ctrl+Enter)</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Dual Format Print Receipt Modal (80mm Thermal & A4) */}
      {completedSale && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 animate-scaleIn">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white/95 backdrop-blur-md z-10">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-50 text-[#16A34A] flex items-center justify-center border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-base text-[#0F172A]">Sale Completed Successfully</h3>
                  <p className="text-xs text-slate-500 font-mono">Invoice #{completedSale.invoice_no}</p>
                </div>
              </div>

              {/* Format Toggle Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200/80">
                <button
                  type="button"
                  onClick={() => setPrintFormat('thermal')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${printFormat === 'thermal'
                    ? 'bg-white text-[#16A34A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  80mm Thermal
                </button>
                <button
                  type="button"
                  onClick={() => setPrintFormat('a4')}
                  className={`px-3 py-1 rounded-lg text-xs font-black transition-all cursor-pointer ${printFormat === 'a4'
                    ? 'bg-white text-[#16A34A] shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                    }`}
                >
                  A4 Standard
                </button>
              </div>

              <button
                onClick={() => setCompletedSale(null)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Preview Area */}
            <div className="p-6 bg-slate-50/70 flex justify-center">
              {printFormat === 'thermal' ? (
                /* 80mm Thermal Receipt Layout */
                <div id="printable-thermal" className="w-[300px] bg-white p-4 border border-slate-200 shadow-sm text-xs font-mono space-y-3 rounded-xl text-slate-800">
                  <div className="text-center space-y-0.5 border-b border-dashed border-slate-300 pb-2">
                    <div className="font-black text-sm uppercase tracking-wide text-slate-900">SALES ERP STORE</div>
                    <div className="text-[10px] text-slate-500">Retail & Wholesale Distribution</div>
                    <div className="text-[10px] text-slate-500">Tel: +92 300 1234567</div>
                  </div>

                  <div className="space-y-0.5 text-[11px]">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Invoice:</span>
                      <span className="font-bold">{completedSale.invoice_no}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Date:</span>
                      <span>{completedSale.sale_date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Customer:</span>
                      <span className="font-bold truncate max-w-[170px]">
                        {completedSale.customer?.name || 'Walk-in Customer'}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Type:</span>
                      <span className="uppercase font-bold">{completedSale.payment_status} ({completedSale.payment_method})</span>
                    </div>
                    {completedSale.payment_reference && (
                      <div className="flex justify-between text-[10px] text-slate-600">
                        <span className="text-slate-500">Txn Ref:</span>
                        <span className="font-mono font-bold truncate max-w-[170px]">{completedSale.payment_reference}</span>
                      </div>
                    )}
                  </div>

                  {/* Items List */}
                  <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                    {completedSale.items?.map((itm, idx) => (
                      <div key={idx} className="space-y-0.5">
                        <div className="font-bold text-slate-900 truncate">{itm.product?.name || 'Item'}</div>
                        <div className="flex justify-between text-[10px] text-slate-600">
                          <span>{itm.quantity} x Rs. {Number(itm.unit_price).toFixed(2)}</span>
                          <span className="font-bold text-slate-900">Rs. {Number(itm.subtotal).toFixed(2)}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Totals */}
                  <div className="space-y-1 text-[11px] pt-1">
                    <div className="flex justify-between">
                      <span>Subtotal:</span>
                      <span>Rs. {Number(completedSale.subtotal).toFixed(2)}</span>
                    </div>
                    {Number(completedSale.discount) > 0 && (
                      <div className="flex justify-between text-rose-600 font-bold">
                        <span>Discount:</span>
                        <span>- Rs. {Number(completedSale.discount).toFixed(2)}</span>
                      </div>
                    )}
                    {Number(completedSale.tax) > 0 && (
                      <div className="flex justify-between">
                        <span>Tax / Freight:</span>
                        <span>+ Rs. {Number(completedSale.tax).toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-sm border-t border-slate-300 pt-1 text-slate-900">
                      <span>TOTAL:</span>
                      <span>Rs. {Number(completedSale.grand_total).toFixed(2)}</span>
                    </div>

                    {completedSale.cash_received && (
                      <>
                        <div className="flex justify-between text-slate-600 text-[10px]">
                          <span>Cash Received:</span>
                          <span>Rs. {Number(completedSale.cash_received).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[10px] text-emerald-700">
                          <span>Change:</span>
                          <span>Rs. {Number(completedSale.change_amount || 0).toFixed(2)}</span>
                        </div>
                      </>
                    )}
                  </div>

                  <div className="text-center border-t border-dashed border-slate-300 pt-2 space-y-0.5">
                    <div className="text-[10px] font-bold text-slate-700">Thank you for your business!</div>
                    <div className="text-[9px] text-slate-400">Software by Sales, Purchase & Stock ERP</div>
                  </div>
                </div>
              ) : (
                /* A4 Standard Invoice Layout */
                <div id="printable-a4" className="w-full bg-white p-6 border border-slate-200 shadow-sm rounded-xl space-y-4 text-xs">
                  {/* Company Header */}
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
                      <div className="font-mono font-bold text-sm text-[#0F172A] mt-1">{completedSale.invoice_no}</div>
                      <div className="text-slate-400 text-[11px]">Date: {completedSale.sale_date}</div>
                    </div>
                  </div>

                  {/* Customer Snapshot */}
                  <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                    <div>
                      <div className="text-[10px] font-bold uppercase text-slate-400">Billed To</div>
                      <div className="font-bold text-slate-800 text-xs">{completedSale.customer?.name || 'Walk-in Customer'}</div>
                      <div className="text-slate-500 text-[11px]">{completedSale.customer?.phone || ''}</div>
                      <div className="text-slate-500 text-[11px]">{completedSale.customer?.address || ''}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-[10px] font-bold uppercase text-slate-400">Payment Details</div>
                      <div className="font-bold text-slate-800 text-xs">Type: {completedSale.payment_status?.toUpperCase()}</div>
                      <div className="text-slate-500 text-[11px]">Method: {completedSale.payment_method?.toUpperCase()}</div>
                      {completedSale.payment_reference && (
                        <div className="text-slate-500 text-[10px]">
                          Txn Ref: <span className="font-mono font-bold text-slate-700">{completedSale.payment_reference}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Line items table */}
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
                      {completedSale.items?.map((item, idx) => (
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

                  {/* Financial Breakdown */}
                  <div className="flex justify-end pt-2">
                    <div className="w-60 space-y-1.5 text-xs">
                      <div className="flex justify-between text-slate-600">
                        <span>Subtotal:</span>
                        <span className="font-bold">Rs. {Number(completedSale.subtotal).toFixed(2)}</span>
                      </div>
                      {Number(completedSale.discount) > 0 && (
                        <div className="flex justify-between text-rose-600 font-bold">
                          <span>Discount:</span>
                          <span>- Rs. {Number(completedSale.discount).toFixed(2)}</span>
                        </div>
                      )}
                      {Number(completedSale.tax) > 0 && (
                        <div className="flex justify-between text-slate-600">
                          <span>Tax / Extra:</span>
                          <span>+ Rs. {Number(completedSale.tax).toFixed(2)}</span>
                        </div>
                      )}
                      <div className="flex justify-between font-black text-sm border-t border-slate-200 pt-1.5 text-[#0F172A]">
                        <span>Grand Total:</span>
                        <span className="text-[#16A34A]">Rs. {Number(completedSale.grand_total).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Actions */}
            <div className="p-4 sm:p-5 border-t border-slate-100 flex items-center justify-between bg-slate-50/80 rounded-b-3xl">
              <button
                type="button"
                onClick={() => setCompletedSale(null)}
                className="px-4 py-2.5 rounded-xl bg-slate-200 hover:bg-slate-300 font-black text-xs text-slate-700 transition-colors cursor-pointer"
              >
                Start New Sale
              </button>

              <button
                type="button"
                onClick={handleNativePrint}
                className="px-5 py-2.5 rounded-xl bg-[#16A34A] hover:bg-[#059669] font-black text-xs text-white transition-all shadow-md shadow-[#16A34A]/25 flex items-center gap-2 cursor-pointer hover:scale-105 active:scale-95"
              >
                <Printer className="w-4 h-4" />
                <span>Print Invoice ({printFormat === 'thermal' ? '80mm' : 'A4'})</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
