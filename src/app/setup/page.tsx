'use client';

import { useState, useEffect } from 'react';
import { authApi } from '@/lib/api/auth';
import { useToast } from '@/shared/hooks/useToast';
import { BASE_PATH } from '@/lib/config';

export default function SetupPage() {
    const toast = useToast();
    
    useEffect(() => {
        console.log('[SETUP] Page mounted - setup page loaded');
        console.log('[SETUP] Current URL:', window.location.href);
        console.log('[SETUP] NO AUTOMATIC REDIRECTS - user must click button');
    }, []);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        console.log('[SETUP] Form submitted');

        if (password !== confirmPassword) {
            toast.error('Паролі не співпадають');
            return;
        }

        if (password.length < 8) {
            toast.error('Пароль має містити мінімум 8 символів');
            return;
        }

        setIsLoading(true);

        try {
            console.log('[SETUP] Starting setup for email:', email);
            console.log('[SETUP] Password length:', password.length);
            
            const response = await authApi.setup({ email, password });
            
            console.log('[SETUP] Response received:', {
                hasAccessToken: !!response.access_token,
                hasRefreshToken: !!response.refresh_token,
                userId: response.user.id,
                userEmail: response.user.email
            });
            
            // Обновляем store СРАЗУ
            const { useAuthStore } = await import('@/stores/useAuthStore');
            console.log('[SETUP] Saving user to store:', response.user);
            useAuthStore.getState().setUser(response.user);
            
            const storeUser = useAuthStore.getState().user;
            console.log('[SETUP] User in store after save:', storeUser);
            console.log('[SETUP] Store state:', {
                user: storeUser,
                isAuthenticated: useAuthStore.getState().isAuthenticated
            });
            
            // Проверяем токены СРАЗУ
            const accessToken = localStorage.getItem('auth_token');
            const refreshToken = localStorage.getItem('refresh_token');
            const cookieToken = document.cookie.split('; ').find(row => row.startsWith('auth_token='))?.split('=')[1];
            
            console.log('[SETUP] ========== TOKEN CHECK ==========');
            console.log('[SETUP] localStorage access_token:', accessToken ? `${accessToken.substring(0, 30)}...` : 'NULL');
            console.log('[SETUP] localStorage refresh_token:', refreshToken ? `${refreshToken.substring(0, 30)}...` : 'NULL');
            console.log('[SETUP] cookie auth_token:', cookieToken ? `${cookieToken.substring(0, 30)}...` : 'NULL');
            console.log('[SETUP] All cookies:', document.cookie);
            console.log('[SETUP] Store user:', useAuthStore.getState().user);
            console.log('[SETUP] ====================================');
            
            if (!accessToken || !refreshToken) {
                console.error('[SETUP] ERROR: Tokens not in localStorage!');
                toast.error('Помилка збереження токенів. Спробуйте увійти вручну.');
                setIsLoading(false);
                return;
            }
            
            if (!cookieToken) {
                console.warn('[SETUP] WARNING: Token not in cookie! Setting manually...');
                const cookiePath = BASE_PATH || '/';
                document.cookie = `auth_token=${accessToken}; path=${cookiePath}; max-age=86400; SameSite=Lax`;
                console.log('[SETUP] Cookie set manually, path:', cookiePath);
            }
            
            toast.success('Акаунт успішно створено!');
            setIsSuccess(true);
            
            console.log('[SETUP] Setup completed. User must click button to continue.');
            console.log('[SETUP] Page will NOT redirect automatically.');
        } catch (error: any) {
            console.error('[SETUP] ========== SETUP ERROR ==========');
            console.error('[SETUP] Error caught:', error);
            console.error('[SETUP] Error type:', typeof error);
            console.error('[SETUP] Error constructor:', error?.constructor?.name);
            console.error('[SETUP] Error message:', error?.message);
            console.error('[SETUP] Error response:', error?.response);
            console.error('[SETUP] Error status:', error?.response?.status);
            console.error('[SETUP] Error data:', error?.response?.data);
            console.error('[SETUP] Error config URL:', error?.config?.url);
            console.error('[SETUP] Error config method:', error?.config?.method);
            console.error('[SETUP] Error config data:', error?.config?.data);
            console.error('[SETUP] Error stack:', error?.stack);
            try {
                console.error('[SETUP] Error JSON:', JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
            } catch (e) {
                console.error('[SETUP] Cannot stringify error:', e);
            }
            console.error('[SETUP] ====================================');
            
            const errorMessage = error?.response?.data?.detail || 
                               error?.response?.data?.message || 
                               error?.message || 
                               'Помилка створення акаунту';
            
            if (errorMessage.includes('not found') || errorMessage.includes('404')) {
                toast.error('Співробітника з такою поштою не знайдено');
            } else if (errorMessage.includes('already set up') || errorMessage.includes('already exists')) {
                toast.error('Акаунт вже створено. Використовуйте сторінку входу.');
            } else {
                toast.error(`Помилка: ${errorMessage}`);
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
            <div className="w-full max-w-md">
                <div className="bg-card border border-border rounded-2xl shadow-xl p-8">
                    {isSuccess ? (
                        <div className="text-center space-y-6">
                            <div className="mb-8">
                                <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </div>
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Акаунт створено!
                                </h1>
                                <p className="text-muted-foreground">
                                    Ваш пароль успішно збережено. Тепер ви можете увійти в систему.
                                </p>
                            </div>
                            
                            <div className="space-y-4">
                                <button
                                    onClick={() => {
                                        console.log('[SETUP] User clicked "Go to system" button');
                                        window.location.href = `${window.location.origin}${BASE_PATH}/`;
                                    }}
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors"
                                >
                                    Перейти в систему
                                </button>
                                
                                <a
                                    href={`${BASE_PATH}/login`}
                                    className="block text-sm text-muted-foreground hover:text-foreground"
                                >
                                    Або увійти на сторінці входу
                                </a>
                            </div>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-bold text-foreground mb-2">
                                    Перша реєстрація
                                </h1>
                                <p className="text-muted-foreground">
                                    Створіть пароль для вашого акаунту
                                </p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-6">
                        <div>
                            <label
                                htmlFor="email"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="your.email@example.com"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="password"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Пароль
                            </label>
                            <input
                                id="password"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Мінімум 8 символів"
                                disabled={isLoading}
                            />
                        </div>

                        <div>
                            <label
                                htmlFor="confirmPassword"
                                className="block text-sm font-medium text-foreground mb-2"
                            >
                                Підтвердіть пароль
                            </label>
                            <input
                                id="confirmPassword"
                                type="password"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                className="w-full px-4 py-3 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-foreground"
                                placeholder="Повторіть пароль"
                                disabled={isLoading}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium py-3 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isLoading ? 'Створення акаунту...' : 'Створити акаунт'}
                            </button>
                        </form>

                        <div className="mt-6 text-center">
                            <p className="text-sm text-muted-foreground">
                                Вже є акаунт?{' '}
                                <a
                                    href={`${BASE_PATH}/login`}
                                    className="text-primary hover:underline font-medium"
                                >
                                    Увійти
                                </a>
                            </p>
                        </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

