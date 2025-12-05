import type { Metadata } from 'next';
import '@/styles/global.css';
import { ToastProvider } from '@/shared/providers/ToastProvider';
import { NavigationProgress } from '@/shared/components/NavigationProgress';
import { Suspense } from 'react';

export const metadata: Metadata = {
    title: 'Adelante CRM — Розклад',
    description: 'Система управління салоном краси',
};

const themeScript = `
(function() {
    try {
        var theme = localStorage.getItem('theme');
        if (theme === 'dark' || (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
            document.documentElement.classList.add('dark');
        }
    } catch (e) {}
})();
`;

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="uk" suppressHydrationWarning>
            <head>
                <script dangerouslySetInnerHTML={{ __html: themeScript }} />
            </head>
            <body>
                <ToastProvider>
                    <Suspense fallback={null}>
                        <NavigationProgress />
                    </Suspense>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}