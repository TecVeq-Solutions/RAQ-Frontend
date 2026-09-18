import Cookies from 'js-cookie';
import superAdminApiClient from './superAdminApi';
import {
  SuperAdminAuthResponse,
  SuperAdminLoginCredentials,
  SuperAdminMeResponse,
  SuperAdminUser,
} from '@/types/superAdminAuth';

const SUPER_ADMIN_TOKEN_KEY = 'super_admin_token';
const SUPER_ADMIN_USER_KEY = 'super_admin_user';
const COOKIE_EXPIRES_DAYS = 7;

export const superAdminAuthService = {
  /**
   * Log in Super Administrator with credentials and store token/user in isolated cookies.
   */
  async login(credentials: SuperAdminLoginCredentials): Promise<{ user: SuperAdminUser; token: string }> {
    const response = await superAdminApiClient.post<SuperAdminAuthResponse>(
      '/super-admin/login',
      credentials
    );
    const { token, user } = response.data.data;

    Cookies.set(SUPER_ADMIN_TOKEN_KEY, token, {
      expires: COOKIE_EXPIRES_DAYS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    Cookies.set(SUPER_ADMIN_USER_KEY, JSON.stringify(user), {
      expires: COOKIE_EXPIRES_DAYS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { user, token };
  },

  /**
   * Fetch latest authenticated Super Administrator profile from API.
   */
  async getCurrentUser(): Promise<SuperAdminUser | null> {
    try {
      const response = await superAdminApiClient.get<SuperAdminMeResponse>('/super-admin/me');
      const user = response.data.data.user;

      Cookies.set(SUPER_ADMIN_USER_KEY, JSON.stringify(user), {
        expires: COOKIE_EXPIRES_DAYS,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return user;
    } catch {
      return null;
    }
  },

  /**
   * Sign out Super Administrator session from API and purge cookies.
   */
  async logout(): Promise<void> {
    try {
      await superAdminApiClient.post('/super-admin/logout', {}, { timeout: 2500 });
    } catch {
      // Ignore API failure and proceed with local cleanup
    } finally {
      Cookies.remove(SUPER_ADMIN_TOKEN_KEY, { path: '/' });
      Cookies.remove(SUPER_ADMIN_USER_KEY, { path: '/' });
      Cookies.remove(SUPER_ADMIN_TOKEN_KEY);
      Cookies.remove(SUPER_ADMIN_USER_KEY);

      if (typeof document !== 'undefined') {
        document.cookie = `${SUPER_ADMIN_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${SUPER_ADMIN_USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }

      if (typeof window !== 'undefined') {
        window.location.href = '/super-admin-login';
      }
    }
  },

  /**
   * Get parsed Super Administrator user object from cookie.
   */
  getUserFromCookie(): SuperAdminUser | null {
    const userStr = Cookies.get(SUPER_ADMIN_USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as SuperAdminUser;
    } catch {
      return null;
    }
  },

  /**
   * Get raw Super Administrator token string.
   */
  getToken(): string | undefined {
    return Cookies.get(SUPER_ADMIN_TOKEN_KEY);
  },

  /**
   * Check if Super Administrator token cookie exists.
   */
  isAuthenticated(): boolean {
    return !!Cookies.get(SUPER_ADMIN_TOKEN_KEY);
  },

  /**
   * Verify if current session is active Super Administrator.
   */
  isSuperAdmin(): boolean {
    const user = this.getUserFromCookie();
    return !!user && user.role === 'super_admin' && user.status === 'active';
  },
};
