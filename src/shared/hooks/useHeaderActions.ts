"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileFormData, UserProfile } from '@/features/profile/types';
import { mockNotifications } from '@/shared/data/mockData';
import { useAuthStore } from '@/stores/useAuthStore';
import { useAuth } from '@/shared/hooks/useAuth';
import { authApi } from '@/lib/api/auth';
import { BASE_PATH } from '@/lib/config';

export function useHeaderActions() {
    const router = useRouter();
    const { user, setUser } = useAuthStore();
    const { logout } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
    const [isLoadingUser, setIsLoadingUser] = useState(false);

    // Загружаем пользователя из API если его нет в store но есть токен
    useEffect(() => {
        const loadUser = async () => {
            console.log('[useHeaderActions] Checking user state:', { 
                hasUser: !!user, 
                userId: user?.id,
                userEmail: user?.email 
            });
            
            if (user) {
                console.log('[useHeaderActions] User already in store, skipping load');
                return; // Уже есть пользователь
            }
            
            const token = localStorage.getItem('auth_token');
            console.log('[useHeaderActions] Token check:', { hasToken: !!token });
            
            if (!token) {
                console.log('[useHeaderActions] No token, skipping load');
                return; // Нет токена
            }
            
            setIsLoadingUser(true);
            try {
                console.log('[useHeaderActions] Loading user from API...');
                const userData = await authApi.me();
                console.log('[useHeaderActions] User loaded from API:', userData);
                setUser(userData);
                console.log('[useHeaderActions] User saved to store');
            } catch (error) {
                console.error('[useHeaderActions] Failed to load user:', error);
            } finally {
                setIsLoadingUser(false);
            }
        };
        
        loadUser();
    }, [user, setUser]);

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
        router.push(`${BASE_PATH}/settings`);
    };

    const handleLogout = async () => {
        try {
            await logout();
            router.push(`${BASE_PATH}/login`);
        } catch (error) {
            console.error('Logout error:', error);
        }
    };

    const handleSaveProfile = (data: ProfileFormData) => {
        console.log('Зберегти профіль:', data);
    };

    // Если пользователя нет, но идет загрузка - показываем дефолтные значения
    // Если пользователя нет и загрузка завершена - показываем дефолтные значения (не мок!)
    const userProfile: UserProfile = user ? {
        id: user.id?.toString() || '1',
        firstName: user.first_name || 'User',
        lastName: user.last_name || '',
        email: user.email || 'user@example.com',
        phone: user.phone || '',
        role: (user.role as any) || 'master',
        avatar: user.avatar || undefined,
        hireDate: user.created_at || new Date().toISOString(),
    } : {
        id: '0',
        firstName: isLoadingUser ? 'Завантаження...' : 'Користувач',
        lastName: '',
        email: '',
        phone: '',
        role: 'master',
        hireDate: new Date().toISOString(),
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
        userProfile,
        isLoadingUser,
    };
}
