import Cookies from 'js-cookie';
import apiClient from './api';
import { AuthResponse, LoginCredentials, MeResponse, Role, User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';
const USER_KEY = 'user';
const COOKIE_EXPIRES_DAYS = 7;

export const authService = {
  /**
   * Log in user with credentials and store token/user in cookies
   */
  async login(credentials: LoginCredentials): Promise<{ user: User; token: string }> {
    const response = await apiClient.post<AuthResponse>('/login', credentials);
    const { token, user } = response.data.data;

    // Store in cookie with 7 days expiration, root path, and SameSite security
    Cookies.set(TOKEN_KEY, token, {
      expires: COOKIE_EXPIRES_DAYS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    Cookies.set(USER_KEY, JSON.stringify(user), {
      expires: COOKIE_EXPIRES_DAYS,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    return { user, token };
  },

  /**
   * Fetch latest authenticated user details from API
   */
  async getCurrentUser(): Promise<User | null> {
    try {
      const response = await apiClient.get<MeResponse>('/me');
      const user = response.data.data.user;

      Cookies.set(USER_KEY, JSON.stringify(user), {
        expires: COOKIE_EXPIRES_DAYS,
        path: '/',
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
      });

      return user;
    } catch (error) {
      return null;
    }
  },

  /**
   * Log out user from API and remove cookies
   */
  async logout(): Promise<void> {
    try {
      // Trigger API logout without blocking or hanging client UI
      apiClient.post('/logout', {}, { timeout: 2500 }).catch(() => {});
    } catch (_) {
      // Ignore API failure and proceed with local cleanup
    } finally {
      // 1. Remove js-cookie with root path and default
      Cookies.remove(TOKEN_KEY, { path: '/' });
      Cookies.remove(USER_KEY, { path: '/' });
      Cookies.remove(TOKEN_KEY);
      Cookies.remove(USER_KEY);

      // 2. Direct document.cookie clearing for maximum compatibility
      if (typeof document !== 'undefined') {
        document.cookie = `${TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${TOKEN_KEY}=; Max-Age=0; path=/;`;
        document.cookie = `${USER_KEY}=; Max-Age=0; path=/;`;
      }

      // 3. Clear storage
      if (typeof window !== 'undefined') {
        try {
          localStorage.clear();
          sessionStorage.clear();
        } catch (_) {}

        // 4. Navigate immediately to login page
        window.location.href = '/login';
      }
    }
  },

  /**
   * Get parsed user object from cookie
   */
  getUserFromCookie(): User | null {
    const userStr = Cookies.get(USER_KEY);
    if (!userStr) return null;
    try {
      return JSON.parse(userStr) as User;
    } catch {
      return null;
    }
  },

  /**
   * Get raw authentication token
   */
  getToken(): string | undefined {
    return Cookies.get(TOKEN_KEY);
  },

  /**
   * Check if token cookie exists
   */
  isAuthenticated(): boolean {
    return !!Cookies.get(TOKEN_KEY);
  },

  /**
   * Check if current user matches given role
   */
  hasRole(role: Role | Role[]): boolean {
    const user = this.getUserFromCookie();
    if (!user) return false;

    if (Array.isArray(role)) {
      return role.includes(user.role);
    }
    return user.role === role;
  },

  /**
   * Check if current user is Admin
   */
  isAdmin(): boolean {
    return this.hasRole('admin');
  },

  /**
   * Check if current user is Staff
   */
  isStaff(): boolean {
    return this.hasRole('staff');
  },

  /**
   * Check if current user is Viewer
   */
  isViewer(): boolean {
    return this.hasRole('viewer');
  },
};
