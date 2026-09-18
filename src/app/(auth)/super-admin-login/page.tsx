import { Metadata } from 'next';
import SuperAdminLoginForm from '@/components/auth/SuperAdminLoginForm';

export const metadata: Metadata = {
  title: 'Super Admin Login | Tecveq Suite SaaS',
  description: 'Master control plane login for platform super administrators.',
};

export default function SuperAdminLoginPage() {
  return <SuperAdminLoginForm />;
}
