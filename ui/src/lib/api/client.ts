import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { USE_MOCK_DATA, BASE_PATH } from '../config';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/admin/v1';

interface ApiErrorResponse {
    message: string;
    code?: string;
    details?: Record<string, string[]>;
    detail?: string;
}

type RetryableRequestConfig = InternalAxiosRequestConfig & { _retry?: boolean };

export interface PageMeta {
    page: number;
    perPage: number;
    total: number;
    totalPages: number;
}

// Конверт ответа backend: { data, meta? }. Все методы ApiClient распаковывают
// его автоматически — вызывающий код получает T напрямую (см. getPaged для
// случаев, когда нужен ещё и meta).
export interface ApiResponse<T> {
    data: T;
    message?: string;
    meta?: PageMeta;
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
                    this.applySalonHeader(config);
                    return config;
                }

                if (token && config.headers) {
                    config.headers.Authorization = `Bearer ${token}`;
                }
                this.applySalonHeader(config);
                return config;
            },
            (error) => Promise.reject(error),
        );

        this.client.interceptors.response.use(
            (response) => response,
            async (error: AxiosError<ApiErrorResponse>) => {
                const originalRequest = error.config as RetryableRequestConfig | undefined;

                // Не пытаемся обновить токен для самого refresh endpoint или если уже пытались
                const isRefreshEndpoint = originalRequest?.url?.includes('/auth/refresh');
                const alreadyRetried = originalRequest?._retry;

                if (
                    error.response?.status === 401 &&
                    originalRequest &&
                    !isRefreshEndpoint &&
                    !alreadyRetried
                ) {
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
            },
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
        }
    }

    private removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
            document.cookie = 'auth_token=; path=/; max-age=0';
        }
    }

    // --- Salon (тенант) ------------------------------------------------
    // Backend роутит все Admin API запросы по заголовку X-Salon-Id. Салон
    // выбирается после логина (первый из user.salons) и хранится отдельно
    // от auth-стора, т.к. нужен уже в интерцепторе axios.

    getSalonId(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('salon_id');
    }

    setSalonId(salonId: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('salon_id', salonId);
        }
    }

    private clearSalonId() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('salon_id');
        }
    }

    private applySalonHeader(config: InternalAxiosRequestConfig) {
        const salonId = this.getSalonId();
        if (salonId && config.headers) {
            config.headers['X-Salon-Id'] = salonId;
        }
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const refreshToken = this.getRefreshToken();

        if (!refreshToken) return null;

        this.refreshPromise = this.client
            .post<ApiResponse<{ accessToken: string; refreshToken: string }>>('/auth/refresh', {
                refreshToken,
            })
            .then((response) => {
                const { accessToken, refreshToken: newRefresh } = response.data.data;
                this.setToken(accessToken);
                this.setRefreshToken(newRefresh);
                return accessToken;
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
            const normalizedPath =
                basePath && currentPath.startsWith(basePath)
                    ? currentPath.slice(basePath.length) || '/'
                    : currentPath;

            if (normalizedPath === '/setup' || normalizedPath.startsWith('/setup/')) {
                return;
            }
        }

        this.removeToken();
        this.clearSalonId();

        if (typeof window !== 'undefined') {
            try {
                localStorage.removeItem('auth-storage');
            } catch (e) {
                console.error('Failed to clear auth storage:', e);
            }

            window.location.href = `${BASE_PATH}/login`;
        }
    }

    private formatError(error: AxiosError<ApiErrorResponse>): Error {
        const status = error.response?.status;
        const detail =
            error.response?.data?.message || error.response?.data?.detail || error.message;

        // Помогаем диагностировать сетевые/CORS проблемы
        if (error.message === 'Network Error') {
            return new Error(
                `Network error. Проверьте доступность API (${API_BASE_URL}) и CORS. Детали: ${detail}`,
            );
        }

        const msg = status ? `[${status}] ${detail}` : detail || 'Невідома помилка';
        return new Error(msg);
    }

    // Универсальные методы распаковывают конверт { data, meta } backend'а —
    // вызывающий код получает T напрямую. Для 204-ответов (delete, forgot/reset
    // password) тело пустое — тогда возвращаем undefined.
    async get<T>(url: string, params?: object): Promise<T> {
        const response = await this.client.get<ApiResponse<T>>(url, { params });
        return response.data?.data as T;
    }

    // Для списков с пагинацией — когда нужен ещё и meta (total, totalPages)
    async getPaged<T>(url: string, params?: object): Promise<ApiResponse<T>> {
        const response = await this.client.get<ApiResponse<T>>(url, { params });
        return response.data;
    }

    // Excel-экспорты и другие бинарные ответы — backend отдаёт их без конверта
    async getBlob(url: string, params?: object): Promise<Blob> {
        const response = await this.client.get(url, { params, responseType: 'blob' });
        return response.data;
    }

    async post<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.post<ApiResponse<T>>(url, data);
        return response.data?.data as T;
    }

    async put<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.put<ApiResponse<T>>(url, data);
        return response.data?.data as T;
    }

    async patch<T>(url: string, data?: unknown): Promise<T> {
        const response = await this.client.patch<ApiResponse<T>>(url, data);
        return response.data?.data as T;
    }

    async delete<T = void>(url: string): Promise<T> {
        const response = await this.client.delete<ApiResponse<T>>(url);
        return response.data?.data as T;
    }

    async upload<T>(url: string, file: File, fieldName = 'file'): Promise<T> {
        const formData = new FormData();
        formData.append(fieldName, file);

        const response = await this.client.post<ApiResponse<T>>(url, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        return response.data?.data as T;
    }

    clearAuthToken() {
        this.removeToken();
        this.clearSalonId();
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
