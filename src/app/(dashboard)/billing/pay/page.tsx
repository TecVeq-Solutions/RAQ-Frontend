'use client';

import React, { useEffect, useState } from 'react';
import { tenantPaymentApi, PaymentGateway, PaymentTransaction } from '@/lib/paymentApi';
import { CreditCard, QrCode, UploadCloud, CheckCircle2, ChevronRight, AlertTriangle } from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Suspense } from 'react';

function PaymentCheckoutContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const packageId = searchParams.get('package_id');
  const amountParam = searchParams.get('amount');
  const [amount, setAmount] = useState<number>(amountParam ? parseFloat(amountParam) : 0);
  
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [selectedGateway, setSelectedGateway] = useState<PaymentGateway | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  
  const [step, setStep] = useState<1 | 2 | 3>(1); // 1: Select Method, 2: Pay (QR/API), 3: Success
  const [transaction, setTransaction] = useState<PaymentTransaction | null>(null);
  
  // QR State
  const [referenceId, setReferenceId] = useState('');
  const [proofFile, setProofFile] = useState<File | null>(null);

  useEffect(() => {
    fetchGateways();
  }, []);

  const fetchGateways = async () => {
    setLoading(true);
    try {
      const gws = await tenantPaymentApi.getActiveGateways();
      setGateways(gws);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInitiate = async () => {
    if (!selectedGateway || !packageId || amount <= 0) return;
    setActionLoading(true);
    try {
      const tx = await tenantPaymentApi.initiatePayment({
        package_id: parseInt(packageId),
        gateway_id: selectedGateway.id,
        amount: amount,
      });
      setTransaction(tx);
      
      if (selectedGateway.type === 'qr') {
        setStep(2); // Go to QR upload step
      } else {
        // Mock external redirect for API gateway (like JazzCash/Safepay)
        setStep(3);
      }
    } catch (err: any) {
      alert('Failed to initiate payment: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleSubmitProof = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction || !referenceId || !proofFile) return;
    
    setActionLoading(true);
    try {
      const formData = new FormData();
      formData.append('reference_id', referenceId);
      formData.append('proof_file', proofFile);
      
      await tenantPaymentApi.submitProof(transaction.id, formData);
      setStep(3);
    } catch (err: any) {
      alert('Failed to submit proof: ' + err.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-slate-500 font-medium">Loading secure checkout...</div>;

  return (
    <div className="max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 font-sans animate-in fade-in zoom-in-95 duration-500">
      
      {/* Header */}
      <div className="mb-8 text-center">
        <h1 className="text-2xl font-black text-slate-900 flex items-center justify-center gap-2">
          <CreditCard className="w-6 h-6 text-indigo-600" />
          Secure Checkout
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-2">
          Complete your payment to activate or renew your subscription.
        </p>
      </div>

      {/* Step 1: Select Payment Method */}
      {step === 1 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="flex justify-between items-center mb-6 pb-6 border-b border-slate-100">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Total Amount</p>
              <h2 className="text-3xl font-black text-slate-900">PKR {amount.toLocaleString()}</h2>
            </div>
          </div>

          <h3 className="text-sm font-bold text-slate-900 mb-4">Select Payment Method</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
            {gateways.map(gw => (
              <label 
                key={gw.id}
                className={`relative flex flex-col p-5 cursor-pointer rounded-2xl border-2 transition-all ${
                  selectedGateway?.id === gw.id 
                    ? 'border-indigo-600 bg-indigo-50/50' 
                    : 'border-slate-200 hover:border-indigo-300'
                }`}
              >
                <input 
                  type="radio" 
                  name="gateway" 
                  className="sr-only" 
                  onChange={() => setSelectedGateway(gw)}
                  checked={selectedGateway?.id === gw.id}
                />
                <div className="flex items-center gap-3 mb-2">
                  <div className={`p-2 rounded-xl ${gw.type === 'qr' ? 'bg-emerald-100 text-emerald-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {gw.type === 'qr' ? <QrCode className="w-5 h-5"/> : <CreditCard className="w-5 h-5"/>}
                  </div>
                  <span className="font-bold text-slate-900 capitalize">{gw.name}</span>
                </div>
                <p className="text-xs text-slate-500 font-medium ml-11">
                  {gw.type === 'qr' ? 'Scan & Upload Proof' : 'Direct secure transfer'}
                </p>
                {selectedGateway?.id === gw.id && (
                  <CheckCircle2 className="absolute top-4 right-4 w-5 h-5 text-indigo-600" />
                )}
              </label>
            ))}
          </div>

          <button
            onClick={handleInitiate}
            disabled={!selectedGateway || actionLoading}
            className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all"
          >
            {actionLoading ? 'Processing...' : 'Proceed to Payment'} <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* Step 2: QR Payment Upload */}
      {step === 2 && selectedGateway?.type === 'qr' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 sm:p-8 shadow-sm">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-slate-900 mb-2">Scan to Pay</h2>
            <p className="text-sm text-slate-500">Scan the QR code below using your banking app to pay <strong>PKR {amount}</strong>.</p>
          </div>

          <div className="flex justify-center mb-8">
            <div className="p-4 bg-white border-2 border-slate-100 rounded-3xl shadow-sm">
              {/* Fallback QR placeholder if config doesn't have an image path */}
              {selectedGateway.config?.qr_image ? (
                <img src={selectedGateway.config.qr_image} alt="QR Code" className="w-48 h-48 rounded-xl object-cover" />
              ) : (
                <div className="w-48 h-48 bg-slate-100 rounded-xl flex items-center justify-center">
                  <QrCode className="w-16 h-16 text-slate-400" />
                </div>
              )}
            </div>
          </div>

          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-8 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-amber-800 font-medium">
              After payment, you must enter the exact Transaction ID/Reference ID from your receipt and upload a screenshot to activate your subscription.
            </div>
          </div>

          <form onSubmit={handleSubmitProof} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Transaction Reference ID *</label>
              <input 
                type="text" 
                required
                value={referenceId}
                onChange={e => setReferenceId(e.target.value)}
                placeholder="e.g. 0293847462"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
              />
            </div>
            
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1.5">Upload Receipt Screenshot *</label>
              <div className="relative border-2 border-dashed border-slate-300 rounded-2xl p-6 text-center hover:bg-slate-50 transition-colors cursor-pointer">
                <input 
                  type="file" 
                  required
                  accept="image/*"
                  onChange={e => setProofFile(e.target.files?.[0] || null)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />
                <UploadCloud className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-sm font-medium text-slate-600">
                  {proofFile ? proofFile.name : 'Tap to upload screenshot (JPG, PNG)'}
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={actionLoading || !referenceId || !proofFile}
              className="w-full py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-base shadow-lg shadow-indigo-600/20 disabled:opacity-50 transition-all mt-6"
            >
              {actionLoading ? 'Submitting...' : 'Submit Payment Proof'}
            </button>
          </form>
        </div>
      )}

      {/* Step 3: Success / Pending State */}
      {step === 3 && (
        <div className="bg-white rounded-3xl border border-slate-200 p-8 sm:p-12 text-center shadow-sm">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-emerald-600" />
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-3">Payment Submitted!</h2>
          <p className="text-sm text-slate-500 font-medium mb-8 max-w-sm mx-auto">
            {selectedGateway?.type === 'qr' 
              ? 'Your payment proof has been received. Our admin team will verify it shortly and activate your subscription.'
              : 'Your payment was processed successfully! Your subscription is now active.'}
          </p>
          <button
            onClick={() => router.push('/dashboard')}
            className="px-8 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-sm transition-colors"
          >
            Return to Dashboard
          </button>
        </div>
      )}
    </div>
  );
}

export default function TenantPaymentPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-slate-500 font-medium">Loading secure checkout...</div>}>
      <PaymentCheckoutContent />
    </Suspense>
  );
}
