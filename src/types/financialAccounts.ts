export type AccountType = 'cash' | 'bank' | 'mobile_wallet' | 'other';

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'transfer_in'
  | 'transfer_out'
  | 'customer_receipt'
  | 'supplier_payment'
  | 'expense';

export interface FinancialAccount {
  id: number;
  name: string;
  account_type: AccountType;
  account_number?: string | null;
  bank_name?: string | null;
  opening_balance: number | string;
  current_balance: number | string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
}

export interface AccountTransaction {
  id: number;
  account_id: number;
  transaction_date: string;
  transaction_type: TransactionType;
  amount: number | string;
  running_balance: number | string;
  reference_type?: string | null;
  reference_id?: number | null;
  description: string;
  created_at?: string;
}

export interface AccountStatementSummary {
  opening_balance: number;
  current_balance: number;
  total_inflow: number;
  total_outflow: number;
  net_flow: number;
}

export interface AccountStatementResponse {
  success: boolean;
  account: FinancialAccount;
  summary: AccountStatementSummary;
  data: AccountTransaction[];
  pagination: {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
  };
}

export interface TransferRequest {
  from_account_id: number;
  to_account_id: number;
  amount: number;
  transfer_date?: string;
  description?: string;
}

export interface CreateFinancialAccountRequest {
  name: string;
  account_type: AccountType;
  account_number?: string;
  bank_name?: string;
  opening_balance?: number;
  is_active?: boolean;
}
