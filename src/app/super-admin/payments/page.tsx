'use client';

import React, { useEffect, useState } from 'react';
import { superAdminPaymentApi, PaymentGateway, PaymentTransaction } from '@/lib/paymentApi';
import { CreditCard, History, Settings2, CheckCircle, XCircle, Search, Eye } from 'lucide-react';

export default function SuperAdminPaymentsPage() {
  const [activeTab, setActiveTab] = useState<'gateways' | 'transactions'>('gateways');
  const [gateways, setGateways] = useState<PaymentGateway[]>([]);
  const [transactions, setTransactions] = useState<PaymentTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ message: string, type: 'error' | 'success' } | null>(null);

  const showToast = (message: string, type: 'error' | 'success' = 'error') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Modals / Selected States
  const [selectedTx, setSelectedTx] = useState<PaymentTransaction | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean, transactionId: number | null }>({ isOpen: false, transactionId: null });

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      if (activeTab === 'gateways') {
        const data = await superAdminPaymentApi.getGateways();
        setGateways(data);
      } else {
        const data = await superAdminPaymentApi.getTransactions();
        setTransactions(data);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  const toggleGateway = async (id: number, currentStatus: boolean) => {
    try {
      await superAdminPaymentApi.toggleGateway(id, !currentStatus);
      fetchData();
    } catch (err: any) {
      showToast('Error toggling gateway: ' + err.message, 'error');
    }
  };

  const verifyTransaction = (id: number) => {
    setConfirmModal({ isOpen: true, transactionId: id });
  };

  const executeVerifyTransaction = async () => {
    if (!confirmModal.transactionId) return;
    setActionLoading(true);
    try {
      await superAdminPaymentApi.verifyTransaction(confirmModal.transactionId);
      setSelectedTx(null);
      setConfirmModal({ isOpen: false, transactionId: null });
      fetchData();
    } catch (err: any) {
      showToast('Verification failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const rejectTransaction = async (id: number) => {
    if (!rejectReason.trim()) return showToast('Please provide a reason', 'error');
    setActionLoading(true);
    try {
      await superAdminPaymentApi.rejectTransaction(id, rejectReason);
      setSelectedTx(null);
      setRejectReason('');
      fetchData();
    } catch (err: any) {
      showToast('Rejection failed: ' + err.message, 'error');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto font-sans animate-in fade-in zoom-in-95 duration-500">
      {/* Toast Popup */}
      {toast && (
        <div className="fixed top-4 right-4 z-[9999] animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`px-4 py-3 rounded-xl shadow-lg border flex items-center gap-3 font-medium text-sm ${toast.type === 'error'
            ? 'bg-rose-50 border-rose-200 text-rose-700'
            : 'bg-emerald-50 border-emerald-200 text-emerald-700'
            }`}>
            {toast.type === 'error' ? <XCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
            {toast.message}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal.isOpen && (
        <div className="fixed inset-0 z-[100] bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-sm w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 mb-2">Confirm Verification</h3>
            <p className="text-sm text-slate-500 mb-6">
              Are you sure you want to verify this transaction? It will activate the associated license.
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setConfirmModal({ isOpen: false, transactionId: null })}
                disabled={actionLoading}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={executeVerifyTransaction}
                disabled={actionLoading}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors"
              >
                {actionLoading ? 'Processing...' : 'Yes, Verify'}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2">
            <CreditCard className="w-7 h-7 text-indigo-600" />
            Payment Management
          </h1>
          <p className="text-sm font-medium text-slate-500 mt-1">
            Manage payment gateways, QR codes, and tenant transactions securely.
          </p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6 border-b border-slate-200">
        <button
          onClick={() => setActiveTab('gateways')}
          className={`pb-3 px-1 text-sm font-bold transition-all border-b-2 ${activeTab === 'gateways'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> Gateways</span>
        </button>
        <button
          onClick={() => setActiveTab('transactions')}
          className={`pb-3 px-1 text-sm font-bold transition-all border-b-2 ${activeTab === 'transactions'
            ? 'border-indigo-600 text-indigo-700'
            : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
        >
          <span className="flex items-center gap-2"><History className="w-4 h-4" /> Transactions</span>
        </button>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-sm font-medium flex items-center gap-2">
          <XCircle className="w-5 h-5" /> {error}
        </div>
      )}

      {loading && <div className="text-center py-12 text-slate-500 font-medium">Loading...</div>}

      {!loading && activeTab === 'gateways' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gateways.map(gw => (
            <div key={gw.id} className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm hover:shadow-md transition-shadow">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-slate-900 text-lg capitalize">{gw.name}</h3>
                  <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">{gw.type} Gateway</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${gw.is_active ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                </div>
              </div>

              <div className="mb-4">
                {gw.config_details?.is_configured ? (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-emerald-50 text-emerald-700 px-2.5 py-1 rounded-lg">
                    <CheckCircle className="w-3.5 h-3.5" /> Configured (.env)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 text-xs font-bold bg-rose-50 text-rose-700 px-2.5 py-1 rounded-lg">
                    <XCircle className="w-3.5 h-3.5" /> Missing Config
                  </span>
                )}
              </div>

              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={() => toggleGateway(gw.id, gw.is_active)}
                  className={`w-full py-2 rounded-xl text-xs font-bold transition-colors ${gw.is_active
                    ? 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                    : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                    }`}
                >
                  {gw.is_active ? 'Disable Gateway' : 'Enable Gateway'}
                </button>
              </div>
            </div>
          ))}
          {gateways.length === 0 && <div className="col-span-full text-center text-slate-500">No gateways found. Run seeders.</div>}
        </div>
      )}

      {!loading && activeTab === 'transactions' && (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-600">
              <thead className="bg-slate-50 text-slate-700 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4">Tenant</th>
                  <th className="px-6 py-4">Method</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {transactions.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">{tx.tenant?.name || `Tenant #${tx.tenant_id}`}</td>
                    <td className="px-6 py-4 capitalize">{tx.payment_method?.replace('_', ' ')}</td>
                    <td className="px-6 py-4 font-bold text-slate-900">{tx.currency} {tx.amount}</td>
                    <td className="px-6 py-4">
                      <span className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase tracking-wider ${tx.status === 'paid' ? 'bg-emerald-100 text-emerald-800' :
                        tx.status === 'processing' ? 'bg-amber-100 text-amber-800' :
                          tx.status === 'failed' || tx.status === 'cancelled' ? 'bg-rose-100 text-rose-800' :
                            'bg-slate-100 text-slate-800'
                        }`}>
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-500">
                      {new Date(tx.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <button
                        onClick={() => setSelectedTx(tx)}
                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs rounded-lg transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" /> View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Transaction Details Modal */}
      {selectedTx && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
            <h3 className="font-bold text-lg text-slate-900 mb-4">Transaction Details</h3>

            <div className="space-y-3 text-sm mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">
              <div className="flex justify-between"><span className="font-semibold text-slate-600">ID:</span> <span className="font-bold">#{selectedTx.id}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-600">Reference:</span> <span className="font-bold font-mono">{selectedTx.reference_id || 'N/A'}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-600">Amount:</span> <span className="font-bold text-emerald-600">{selectedTx.currency} {selectedTx.amount}</span></div>
              <div className="flex justify-between"><span className="font-semibold text-slate-600">Status:</span> <span className="font-bold uppercase">{selectedTx.status}</span></div>
            </div>

            {selectedTx.payment_proof_path && (
              <div className="mb-6">
                <p className="font-bold text-sm text-slate-700 mb-2">Payment Proof</p>
                <img
                  src={(() => {
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
                    const cleanPath = selectedTx.payment_proof_path!.startsWith('/') ? selectedTx.payment_proof_path!.substring(1) : selectedTx.payment_proof_path!;
                    return `${baseUrl}/storage/${cleanPath}`;
                  })()}
                  alt="Proof"
                  className="w-full h-48 object-cover rounded-xl border border-slate-200 cursor-pointer hover:opacity-90"
                  onClick={() => {
                    const baseUrl = (process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000').replace(/\/api\/?$/, '');
                    const cleanPath = selectedTx.payment_proof_path!.startsWith('/') ? selectedTx.payment_proof_path!.substring(1) : selectedTx.payment_proof_path!;
                    window.open(`${baseUrl}/storage/${cleanPath}`, '_blank');
                  }}
                />
              </div>
            )}

            {(selectedTx.status === 'processing' || selectedTx.status === 'pending') && (
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Rejection reason (if rejecting)..."
                  value={rejectReason}
                  onChange={e => setRejectReason(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
                <div className="flex gap-3">
                  <button
                    onClick={() => verifyTransaction(selectedTx.id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    Verify & Activate
                  </button>
                  <button
                    onClick={() => rejectTransaction(selectedTx.id)}
                    disabled={actionLoading}
                    className="flex-1 py-2.5 bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm rounded-xl transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedTx(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-sm rounded-xl transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

