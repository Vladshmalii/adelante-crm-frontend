import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthSalon, UserRole } from '@/lib/api/auth';

// Форма соответствует ответу backend GET /auth/me (camelCase-конверт Admin API)
export interface User {
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

interface AuthState {
    user: User | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    // Салон, с которым сейчас работает пользователь (дублирует apiClient's
    // localStorage 'salon_id' в реактивном сторе, чтобы UI-переключатель
    // мог перерисоваться сразу после выбора, см. SalonSwitcher).
    currentSalonId: string | null;

    setUser: (user: User) => void;
    clearUser: () => void;
    setLoading: (isLoading: boolean) => void;
    updateProfile: (data: Partial<User>) => void;
    setCurrentSalonId: (salonId: string) => void;
}

export const useAuthStore = create<AuthState>()(
    persist(
        (set, get) => ({
            user: null,
            isAuthenticated: false,
            isLoading: false,
            currentSalonId: null,

            setUser: (user) => set({ user, isAuthenticated: true, isLoading: false }),

            clearUser: () => {
                set({ user: null, isAuthenticated: false, isLoading: false, currentSalonId: null });
                if (typeof window !== 'undefined') {
                    localStorage.removeItem('auth_token');
                    localStorage.removeItem('refresh_token');
                    localStorage.removeItem('salon_id');
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

            setCurrentSalonId: (salonId) => set({ currentSalonId: salonId }),
        }),
        {
            name: 'auth-storage',
            partialize: (state) => ({
                user: state.user,
                isAuthenticated: state.isAuthenticated,
                currentSalonId: state.currentSalonId,
            }),
        },
    ),
);
