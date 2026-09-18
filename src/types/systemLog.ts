export type LogCategory = 'auth' | 'license' | 'package' | 'tenant' | 'module' | 'user' | 'db' | 'ai' | 'support';
export type LogSeverity = 'info' | 'warning' | 'critical';

export interface AdminActivityLog {
  id: number;
  super_admin_id: number | null;
  tenant_id: number | null;
  category: LogCategory;
  severity: LogSeverity;
  action: string;
  description: string;
  target_type: string | null;
  target_id: number | null;
  request_method: string | null;
  request_path: string | null;
  ip_address: string | null;
  user_agent: string | null;
  before_data: Record<string, any> | null;
  after_data: Record<string, any> | null;
  metadata: Record<string, any> | null;
  created_at: string;
  super_admin?: {
    id: number;
    name: string;
    email: string;
  } | null;
  tenant?: {
    id: number;
    name: string;
    slug: string;
    status: string;
  } | null;
}

export interface SystemLogPagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

export interface SystemLogSummary {
  total_logs: number;
  critical_logs: number;
  warning_logs: number;
  recent_24h: number;
}

export interface SystemLogListResponse {
  logs: AdminActivityLog[];
  pagination: SystemLogPagination;
  summary: SystemLogSummary;
}

export interface SystemLogFilterParams {
  search?: string;
  category?: string;
  severity?: string;
  action?: string;
  tenant_id?: string | number;
  super_admin_id?: string | number;
  date_from?: string;
  date_to?: string;
  page?: number;
  per_page?: number;
}

export interface TenantAuditTimelineItem {
  id: string;
  source: 'admin_activity_log' | 'license_event' | 'subscription_event' | 'ai_audit_log' | string;
  category: string;
  severity: LogSeverity;
  action: string;
  actor_name: string;
  actor_email?: string | null;
  actor_type: 'super_admin' | 'tenant_user' | 'system' | 'automation';
  description: string;
  target_type?: string | null;
  target_id?: number | null;
  timestamp: string;
  metadata?: Record<string, any> | null;
  before_data?: Record<string, any> | null;
  after_data?: Record<string, any> | null;
}

export interface TenantAuditResponse {
  tenant: {
    id: number;
    name: string;
    slug: string;
    status: string;
  };
  timeline: TenantAuditTimelineItem[];
  pagination: SystemLogPagination;
}
