export interface PackageOffering {
  id: number;
  name: string;
  code: string;
  price: string | number;
  billing_cycle: string;
}

export interface CurrentPackageInfo {
  id: number;
  name: string;
  code: string;
  price?: string | number;
  billing_cycle?: string;
}

export interface ModuleOverrideInfo {
  id: number;
  is_enabled: boolean;
  reason?: string | null;
  expires_at?: string | null;
}

export interface ResolvedModule {
  module: string;
  module_id: number | null;
  module_name: string;
  allowed: boolean;
  source: 'override' | 'package' | 'global' | 'license' | 'none';
  package: CurrentPackageInfo | null;
  override: ModuleOverrideInfo | null;
  reason: string | null;
  available_in: PackageOffering[];
  icon?: string;
  description?: string;
  sort_order?: number;
}

export interface ModuleAccessData {
  modules: ResolvedModule[];
  access_map: Record<string, boolean>;
  current_package: CurrentPackageInfo | null;
  license_status: string;
}

export interface ModuleAccessApiResponse {
  success: boolean;
  data: ModuleAccessData;
  message?: string;
}
