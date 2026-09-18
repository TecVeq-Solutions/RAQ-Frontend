'use client';

import React from 'react';
import ModuleGuard from '@/components/common/ModuleGuard';

export default function BackupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ModuleGuard module="backup">{children}</ModuleGuard>;
}
