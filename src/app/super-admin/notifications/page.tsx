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
    ChevronRight,
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Critical
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Error
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Warning
                    </span>
                );
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Success
                    </span>
                );
            case 'info':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200">
                        <Info className="w-3.5 h-3.5 text-sky-600" /> Info
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
        <div className="p-6 sm:p-8 space-y-6 max-w-7xl mx-auto font-sans">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-1.5">
                        <Link href="/super-admin/dashboard" className="hover:text-emerald-600 transition-colors">
                            Super Admin
                        </Link>
                        <ChevronRight className="w-3.5 h-3.5" />
                        <span className="text-emerald-600 font-bold">Notifications</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                            <Bell className="w-7 h-7 text-emerald-600" />
                            <span>Platform Notification Center</span>
                        </h1>
                        {connected ? (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                Live Connected
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                                <Radio className="w-3.5 h-3.5 text-slate-500" />
                                Polling Mode
                            </span>
                        )}
                    </div>
                    <p className="text-xs sm:text-sm text-slate-500 mt-1">
                        Multi-tenant license expirations, tenant lifecycle alerts, audit triggers, and platform infrastructure events.
                    </p>
                </div>

                {/* Right Tab Controls & Audio */}
                <div className="flex items-center gap-2.5 self-start sm:self-auto">
                    <button
                        type="button"
                        onClick={() => setSoundEnabled((prev) => !prev)}
                        className={`px-3 py-2 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                            soundEnabled
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-700'
                                : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'
                        }`}
                        title={soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
                        <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
                    </button>

                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200/80 text-xs font-bold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inbox')}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                activeTab === 'inbox'
                                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            Inbox {unreadCount > 0 && <span className="ml-1.5 px-1.5 py-0.5 bg-rose-500 text-white rounded-full text-[10px] font-mono">{unreadCount}</span>}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setActiveTab('preferences');
                                if (preferences.length === 0) loadPreferences();
                            }}
                            className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer ${
                                activeTab === 'preferences'
                                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                                    : 'text-slate-500 hover:text-slate-800'
                            }`}
                        >
                            <span className="flex items-center gap-1.5">
                                <Settings2 className="w-3.5 h-3.5 text-slate-600" /> Preferences
                            </span>
                        </button>
                    </div>
                </div>
            </div>

            {/* TAB 1: INBOX */}
            {activeTab === 'inbox' && (
                <div className="space-y-4">
                    {/* Filters Bar */}
                    <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search platform notifications..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50/50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                            >
                                <option value="all">All Status</option>
                                <option value="unread">Unread Only</option>
                                <option value="read">Read Only</option>
                            </select>

                            {/* Severity Filter */}
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                                className="px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                                    className="px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                                >
                                    <CheckCheck className="w-4 h-4 text-emerald-600" />
                                    Mark All Read
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleFilterChange()}
                                className="p-2 bg-white hover:bg-slate-50 border border-slate-200 text-slate-600 rounded-xl transition cursor-pointer shadow-2xs"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-emerald-600' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications Stream */}
                    <div className="space-y-3">
                        {loading && notifications.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center text-slate-400 shadow-xs">
                                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-emerald-600" />
                                <p className="text-sm font-semibold">Fetching platform notifications...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white p-12 rounded-3xl border border-slate-200/80 text-center shadow-xs">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-400">
                                    <Bell className="w-7 h-7 text-slate-300" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">No Notifications</h3>
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
                                            ? 'bg-white border-slate-200/80 shadow-2xs hover:border-slate-300'
                                            : 'bg-emerald-50/30 border-emerald-200 shadow-xs hover:border-emerald-300'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                                            {getSeverityBadge(notif.severity)}
                                            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600 border border-slate-200">
                                                {notif.category}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatTimestamp(notif.created_at)}
                                            </span>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" title="Unread" />
                                            )}
                                        </div>

                                        <h3 className={`text-sm sm:text-base font-bold ${notif.is_read ? 'text-slate-800' : 'text-slate-900 font-extrabold'}`}>
                                            {notif.title}
                                        </h3>

                                        <p className="text-xs sm:text-sm text-slate-600 mt-1 leading-relaxed">
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
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs hover:scale-[1.01]"
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
                                                className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition cursor-pointer"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteNotification(notif.id)}
                                            className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition cursor-pointer"
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
                <div className="bg-white p-6 sm:p-8 rounded-3xl border border-slate-200/80 shadow-xs space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Super Admin Notification Preferences</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Configure channel subscriptions and minimum severity thresholds for platform-wide alerts.
                        </p>
                    </div>

                    {prefMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                            <span>{prefMessage}</span>
                        </div>
                    )}

                    {prefLoading ? (
                        <div className="p-8 text-center text-slate-400">
                            <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-emerald-600" />
                            <span>Loading preferences...</span>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-xs sm:text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-200/80 text-slate-500 text-xs uppercase tracking-wider font-bold bg-slate-50/70">
                                            <th className="py-3 px-4 rounded-l-xl">Category</th>
                                            <th className="py-3 px-4 text-center">In-App Alert</th>
                                            <th className="py-3 px-4 text-center">Sound Chime</th>
                                            <th className="py-3 px-4 text-center">Email Dispatch</th>
                                            <th className="py-3 px-4 rounded-r-xl">Min Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preferences.map((pref, idx) => (
                                            <tr key={pref.category} className="hover:bg-slate-50/60 transition-colors">
                                                <td className="py-3.5 px-4 font-bold text-slate-900 capitalize">
                                                    {pref.category}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.in_app_enabled}
                                                        onChange={() => togglePrefField(idx, 'in_app_enabled')}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-white border-slate-300 cursor-pointer accent-emerald-600"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.sound_enabled}
                                                        onChange={() => togglePrefField(idx, 'sound_enabled')}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-white border-slate-300 cursor-pointer accent-emerald-600"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.email_enabled}
                                                        onChange={() => togglePrefField(idx, 'email_enabled')}
                                                        className="w-4 h-4 text-emerald-600 rounded focus:ring-emerald-500 bg-white border-slate-300 cursor-pointer accent-emerald-600"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <select
                                                        value={pref.min_severity}
                                                        onChange={(e) => setPrefSeverity(idx, e.target.value as any)}
                                                        className="px-2.5 py-1.5 bg-white border border-slate-200 rounded-lg text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
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
                                    className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20 disabled:opacity-50 cursor-pointer hover:scale-[1.01]"
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
