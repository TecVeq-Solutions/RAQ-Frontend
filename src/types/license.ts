export interface LicenseEvent {
  id: number;
  license_id: number;
  event_type: string;
  event_data?: Record<string, any> | null;
  ip_address?: string | null;
  user_agent?: string | null;
  created_at: string;
}

export interface LicenseTenant {
  id: number;
  name: string;
  slug?: string;
  email?: string;
  status: string;
}

export interface LicensePackage {
  id: number;
  name: string;
  code: string;
  price?: number | string;
  billing_cycle: string;
  currency?: string;
  trial_days?: number;
  is_active?: boolean;
}

export interface License {
  id: number;
  uuid: string;
  license_key: string;
  tenant_id: number;
  package_id: number;
  status: 'pending' | 'active' | 'expired' | 'suspended' | 'revoked';
  issued_at: string;
  starts_at?: string | null;
  expires_at?: string | null;
  last_validated_at?: string | null;
  revocation_reason?: string | null;
  created_at: string;
  updated_at: string;
  tenant?: LicenseTenant;
  package?: LicensePackage;
  events_count?: number;
  events?: LicenseEvent[];
}

export interface LicenseValidationResult {
  license_id: number;
  license_key: string;
  is_valid: boolean;
  status: string;
  access_level: 'full' | 'grace_period' | 'restricted';
  in_grace_period: boolean;
  days_remaining: number;
  grace_days_remaining: number;
  starts_at?: string | null;
  expires_at?: string | null;
  last_validated_at?: string | null;
  package?: LicensePackage | null;
  tenant?: LicenseTenant | null;
}

export interface LicenseDetailResponse {
  license: License;
  validation: LicenseValidationResult;
}

export interface GenerateLicensePayload {
  tenant_id: number;
  package_id: number;
  starts_at?: string;
  expires_at?: string;
  status?: 'active' | 'pending';
}

export interface LicenseApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
}
