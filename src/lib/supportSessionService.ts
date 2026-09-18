import Cookies from 'js-cookie';
import superAdminApiClient from './superAdminApi';
import {
  ActiveSupportContext,
  StartSupportSessionPayload,
  SupportSession,
  SupportSessionResponse,
} from '@/types/supportSession';

const SUPPORT_CONTEXT_KEY = 'raq_support_mode_context';
const TENANT_TOKEN_KEY = 'auth_token';
const TENANT_USER_KEY = 'user';

export const supportSessionService = {
  /**
   * Start Support Mode impersonation for a tenant.
   */
  async startSession(
    tenantId: number,
    payload: StartSupportSessionPayload
  ): Promise<SupportSessionResponse> {
    const response = await superAdminApiClient.post<{
      success: boolean;
      message: string;
      data: SupportSessionResponse;
    }>(`/super-admin/tenants/${tenantId}/support/start`, payload);

    const sessionData = response.data.data;
    this.setActiveSupportContext(sessionData);
    return sessionData;
  },

  /**
   * Terminate a Support Mode session.
   */
  async endSession(sessionId: number, reason?: string): Promise<SupportSession> {
    try {
      const response = await superAdminApiClient.post<{
        success: boolean;
        message: string;
        data: SupportSession;
      }>(`/super-admin/support/${sessionId}/end`, { reason });
      return response.data.data;
    } finally {
      this.clearActiveSupportContext();
    }
  },

  /**
   * Retrieve Support Session status.
   */
  async getSession(sessionId: number): Promise<SupportSession> {
    const response = await superAdminApiClient.get<{
      success: boolean;
      data: SupportSession;
    }>(`/super-admin/support/${sessionId}`);
    return response.data.data;
  },

  /**
   * Store active support context and configure temporary tenant authentication tokens.
   */
  setActiveSupportContext(data: SupportSessionResponse): void {
    const context: ActiveSupportContext = {
      sessionId: data.session.id,
      sessionUuid: data.session.session_id,
      tenantId: data.tenant.id,
      tenantName: data.tenant.name,
      userId: data.user.id,
      userName: data.user.name,
      userEmail: data.user.email,
      userRole: data.user.role,
      reason: data.session.reason,
      expiresAt: data.expires_at,
      startedAt: data.session.started_at,
    };

    if (typeof window !== 'undefined') {
      sessionStorage.setItem(SUPPORT_CONTEXT_KEY, JSON.stringify(context));
    }

    // Set temporary tenant auth token and user cookies (valid for duration of session)
    const expireDate = new Date(data.expires_at);

    Cookies.set(TENANT_TOKEN_KEY, data.token, {
      expires: expireDate,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });

    Cookies.set(TENANT_USER_KEY, JSON.stringify(data.user), {
      expires: expireDate,
      path: '/',
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    });
  },

  /**
   * Retrieve active support context from browser session.
   */
  getActiveSupportContext(): ActiveSupportContext | null {
    if (typeof window === 'undefined') return null;
    try {
      const raw = sessionStorage.getItem(SUPPORT_CONTEXT_KEY);
      if (!raw || raw === 'undefined' || raw === 'null') return null;
      const context = JSON.parse(raw) as ActiveSupportContext;

      if (!context || !context.expiresAt) {
        this.clearActiveSupportContext();
        return null;
      }

      // Check if expired
      if (new Date(context.expiresAt).getTime() <= Date.now()) {
        this.clearActiveSupportContext();
        return null;
      }
      return context;
    } catch {
      return null;
    }
  },

  /**
   * Check if Support Mode is currently active in browser.
   */
  isSupportModeActive(): boolean {
    return this.getActiveSupportContext() !== null;
  },

  /**
   * Purge active support context and tenant cookies.
   */
  clearActiveSupportContext(): void {
    if (typeof window !== 'undefined') {
      try {
        sessionStorage.removeItem(SUPPORT_CONTEXT_KEY);
      } catch {}

      Cookies.remove(TENANT_TOKEN_KEY, { path: '/' });
      Cookies.remove(TENANT_USER_KEY, { path: '/' });
      Cookies.remove(TENANT_TOKEN_KEY);
      Cookies.remove(TENANT_USER_KEY);

      if (typeof document !== 'undefined') {
        document.cookie = `${TENANT_TOKEN_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
        document.cookie = `${TENANT_USER_KEY}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
      }
    }
  },
};
