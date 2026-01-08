import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface User {
    id: number;
    email: string;
    first_name: string;
    last_name: string;
    phone?: string;
    role: string;
    avatar?: string;
    is_active: boolean;
    is_verified: boolean;
    telegram_id?: number | null;
    telegram_username?: string | null;
    created_at: string;
}

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    setUser: (user: User) => void;
    clearUser: () => void;
    setLoading: (isLoading: boolean) => void;
    updateProfile: (data: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,

            setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

            clearUser: () => {
                set({ user: null, isAuthenticated: false, isLoading: false });
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                }
            },

            setLoading: (isLoading) => {
                set({ isLoading });
            },

            updateProfile: (data) => {
                const currentUser = get().user;
                if (currentUser) {
                    set({ user: { ...currentUser, ...data } });
                }
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
