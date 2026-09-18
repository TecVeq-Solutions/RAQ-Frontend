export type TenantUserRole = 'admin' | 'staff' | 'viewer';

export interface TenantUser {
  id: number;
  tenant_id: number;
  name: string;
  email: string;
  role: TenantUserRole;
  is_active: boolean;
  email_verified_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface TenantUserLimitInfo {
  max_users: number;
  active_users: number;
  total_users: number;
  is_unlimited: boolean;
  can_add_user: boolean;
}

export interface TenantSummaryInfo {
  id: number;
  name: string;
  slug: string;
  status: string;
}

export interface TenantPackageSummary {
  id: number;
  name: string;
  code: string;
}

export interface TenantUsersData {
  users: TenantUser[];
  pagination: {
    total: number;
    per_page: number;
    current_page: number;
    last_page: number;
  };
  tenant: TenantSummaryInfo;
  package: TenantPackageSummary | null;
  user_limit: TenantUserLimitInfo;
}

export interface TenantUsersApiResponse {
  success: boolean;
  message?: string;
  data: TenantUsersData;
}

export interface CreateTenantUserPayload {
  name: string;
  email: string;
  role: TenantUserRole;
  is_active?: boolean;
}

export interface UserActionApiResponse {
  success: boolean;
  message: string;
  data?: any;
  code?: string;
}
