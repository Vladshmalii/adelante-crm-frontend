"use client";

import { useState } from 'react';
import { Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileFormData, UserProfile } from '@/features/profile/types';
import { mockNotifications, mockUserProfile } from '@/shared/data/mockData';

export function useHeaderActions() {
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

    const handleMarkNotificationAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const handleMarkAllNotificationsAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleDeleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const handleProfileClick = () => {
        setIsProfileModalOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Відкрити налаштування');
    };

    const handleLogout = () => {
        console.log('Вийти з системи');
    };

    const handleSaveProfile = (data: ProfileFormData) => {
        console.log('Зберегти профіль:', data);
    };

    return {
        notifications,
        isProfileModalOpen,
        setIsProfileModalOpen,
        handleMarkNotificationAsRead,
        handleMarkAllNotificationsAsRead,
        handleDeleteNotification,
        handleProfileClick,
        handleSettingsClick,
        handleLogout,
        handleSaveProfile,
        userProfile: mockUserProfile,
    };
}
