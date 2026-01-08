import { useState, useEffect } from 'react';
import { useAuthStore } from '@/stores/useAuthStore';
import { authApi } from '@/lib/api/auth';
import { USE_MOCK_DATA } from '@/lib/config';

export function useAuth() {
    const { user, setUser, clearUser, isAuthenticated } = useAuthStore();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Перевіряємо аут user при завантаженні
    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            if (USE_MOCK_DATA) {
                // У режимі демо завжди авторизовані
                if (!user) {
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
        }
    };

    const login = async (email: string, password: string) => {
        try {
            setIsLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова авторизація
                await new Promise((resolve) => setTimeout(resolve, 500));
                
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
                    access_token: 'mock_token',
                    refresh_token: 'mock_refresh_token',
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
            clearUser();
        } catch (err) {
            console.error('Failed to logout:', err);
            // Очищаємо дані навіть при помилці
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
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
