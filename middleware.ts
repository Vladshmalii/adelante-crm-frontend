import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Учитываем basePath (в dev локально basePath обычно пустой, в GH Pages есть /adelante-crm-frontend)
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || '';

function normalizePath(pathname: string) {
    return basePath && pathname.startsWith(basePath)
        ? pathname.slice(basePath.length) || '/'
        : pathname;
}

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth_token')?.value;
    const rawPath = request.nextUrl.pathname;
    const pathname = normalizePath(rawPath);

    const publicRoutes = ['/login', '/register', '/forgot-password', '/booking', '/setup'];
    const isPublicRoute = publicRoutes.some(route => pathname.startsWith(route));

    // /setup - ВСЕГДА пропускаем, даже если есть токен
    if (pathname === '/setup' || pathname.startsWith('/setup/')) {
        return NextResponse.next();
    }

    // Пропускаем служебные и публичные
    if (
        pathname.startsWith('/_next') ||
        pathname.startsWith('/api') ||
        pathname.startsWith('/static') ||
        isPublicRoute ||
        pathname === '/favicon.ico'
    ) {
        if (token && pathname === '/login') {
            return NextResponse.redirect(new URL(`${basePath}/`, request.url));
        }
        return NextResponse.next();
    }

    // Защищённые — только с токеном
    if (!token) {
        return NextResponse.redirect(new URL(`${basePath}/login`, request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
