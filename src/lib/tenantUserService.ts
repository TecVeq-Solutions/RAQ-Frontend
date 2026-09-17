import superAdminApiClient from './superAdminApi';
import {
  CreateTenantUserPayload,
  TenantUser,
  TenantUsersApiResponse,
  TenantUsersData,
  UserActionApiResponse,
} from '@/types/tenantUser';

export const tenantUserService = {
  /**
   * Fetch paginated users for a specific tenant with filters.
   */
  async getTenantUsers(
    tenantId: number | string,
    filters?: {
      search?: string;
      role?: string;
      status?: string;
      page?: number;
      per_page?: number;
    }
  ): Promise<TenantUsersData> {
    const response = await superAdminApiClient.get<TenantUsersApiResponse>(
      `/super-admin/tenants/${tenantId}/users`,
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Fetch a single user belonging to a tenant.
   */
  async getTenantUser(tenantId: number | string, userId: number | string): Promise<TenantUser> {
    const response = await superAdminApiClient.get<{ success: boolean; data: TenantUser }>(
      `/super-admin/tenants/${tenantId}/users/${userId}`
    );
    return response.data.data;
  },

  /**
   * Create a new user for a specific tenant enforcing role limits.
   */
  async createTenantUser(
    tenantId: number | string,
    payload: CreateTenantUserPayload
  ): Promise<TenantUser> {
    const response = await superAdminApiClient.post<{ success: boolean; data: TenantUser; message: string }>(
      `/super-admin/tenants/${tenantId}/users`,
      payload
    );
    return response.data.data;
  },

  /**
   * Update active status for a tenant user (activate / deactivate).
   */
  async updateUserStatus(
    tenantId: number | string,
    userId: number | string,
    isActive: boolean
  ): Promise<TenantUser> {
    const response = await superAdminApiClient.patch<{ success: boolean; data: TenantUser; message: string }>(
      `/super-admin/tenants/${tenantId}/users/${userId}/status`,
      { is_active: isActive }
    );
    return response.data.data;
  },

  /**
   * Revoke all active sessions and API tokens for a tenant user.
   */
  async revokeUserSessions(
    tenantId: number | string,
    userId: number | string
  ): Promise<UserActionApiResponse> {
    const response = await superAdminApiClient.post<UserActionApiResponse>(
      `/super-admin/tenants/${tenantId}/users/${userId}/revoke-sessions`
    );
    return response.data;
  },

  /**
   * Initiate a secure password reset workflow for a tenant user.
   */
  async initiatePasswordReset(
    tenantId: number | string,
    userId: number | string
  ): Promise<UserActionApiResponse> {
    const response = await superAdminApiClient.post<UserActionApiResponse>(
      `/super-admin/tenants/${tenantId}/users/${userId}/password-reset`
    );
    return response.data;
  },
};
