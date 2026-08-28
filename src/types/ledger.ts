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
