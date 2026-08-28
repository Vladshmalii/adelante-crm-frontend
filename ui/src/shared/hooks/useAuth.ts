import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type User } from '@/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';
import apiClient from '@/lib/api/client';
import { USE_MOCK_DATA, BASE_PATH } from '@/lib/config';

const MOCK_USER: User = {
    id: '1',
    firstName: 'Демо',
    lastName: 'Користувач',
    name: 'Демо Користувач',
    role: 'administrator',
    createdAt: new Date().toISOString(),
    salons: [{ id: 'demo', name: 'Demo Salon', slug: 'demo' }],
};

export function useAuth() {
    const { user, setUser, clearUser, isAuthenticated, setCurrentSalonId } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    // Салон, с которым сейчас работает пользователь (X-Salon-Id для всех
    // запросов Admin API). Переключается через SalonSwitcher (Sidebar) —
    // здесь при каждом логине/checkAuth сохраняем предыдущий выбор, если он
    // всё ещё есть в списке салонов пользователя, иначе берём первый.
    const applySalon = useCallback(
        (salons: { id: string }[]) => {
            const stored = useAuthStore.getState().currentSalonId;
            const salonId = stored && salons.some((s) => s.id === stored) ? stored : salons[0]?.id;
            if (salonId) {
                apiClient.setSalonId(salonId);
                setCurrentSalonId(salonId);
            }
        },
        [setCurrentSalonId],
    );

    const checkAuth = useCallback(async () => {
        try {
            if (USE_MOCK_DATA) {
                const token = localStorage.getItem('auth_token');

                if (!token) {
                    clearUser();
                    if (typeof window !== 'undefined') {
                        router.replace('/login');
                    }
                    return;
                }

                if (!useAuthStore.getState().user) {
                    applySalon(MOCK_USER.salons);
                    setUser(MOCK_USER);
                }
                return;
            }

            const token = localStorage.getItem('auth_token');

            if (!token) {
                clearUser();
                if (typeof window !== 'undefined') {
                    router.replace('/login');
                }
                return;
            }

            const userData = await authApi.me();
            applySalon(userData.salons);
            setUser(userData);
        } catch (err) {
            console.error('[useAuth.checkAuth] Failed to check auth:', err);
            clearUser();
            if (typeof window !== 'undefined') {
                router.replace('/login');
            }
        }
    }, [setUser, clearUser, router, applySalon]);

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                await new Promise((resolve) => setTimeout(resolve, 500));

                const mockAccess = 'mock_token';
                const mockRefresh = 'mock_refresh_token';

                localStorage.setItem('auth_token', mockAccess);
                localStorage.setItem('refresh_token', mockRefresh);
                applySalon(MOCK_USER.salons);

                if (typeof document !== 'undefined') {
                    const path = BASE_PATH || '/';
                    document.cookie = `auth_token=${mockAccess}; path=${path}; max-age=${60 * 60 * 24 * 30}`;
                }

                setUser({ ...MOCK_USER, email });

                return { accessToken: mockAccess, refreshToken: mockRefresh };
            }

            const response = await authApi.login({ email, password });

            localStorage.setItem('auth_token', response.accessToken);
            localStorage.setItem('refresh_token', response.refreshToken);

            if (typeof document !== 'undefined') {
                const path = BASE_PATH || '/';
                document.cookie = `auth_token=${response.accessToken}; path=${path}; max-age=86400; SameSite=Lax`;
            }

            // Логин отдаёт только id/name/role/salonIds — полный профиль
            // (email, телефон, аватар) и список салонов подтягиваем через /me
            const salonId = response.user.salonIds[0];
            if (salonId) {
                apiClient.setSalonId(salonId);
            }
            const me = await authApi.me();
            applySalon(me.salons);
            setUser(me);

            return response;
        } catch (err) {
            console.error('Failed to login:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to login';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    // Самостоятельная регистрация недоступна — салоны создаёт администратор
    // платформы (см. backend/README.md, salonctl). Оставлено для мок-режима.
    const register = async (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        phone: string;
        salon_name: string;
    }) => {
        if (!USE_MOCK_DATA) {
            throw new Error(
                'Самостоятельная регистрація недоступна. Зверніться до адміністратора платформи.',
            );
        }
        setIsLoading(true);
        try {
            await new Promise((resolve) => setTimeout(resolve, 500));
            setUser({
                id: '1',
                firstName: data.first_name,
                lastName: data.last_name,
                name: `${data.first_name} ${data.last_name}`.trim(),
                phone: data.phone,
                role: 'administrator',
                createdAt: new Date().toISOString(),
                salons: [{ id: 'demo', name: data.salon_name, slug: 'demo' }],
            });
            return { accessToken: 'mock_token', refreshToken: 'mock_refresh_token' };
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            setError(null);
            await authApi.logout();
        } finally {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            localStorage.removeItem('salon_id');
            if (typeof document !== 'undefined') {
                const path = BASE_PATH || '/';
                document.cookie = `auth_token=; path=${path}; max-age=0`;
            }
            clearUser();
            setIsLoading(false);
        }
    };

    return {
        user,
        isAuthenticated,
        isLoading,
        error,
        login,
        register,
        logout,
        checkAuth,
    };
}
