export interface Customer {
  id: number;
  name: string;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at?: string;
}

export interface Supplier {
  id: number;
  name: string;
  contact_person?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  opening_balance: number;
  current_balance: number;
  is_active: boolean;
  created_at?: string;
}

export interface LedgerEntry {
  id: number;
  date: string;
  reference_type: string;
  reference_id?: number | null;
  description: string;
  debit: number;
  credit: number;
  running_balance: number;
  due_date?: string | null;
  payment_terms?: string | null;
  is_overdue?: boolean;
  overdue_days?: number;
  due_status?: 'paid' | 'due_today' | 'due_soon' | 'overdue' | 'current' | null;
}

export interface LedgerStatement {
  customer?: Customer;
  supplier?: Supplier;
  carry_forward: number;
  statement: LedgerEntry[];
  totals: {
    total_debit: number;
    total_credit: number;
  };
}

export interface AgingBucket {
  current: number;
  '1_30': number;
  '31_60': number;
  '61_plus': number;
  total: number;
  count: number;
}

export interface AgingInvoiceItem {
  id: number;
  invoice_no?: string;
  purchase_no?: string;
  date: string;
  due_date: string | null;
  payment_terms: string | null;
  grand_total: number;
  paid_amount: number;
  due_amount: number;
  overdue_days: number;
  bucket: 'current' | '1_30' | '31_60' | '61_plus';
  due_status: 'paid' | 'due_today' | 'due_soon' | 'overdue' | 'current';
}

export interface AgingEntityItem {
  id: number;
  name: string;
  phone?: string | null;
  email?: string | null;
  total_outstanding: number;
  buckets: {
    current: number;
    '1_30': number;
    '31_60': number;
    '61_plus': number;
  };
  invoices_count: number;
  invoices?: AgingInvoiceItem[];
}

export interface AgingReportData {
  as_of_date: string;
  receivables: {
    summary: AgingBucket;
    customers: AgingEntityItem[];
  };
  payables: {
    summary: AgingBucket;
    suppliers: AgingEntityItem[];
  };
}

export interface DueAlertsCategory {
  today_due_amount: number;
  today_due_count: number;
  overdue_amount: number;
  overdue_count: number;
  due_soon_amount?: number;
  due_soon_count?: number;
  top_overdue?: Array<{
    id: number;
    invoice_no?: string;
    purchase_no?: string;
    due_date: string;
    due_amount: number;
    customer?: { name: string };
    supplier?: { name: string };
  }>;
}

export interface DueAlertsData {
  as_of_date?: string;
  receivables?: DueAlertsCategory;
  payables?: DueAlertsCategory;
  totals?: {
    total_today_due: number;
    total_overdue: number;
  };
}

