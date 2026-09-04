export interface Category {
  id: number;
  name: string;
  slug: string;
  description?: string | null;
  is_active: boolean;
  products_count?: number;
  created_at?: string;
}

export interface ProductUnit {
  id: number;
  name: string;
  short_name: string;
  created_at?: string;
}

export interface StockDisplay {
  base_stock: number;
  base_unit: string;
  base_display: string;
  secondary_stock?: number | null;
  secondary_unit?: string | null;
  secondary_display?: string | null;
  conversion_ratio?: number | null;
  full_display: string;
  status: 'normal' | 'low_stock' | 'out_of_stock';
}

export interface Product {
  id: number;
  category_id?: number | null;
  unit_id: number;
  secondary_unit_id?: number | null;
  conversion_ratio?: number | null;
  name: string;
  sku: string;
  barcode?: string | null;
  description?: string | null;
  purchase_price: number;
  selling_price: number;
  stock_quantity: number;
  alert_quantity: number;
  is_active: boolean;
  category?: Category | null;
  unit?: ProductUnit | null;
  secondaryUnit?: ProductUnit | null;
  stock_display?: StockDisplay;
  created_at?: string;
}
