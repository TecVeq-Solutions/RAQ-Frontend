export interface SuperAdminUser {
  id: number;
  name: string;
  email: string;
  status: 'active' | 'inactive' | 'suspended';
  role: 'super_admin';
  last_login_at?: string | null;
}

export interface SuperAdminLoginCredentials {
  email: string;
  password: string;
}

export interface SuperAdminAuthResponse {
  success: boolean;
  message: string;
  data: {
    token: string;
    user: SuperAdminUser;
  };
}

export interface SuperAdminMeResponse {
  success: boolean;
  data: {
    user: SuperAdminUser;
  };
}
