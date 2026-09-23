import superAdminApiClient from './superAdminApi';
import { apiClient } from './api';

export interface PaymentGateway {
  id: number;
  name: string;
  code: string;
  type: 'api' | 'qr';
  config: any;
  is_active: boolean;
  is_default: boolean;
  config_details?: {
    is_configured: boolean;
    [key: string]: any;
  };
}

export interface PaymentTransaction {
  id: number;
  tenant_id: number;
  package_id: number;
  license_id?: number;
  payment_gateway_id: number;
  amount: string;
  currency: string;
  payment_method?: string;
  reference_id?: string;
  status: 'pending' | 'processing' | 'paid' | 'failed' | 'cancelled';
  payment_proof_path?: string;
  metadata?: any;
  created_at: string;
  gateway?: PaymentGateway;
  tenant?: any;
  package?: any;
}

export const superAdminPaymentApi = {
  getGateways: async () => {
    const res = await superAdminApiClient.get('/super-admin/payments/gateways');
    return res.data.data;
  },
  toggleGateway: async (id: number, is_active: boolean) => {
    const res = await superAdminApiClient.put(`/super-admin/payments/gateways/${id}/toggle`, { is_active });
    return res.data.data;
  },
  updateGatewayConfig: async (id: number, config: any) => {
    const res = await superAdminApiClient.put(`/super-admin/payments/gateways/${id}/config`, { config });
    return res.data.data;
  },
  getTransactions: async (params?: { status?: string; search?: string }) => {
    const res = await superAdminApiClient.get('/super-admin/payments/transactions', { params });
    return res.data.data;
  },
  verifyTransaction: async (id: number) => {
    const res = await superAdminApiClient.post(`/super-admin/payments/transactions/${id}/verify`);
    return res.data.data;
  },
  rejectTransaction: async (id: number, reason: string) => {
    const res = await superAdminApiClient.post(`/super-admin/payments/transactions/${id}/reject`, { reason });
    return res.data.data;
  }
};

export const tenantPaymentApi = {
  getActiveGateways: async () => {
    const res = await apiClient.get('/tenant/payments/gateways');
    return res.data.data;
  },
  initiatePayment: async (payload: { package_id: number; license_id?: number; gateway_id: number; amount: number }) => {
    const res = await apiClient.post('/tenant/payments/initiate', payload);
    return res.data.data;
  },
  submitProof: async (transactionId: number, formData: FormData) => {
    const res = await apiClient.post(`/tenant/payments/${transactionId}/proof`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    });
    return res.data.data;
  }
};
