export type NotificationSeverity = 'info' | 'success' | 'warning' | 'error' | 'critical';

export type NotificationCategory =
    | 'system'
    | 'billing'
    | 'license'
    | 'inventory'
    | 'production'
    | 'finance'
    | 'support'
    | 'security'
    | 'general';

export interface NotificationItem {
    id: number;
    tenant_id: number | null;
    super_admin_id: number | null;
    user_id: number | null;
    type: string;
    title: string;
    message: string;
    severity: NotificationSeverity;
    category: NotificationCategory;
    action_url: string | null;
    data: Record<string, any> | null;
    is_read: boolean;
    read_at: string | null;
    created_at: string;
    updated_at: string;
}

export interface NotificationPreferenceItem {
    category: string;
    in_app_enabled: boolean;
    sound_enabled: boolean;
    email_enabled: boolean;
    min_severity: NotificationSeverity;
}

export interface NotificationResponse {
    data: NotificationItem[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    unread_count: number;
}
