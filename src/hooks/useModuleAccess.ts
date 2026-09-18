'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { moduleAccessClient } from '@/lib/moduleAccessService';
import { ModuleAccessData, ResolvedModule, CurrentPackageInfo } from '@/types/moduleAccess';

export function useModuleAccess() {
  const [data, setData] = useState<ModuleAccessData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAccess = useCallback(async (force = false) => {
    try {
      setLoading(true);
      setError(null);
      const res = await moduleAccessClient.getEffectiveAccess(force);
      setData(res);
    } catch (err: any) {
      console.error('Failed to load module access:', err);
      setError(err?.response?.data?.message || err?.message || 'Could not load module permissions');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAccess();
  }, [fetchAccess]);

  const hasAccess = useCallback(
    (moduleCode: string): boolean => {
      if (!data) return false;
      return data.access_map[moduleCode] === true;
    },
    [data]
  );

  const isLocked = useCallback(
    (moduleCode: string): boolean => {
      if (!data) return false;
      return data.access_map[moduleCode] === false;
    },
    [data]
  );

  const getModule = useCallback(
    (moduleCode: string): ResolvedModule | null => {
      if (!data) return null;
      return data.modules.find((m) => m.module === moduleCode) || null;
    },
    [data]
  );

  const accessibleModules = useMemo(() => {
    if (!data) return [];
    return data.modules.filter((m) => m.allowed);
  }, [data]);

  const lockedModules = useMemo(() => {
    if (!data) return [];
    return data.modules.filter((m) => !m.allowed);
  }, [data]);

  return {
    hasAccess,
    isLocked,
    getModule,
    accessibleModules,
    lockedModules,
    allModules: data?.modules || [],
    currentPackage: data?.current_package || null,
    licenseStatus: data?.license_status || 'unknown',
    loading,
    error,
    refresh: () => fetchAccess(true),
  };
}
