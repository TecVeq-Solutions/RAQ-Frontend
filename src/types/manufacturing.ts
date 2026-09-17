import { Product, ProductUnit } from './inventory';
import { User } from './auth';

export interface BomItem {
  id?: number;
  bom_id?: number;
  raw_material_product_id: number;
  quantity: number;
  unit_id: number;
  wastage_allowance_percent: number;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  rawMaterialProduct?: Product;
  raw_material_product?: Product;
  unit?: ProductUnit;
}

export interface Bom {
  id: number;
  finished_product_id: number;
  bom_code: string;
  name: string;
  batch_quantity: number;
  unit_id: number;
  is_active: boolean;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  finishedProduct?: Product;
  finished_product?: Product;
  unit?: ProductUnit;
  bomItems?: BomItem[];
  bom_items?: BomItem[];
}

export interface BomItemFormData {
  id?: number;
  raw_material_product_id: number | '';
  quantity: number | string;
  unit_id: number | '';
  wastage_allowance_percent: number | string;
  notes?: string;
}

export interface BomFormData {
  finished_product_id: number | '';
  bom_code: string;
  name: string;
  batch_quantity: number | string;
  unit_id: number | '';
  is_active: boolean;
  notes?: string;
  items: BomItemFormData[];
}

// Phase 4: Production Order Types
export type ProductionOrderStatus = 'draft' | 'in_progress' | 'completed' | 'cancelled';
export type ProductionOrderStage = 'planning' | 'cutting' | 'binding' | 'finishing' | 'completed';

export interface ProductionOrderItem {
  id?: number;
  production_order_id?: number;
  raw_material_product_id: number;
  planned_quantity: number;
  consumed_quantity: number;
  unit_id: number;
  unit_cost: number;
  created_at?: string;
  updated_at?: string;
  rawMaterialProduct?: Product;
  raw_material_product?: Product;
  unit?: ProductUnit;
}

export interface ProductionOrder {
  id: number;
  order_no: string;
  bom_id?: number | null;
  finished_product_id: number;
  planned_quantity: number;
  actual_quantity: number;
  status: ProductionOrderStatus;
  current_stage: ProductionOrderStage;
  start_date?: string | null;
  completion_date?: string | null;
  user_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  finishedProduct?: Product;
  finished_product?: Product;
  bom?: Bom | null;
  user?: User | null;
  items?: ProductionOrderItem[];
  cuttingLogs?: ProductionCuttingLog[];
  cutting_logs?: ProductionCuttingLog[];
  cuttingLog?: ProductionCuttingLog | null;
  cutting_log?: ProductionCuttingLog | null;
  stageCosts?: ProductionStageCost[];
  stage_costs?: ProductionStageCost[];
  total_cost?: number | string | null;
  unit_cost?: number | string | null;
}

export interface ProductionOrderItemFormData {
  raw_material_product_id: number | '';
  planned_quantity: number | string;
  unit_id: number | '';
  unit_cost?: number | string;
}

export interface ProductionOrderFormData {
  finished_product_id: number | '';
  bom_id?: number | '';
  planned_quantity: number | string;
  actual_quantity?: number | string;
  start_date?: string;
  completion_date?: string;
  notes?: string;
  status?: ProductionOrderStatus;
  items?: ProductionOrderItemFormData[];
}

export interface MaterialCalculationItem {
  raw_material_product_id: number;
  product_name: string;
  sku: string;
  planned_quantity: number;
  unit_id: number;
  unit_name: string;
  unit_cost: number;
  wastage_allowance_percent: number;
  current_stock: number;
}

export interface MaterialCalculationResponse {
  bom_id: number;
  bom_code: string;
  bom_name: string;
  batch_quantity: number;
  planned_quantity: number;
  finished_product_id: number;
  finished_product_name: string;
  items: MaterialCalculationItem[];
}

// Phase 5: Material Consumption & Stock Transformation Types
export interface CompleteProductionItem {
  raw_material_product_id: number;
  consumed_quantity: number;
}

