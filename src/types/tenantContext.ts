import { ResolvedModule } from './moduleAccess';

export type TenantStatus = 'active' | 'trial' | 'suspended' | 'expired' | 'archived';
export type LicenseStatus = 'active' | 'expiring_soon' | 'grace_period' | 'expired' | 'suspended' | 'revoked' | 'none';

export interface TenantSummary {
    id: number;
    uuid: string;
    name: string;
    slug: string;
    legal_name?: string | null;
    owner_name?: string | null;
    email?: string | null;
    currency: string;
    timezone: string;
    status: TenantStatus;
    is_active: boolean;
    created_at?: string;
}

export interface TenantLicense {
    id: number | null;
    status: LicenseStatus;
    license_key_masked: string | null;
    expires_at: string | null;
    days_remaining: number;
    grace_period: boolean;
    is_valid: boolean;
    is_expiring_soon: boolean;
    validation_message: string | null;
}

export interface TenantPackage {
    id: number;
    name: string;
    code: string;
    description?: string | null;
    billing_cycle: string;
    price: number;
    currency: string;
}

export interface TenantLimits {
    max_users: number;
    max_products: number;
    max_customers: number;
    max_suppliers: number;
    max_storage_mb: number;
    max_ai_requests: number;
    max_backups: number;
    [key: string]: number;
}

export interface TenantUsage {
    users: number;
    products: number;
    customers: number;
    suppliers: number;
    storage_mb: number;
    ai_requests: number;
    backups: number;
    [key: string]: number;
}

export interface TenantContextData {
    tenant: TenantSummary;
    license: TenantLicense;
    package: TenantPackage | null;
    limits: TenantLimits;
    usage: TenantUsage;
    modules: Record<string, boolean>;
    module_details: ResolvedModule[];
}

export interface TenantContextValue {
    context: TenantContextData | null;
    tenant: TenantSummary | null;
    license: TenantLicense | null;
    package: TenantPackage | null;
    limits: TenantLimits | null;
    usage: TenantUsage | null;
    modules: Record<string, boolean>;
    moduleDetails: ResolvedModule[];
    loading: boolean;
    error: string | null;
    refreshTenantContext: () => Promise<void>;
    hasModuleAccess: (moduleCode: string) => boolean;
    isModuleLocked: (moduleCode: string) => boolean;
    isLicenseActive: () => boolean;
    isLicenseExpiringSoon: () => boolean;
    isLicenseExpired: () => boolean;
    isLimitReached: (resource: string) => boolean;
    isUnlimited: (resource: string) => boolean;
    getUsagePercentage: (resource: string) => number;
}
