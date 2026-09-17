import type { Metadata } from 'next';
import { Poppins } from 'next/font/google';
import './globals.css';

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-poppins',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Tecveq - Sales, Purchase, Stock & Accounting System',
  description: 'Enterprise Sales, Purchase, Stock & Accounting Management System with Role-Based Access Control',
  icons: {
    icon: '/tecveq-logo.png',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`h-full ${poppins.variable}`}>
      <body className={`h-full bg-brand-gray text-brand-navy antialiased font-sans ${poppins.className}`}>
        {children}
      </body>
    </html>
  );
}
