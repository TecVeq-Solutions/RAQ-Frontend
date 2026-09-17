import superAdminApiClient from './superAdminApi';
import {
  GenerateLicensePayload,
  License,
  LicenseApiResponse,
  LicenseDetailResponse,
  LicenseEvent,
} from '@/types/license';

export const licenseService = {
  /**
   * Fetch all SaaS licenses with optional filters.
   */
  async getLicenses(filters?: {
    status?: string;
    tenant_id?: number;
    package_id?: number;
    search?: string;
  }): Promise<License[]> {
    const response = await superAdminApiClient.get<LicenseApiResponse<License[]>>(
      '/super-admin/licenses',
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Retrieve single license with detailed validation analysis.
   */
  async getLicenseById(id: number): Promise<LicenseDetailResponse> {
    const response = await superAdminApiClient.get<LicenseApiResponse<LicenseDetailResponse>>(
      `/super-admin/licenses/${id}`
    );
    return response.data.data;
  },

  /**
   * Generate a new license for a tenant.
   */
  async generateLicense(payload: GenerateLicensePayload): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      '/super-admin/licenses',
      payload
    );
    return response.data.data;
  },

  /**
   * Activate a pending or suspended license.
   */
  async activateLicense(id: number): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      `/super-admin/licenses/${id}/activate`
    );
    return response.data.data;
  },

  /**
   * Suspend an active license with a mandatory reason.
   */
  async suspendLicense(id: number, reason: string): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      `/super-admin/licenses/${id}/suspend`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Permanently revoke a license with a mandatory reason.
   */
  async revokeLicense(id: number, reason: string): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      `/super-admin/licenses/${id}/revoke`,
      { reason }
    );
    return response.data.data;
  },

  /**
   * Renew an existing license.
   */
  async renewLicense(id: number, billingCycle?: string): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      `/super-admin/licenses/${id}/renew`,
      { billing_cycle: billingCycle }
    );
    return response.data.data;
  },

  /**
   * Extend an existing license by X days with mandatory reason.
   */
  async extendLicense(id: number, days: number, reason: string): Promise<License> {
    const response = await superAdminApiClient.post<LicenseApiResponse<License>>(
      `/super-admin/licenses/${id}/extend`,
      { days, reason }
    );
    return response.data.data;
  },

  /**
   * Fetch complete event timeline history for a license.
   */
  async getLicenseEvents(id: number): Promise<LicenseEvent[]> {
    const response = await superAdminApiClient.get<LicenseApiResponse<LicenseEvent[]>>(
      `/super-admin/licenses/${id}/events`
    );
    return response.data.data;
  },
};
