'use client';

import React, { useState, useEffect, useCallback } from 'react';
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
    Search,
    RefreshCw,
    Radio,
    Settings2,
    Layers,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/lib/notificationService';
import {
    NotificationItem,
    NotificationPreferenceItem,
    NotificationSeverity,
} from '@/types/notification';

export default function SuperAdminNotificationsPage() {
    const [activeTab, setActiveTab] = useState<'inbox' | 'preferences'>('inbox');
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'unread' | 'read'>('all');
    const [severityFilter, setSeverityFilter] = useState<string>('all');
    const [categoryFilter, setCategoryFilter] = useState<string>('all');

    // Preferences state
    const [preferences, setPreferences] = useState<NotificationPreferenceItem[]>([]);
    const [prefLoading, setPrefLoading] = useState<boolean>(false);
    const [prefSaving, setPrefSaving] = useState<boolean>(false);
    const [prefMessage, setPrefMessage] = useState<string | null>(null);

    const {
        notifications,
        unreadCount,
        loading,
        connected,
        soundEnabled,
        setSoundEnabled,
        loadNotifications,
        markAsRead,
        markAllAsRead,
        deleteNotification,
    } = useNotifications();

    const handleFilterChange = useCallback(() => {
        loadNotifications({
            status: statusFilter,
            severity: severityFilter !== 'all' ? severityFilter : undefined,
            category: categoryFilter !== 'all' ? categoryFilter : undefined,
            search: searchQuery.trim() || undefined,
        });
    }, [loadNotifications, statusFilter, severityFilter, categoryFilter, searchQuery]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            handleFilterChange();
        }, 300);
        return () => clearTimeout(timeout);
    }, [handleFilterChange]);

    const loadPreferences = async () => {
        try {
            setPrefLoading(true);
            const data = await notificationService.getPreferences();
            setPreferences(data || []);
        } catch (err) {
            console.error('Failed to load super admin preferences:', err);
        } finally {
            setPrefLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        try {
            setPrefSaving(true);
            setPrefMessage(null);
            const updated = await notificationService.updatePreferences(preferences);
            setPreferences(updated);
            setPrefMessage('Platform notification preferences updated successfully.');
            setTimeout(() => setPrefMessage(null), 4000);
        } catch (err) {
            console.error('Failed to save preferences:', err);
            setPrefMessage('Failed to update preferences.');
        } finally {
            setPrefSaving(false);
        }
    };

    const togglePrefField = (index: number, field: 'in_app_enabled' | 'sound_enabled' | 'email_enabled') => {
        setPreferences((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], [field]: !next[index][field] };
            return next;
        });
    };

    const setPrefSeverity = (index: number, min_severity: NotificationSeverity) => {
        setPreferences((prev) => {
            const next = [...prev];
            next[index] = { ...next[index], min_severity };
            return next;
        });
    };

    const getSeverityBadge = (severity: NotificationSeverity) => {
        switch (severity) {
            case 'critical':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">
                        <AlertCircle className="w-3.5 h-3.5" /> Critical
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-500/15 text-red-400 border border-red-500/30">
                        <AlertCircle className="w-3.5 h-3.5" /> Error
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                        <AlertTriangle className="w-3.5 h-3.5" /> Warning
                    </span>
                );
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Success
                    </span>
                );
            case 'info':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        <Info className="w-3.5 h-3.5" /> Info
                    </span>
                );
        }
    };

    const formatTimestamp = (dateStr: string) => {
        try {
            const d = new Date(dateStr);
            return d.toLocaleString('en-US', {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
            });
        } catch {
            return dateStr;
        }
    };

    return (
        <div className="space-y-6">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-900/80 p-6 rounded-2xl border border-slate-800 shadow-xl backdrop-blur-md">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shadow-inner">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                                Platform Notification Center
                            </h1>
                            {connected ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping"></span>
                                    Live Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-800 text-slate-400">
                                    <Radio className="w-3.5 h-3.5 text-slate-500" />
                                    Polling Mode
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Multi-tenant license expirations, tenant lifecycle alerts, audit triggers, and platform infrastructure events.
                        </p>
                    </div>
                </div>

                {/* Right Tab Controls & Audio */}
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setSoundEnabled((prev) => !prev)}
                        className={`p-2.5 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                            soundEnabled
                                ? 'bg-indigo-500/20 border-indigo-500/30 text-indigo-300'
                                : 'bg-slate-800/80 border-slate-700 text-slate-400'
                        }`}
                        title={soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
                    </button>

                    <div className="flex p-1 bg-slate-950/80 rounded-xl border border-slate-800 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inbox')}
                            className={`px-3.5 py-1.5 rounded-lg transition ${
                                activeTab === 'inbox'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            Inbox {unreadCount > 0 && <span className="ml-1 px-1.5 py-0.2 bg-rose-500 text-white rounded-full text-[10px]">{unreadCount}</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('preferences');
                                if (preferences.length === 0) loadPreferences();
                            }}
                            className={`px-3.5 py-1.5 rounded-lg transition ${
                                activeTab === 'preferences'
                                    ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30 font-bold'
                                    : 'text-slate-400 hover:text-slate-200'
                            }`}
                        >
                            <span className="flex items-center gap-1">
                                <Settings2 className="w-3.5 h-3.5" /> Preferences
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: INBOX */}
            {activeTab === 'inbox' && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="bg-slate-900/80 p-4 rounded-2xl border border-slate-800 shadow-xl flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search platform notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Status</option>
                                <option value="unread">Unread Only</option>
                                <option value="read">Read Only</option>
                            </select>

                            {/* Severity Filter */}
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Severities</option>
                                <option value="critical">Critical</option>
                                <option value="error">Error</option>
                                <option value="warning">Warning</option>
                                <option value="success">Success</option>
                                <option value="info">Info</option>
                            </select>

                            {/* Category Filter */}
                            <select
                                value={categoryFilter}
                                onChange={(e) => setCategoryFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs font-semibold text-slate-300 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="billing">Billing</option>
                                <option value="license">License</option>
                                <option value="security">Security</option>
                                <option value="system">System</option>
                                <option value="support">Support</option>
                            </select>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="px-3.5 py-2 bg-indigo-500/20 hover:bg-indigo-500/30 text-indigo-300 border border-indigo-500/30 rounded-xl text-xs font-bold transition flex items-center gap-1.5"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark All Read
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleFilterChange()}
                                className="p-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications Stream */}
                    <div className="space-y-3">
                        {loading && notifications.length === 0 ? (
                            <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center text-slate-400">
                                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-400" />
                                <p className="text-sm font-medium">Fetching platform notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-slate-900/80 p-12 rounded-2xl border border-slate-800 text-center">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-800 flex items-center justify-center text-slate-400">
                                    <Bell className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-slate-200">No Notifications</h3>
                                <p className="text-xs sm:text-sm text-slate-400 mt-1 max-w-sm mx-auto">
                                    No platform notifications match your current filter settings.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif: NotificationItem) => (
                                <div
                                    key={notif.id}
                                    className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col sm:flex-row items-start justify-between gap-4 ${
                                        notif.is_read
                                            ? 'bg-slate-900/60 border-slate-800'
                                            : 'bg-indigo-950/25 border-indigo-500/40 shadow-lg shadow-indigo-950/20'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                                            {getSeverityBadge(notif.severity)}
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-800 text-slate-300">
                                                {notif.category}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatTimestamp(notif.created_at)}
                                            </span>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" title="Unread" />
                                            )}
                                        </div>

                                        <h3 className={`text-sm sm:text-base font-bold ${notif.is_read ? 'text-slate-200' : 'text-white'}`}>
                                            {notif.title}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-slate-300 mt-1 leading-relaxed">
                                            {notif.message}
                                        </p>

                                        {/* Action link if provided */}
                                        {notif.action_url && (
                                            <div className="mt-3">
                                                <Link
                                                    href={notif.action_url}
                                                    onClick={() => {
                                                        if (!notif.is_read) markAsRead(notif.id);
                                                    }}
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-indigo-600/30"
                                                >
                                                    View Details <ExternalLink className="w-3.5 h-3.5" />
                                                </Link>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Buttons */}
                                    <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-start">
                                        {!notif.is_read && (
                                            <button
                                                type="button"
                                                onClick={() => markAsRead(notif.id)}
                                                className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-xl transition"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteNotification(notif.id)}
                                            className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-xl transition"
                                            title="Delete notification"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}

            {/* TAB 2: PREFERENCES */}
            {activeTab === 'preferences' && (
                <div className="bg-slate-900/80 p-6 sm:p-8 rounded-2xl border border-slate-800 shadow-xl space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-white">Super Admin Notification Preferences</h2>
                        <p className="text-xs sm:text-sm text-slate-400 mt-1">
                            Configure channel subscriptions and minimum severity thresholds for platform-wide alerts.
                        </p>
                    </div>

                    {prefMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-bold">
                            {prefMessage}
                        </div>
                    )}

                    {prefLoading ? (
                        <div className="p-8 text-center text-slate-400">Loading preferences...</div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-800 text-slate-400 text-xs uppercase tracking-wider font-semibold">
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4 text-center">In-App Alert</th>
                                            <th className="py-3 px-4 text-center">Sound Chime</th>
                                            <th className="py-3 px-4 text-center">Email Dispatch</th>
                                            <th className="py-3 px-4">Min Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-800">
                                        {preferences.map((pref, idx) => (
                                            <tr key={pref.category} className="hover:bg-slate-800/40">
                                                <td className="py-3.5 px-4 font-bold text-slate-200 capitalize">
                                                    {pref.category}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.in_app_enabled}
                                                        onChange={() => togglePrefField(idx, 'in_app_enabled')}
                                                        className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.sound_enabled}
                                                        onChange={() => togglePrefField(idx, 'sound_enabled')}
                                                        className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.email_enabled}
                                                        onChange={() => togglePrefField(idx, 'email_enabled')}
                                                        className="w-4 h-4 text-indigo-500 rounded focus:ring-indigo-500 bg-slate-950 border-slate-700 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <select
                                                        value={pref.min_severity}
                                                        onChange={(e) => setPrefSeverity(idx, e.target.value as any)}
                                                        className="px-2.5 py-1 bg-slate-950 border border-slate-700 rounded-lg text-xs font-semibold text-slate-200"
                                                    >
                                                        <option value="info">Info (All)</option>
                                                        <option value="warning">Warning & Above</option>
                                                        <option value="critical">Critical Only</option>
                                                    </select>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            <div className="pt-4 flex justify-end">
                                <button
                                    type="button"
                                    onClick={handleSavePreferences}
                                    disabled={prefSaving}
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                                >
                                    {prefSaving ? 'Saving...' : 'Save Preferences'}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
