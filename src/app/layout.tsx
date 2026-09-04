import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tecveq - Sales, Purchase, Stock & Accounting System',
  description: 'Enterprise Sales, Purchase, Stock & Accounting Management System with Role-Based Access Control',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <body className="h-full bg-brand-gray text-brand-navy antialiased">
        {children}
      </body>
    </html>
  );
}
