'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/hooks/useAuth';
import { BASE_PATH } from '@/lib/config';

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const { checkAuth } = useAuth();
    const pathname = usePathname();

    useEffect(() => {
        // Стрипаем basePath, чтобы на GitHub Pages корректно определять публичные роуты
        const normalizePath = (path?: string | null) => {
            if (!path) return '/';
            if (BASE_PATH && path.startsWith(BASE_PATH)) {
                return path.slice(BASE_PATH.length) || '/';
            }
            return path;
        };

        const normalizedPath = normalizePath(pathname);

        // Не проверяем авторизацию на публичных страницах
        const publicRoutes = ['/login', '/register', '/forgot-password', '/booking', '/setup'];
        const isPublicRoute = publicRoutes.some(route => normalizedPath?.startsWith(route));
        
        if (!isPublicRoute) {
            checkAuth();
        }
    }, [pathname, checkAuth]);

    return <>{children}</>;
}

