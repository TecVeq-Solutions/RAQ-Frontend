import { apiClient } from './api';
import {
    NotificationItem,
    NotificationPreferenceItem,
    NotificationResponse,
} from '@/types/notification';

export interface NotificationFilters {
    status?: 'all' | 'unread' | 'read';
    severity?: string;
    category?: string;
    search?: string;
    page?: number;
    per_page?: number;
}

export const notificationService = {
    async getNotifications(filters: NotificationFilters = {}): Promise<NotificationResponse> {
        const response = await apiClient.get<NotificationResponse>('/notifications', {
            params: filters,
        });
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await apiClient.get<{ unread_count: number }>('/notifications/unread-count');
        return response.data.unread_count;
    },

    async markAsRead(id: number): Promise<{ message: string; notification: NotificationItem; unread_count: number }> {
        const response = await apiClient.patch<{ message: string; notification: NotificationItem; unread_count: number }>(
            `/notifications/${id}/read`
        );
        return response.data;
    },

    async markAllAsRead(): Promise<{ message: string; marked_count: number; unread_count: number }> {
        const response = await apiClient.post<{ message: string; marked_count: number; unread_count: number }>(
            '/notifications/read-all'
        );
        return response.data;
    },

    async deleteNotification(id: number): Promise<{ message: string; unread_count: number }> {
        const response = await apiClient.delete<{ message: string; unread_count: number }>(
            `/notifications/${id}`
        );
        return response.data;
    },

    async getPreferences(): Promise<NotificationPreferenceItem[]> {
        const response = await apiClient.get<{ data: NotificationPreferenceItem[] }>(
            '/notifications/preferences'
        );
        return response.data.data;
    },

    async updatePreferences(preferences: NotificationPreferenceItem[]): Promise<NotificationPreferenceItem[]> {
        const response = await apiClient.patch<{ message: string; data: NotificationPreferenceItem[] }>(
            '/notifications/preferences',
            { preferences }
        );
        return response.data.data;
    },
};
