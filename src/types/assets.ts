export type AssetType = 'machinery' | 'vehicle' | 'building' | 'furniture' | 'electronics' | 'other';

export type AssetStatus = 'active' | 'under_maintenance' | 'disposed' | 'retired';

export type DepreciationMethod = 'straight_line' | 'none';

export type DepreciationFrequency = 'monthly' | 'annually';

export type DisposalType = 'sold' | 'scrapped' | 'written_off' | 'donated';

export type GainOrLoss = 'gain' | 'loss' | 'neutral';

export interface AssetMaintenance {
  id: number;
  asset_id: number;
  maintenance_date: string;
  cost: number | string;
  vendor_name?: string | null;
  description: string;
  performed_by?: string | null;
  created_at?: string;
  updated_at?: string;
  asset?: Asset;
}

export interface AssetDepreciation {
  id: number;
  asset_id: number;
  period_date: string;
  period_label: string;
  opening_book_value: number | string;
  depreciation_amount: number | string;
  accumulated_depreciation: number | string;
  closing_book_value: number | string;
  is_posted: boolean;
  posted_at?: string | null;
  posted_by?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface AssetDisposal {
  id: number;
  asset_id: number;
  disposal_date: string;
  disposal_type: DisposalType;
  sale_proceeds: number | string;
  net_book_value: number | string;
  gain_loss_amount: number | string;
  gain_or_loss: GainOrLoss;
  buyer_name?: string | null;
  reason: string;
  notes?: string | null;
  user_id?: number;
  created_at?: string;
  updated_at?: string;
}

export interface AssetJournalEntry {
  id: number;
  asset_id: number;
  entry_type: 'depreciation' | 'disposal_gain' | 'disposal_loss' | 'disposal_proceeds' | 'asset_cost_clearance';
  reference_id?: number | null;
  entry_date: string;
  debit_account: string;
  credit_account: string;
  amount: number | string;
  description: string;
  user_id?: number | null;
  created_at?: string;
  updated_at?: string;
}

export interface Asset {
  id: number;
  name: string;
  asset_code: string;
  asset_type: AssetType;
  purchase_cost: number | string;
  purchase_date: string;
  current_value: number | string;
  depreciation_method?: DepreciationMethod;
  useful_life_years?: number | string | null;
  depreciation_frequency?: DepreciationFrequency;
  depreciation_start_date?: string | null;
  salvage_value?: number | string;
  accumulated_depreciation?: number | string;
  maintenance_cost: number | string;
  status: AssetStatus;
  location?: string | null;
  description?: string | null;
  disposed_at?: string | null;
  created_at?: string;
  updated_at?: string;
  deleted_at?: string | null;
  maintenances?: AssetMaintenance[];
  depreciations?: AssetDepreciation[];
  disposal?: AssetDisposal | null;
  journal_entries?: AssetJournalEntry[];
  journalEntries?: AssetJournalEntry[];
}

export interface AssetFormData {
  name: string;
  asset_code: string;
  asset_type: AssetType;
  purchase_cost: number | string;
  purchase_date: string;
  current_value: number | string;
  depreciation_method?: DepreciationMethod;
  useful_life_years?: number | string;
  depreciation_frequency?: DepreciationFrequency;
  salvage_value?: number | string;
  status: AssetStatus;
  location?: string;
  description?: string;
}

export interface DepreciationConfigFormData {
  depreciation_method: DepreciationMethod;
  useful_life_years: number | string;
  depreciation_frequency: DepreciationFrequency;
  depreciation_start_date: string;
  salvage_value: number | string;
}

export interface DisposalFormData {
  disposal_date: string;
  disposal_type: DisposalType;
  sale_proceeds: number | string;
  buyer_name?: string;
  reason: string;
  notes?: string;
}

export interface AssetMaintenanceFormData {
  maintenance_date: string;
  cost: number | string;
  vendor_name?: string;
  description: string;
  performed_by?: string;
}

export interface AssetMetrics {
  total_purchase_value: number;
  total_current_value: number;
  total_accumulated_depreciation: number;
  total_maintenance_cost: number;
  total_assets_count: number;
  active_assets_count: number;
  under_maintenance_count: number;
  disposed_count?: number;
}
