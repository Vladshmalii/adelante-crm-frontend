import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar?: string;
}

interface AuthState {
    user: User | null;
    token: string | null;
    isAuthenticated: boolean;
    isLoading: boolean;

    login: (user: User, token: string) => void;
    logout: () => void;
    setLoading: (isLoading: boolean) => void;
    updateProfile: (data: Partial<User>) => void;
    checkAuth: () => boolean;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,

            login: (user, token) => {
                set({
                    user,
                    token,
                    isAuthenticated: true,
                    isLoading: false,
                });
            },

            logout: () => {
                set({
                    user: null,
                    token: null,
                    isAuthenticated: false,
                });
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

            checkAuth: () => {
                const { token, user } = get();
                return !!(token && user);
            },
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                token: state.token,
                isAuthenticated: state.isAuthenticated,
            }),
        }
    )
);
