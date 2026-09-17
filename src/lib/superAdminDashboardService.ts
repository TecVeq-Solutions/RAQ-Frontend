import superAdminApiClient from './superAdminApi';
import {
  SuperAdminDashboardApiResponse,
  SuperAdminDashboardData,
} from '@/types/superAdminDashboard';

export const superAdminDashboardService = {
  /**
   * Fetch Super Admin platform health analytics data.
   */
  async getDashboardData(range: string = '30_days'): Promise<SuperAdminDashboardData> {
    const response = await superAdminApiClient.get<SuperAdminDashboardApiResponse>(
      '/super-admin/dashboard',
      {
        params: { range },
      }
    );
    return response.data.data;
  },
};
