export type Role = 'admin' | 'staff' | 'viewer';

export interface User {
  id: number;
  name: string;
  email: string;
  role: Role;
  is_active: boolean;
  permissions?: string[];
  created_at?: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  data: {
    token: string;
    token_type: string;
    user: User;
  };
  errors?: Record<string, string[]>;
}

export interface MeResponse {
  success: boolean;
  data: {
    user: User;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  errors?: Record<string, string[]>;
}
