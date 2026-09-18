'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';
import {
    NotificationItem,
    NotificationResponse,
} from '@/types/notification';
import { notificationService, NotificationFilters } from '@/lib/notificationService';

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://127.0.0.1:6001';

export function useNotifications() {
    const [notifications, setNotifications] = useState<NotificationItem[]>([]);
    const [unreadCount, setUnreadCount] = useState<number>(0);
    const [loading, setLoading] = useState<boolean>(true);
    const [connected, setConnected] = useState<boolean>(false);
    const [totalPages, setTotalPages] = useState<number>(1);
    const [currentPage, setCurrentPage] = useState<number>(1);
    const [totalCount, setTotalCount] = useState<number>(0);
    const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

    const socketRef = useRef<Socket | null>(null);

    // Fetch notifications from REST API
    const loadNotifications = useCallback(async (filters: NotificationFilters = {}) => {
        try {
            setLoading(true);
            const res: NotificationResponse = await notificationService.getNotifications(filters);
            setNotifications(res.data || []);
            setUnreadCount(res.unread_count || 0);
            setTotalPages(res.last_page || 1);
            setCurrentPage(res.current_page || 1);
            setTotalCount(res.total || 0);
        } catch (err) {
            console.error('Failed to load notifications:', err);
        } finally {
            setLoading(false);
        }
    }, []);

    // Refresh unread count only
    const refreshUnreadCount = useCallback(async () => {
        try {
            const count = await notificationService.getUnreadCount();
            setUnreadCount(count);
        } catch (err) {
            console.error('Failed to refresh unread count:', err);
        }
    }, []);

    // Mark single notification as read
    const markAsRead = useCallback(async (id: number) => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => (n.id === id ? { ...n, is_read: true, read_at: new Date().toISOString() } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));

            const res = await notificationService.markAsRead(id);
            if (typeof res.unread_count === 'number') {
                setUnreadCount(res.unread_count);
            }
        } catch (err) {
            console.error('Failed to mark notification as read:', err);
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    // Mark all notifications as read
    const markAllAsRead = useCallback(async () => {
        try {
            // Optimistic update
            setNotifications((prev) =>
                prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() }))
            );
            setUnreadCount(0);

            const res = await notificationService.markAllAsRead();
            if (typeof res.unread_count === 'number') {
                setUnreadCount(res.unread_count);
            }
        } catch (err) {
            console.error('Failed to mark all notifications as read:', err);
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    // Delete single notification
    const deleteNotification = useCallback(async (id: number) => {
        try {
            setNotifications((prev) => prev.filter((n) => n.id !== id));
            const res = await notificationService.deleteNotification(id);
            if (typeof res.unread_count === 'number') {
                setUnreadCount(res.unread_count);
            }
        } catch (err) {
            console.error('Failed to delete notification:', err);
            refreshUnreadCount();
        }
    }, [refreshUnreadCount]);

    // Sound chime helper
    const playChime = useCallback(() => {
        if (!soundEnabled || typeof window === 'undefined') return;
        try {
            const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
            osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
            gain.gain.setValueAtTime(0.15, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
            osc.start();
            osc.stop(ctx.currentTime + 0.4);
        } catch (e) {
            // Audio context not allowed or blocked
        }
    }, [soundEnabled]);

    // Setup Socket.IO connection and rooms
    useEffect(() => {
        const token = Cookies.get('auth_token') || Cookies.get('super_admin_token');
        const userCookie = Cookies.get('user');
        const superAdminCookie = Cookies.get('super_admin_user');

        let room = '';
        if (superAdminCookie) {
            try {
                const sa = JSON.parse(superAdminCookie);
                if (sa.id) room = `super-admin:${sa.id}`;
            } catch (e) { }
        } else if (userCookie) {
            try {
                const user = JSON.parse(userCookie);
                if (user.tenant_id) room = `tenant:${user.tenant_id}`;
            } catch (e) { }
        }

        // Initial fetch
        loadNotifications();

        // Connect Socket
        const socket = io(SOCKET_URL, {
            auth: { token },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on('connect', () => {
            setConnected(true);
            if (room) {
                socket.emit('join_room', { room });
            }
        });

        socket.on('disconnect', () => {
            setConnected(false);
        });

        // Listen for new incoming notification
        socket.on('notification:new', (payload: { notification: NotificationItem }) => {
            if (payload?.notification) {
                setNotifications((prev) => [payload.notification, ...prev]);
                setUnreadCount((prev) => prev + 1);
                playChime();
            }
        });

        // Listen for unread count updates
        socket.on('notification:unread_count', (payload: { unread_count: number }) => {
            if (typeof payload?.unread_count === 'number') {
                setUnreadCount(payload.unread_count);
            }
        });

        return () => {
            if (room) {
                socket.emit('leave_room', { room });
            }
            socket.disconnect();
        };
    }, [loadNotifications, playChime]);

    return {
        notifications,
        unreadCount,
        loading,
        connected,
        totalPages,
        currentPage,
        totalCount,
        soundEnabled,
        setSoundEnabled,
        loadNotifications,
        refreshUnreadCount,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    };
}
