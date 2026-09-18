'use client';

import React from 'react';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function AssetsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard module="fixed_assets">{children}</ModuleGuard>;
}
