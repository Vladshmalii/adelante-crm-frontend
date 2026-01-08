import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';
import { USE_MOCK_DATA, BASE_PATH } from '../config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
}

export interface ApiResponse<T> {
    data: T;
    message?: string;
    meta?: {
        page: number;
        perPage: number;
        total: number;
        totalPages: number;
    };
}

class ApiClient {
    private client: AxiosInstance;
    private refreshPromise: Promise<string | null> | null = null;
    private basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

    constructor() {
        this.client = axios.create({
            baseURL: API_BASE_URL,
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 30000,
        });

        this.setupInterceptors();
    }

    private setupInterceptors() {
        this.client.interceptors.request.use(
            async (config: InternalAxiosRequestConfig) => {
                const url = config.url || '';
                const isAuthEndpoint =
                    url.includes('/auth/login') ||
                    url.includes('/auth/register') ||
                    url.includes('/auth/setup') ||
                    url.includes('/auth/refresh') ||
                    url.includes('/auth/forgot-password') ||
                    url.includes('/auth/reset-password');

                const token = this.getToken();

                // Если нет токена и не демо-режим — для не-auth запросов уходим на логин и не шлём запрос
                if (!token && !USE_MOCK_DATA && !isAuthEndpoint) {
                    if (typeof window !== 'undefined') {
                        window.location.href = `${this.basePath}/login`;
                    }
                    return Promise.reject(new Error('Not authenticated'));
                }

                // Если токен есть, но истёк — попробуем рефреш перед запросом (не для auth endpoints)
                if (token && !USE_MOCK_DATA && !isAuthEndpoint && this.isTokenExpired(token)) {
                    const newToken = await this.refreshToken();
                    if (!newToken) {
                        if (typeof window !== 'undefined') {
                            window.location.href = `${this.basePath}/login`;
                        }
                        return Promise.reject(new Error('Not authenticated'));
                    }
                    if (config.headers) {
                        config.headers.Authorization = `Bearer ${newToken}`;
                    }
                    return config;
                }

                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                return config;
            },
            (error) => Promise.reject(error)
        );

        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiErrorResponse>) => {
                const originalRequest = error.config as any;

                // Не пытаемся обновить токен для самого refresh endpoint или если уже пытались
                const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');
                const alreadyRetried = originalRequest?._retry;

                if (error.response?.status === 401 && originalRequest && !isRefreshEndpoint && !alreadyRetried) {
                    originalRequest._retry = true;
                    
                    try {
                        const newToken = await this.refreshToken();
                        if (newToken && originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        }
                    } catch (refreshError) {
                        console.error('Token refresh failed:', refreshError);
                    }

                    // Если рефреш не удался — выходим на логин
                    this.handleLogout();
                    return Promise.reject(new Error('Not authenticated'));
                }

                // Если это refresh endpoint с 401 - сразу разлогиниваем
                if (error.response?.status === 401 && isRefreshEndpoint) {
                    this.handleLogout();
                    return Promise.reject(new Error('Session expired'));
                }

                if (error.response?.status === 403) {
                    console.error('Доступ заборонено');
                }

                if (error.response?.status === 500) {
                    console.error('Серверна помилка');
                }

                return Promise.reject(this.formatError(error));
            }
        );
    }

    private isTokenExpired(token: string): boolean {
        try {
            const payload = JSON.parse(atob(token.split('.')[1]));
            const exp = payload?.exp;
            if (!exp) return false;
            const now = Math.floor(Date.now() / 1000);
            return now >= exp;
        } catch {
            return false;
        }
    }

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    }

    private getRefreshToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('refresh_token');
    }

    setAuthToken(access: string, refresh?: string) {
        this.setToken(access);
        if (refresh) this.setRefreshToken(refresh);
    }

    private setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
            const cookiePath = BASE_PATH || '/';
            document.cookie = `auth_token=${token}; path=${cookiePath}; max-age=86400; SameSite=Lax`;
            console.log('[API] Token saved to localStorage and cookie, path:', cookiePath);
        }
    }

    private removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'auth_token=; path=/; max-age=0';
        }
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const refreshToken = this.getRefreshToken();

        if (!refreshToken) return null;

        this.refreshPromise = this.client
            .post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken })
            .then((response: AxiosResponse<{ access_token: string }>) => {
                const newToken = response.data.access_token;
                this.setToken(newToken);
                this.setRefreshToken(refreshToken); // сохраняем актуальный refresh
                return newToken;
            })
            .catch(() => {
                this.handleLogout();
                return null;
            })
            .finally(() => {
                this.refreshPromise = null;
            });

        return this.refreshPromise;
    }

    private setRefreshToken(refresh: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('refresh_token', refresh);
        }
    }

    private handleLogout() {
        // НЕ редиректим если мы на странице setup
        if (typeof window !== 'undefined') {
            const currentPath = window.location.pathname;
            const basePath = BASE_PATH || '';
            const normalizedPath = basePath && currentPath.startsWith(basePath) 
                ? currentPath.slice(basePath.length) || '/' 
                : currentPath;
            
            if (normalizedPath === '/setup' || normalizedPath.startsWith('/setup/')) {
                console.log('[API] Skipping logout redirect - on setup page');
                return;
            }
        }
        
        console.log('Logging out due to authentication failure');
        this.removeToken();
        
        // Очищаем zustand store
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('auth-storage');
            } catch (e) {
                console.error('Failed to clear auth storage:', e);
            }
            
            console.log('Redirecting to login:', `${BASE_PATH}/login`);
            window.location.href = `${BASE_PATH}/login`;
        }
    }

    private formatError(error: AxiosError<ApiErrorResponse>): Error {
        const status = error.response?.status;
        const detail =
            error.response?.data?.message ||
            (error.response?.data as any)?.detail ||
            error.message;

        // Помогаем диагностировать сетевые/CORS проблемы
        if (error.message === 'Network Error') {
            return new Error(
                `Network error. Проверьте доступность API (${API_BASE_URL}) и CORS. Детали: ${detail}`
            );
        }

        const msg = status ? `[${status}] ${detail}` : detail || 'Невідома помилка';
        return new Error(msg);
    }

    async get<T>(url: string, params?: Record<string, any>): Promise<T> {
        const response = await this.client.get<T>(url, { params });
        return response.data;
    }

    async post<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.post<T>(url, data);
        return response.data;
    }

    async put<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.put<T>(url, data);
        return response.data;
    }

    async patch<T>(url: string, data?: any): Promise<T> {
        const response = await this.client.patch<T>(url, data);
        return response.data;
    }

    async delete<T>(url: string): Promise<T> {
        const response = await this.client.delete<T>(url);
        return response.data;
    }

    async upload<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
        const formData = new FormData();
        formData.append(fieldName, file);

        const response = await this.client.post<T>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data;
    }

    clearAuthToken() {
        this.removeToken();
        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('auth-storage');
            } catch (e) {
                console.error('Failed to clear auth storage:', e);
            }
        }
    }
}

export const apiClient = new ApiClient();
export default apiClient;
