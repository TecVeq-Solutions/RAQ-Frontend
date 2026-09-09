export interface BalanceSheetAccount {
  id: number;
  name: string;
  account_type: 'cash' | 'bank' | 'mobile_wallet' | 'other';
  account_number?: string | null;
  bank_name?: string | null;
  current_balance: number;
}

export interface BalanceSheetAssetItem {
  id: number;
  name: string;
  asset_code: string;
  asset_type: string;
  status: string;
  purchase_cost: number;
  accumulated_depreciation: number;
  current_value: number;
}

export interface BalanceSheetCurrentAssets {
  cash_and_bank: number;
  cash_balance: number;
  bank_balance: number;
  mobile_wallet_balance: number;
  other_account_balance: number;
  customer_receivables: number;
  raw_material_inventory: number;
  finished_goods_inventory: number;
  consumables_inventory: number;
  machinery_inventory: number;
  total_inventory: number;
  total_current_assets: number;
  accounts_count: number;
  accounts: BalanceSheetAccount[];
  active_customers_with_due: number;
}

export interface BalanceSheetFixedAssets {
  machinery_and_capital_assets: number;
  total_fixed_assets: number;
  assets_count: number;
  assets: BalanceSheetAssetItem[];
}

export interface BalanceSheetAssets {
  current_assets: BalanceSheetCurrentAssets;
  fixed_assets: BalanceSheetFixedAssets;
  total_assets: number;
}

export interface BalanceSheetCurrentLiabilities {
  supplier_payables: number;
  total_current_liabilities: number;
  active_suppliers_with_due: number;
}

export interface BalanceSheetLiabilities {
  current_liabilities: BalanceSheetCurrentLiabilities;
  total_liabilities: number;
}

export interface BalanceSheetEquity {
  owner_net_worth: number;
  total_equity: number;
}

export interface BalanceSheetSummary {
  total_assets: number;
  total_current_assets: number;
  total_fixed_assets: number;
  total_liabilities: number;
  equity: number;
  liabilities_and_equity: number;
  balance_difference: number;
  is_balanced: boolean;
}

export interface BalanceSheetData {
  as_of_date: string;
  assets: BalanceSheetAssets;
  liabilities: BalanceSheetLiabilities;
  equity: BalanceSheetEquity;
  summary: BalanceSheetSummary;
}

// ==========================================
// PHASE 13 — MANUFACTURING REPORTS SUITE TYPES
// ==========================================

export interface ProductionSummarySummary {
  total_orders: number;
  draft_orders: number;
  in_progress_orders: number;
  completed_orders: number;
  cancelled_orders: number;
  target_quantity: number;
  completed_quantity: number;
  remaining_quantity: number;
  completion_percentage: number;
}

export interface ProductionSummaryProduct {
  id: number;
  name: string;
  sku: string;
  unit_name: string;
  orders_count: number;
  planned_quantity: number;
  actual_quantity: number;
  variance: number;
  achievement_percentage: number;
}

export interface ProductionSummaryRow {
  id: number;
  order_no: string;
  finished_product: {
    id: number;
    name: string;
    sku: string;
    unit_name: string;
  };
  bom_name: string;
  planned_quantity: number;
  actual_quantity: number;
  variance: number;
  achievement_percentage: number;
  performance_status: 'on_target' | 'under_production' | 'over_production';
  status: string;
  current_stage: string | null;
  start_date: string | null;
  completion_date: string | null;
  user_name: string;
}

export interface ProductionSummaryData {
  date_from: string;
  date_to: string;
  summary: ProductionSummarySummary;
  by_product: ProductionSummaryProduct[];
  rows: ProductionSummaryRow[];
}

export interface RawMaterialSummary {
  id: number;
  name: string;
  sku: string;
  unit_name: string;
  orders_count: number;
  planned_quantity: number;
  consumed_quantity: number;
  variance: number;
  unit_cost: number;
  total_cost: number;
}

export interface RawMaterialConsumptionRow {
  id: number;
  production_order_id: number;
  order_no: string;
  order_status: string;
  finished_product: {
    id: number;
    name: string;
    sku: string;
  };
  raw_material: {
    id: number;
    name: string;
    sku: string;
    unit_name: string;
    purchase_price: number;
  };
  planned_quantity: number;
  consumed_quantity: number;
  variance: number;
  unit_name: string;
  unit_cost: number;
  total_cost: number;
  date: string | null;
}

export interface RawMaterialConsumptionData {
  date_from: string;
  date_to: string;
  summary: {
    total_orders_count: number;
    total_materials_count: number;
    total_planned_quantity: number;
    total_consumed_quantity: number;
    total_variance_quantity: number;
    total_materials_cost: number;
    paper_reams_consumed: number;
    paper_sheets_consumed: number;
  };
  by_material: RawMaterialSummary[];
  rows: RawMaterialConsumptionRow[];
}

export interface ManufacturingWastageRow {
  id: number;
  production_order_id: number | null;
  order_no: string;
  finished_product: {
    id: number | null;
    name: string;
    sku: string;
  };
  raw_material: {
    id: number | null;
    name: string;
    sku: string;
    unit_name: string;
  };
  input_quantity: number;
  expected_output_sheets: number;
  actual_output_sheets: number;
  wastage_sheets: number;
  wastage_percentage: number;
  is_high_wastage: boolean;
  scrap_cost: number;
  operator_name: string;
  cutting_machine_id: number | null;
  date: string | null;
  notes: string | null;
}

export interface ManufacturingWastageData {
  date_from: string;
  date_to: string;
  summary: {
    total_cutting_operations: number;
    total_input_quantity: number;
    total_expected_sheets: number;
    total_usable_sheets: number;
    total_wastage_sheets: number;
    overall_wastage_percentage: number;
    high_wastage_count: number;
    total_scrap_cost: number;
  };
  rows: ManufacturingWastageRow[];
}

export interface ManufacturingCostRow {
  production_order_id: number;
  order_no: string;
  status: string;
  finished_product: {
    id: number;
    name: string;
    sku: string;
    unit_name: string;
    selling_price: number;
  };
  planned_quantity: number;
  actual_quantity: number;
  output_quantity: number;
  material_cost: number;
  labor_cost: number;
  binding_cost: number;
  overhead_cost: number;
  stage_cost: number;
  total_cost: number;
  unit_cost: number;
  selling_price: number;
  sales_value: number;
  gross_profit: number;
  margin_percentage: number;
  completion_date: string | null;
}

export interface ManufacturingCostData {
  date_from: string;
  date_to: string;
  summary: {
    total_orders_count: number;
    completed_orders_count: number;
    total_output_quantity: number;
    total_material_cost: number;
    total_labor_cost: number;
    total_binding_cost: number;
    total_overhead_cost: number;
    total_stage_costs: number;
    total_manufacturing_cost: number;
    total_revenue_value: number;
    average_unit_cost: number;
    manufacturing_gross_profit: number;
    manufacturing_margin_percentage: number;
  };
  rows: ManufacturingCostRow[];
}

