export interface PackageLimit {
  id?: number;
  package_id?: number;
  limit_key: string;
  limit_value: number; // -1 for Unlimited, >= 0 for Cap
}

export interface CanonicalModule {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  icon?: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface Package {
  id: number;
  name: string;
  code: string;
  description?: string | null;
  price: string | number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime' | 'custom';
  currency: string;
  trial_days: number;
  is_active: boolean;
  sort_order: number;
  limits?: PackageLimit[];
  modules?: CanonicalModule[];
  total_licenses_count?: number;
  active_licenses_count?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PackageFormData {
  name: string;
  code?: string;
  description?: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime' | 'custom';
  currency?: string;
  trial_days?: number;
  is_active?: boolean;
  sort_order?: number;
  limits: {
    max_users: number;
    max_products: number;
    max_storage_mb: number;
    max_ai_requests: number;
    max_backups: number;
  };
  module_ids: number[];
}

export interface LimitComparisonValue {
  raw_value: number;
  is_unlimited: boolean;
  formatted: string;
}

export interface LimitComparisonRow {
  key: string;
  label: string;
  values: Record<number, LimitComparisonValue>;
}

export interface ModuleComparisonRow {
  module_id: number;
  name: string;
  code: string;
  icon?: string | null;
  availability: Record<number, { included: boolean }>;
}

export interface PricingComparisonItem {
  package_id: number;
  package_name: string;
  price: number;
  formatted_price: string;
  billing_cycle: string;
  currency: string;
  trial_days: number;
  is_active: boolean;
}

export interface PackageComparisonData {
  packages: Array<{
    id: number;
    name: string;
    code: string;
    price: number;
    billing_cycle: string;
    currency: string;
    is_active: boolean;
    modules_count: number;
  }>;
  comparison: {
    pricing: Record<number, PricingComparisonItem>;
    limits: LimitComparisonRow[];
    modules: ModuleComparisonRow[];
  };
}

export interface PackageApiResponse<T = any> {
  success: boolean;
  message?: string;
  code?: string;
  data: T;
}
