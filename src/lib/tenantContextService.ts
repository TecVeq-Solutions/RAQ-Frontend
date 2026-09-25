import { apiClient } from './api';
import { TenantContextData } from '@/types/tenantContext';

export const tenantContextService = {
    /**
     * Fetch aggregated global tenant context for the authenticated session.
     */
    async getTenantContext(): Promise<TenantContextData> {
        const response = await apiClient.get<{ success: boolean; data: TenantContextData }>('/tenant/context');
        return response.data.data;
    },
};
