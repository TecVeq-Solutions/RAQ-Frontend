import { User } from './auth';

export type SupportSessionStatus = 'active' | 'expired' | 'ended';

export interface SupportSession {
  id: number;
  session_id: string;
  super_admin_id: number;
  tenant_id: number;
  user_id: number;
  reason: string;
  duration_minutes: number;
  started_at: string;
  expires_at: string;
  ended_at: string | null;
  status: SupportSessionStatus;
  super_admin?: {
    id: number;
    name: string;
    email: string;
  };
  tenant?: {
    id: number;
    name: string;
    slug: string;
    currency: string;
    status: string;
  };
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
}

export interface StartSupportSessionPayload {
  user_id?: number;
  reason: string;
  duration_minutes?: number;
}

export interface SupportSessionResponse {
  session: SupportSession;
  token: string;
  tenant: {
    id: number;
    name: string;
    slug: string;
    currency: string;
    status: string;
  };
  user: {
    id: number;
    name: string;
    email: string;
    role: string;
    is_active: boolean;
  };
  expires_at: string;
  duration_minutes: number;
}

export interface ActiveSupportContext {
  sessionId: number;
  sessionUuid: string;
  tenantId: number;
  tenantName: string;
  userId: number;
  userName: string;
  userEmail: string;
  userRole: string;
  reason: string;
  expiresAt: string;
  startedAt: string;
}
