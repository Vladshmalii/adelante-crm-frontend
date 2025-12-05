import apiClient from './client';

export interface LoginRequest {
    email: string;
    password: string;
}

export interface LoginResponse {
    access_token: string;
    refresh_token: string;
    user: {
        id: string;
        email: string;
        name: string;
        role: string;
        avatar?: string;
    };
}

export interface RegisterRequest {
    email: string;
    password: string;
    name: string;
    phone?: string;
}

export const authApi = {
    login: async (data: LoginRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/login', data);
        apiClient.setAuthToken(response.access_token);
        return response;
    },

    register: async (data: RegisterRequest): Promise<LoginResponse> => {
        const response = await apiClient.post<LoginResponse>('/auth/register', data);
        apiClient.setAuthToken(response.access_token);
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
};

export default authApi;
