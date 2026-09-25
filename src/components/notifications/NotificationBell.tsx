'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import {
    Bell,
    CheckCheck,
    Check,
    Trash2,
    Volume2,
    VolumeX,
    ExternalLink,
    AlertCircle,
    CheckCircle2,
    AlertTriangle,
    Info,
    Radio,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationItem, NotificationSeverity } from '@/types/notification';

interface NotificationBellProps {
    basePath?: string;
    className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({
    basePath = '',
    className = '',
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');
    const dropdownRef = useRef<HTMLDivElement>(null);

    const {
        notifications,
        unreadCount,
        loading,
        connected,
        soundEnabled,
        setSoundEnabled,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

    // Close on outside click
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isOpen]);

    const displayedNotifications = notifications.filter((n) => {
        if (filter === 'unread') return !n.is_read;
        return true;
    });

    const getSeverityBadge = (severity: NotificationSeverity) => {
        switch (severity) {
            case 'critical':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3 h-3" /> Critical
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-red-500/15 text-red-400 border border-red-500/30">
                        <AlertCircle className="w-3 h-3" /> Error
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3 h-3" /> Warning
                    </span>
                );
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3" /> Success
                    </span>
                );
            case 'info':
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <Info className="w-3 h-3" /> Info
                    </span>
                );
        }
    };

    const formatTimeAgo = (dateStr: string) => {
        try {
            const date = new Date(dateStr);
            const now = new Date();
            const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

            if (diffInSeconds < 60) return 'just now';
            if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
            if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
            return `${Math.floor(diffInSeconds / 86400)}d ago`;
        } catch {
            return '';
        }
    };

    return (
        <div className={`relative ${className}`} ref={dropdownRef}>
            {/* Bell Trigger Button */}
            <button
                type="button"
                onClick={() => setIsOpen((prev) => !prev)}
                className="relative p-2 text-slate-400 hover:text-slate-100 hover:bg-slate-800/80 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50"
                aria-label="Notifications"
            >
                <Bell className="w-5 h-5" />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-5 min-w-[20px] px-1 items-center justify-center rounded-full bg-rose-500 text-[11px] font-bold text-white shadow-lg shadow-rose-500/40 ring-2 ring-slate-900 animate-pulse">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 mt-3 w-80 sm:w-96 rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl shadow-black/80 z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
                    {/* Header */}
                    <div className="p-4 border-b border-slate-800 flex items-center justify-between bg-slate-900/90 backdrop-blur-md">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold text-slate-100 text-sm">Notifications</span>
                            {connected ? (
                                <span className="flex items-center gap-1 text-[11px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20" title="Real-time Socket Connected">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                                    Live
                                </span>
                            ) : (
                                <span className="flex items-center gap-1 text-[11px] text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                                    <Radio className="w-3 h-3 text-slate-500" />
                                    Polling
                                </span>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                onClick={() => setSoundEnabled((prev) => !prev)}
                                className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-slate-800 rounded-lg transition"
                                title={soundEnabled ? 'Mute Chime' : 'Unmute Chime'}
                            >
                                {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-slate-500" />}
                            </button>

                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="flex items-center gap-1 text-xs font-medium text-indigo-400 hover:text-indigo-300 transition hover:underline"
                                    title="Mark all as read"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Mark all
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter Tabs */}
                    <div className="flex border-b border-slate-800/80 bg-slate-950/40 px-3 py-1.5 gap-2">
                        <button
                            type="button"
                            onClick={() => setFilter('all')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                filter === 'all'
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                        >
                            All ({notifications.length})
                        </button>
                        <button
                            type="button"
                            onClick={() => setFilter('unread')}
                            className={`px-3 py-1 rounded-lg text-xs font-medium transition ${
                                filter === 'unread'
                                    ? 'bg-indigo-600 text-white shadow-sm shadow-indigo-600/30'
                                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                            }`}
                        >
                            Unread ({unreadCount})
                        </button>
                    </div>

                    {/* Notification List */}
                    <div className="max-h-80 overflow-y-auto divide-y divide-slate-800/60 scrollbar-thin scrollbar-thumb-slate-700">
                        {loading && notifications.length === 0 ? (
                            <div className="p-8 text-center text-slate-500 text-sm">
                                Loading notifications...
                            </div>
                        ) : displayedNotifications.length === 0 ? (
                            <div className="p-8 text-center">
                                <div className="w-10 h-10 mx-auto mb-2 rounded-full bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Bell className="w-5 h-5 opacity-60" />
                                </div>
                                <p className="text-sm font-medium text-slate-300">All caught up!</p>
                                <p className="text-xs text-slate-500 mt-0.5">No new notifications in this view.</p>
                            </div>
                        ) : (
                            displayedNotifications.map((notif: NotificationItem) => (
                                <div
                                    key={notif.id}
                                    className={`p-3.5 transition-colors relative group ${
                                        notif.is_read
                                            ? 'bg-slate-900/40 hover:bg-slate-800/40'
                                            : 'bg-indigo-950/20 hover:bg-indigo-950/30 border-l-2 border-indigo-500'
                                    }`}
                                >
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                {getSeverityBadge(notif.severity)}
                                                <span className="text-[11px] text-slate-500">
                                                    {formatTimeAgo(notif.created_at)}
                                                </span>
                                            </div>
                                            <h4 className={`text-xs font-semibold leading-tight line-clamp-1 ${notif.is_read ? 'text-slate-300' : 'text-slate-100'}`}>
                                                {notif.title}
                                            </h4>
                                            <p className="text-xs text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                                                {notif.message}
                                            </p>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition-opacity">
                                            {!notif.is_read && (
                                                <button
                                                    type="button"
                                                    onClick={() => markAsRead(notif.id)}
                                                    className="p-1 hover:bg-indigo-500/20 text-slate-400 hover:text-indigo-400 rounded-md transition"
                                                    title="Mark as read"
                                                >
                                                    <Check className="w-3.5 h-3.5" />
                                                </button>
                                            )}
                                            <button
                                                type="button"
                                                onClick={() => deleteNotification(notif.id)}
                                                className="p-1 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 rounded-md transition"
                                                title="Delete notification"
                                            >
                                                <Trash2 className="w-3.5 h-3.5" />
                                            </button>
                                        </div>
                                    </div>

                                    {notif.action_url && (
                                        <div className="mt-2">
                                            <Link
                                                href={notif.action_url}
                                                onClick={() => {
                                                    if (!notif.is_read) markAsRead(notif.id);
                                                    setIsOpen(false);
                                                }}
                                                className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-400 hover:text-indigo-300 hover:underline"
                                            >
                                                Take action <ExternalLink className="w-3 h-3" />
                                            </Link>
                                        </div>
                                    )}
                                </div>
                            ))
                        )}
                    </div>

                    {/* Footer */}
                    <div className="p-2.5 border-t border-slate-800 bg-slate-900/90 text-center">
                        <Link
                            href={`${basePath}/notifications`}
                            onClick={() => setIsOpen(false)}
                            className="inline-flex items-center justify-center w-full py-1.5 text-xs font-semibold text-indigo-400 hover:text-indigo-300 hover:bg-slate-800/60 rounded-xl transition"
                        >
                            View Notification Center →
                        </Link>
                    </div>
                </div>
            )}
        </div>
    );
};
