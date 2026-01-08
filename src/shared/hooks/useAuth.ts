import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';
import { USE_MOCK_DATA, BASE_PATH } from '@/lib/config';

export function useAuth() {
    const { user, setUser, clearUser, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const router = useRouter();

    const checkAuth = useCallback(async () => {
        try {
            if (USE_MOCK_DATA) {
                const token = localStorage.getItem('auth_token');

                if (!token) {
                    clearUser();
                    if (typeof window !== 'undefined') {
                        router.replace('/login'); // basePath додається автоматично
                    }
                    return;
                }

                const currentUser = useAuthStore.getState().user;
                // Якщо токен є, але користувача ще немає — ставимо дефолтного демо
                if (!currentUser) {
                    setUser({
                        id: 1,
                        email: 'demo@adelante.com',
                        first_name: 'Демо',
                        last_name: 'Користувач',
                        role: 'admin',
                        is_active: true,
                        is_verified: true,
                        created_at: new Date().toISOString(),
                    });
                }
                return;
            }

            const token = localStorage.getItem('auth_token');
            console.log('[useAuth.checkAuth] Token check:', { hasToken: !!token });
            
            if (!token) {
                console.log('[useAuth.checkAuth] No token, clearing user');
                clearUser();
                
                // Перенаправляємо на логін, якщо користувач неавторизований
                if (typeof window !== 'undefined') {
                    router.replace('/login'); // basePath додається автоматично
                }
                return;
            }

            // Перевіряємо токен через API
            console.log('[useAuth.checkAuth] Loading user from API...');
            const userData = await authApi.me();
            console.log('[useAuth.checkAuth] User loaded from API:', userData);
            setUser(userData);
            
            const storeUser = useAuthStore.getState().user;
            console.log('[useAuth.checkAuth] User in store after save:', storeUser);
        } catch (err) {
            console.error('[useAuth.checkAuth] Failed to check auth:', err);
            clearUser();
            if (typeof window !== 'undefined') {
                router.replace('/login'); // basePath додається автоматично
            }
        }
    }, [setUser, clearUser, router]);

    // Перевіряємо аут user при завантаженні
    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова авторизація
                await new Promise((resolve) => setTimeout(resolve, 500));

                const mockAccess = 'mock_token';
                const mockRefresh = 'mock_refresh_token';

                localStorage.setItem('auth_token', mockAccess);
                localStorage.setItem('refresh_token', mockRefresh);

                // Ставимо куку, щоб middleware бачив токен у демо
                if (typeof document !== 'undefined') {
                    const path = BASE_PATH || '/';
                    document.cookie = `auth_token=${mockAccess}; path=${path}; max-age=${60 * 60 * 24 * 30}`;
                }

                setUser({
                    id: 1,
                    email: email,
                    first_name: 'Демо',
                    last_name: 'Користувач',
                    role: 'admin',
                    is_active: true,
                    is_verified: true,
                    created_at: new Date().toISOString(),
                });
                
                return {
                    access_token: mockAccess,
                    refresh_token: mockRefresh,
                };
            } else {
                // Реальна авторизація
                console.log('[useAuth] Logging in with email:', email);
                const response = await authApi.login({ email, password });
                
                console.log('[useAuth] Login response received:', {
                    hasAccessToken: !!response.access_token,
                    hasRefreshToken: !!response.refresh_token,
                    user: response.user
                });
                
                // Зберігаємо токени
                localStorage.setItem('auth_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);
                
                console.log('[useAuth] Saving user to store:', response.user);
                setUser(response.user);
                
                const storeUser = useAuthStore.getState().user;
                console.log('[useAuth] User in store after save:', storeUser);
                
                return response;
            }
        } catch (err) {
            console.error('Failed to login:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to login';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const register = async (data: {
        email: string;
        password: string;
        first_name: string;
        last_name: string;
        phone: string;
        salon_name: string;
    }) => {
        try {
            setIsLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова реєстрація
                await new Promise((resolve) => setTimeout(resolve, 500));
                
                setUser({
                    id: 1,
                    email: data.email,
                    first_name: data.first_name,
                    last_name: data.last_name,
                    phone: data.phone,
                    role: 'admin',
                    is_active: true,
                    is_verified: false,
                    created_at: new Date().toISOString(),
                });
                
                return {
                    access_token: 'mock_token',
                    refresh_token: 'mock_refresh_token',
                };
            } else {
                // Реальна реєстрація
                const response = await authApi.register(data);
                
                // Зберігаємо токени
                localStorage.setItem('auth_token', response.access_token);
                localStorage.setItem('refresh_token', response.refresh_token);
                
                setUser(response.user);
                
                return response;
            }
        } catch (err) {
            console.error('Failed to register:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to register';
            setError(errorMessage);
            throw err;
        } finally {
            setIsLoading(false);
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            setError(null);

            if (!USE_MOCK_DATA) {
                // Викликаємо logout на бекенді
                await authApi.logout();
            }

            // Очищаємо локальні дані
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            if (typeof document !== 'undefined') {
                const path = BASE_PATH || '/';
                document.cookie = `auth_token=; path=${path}; max-age=0`;
            }
            clearUser();
        } catch (err) {
            console.error('Failed to logout:', err);
            // Очищаємо дані навіть при помилці
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            if (typeof document !== 'undefined') {
                const path = BASE_PATH || '/';
                document.cookie = `auth_token=; path=${path}; max-age=0`;
            }
            clearUser();
        } finally {
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
