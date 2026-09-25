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
    SlidersHorizontal,
    Search,
    RefreshCw,
    Shield,
    Radio,
    Sparkles,
    Settings2,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { notificationService } from '@/lib/notificationService';
import {
    NotificationItem,
    NotificationPreferenceItem,
    NotificationSeverity,
} from '@/types/notification';

export default function TenantNotificationsPage() {
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
            console.error('Failed to load preferences:', err);
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
            setPrefMessage('Preferences updated successfully!');
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
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-rose-600" /> Critical
                    </span>
                );
            case 'error':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-red-50 text-red-700 border border-red-200 shadow-2xs">
                        <AlertCircle className="w-3.5 h-3.5 text-red-600" /> Error
                    </span>
                );
            case 'warning':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200 shadow-2xs">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" /> Warning
                    </span>
                );
            case 'success':
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Success
                    </span>
                );
            case 'info':
            default:
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-700 border border-sky-200 shadow-2xs">
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
        <div className="space-y-6 max-w-6xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header Title Section */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-inner">
                        <Bell className="w-6 h-6" />
                    </div>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                                Notification Center
                            </h1>
                            {connected ? (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
                                    Live Connected
                                </span>
                            ) : (
                                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600">
                                    <Radio className="w-3.5 h-3.5 text-slate-400" />
                                    Polling Mode
                                </span>
                            )}
                        </div>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Real-time operational alerts, production milestones, inventory triggers, and system updates.
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
                                ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
                                : 'bg-slate-100 border-slate-200 text-slate-500'
                        }`}
                        title={soundEnabled ? 'Chime Enabled' : 'Chime Muted'}
                    >
                        {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                        <span className="hidden sm:inline">{soundEnabled ? 'Sound On' : 'Muted'}</span>
                    </button>

                    <div className="flex p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs font-semibold">
                        <button
                            type="button"
                            onClick={() => setActiveTab('inbox')}
                            className={`px-3.5 py-1.5 rounded-lg transition ${
                                activeTab === 'inbox'
                                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
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
                                    ? 'bg-white text-slate-900 shadow-2xs font-bold'
                                    : 'text-slate-600 hover:text-slate-900'
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
                    <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                        <div className="flex-1 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                            {/* Search */}
                            <div className="relative flex-1 min-w-[200px]">
                                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Search alerts and messages..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                                />
                            </div>

                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value as any)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Status</option>
                                <option value="unread">Unread Only</option>
                                <option value="read">Read Only</option>
                            </select>

                            {/* Severity Filter */}
                            <select
                                value={severityFilter}
                                onChange={(e) => setSeverityFilter(e.target.value)}
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
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
                                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500"
                            >
                                <option value="all">All Categories</option>
                                <option value="inventory">Inventory</option>
                                <option value="production">Production</option>
                                <option value="finance">Finance</option>
                                <option value="license">License</option>
                                <option value="system">System</option>
                                <option value="security">Security</option>
                            </select>
                        </div>

                        {/* Bulk Actions */}
                        <div className="flex items-center gap-2 shrink-0">
                            {unreadCount > 0 && (
                                <button
                                    type="button"
                                    onClick={markAllAsRead}
                                    className="px-3.5 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-2xs"
                                >
                                    <CheckCheck className="w-4 h-4" />
                                    Mark All Read
                                </button>
                            )}

                            <button
                                type="button"
                                onClick={() => handleFilterChange()}
                                className="p-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition"
                                title="Refresh"
                            >
                                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            </button>
                        </div>
                    </div>

                    {/* Notifications Stream */}
                    <div className="space-y-3">
                        {loading && notifications.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center text-slate-400">
                                <RefreshCw className="w-6 h-6 mx-auto animate-spin mb-2 text-indigo-500" />
                                <p className="text-sm font-medium">Fetching notifications stream...</p>
                            </div>
                        ) : notifications.length === 0 ? (
                            <div className="bg-white p-12 rounded-2xl border border-slate-200 text-center shadow-2xs">
                                <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500">
                                    <Bell className="w-7 h-7" />
                                </div>
                                <h3 className="text-base font-bold text-slate-800">Inbox is empty</h3>
                                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-sm mx-auto">
                                    No notifications match your current filter criteria. You will be notified in real-time when new alerts occur.
                                </p>
                            </div>
                        ) : (
                            notifications.map((notif: NotificationItem) => (
                                <div
                                    key={notif.id}
                                    className={`p-5 rounded-2xl border transition-all duration-200 shadow-2xs flex flex-col sm:flex-row items-start justify-between gap-4 ${
                                        notif.is_read
                                            ? 'bg-white border-slate-200'
                                            : 'bg-indigo-50/40 border-indigo-200/80 shadow-indigo-500/5'
                                    }`}
                                >
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2.5 flex-wrap mb-2">
                                            {getSeverityBadge(notif.severity)}
                                            <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-slate-100 text-slate-600">
                                                {notif.category}
                                            </span>
                                            <span className="text-xs text-slate-400">
                                                {formatTimestamp(notif.created_at)}
                                            </span>
                                            {!notif.is_read && (
                                                <span className="w-2 h-2 rounded-full bg-indigo-600" title="Unread" />
                                            )}
                                        </div>

                                        <h3 className={`text-sm sm:text-base font-bold ${notif.is_read ? 'text-slate-800' : 'text-slate-950'}`}>
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
                                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
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
                                                className="p-2 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition"
                                                title="Mark as read"
                                            >
                                                <Check className="w-4 h-4" />
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            onClick={() => deleteNotification(notif.id)}
                                            className="p-2 text-slate-500 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition"
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
                <div className="bg-white p-6 sm:p-8 rounded-2xl border border-slate-200 shadow-2xs space-y-6">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Notification Preferences</h2>
                        <p className="text-xs sm:text-sm text-slate-500 mt-1">
                            Customize which categories trigger notifications and select your minimum severity thresholds.
                        </p>
                    </div>

                    {prefMessage && (
                        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold">
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
                                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider font-semibold">
                                            <th className="py-3 px-4">Category</th>
                                            <th className="py-3 px-4 text-center">In-App Alert</th>
                                            <th className="py-3 px-4 text-center">Sound Chime</th>
                                            <th className="py-3 px-4 text-center">Email Dispatch</th>
                                            <th className="py-3 px-4">Min Severity</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {preferences.map((pref, idx) => (
                                            <tr key={pref.category} className="hover:bg-slate-50/60">
                                                <td className="py-3.5 px-4 font-bold text-slate-800 capitalize">
                                                    {pref.category}
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.in_app_enabled}
                                                        onChange={() => togglePrefField(idx, 'in_app_enabled')}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.sound_enabled}
                                                        onChange={() => togglePrefField(idx, 'sound_enabled')}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4 text-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={pref.email_enabled}
                                                        onChange={() => togglePrefField(idx, 'email_enabled')}
                                                        className="w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500 cursor-pointer"
                                                    />
                                                </td>
                                                <td className="py-3.5 px-4">
                                                    <select
                                                        value={pref.min_severity}
                                                        onChange={(e) => setPrefSeverity(idx, e.target.value as any)}
                                                        className="px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-700"
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
                                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold rounded-xl transition shadow-sm disabled:opacity-50"
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
