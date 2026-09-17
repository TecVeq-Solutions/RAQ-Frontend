import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Sanctum Bearer Token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('auth_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized globally
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('auth_token');
      Cookies.remove('user');

      // Only redirect on client side
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login')) {
        window.location.href = '/login?session_expired=1';
      }
    }
    return Promise.reject(error);
  }
);

// Simple in-memory cache for static/read-mostly master data (categories, units, etc.)
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const masterDataCache = new Map<string, CacheEntry<any>>();
const CACHE_TTL_MS = 60 * 1000; // 60 seconds TTL

export async function getCachedData<T>(endpoint: string, forceFresh = false): Promise<T> {
  const cached = masterDataCache.get(endpoint);
  const now = Date.now();

  if (!forceFresh && cached && now - cached.timestamp < CACHE_TTL_MS) {
    return cached.data;
  }

  const response = await apiClient.get<{ success: boolean; data: T }>(endpoint);
  const data = response.data?.data;
  masterDataCache.set(endpoint, { data, timestamp: now });
  return data;
}

export function invalidateCache(endpointPrefix?: string) {
  if (endpointPrefix) {
    masterDataCache.forEach((_, key) => {
      if (key.startsWith(endpointPrefix)) {
        masterDataCache.delete(key);
      }
    });
  } else {
    masterDataCache.clear();
  }
}

export default apiClient;
