'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/hooks/useAuth';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        // Не проверяем авторизацию на публичных страницах
        const publicRoutes = ['/login', '/register', '/forgot-password', '/booking', '/setup'];
        const isPublicRoute = publicRoutes.some(route => pathname?.startsWith(route));
        
        if (!isPublicRoute) {
            checkAuth();
        }
    }, [pathname, checkAuth]);

    return <>{children}</>;
}

