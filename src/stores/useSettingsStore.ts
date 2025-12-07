import { create } from 'zustand';
import { settingsApi, SalonSettings, UserProfile, RolePermissions } from '@/lib/api/settings';

interface SettingsState {
    salon: SalonSettings | null;
    profile: UserProfile | null;
    roles: RolePermissions[];
    isLoading: boolean;

    fetchSalonSettings: () => Promise<void>;
    updateSalonSettings: (data: Partial<SalonSettings>) => Promise<void>;
    fetchProfile: () => Promise<void>;
    updateProfile: (data: Partial<UserProfile>) => Promise<void>;
    fetchRoles: () => Promise<void>;
    updateRole: (role: string, permissions: string[]) => Promise<void>;
}

export const useSettingsStore = create<SettingsState>((set) => ({
    salon: null,
    profile: null,
    roles: [],
    isLoading: false,

    fetchSalonSettings: async () => {
        set({ isLoading: true });
        try {
            const salon = await settingsApi.getSalonSettings();
            set({ salon });
        } catch (error) {
            console.error('Failed to fetch salon settings:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateSalonSettings: async (data) => {
        set({ isLoading: true });
        try {
            const updatedSalon = await settingsApi.updateSalonSettings(data);
            set({ salon: updatedSalon });
        } catch (error) {
            console.error('Failed to update salon settings:', error);
            throw error; // Re-throw so components can handle success/error UI
        } finally {
            set({ isLoading: false });
        }
    },

    fetchProfile: async () => {
        set({ isLoading: true });
        try {
            const profile = await settingsApi.getProfile();
            set({ profile });
        } catch (error) {
            console.error('Failed to fetch profile:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateProfile: async (data) => {
        set({ isLoading: true });
        try {
            const updatedProfile = await settingsApi.updateProfile(data);
            set({ profile: updatedProfile });
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    fetchRoles: async () => {
        set({ isLoading: true });
        try {
            const roles = await settingsApi.getRoles();
            set({ roles });
        } catch (error) {
            console.error('Failed to fetch roles:', error);
        } finally {
            set({ isLoading: false });
        }
    },

    updateRole: async (role, permissions) => {
        set({ isLoading: true });
        try {
            const updatedRole = await settingsApi.updateRole(role, permissions);
            set((state) => ({
                roles: state.roles.map((r) => (r.role === role ? updatedRole : r))
            }));
        } catch (error) {
            console.error(`Failed to update role ${role}:`, error);
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },
}));
