import superAdminApiClient from './superAdminApi';
import {
  CanonicalModule,
  Package,
  PackageApiResponse,
  PackageComparisonData,
  PackageFormData,
} from '@/types/package';

export const packageService = {
  /**
   * Fetch all SaaS packages with optional filters.
   */
  async getAllPackages(filters?: {
    status?: string;
    billing_cycle?: string;
    search?: string;
  }): Promise<Package[]> {
    const response = await superAdminApiClient.get<PackageApiResponse<Package[]>>(
      '/super-admin/packages',
      { params: filters }
    );
    return response.data.data;
  },

  /**
   * Fetch a single package by ID.
   */
  async getPackageById(id: number): Promise<Package> {
    const response = await superAdminApiClient.get<PackageApiResponse<Package>>(
      `/super-admin/packages/${id}`
    );
    return response.data.data;
  },

  /**
   * Create a new package with limits and module assignments.
   */
  async createPackage(data: PackageFormData): Promise<Package> {
    const response = await superAdminApiClient.post<PackageApiResponse<Package>>(
      '/super-admin/packages',
      data
    );
    return response.data.data;
  },

  /**
   * Update an existing package, its limits, and module assignments.
   */
  async updatePackage(id: number, data: Partial<PackageFormData>): Promise<Package> {
    const response = await superAdminApiClient.put<PackageApiResponse<Package>>(
      `/super-admin/packages/${id}`,
      data
    );
    return response.data.data;
  },

  /**
   * Toggle package active / inactive status.
   */
  async togglePackageStatus(id: number): Promise<Package> {
    const response = await superAdminApiClient.patch<PackageApiResponse<Package>>(
      `/super-admin/packages/${id}/status`
    );
    return response.data.data;
  },

  /**
   * Delete an unreferenced package.
   */
  async deletePackage(id: number): Promise<{ success: boolean; message: string }> {
    const response = await superAdminApiClient.delete<PackageApiResponse>(
      `/super-admin/packages/${id}`
    );
    return {
      success: response.data.success,
      message: response.data.message || 'Package deleted successfully.',
    };
  },

  /**
   * Compare selected packages or all active packages.
   */
  async comparePackages(packageIds?: number[]): Promise<PackageComparisonData> {
    const params = packageIds && packageIds.length > 0 ? { ids: packageIds } : {};
    const response = await superAdminApiClient.get<PackageApiResponse<PackageComparisonData>>(
      '/super-admin/packages/compare',
      { params }
    );
    return response.data.data;
  },

  /**
   * Fetch all canonical system modules for package assignment.
   */
  async getCanonicalModules(): Promise<CanonicalModule[]> {
    const response = await superAdminApiClient.get<PackageApiResponse<CanonicalModule[]>>(
      '/super-admin/packages/modules'
    );
    return response.data.data;
  },
};
