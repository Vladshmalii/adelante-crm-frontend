import axios, { AxiosInstance, AxiosError, AxiosResponse, InternalAxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

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
            (config: InternalAxiosRequestConfig) => {
                const token = this.getToken();
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
                const originalRequest = error.config;

                if (error.response?.status === 401 && originalRequest) {
                    try {
                        const newToken = await this.refreshToken();
                        if (newToken && originalRequest.headers) {
                            originalRequest.headers.Authorization = `Bearer ${newToken}`;
                            return this.client(originalRequest);
                        }
                    } catch {
                        this.handleLogout();
                    }
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

    private getToken(): string | null {
        if (typeof window === 'undefined') return null;
        return localStorage.getItem('auth_token');
    }

    private setToken(token: string) {
        if (typeof window !== 'undefined') {
            localStorage.setItem('auth_token', token);
        }
    }

    private removeToken() {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('auth_token');
            localStorage.removeItem('refresh_token');
        }
    }

    private async refreshToken(): Promise<string | null> {
        if (this.refreshPromise) {
            return this.refreshPromise;
        }

        const refreshToken = typeof window !== 'undefined'
            ? localStorage.getItem('refresh_token')
            : null;

        if (!refreshToken) return null;

        this.refreshPromise = this.client
            .post<{ access_token: string }>('/auth/refresh', { refresh_token: refreshToken })
            .then((response: AxiosResponse<{ access_token: string }>) => {
                const newToken = response.data.access_token;
                this.setToken(newToken);
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

    private handleLogout() {
        this.removeToken();
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
    }

    private formatError(error: AxiosError<ApiErrorResponse>): Error {
        const message = error.response?.data?.message || error.message || 'Невідома помилка';
        return new Error(message);
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

    setAuthToken(token: string) {
        this.setToken(token);
    }

    clearAuthToken() {
        this.removeToken();
    }
}

export const apiClient = new ApiClient();
export default apiClient;
