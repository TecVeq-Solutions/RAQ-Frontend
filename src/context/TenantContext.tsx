'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import Cookies from 'js-cookie';
import { io, Socket } from 'socket.io-client';
import {
    TenantContextData,
    TenantContextValue,
    TenantSummary,
    TenantLicense,
    TenantPackage,
    TenantLimits,
    TenantUsage,
} from '@/types/tenantContext';
import { ResolvedModule } from '@/types/moduleAccess';
import { tenantContextService } from '@/lib/tenantContextService';

const TenantContext = createContext<TenantContextValue | undefined>(undefined);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:6001';

export const TenantContextProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [context, setContext] = useState<TenantContextData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    const loadContext = useCallback(async () => {
        try {
            const token = Cookies.get('auth_token');
            if (!token) {
                setLoading(false);
                return;
            }

            const data = await tenantContextService.getTenantContext();
            setContext(data);
            setError(null);
        } catch (err: any) {
            console.error('Failed to load global tenant context:', err);
            setError(err?.response?.data?.message || err?.message || 'Failed to load tenant context.');
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        loadContext();
    }, [loadContext]);

    // Socket.IO Real-time synchronization
    useEffect(() => {
        const token = Cookies.get('auth_token');
        const userCookie = Cookies.get('user');

        if (!token || !userCookie) return;

        let room = '';
        try {
            const user = JSON.parse(userCookie);
            if (user?.tenant_id) {
                room = `tenant:${user.tenant_id}`;
            }
        } catch (e) {}

        if (!room) return;

        const socket: Socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 5,
        });

        socket.on('connect', () => {
            socket.emit('join_room', { room });
        });

        // Listen for context-altering notification events
        socket.on('notification:new', (payload: any) => {
            const type = payload?.notification?.type || '';
            const category = payload?.notification?.category || '';

            if (
                type.includes('license') ||
                type.includes('package') ||
                type.includes('module') ||
                type.includes('subscription') ||
                category === 'license' ||
                category === 'billing'
            ) {
                loadContext();
            }
        });

        // Window focus refresh
        const handleFocus = () => {
            loadContext();
        };
        window.addEventListener('focus', handleFocus);

        return () => {
            window.removeEventListener('focus', handleFocus);
            socket.emit('leave_room', { room });
            socket.disconnect();
        };
    }, [loadContext]);

    // Derived helpers
    const hasModuleAccess = useCallback(
        (moduleCode: string): boolean => {
            if (!context?.modules) return false;
            return context.modules[moduleCode] === true;
        },
        [context]
    );

    const isModuleLocked = useCallback(
        (moduleCode: string): boolean => {
            if (!context?.modules) return true;
            return context.modules[moduleCode] === false;
        },
        [context]
    );

    const isLicenseActive = useCallback((): boolean => {
        if (!context?.license) return false;
        return context.license.status === 'active' && context.license.is_valid;
    }, [context]);

    const isLicenseExpiringSoon = useCallback((): boolean => {
        if (!context?.license) return false;
        return context.license.is_expiring_soon || (context.license.days_remaining > 0 && context.license.days_remaining <= 14);
    }, [context]);

    const isLicenseExpired = useCallback((): boolean => {
        if (!context?.license) return true;
        return context.license.status === 'expired' || context.license.status === 'revoked' || !context.license.is_valid;
    }, [context]);

    const isUnlimited = useCallback(
        (resource: string): boolean => {
            if (!context?.limits) return false;
            const limitKey = resource.startsWith('max_') ? resource : `max_${resource}`;
            return context.limits[limitKey] === -1;
        },
        [context]
    );

    const isLimitReached = useCallback(
        (resource: string): boolean => {
            if (!context?.limits || !context?.usage) return false;
            const limitKey = resource.startsWith('max_') ? resource : `max_${resource}`;
            const usageKey = resource.replace(/^max_/, '');

            const limit = context.limits[limitKey];
            const usage = context.usage[usageKey] || 0;

            if (limit === -1 || limit === undefined) return false;
            return usage >= limit;
        },
        [context]
    );

    const getUsagePercentage = useCallback(
        (resource: string): number => {
            if (!context?.limits || !context?.usage) return 0;
            const limitKey = resource.startsWith('max_') ? resource : `max_${resource}`;
            const usageKey = resource.replace(/^max_/, '');

            const limit = context.limits[limitKey];
            const usage = context.usage[usageKey] || 0;

            if (limit === -1 || limit === undefined) return 0;
            if (limit <= 0) return 100;

            return Math.min(100, Math.round((usage / limit) * 100));
        },
        [context]
    );

    const value: TenantContextValue = useMemo(
        () => ({
            context,
            tenant: context?.tenant || null,
            license: context?.license || null,
            package: context?.package || null,
            limits: context?.limits || null,
            usage: context?.usage || null,
            modules: context?.modules || {},
            moduleDetails: context?.module_details || [],
            loading,
            error,
            refreshTenantContext: loadContext,
            hasModuleAccess,
            isModuleLocked,
            isLicenseActive,
            isLicenseExpiringSoon,
            isLicenseExpired,
            isLimitReached,
            isUnlimited,
            getUsagePercentage,
        }),
        [
            context,
            loading,
            error,
            loadContext,
            hasModuleAccess,
            isModuleLocked,
            isLicenseActive,
            isLicenseExpiringSoon,
            isLicenseExpired,
            isLimitReached,
            isUnlimited,
            getUsagePercentage,
        ]
    );

    return <TenantContext.Provider value={value}>{children}</TenantContext.Provider>;
};

export const useTenantContext = (): TenantContextValue => {
    const ctx = useContext(TenantContext);
    if (!ctx) {
        throw new Error('useTenantContext must be used within a <TenantContextProvider>');
    }
    return ctx;
};