export interface CompleteProductionPayload {
  actual_quantity: number;
  consumption: CompleteProductionItem[];
}

// Phase 6: Paper Cutting & Wastage Tracking Types
export interface ProductionCuttingLog {
  id: number;
  production_order_id: number;
  raw_material_product_id: number;
  input_quantity: number;
  expected_output_sheets: number;
  actual_output_sheets: number;
  wastage_sheets: number;
  wastage_percentage: number;
  operator_name?: string | null;
  cutting_machine_id?: number | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  rawMaterialProduct?: Product;
  raw_material_product?: Product;
  productionOrder?: ProductionOrder;
}

export interface CuttingLogFormData {
  raw_material_product_id: number | '';
  input_quantity: number | string;
  expected_output_sheets: number | string;
  actual_output_sheets: number | string;
  wastage_sheets: number | string;
  total_cut_sheets?: number | string;
  operator_name?: string;
  cutting_machine_id?: number | string;
  notes?: string;
}

// Phase 7: Binding & Finishing Stage Tracking Types
export type ProductionStageName = 'cutting' | 'stitching' | 'pasting' | 'binding' | 'finishing' | 'other';
export type ProductionCostType = 'labor' | 'binding_contract' | 'electricity' | 'consumables' | 'overhead';

export interface ProductionStageCost {
  id: number;
  production_order_id: number;
  stage_name: ProductionStageName;
  cost_type: ProductionCostType;
  amount: number | string;
  vendor_or_worker_name?: string | null;
  notes?: string | null;
  created_at?: string;
  updated_at?: string;
  productionOrder?: ProductionOrder;
  production_order?: ProductionOrder;
}

export interface ProductionCostSummary {
  production_order_id: number;
  items: ProductionStageCost[];
  by_cost_type: Record<ProductionCostType, number>;
  by_stage: Record<ProductionStageName, number>;
  total_stage_cost: number;
}

export interface StageCostFormData {
  stage_name: ProductionStageName | '';
  cost_type: ProductionCostType | '';
  amount: number | string;
  vendor_or_worker_name?: string;
  notes?: string;
}

// Phase 8: Manufacturing Cost Calculation Types
export interface MaterialCostBreakdownItem {
  raw_material_product_id: number;
  name: string;
  sku: string;
  quantity: number;
  base_quantity: number;
  unit_name: string;
  unit_purchase_price: number;
  subtotal: number;
}

export interface WastageCostBreakdownItem {
  cutting_log_id: number;
  raw_material_product_id: number;
  raw_material_name: string;
  input_quantity: number;
  unit_name: string;
  expected_output_sheets: number;
  actual_output_sheets: number;
  wastage_sheets: number;
  wastage_percentage: number;
  wastage_quantity: number;
  raw_material_unit_price: number;
  wastage_cost: number;
}

export interface ProductionCostBreakdown {
  production_order_id: number;
  order_no: string;
  status: ProductionOrderStatus;
  current_stage: ProductionOrderStage;
  finished_product: {
    id?: number;
    name?: string;
    sku?: string;
    unit_name?: string;
    current_purchase_price?: number;
  };
  planned_quantity: number;
  actual_quantity: number;
  effective_quantity: number;
  material_cost_subtotal: number;
  materials_breakdown: MaterialCostBreakdownItem[];
  wastage_cost: number;
  wastage_breakdown: WastageCostBreakdownItem[];
  labor_cost: number;
  binding_cost: number;
  labor_and_binding_subtotal: number;
  electricity_cost: number;
  consumables_cost: number;
  overhead_cost: number;
  by_cost_type: Record<ProductionCostType, number>;
  stage_costs_subtotal: number;
  stage_costs_breakdown: ProductionStageCost[];
  total_manufacturing_cost: number;
  total_cost: number;
  unit_manufacturing_cost: number;
  unit_cost: number;
}




