export interface TenantKpis {
  total: number;
  active: number;
  trial: number;
  suspended: number;
  expired: number;
  cancelled: number;
}

export interface LicenseKpis {
  total: number;
  active: number;
  expiring_soon: number;
  expiring_soon_days: number;
  expired: number;
  suspended_or_revoked: number;
}

export interface RevenueKpis {
  monthly_mrr: number;
  projected_annual_arr: number;
  currency: string;
  paying_tenants_count: number;
}

export interface TenantGrowthPoint {
  date: string;
  label: string;
  new_tenants: number;
  total_tenants: number;
}

export interface ModuleAdoptionItem {
  id: number;
  name: string;
  code: string;
  icon?: string | null;
  description?: string | null;
  tenants_count: number;
  total_active_tenants: number;
  adoption_percentage: number;
}

export interface SystemAlert {
  id: string;
  type: string;
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  count?: number;
}

export interface RecentActivityItem {
  id: string;
  type: 'license_event' | 'subscription_event';
  event_type: string;
  tenant_name: string;
  description: string;
  metadata?: Record<string, any> | null;
  created_at: string;
}

export interface SuperAdminDashboardData {
  tenants: TenantKpis;
  licenses: LicenseKpis;
  revenue: RevenueKpis;
  alerts: SystemAlert[];
  tenant_growth: TenantGrowthPoint[];
  module_adoption: ModuleAdoptionItem[];
  recent_activity: RecentActivityItem[];
  generated_at: string;
}

export interface SuperAdminDashboardApiResponse {
  success: boolean;
  message: string;
  data: SuperAdminDashboardData;
}
