import { apiClient } from './api';
import { ModuleAccessApiResponse, ModuleAccessData, ResolvedModule } from '@/types/moduleAccess';

class ModuleAccessClient {
  private cache: ModuleAccessData | null = null;
  private fetchPromise: Promise<ModuleAccessData> | null = null;
  private lastFetchedAt: number = 0;
  private readonly CACHE_DURATION_MS = 30000; // 30 seconds

  /**
   * Fetch all effective module permissions for the current tenant.
   */
  async getEffectiveAccess(forceRefresh: boolean = false): Promise<ModuleAccessData> {
    const now = Date.now();
    if (!forceRefresh && this.cache && now - this.lastFetchedAt < this.CACHE_DURATION_MS) {
      return this.cache;
    }

    if (this.fetchPromise && !forceRefresh) {
      return this.fetchPromise;
    }

    this.fetchPromise = apiClient
      .get<ModuleAccessApiResponse>('/modules/access')
      .then((res) => {
        if (res.data.success && res.data.data) {
          this.cache = res.data.data;
          this.lastFetchedAt = Date.now();
          return this.cache;
        }
        throw new Error(res.data.message || 'Failed to load module access data');
      })
      .finally(() => {
        this.fetchPromise = null;
      });

    return this.fetchPromise;
  }

  /**
   * Fetch single module resolution details.
   */
  async resolveSingleModule(moduleCode: string): Promise<ResolvedModule> {
    const res = await apiClient.get<{ success: boolean; data: ResolvedModule }>(`/modules/access/${moduleCode}`);
    if (res.data.success && res.data.data) {
      return res.data.data;
    }
    throw new Error('Failed to resolve module');
  }

  /**
   * Clear local module access cache (e.g. after upgrade/renewal).
   */
  clearCache(): void {
    this.cache = null;
    this.lastFetchedAt = 0;
  }
}

export const moduleAccessClient = new ModuleAccessClient();
