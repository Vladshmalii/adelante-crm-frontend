import { useAuthStore } from '@/stores/useAuthStore';
import { usePermissions } from './usePermissions';
import { useRouter } from 'next/navigation';

export function useAuth() {
    const { user, token, isAuthenticated, logout: storeLogout, isLoading } = useAuthStore();
    const router = useRouter();

    const role = (user?.role as any) || 'staff';
    const permissions = usePermissions({ role: isAuthenticated ? role : 'staff' });

    const logout = () => {
        storeLogout();
        router.push('/login');
    };

    return {
        user,
        token,
        isAuthenticated,
        isLoading,
        logout,
        ...permissions, // Spread permissions methods (hasPermission, canAccess, etc.)
    };
}
