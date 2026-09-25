import superAdminApiClient from './superAdminApi';
import {
    TenantDataSummaryResponse,
    ResetOperationalPayload,
    ResetFullPayload,
    ArchiveTenantPayload,
    DeleteTenantPayload,
    ResetOperationResult,
} from '@/types/tenantDataReset';

export interface ApiResponse<T> {
    success: boolean;
    message: string;
    data?: T;
    code?: string;
    errors?: Record<string, string[]>;
}

export const tenantDataResetService = {
    /**
     * Fetch safe summary counts of tenant's operational, master, and SaaS data
     */
    async getSummary(tenantId: number | string): Promise<TenantDataSummaryResponse> {
        const response = await superAdminApiClient.get<ApiResponse<TenantDataSummaryResponse>>(
            `/super-admin/tenants/${tenantId}/data`
        );
        if (!response.data.data) {
            throw new Error(response.data.message || 'Failed to fetch tenant data summary');
        }
        return response.data.data;
    },

    /**
     * Perform operational reset (clears transactions, preserves master records)
     */
    async resetOperational(
        tenantId: number | string,
        payload: ResetOperationalPayload
    ): Promise<ApiResponse<ResetOperationResult>> {
        const response = await superAdminApiClient.post<ApiResponse<ResetOperationResult>>(
            `/super-admin/tenants/${tenantId}/data/reset-operational`,
            payload
        );
        return response.data;
    },

    /**
     * Perform full business reset (clears transactions and master records, preserves SaaS identity)
     */
    async resetFull(
        tenantId: number | string,
        payload: ResetFullPayload
    ): Promise<ApiResponse<ResetOperationResult>> {
        const response = await superAdminApiClient.post<ApiResponse<ResetOperationResult>>(
            `/super-admin/tenants/${tenantId}/data/reset-full`,
            payload
        );
        return response.data;
    },

    /**
     * Archive tenant (disables access, suspends licenses, revokes user tokens, preserves data)
     */
    async archiveTenant(
        tenantId: number | string,
        payload: ArchiveTenantPayload
    ): Promise<ApiResponse<ResetOperationResult>> {
        const response = await superAdminApiClient.post<ApiResponse<ResetOperationResult>>(
            `/super-admin/tenants/${tenantId}/archive`,
            payload
        );
        return response.data;
    },

    /**
     * Delete tenant (controlled soft-deletion, token revocation, license revocation)
     */
    async deleteTenant(
        tenantId: number | string,
        payload: DeleteTenantPayload
    ): Promise<ApiResponse<ResetOperationResult>> {
        const response = await superAdminApiClient.post<ApiResponse<ResetOperationResult>>(
            `/super-admin/tenants/${tenantId}/delete`,
            payload
        );
        return response.data;
    },
};

export default tenantDataResetService;
