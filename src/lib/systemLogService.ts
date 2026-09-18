import superAdminApiClient from './superAdminApi';
import {
  AdminActivityLog,
  SystemLogFilterParams,
  SystemLogListResponse,
  TenantAuditResponse,
} from '@/types/systemLog';

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
}

export const systemLogService = {
  /**
   * Fetch paginated Super Admin activity logs with multi-dimension filters.
   */
  async getLogs(filters?: SystemLogFilterParams): Promise<SystemLogListResponse> {
    const response = await superAdminApiClient.get<ApiResponse<SystemLogListResponse>>(
      '/super-admin/logs',
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Retrieve full details for a single activity log entry.
   */
  async getLogById(id: number): Promise<AdminActivityLog> {
    const response = await superAdminApiClient.get<ApiResponse<AdminActivityLog>>(
      `/super-admin/logs/${id}`
    );
    return response.data.data;
  },

  /**
   * Retrieve correlated multi-source audit timeline for a tenant.
   */
  async getTenantAudit(
    tenantId: number,
    filters?: {
      search?: string;
      category?: string;
      severity?: string;
      source?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<TenantAuditResponse> {
    const response = await superAdminApiClient.get<ApiResponse<TenantAuditResponse>>(
      `/super-admin/tenants/${tenantId}/audit`,
      { params: filters }
    );
    return response.data.data;
  },
};
