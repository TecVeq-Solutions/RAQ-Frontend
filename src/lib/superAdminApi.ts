import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api';

export const superAdminApiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request Interceptor: Attach Super Admin Bearer Token
superAdminApiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get('super_admin_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response Interceptor: Handle 401 Unauthorized for Super Admin
superAdminApiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      Cookies.remove('super_admin_token', { path: '/' });
      Cookies.remove('super_admin_user', { path: '/' });

      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/super-admin-login')) {
        window.location.href = '/super-admin-login?session_expired=1';
      }
    }
    return Promise.reject(error);
  }
);

export default superAdminApiClient;
