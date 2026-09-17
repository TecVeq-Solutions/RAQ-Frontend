'use client';

import React from 'react';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function ManufacturingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard module="manufacturing">{children}</ModuleGuard>;
}
