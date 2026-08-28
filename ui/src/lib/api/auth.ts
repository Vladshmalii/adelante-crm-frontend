import apiClient from './client';
import { USE_MOCK_DATA } from '../config';

export type UserRole = 'administrator' | 'master';

export interface AuthSalon {
    id: string;
    name: string;
    slug: string;
}

// Ответ /auth/login — совпадает по форме с /auth/me плюс токены
export interface LoginResponse {
    accessToken: string;
    refreshToken: string;
    user: {
        id: string;
        name: string;
        role: UserRole;
        salonIds: string[];
    };
}

export interface MeResponse {
    id: string;
    firstName: string;
    lastName?: string | null;
    name: string;
    email?: string | null;
    phone?: string | null;
    avatarUrl?: string | null;
    role: UserRole;
    createdAt: string;
    salons: AuthSalon[];
}

export interface LoginRequest {
    email: string;
    password: string;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', data);
        apiClient.setAuthToken(response.accessToken, response.refreshToken);
        return response;
    },

    // Самостоятельная регистрация не предусмотрена: новые салоны создаёт
    // администратор платформы через CLI (salonctl), см. backend/README.md.
    // Здесь оставлено для мок-режима демонстрации UI.
    register: async (): Promise<never> => {
        throw new Error(
            'Самостоятельная регистрация недоступна. Обратитесь к администратору платформы.',
        );
    },

    logout: async (): Promise<void> => {
        // JWT stateless — серверу нечего инвалидировать, выходим локально
        apiClient.clearAuthToken();
    },

    refreshToken: async (
        refreshToken: string,
    ): Promise<{ accessToken: string; refreshToken: string }> => {
        return apiClient.post('/auth/refresh', { refreshToken });
    },

    forgotPassword: async (email: string): Promise<void> => {
        return apiClient.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token: string, password: string): Promise<void> => {
        return apiClient.post('/auth/reset-password', { token, password });
    },

    me: async (): Promise<MeResponse> => {
        if (USE_MOCK_DATA) {
            return {
                id: '1',
                firstName: 'Олександр',
                lastName: 'Адмін',
                name: 'Олександр Адмін',
                role: 'administrator',
                createdAt: new Date().toISOString(),
                salons: [{ id: 'demo', name: 'Demo Salon', slug: 'demo' }],
            };
        }
        return apiClient.get<MeResponse>('/auth/me');
    },

    // Самостоятельное создание салона недоступно (см. register выше) —
    // /setup хранится как страница первого запуска для мок-демонстрации UI.
    // Возвращаемый тип условный (never, как у register) — используется только
    // чтобы не ломать typecheck страницы /setup, вызов всегда завершается ошибкой.
    setup: async (_data: LoginRequest): Promise<never> => {
        throw new Error(
            'Створення салону через UI недоступне. Зверніться до адміністратора платформи.',
        );
    },
};

export default authApi;
