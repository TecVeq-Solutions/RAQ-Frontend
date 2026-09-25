export interface TenantDataSummaryCounts {
    operational: {
        sales: number;
        sale_items: number;
        purchases: number;
        purchase_items: number;
        payments: number;
        expenses: number;
        production_orders: number;
        production_order_items: number;
        production_cutting_logs: number;
        production_stage_costs: number;
        stock_movements: number;
        customer_ledgers: number;
        supplier_ledgers: number;
        account_transactions: number;
        asset_depreciations: number;
        asset_disposals: number;
        asset_maintenances: number;
        asset_journal_entries: number;
        total: number;
    };
    master: {
        products: number;
        categories: number;
        units: number;
        customers: number;
        suppliers: number;
        boms: number;
        bom_items: number;
        assets: number;
        financial_accounts: number;
        total: number;
    };
    saas: {
        users: number;
        licenses: number;
        license_events: number;
        subscription_events: number;
        module_overrides: number;
        total: number;
    };
    grand_total: number;
}

export interface TenantDataSummaryResponse {
    tenant: {
        id: number;
        uuid: string;
        name: string;
        slug: string;
        legal_name: string | null;
        owner_name: string | null;
        email: string | null;
        phone: string | null;
        status: string;
        created_at: string;
        package: {
            id: number;
            name: string;
            slug: string;
        } | null;
        active_license: {
            id: number;
            license_key: string;
            status: string;
            expires_at: string | null;
        } | null;
    };
    counts: TenantDataSummaryCounts;
    timestamp: string;
}

export interface ResetOperationalPayload {
    confirmation_phrase: string;
}

export interface ResetFullPayload {
    password?: string;
    confirmation_phrase: string;
}

export interface ArchiveTenantPayload {
    password?: string;
    confirmation_phrase: string;
}

export interface DeleteTenantPayload {
    password?: string;
    confirmation_phrase: string;
}

export interface ResetOperationResult {
    tenant_id: number;
    tenant_name: string;
    action?: string;
    deleted_records_count?: number;
    cleared_counts?: Record<string, number>;
    status?: string;
    revoked_tokens_count?: number;
    suspended_licenses_count?: number;
    revoked_licenses_count?: number;
}
