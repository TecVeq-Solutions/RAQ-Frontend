'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { authService } from '@/lib/auth';
import { User } from '@/types/auth';
import { Loader2 } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial immediate load from stored cookie
    const cachedUser = authService.getUserFromCookie();
    if (cachedUser) {
      setUser(cachedUser);
      setLoading(false);
    } else {
      // 2. Fetch fresh user data from API endpoint /api/me if cookie is missing
      authService
        .getCurrentUser()
        .then((freshUser) => {
          if (freshUser) {
            setUser(freshUser);
          }
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  if (loading && !user) {
    return (
      <div className="min-h-screen bg-brand-gray flex flex-col items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-[#16A34A] mb-3" />
        <p className="text-sm font-medium text-slate-500">Loading your workspace...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Sticky Header */}
        <Header
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-4 sm:p-6 lg:p-8 w-full">
          {children}
        </main>
      </div>
    </div>
  );
}
