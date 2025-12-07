import apiClient from './client';

export interface SalonSettings {
    name: string;
    address: string;
    phone: string;
    email: string;
    website?: string;
    currency: string;
    timezone: string;
    workingHours: Record<string, { start: string; end: string; isOpen: boolean }>;
    socialUrls?: {
        instagram?: string;
        facebook?: string;
        telegram?: string;
    };
}

export interface UserProfile {
    id: string;
    email: string;
    name: string;
    phone?: string;
    role: string;
    avatar?: string;
    preferences?: Record<string, any>;
}

export interface RolePermissions {
    role: string;
    permissions: string[];
}

export const settingsApi = {
    getSalonSettings: async (): Promise<SalonSettings> => {
        return apiClient.get('/settings/salon');
    },

    updateSalonSettings: async (data: Partial<SalonSettings>): Promise<SalonSettings> => {
        return apiClient.put('/settings/salon', data);
    },

    getProfile: async (): Promise<UserProfile> => {
        return apiClient.get('/settings/profile');
    },

    updateProfile: async (data: Partial<UserProfile>): Promise<UserProfile> => {
        return apiClient.put('/settings/profile', data);
    },

    getRoles: async (): Promise<RolePermissions[]> => {
        return apiClient.get('/settings/roles');
    },

    updateRole: async (role: string, permissions: string[]): Promise<RolePermissions> => {
        return apiClient.put(`/settings/roles/${role}`, { permissions });
    }
};

export default settingsApi;
