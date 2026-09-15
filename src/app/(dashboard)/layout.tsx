'use client';

import React, { useEffect, useState } from 'react';
import Sidebar from '@/components/layout/Sidebar';
import Header from '@/components/layout/Header';
import { authService } from '@/lib/auth';
import { User } from '@/types/auth';
import { WorkspaceSkeleton } from '@/components/ui/Skeleton';
import AiAssistantDrawer from '@/components/ai/AiAssistantDrawer';
import { Sparkles } from 'lucide-react';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [user, setUser] = useState<User | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);
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
          } else {
            window.location.href = '/login';
          }
        })
        .catch(() => {
          window.location.href = '/login';
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, []);

  if (loading || !user) {
    return <WorkspaceSkeleton />;
  }

  return (
    <div className="min-h-screen bg-[#F3F4F6] flex max-w-full overflow-x-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        user={user}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 max-w-full lg:pl-72 2xl:pl-80 overflow-x-hidden transition-all duration-300">
        {/* Sticky Header */}
        <Header
          user={user}
          onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)}
          onAiToggle={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
        />

        {/* Dynamic Page Content */}
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 2xl:p-10 w-full max-w-full overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Floating AI Assistant Launcher Button */}
      <button
        type="button"
        onClick={() => setIsAiDrawerOpen(true)}
        className="fixed bottom-5 right-5 z-40 p-3 sm:px-4 sm:py-3 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-500 hover:to-teal-600 text-white shadow-xl hover:shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center gap-2 font-bold text-xs sm:text-sm cursor-pointer border border-emerald-400/30"
        title="Open Tecveq AI Assistant"
      >
        <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-200 animate-pulse" />
        <span className="hidden sm:inline">Tecveq AI</span>
      </button>

      {/* Slide-over AI Assistant Chat Drawer */}
      <AiAssistantDrawer
        isOpen={isAiDrawerOpen}
        onClose={() => setIsAiDrawerOpen(false)}
        user={user}
      />
    </div>
  );
}

