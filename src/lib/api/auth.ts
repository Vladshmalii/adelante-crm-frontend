import apiClient from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    token_type: string;
    user: {
        id: number;
        email: string;
        first_name: string;
        last_name: string;
        phone?: string;
        role: string;
        avatar?: string;
        is_active: boolean;
        is_verified: boolean;
        telegram_id?: number;
        telegram_username?: string;
        created_at: string;
    };
}

export interface RegisterRequest {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
    salon_name: string;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', data);
        apiClient.setAuthToken(response.access_token, response.refresh_token);
        return response;
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/register', data);
        apiClient.setAuthToken(response.access_token, response.refresh_token);
        return response;
    },

    logout: async (): Promise<void> => {
        try {
            await apiClient.post('/auth/logout');
        } finally {
            apiClient.clearAuthToken();
        }
    },

    refreshToken: async (refreshToken: string): Promise<{ access_token: string }> => {
        return apiClient.post('/auth/refresh', { refresh_token: refreshToken });
    },

    forgotPassword: async (email: string): Promise<{ message: string }> => {
        return apiClient.post('/auth/forgot-password', { email });
    },

    resetPassword: async (token: string, password: string): Promise<{ message: string }> => {
        return apiClient.post('/auth/reset-password', { token, password });
    },

    me: async () => {
        return apiClient.get<LoginResponse['user']>('/auth/me');
    },

    setup: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/setup', data);
        apiClient.setAuthToken(response.access_token, response.refresh_token);
        return response;
    },
};

export default authApi;
