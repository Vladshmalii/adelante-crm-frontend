import type { Metadata } from 'next';
import localFont from 'next/font/local';
import '@/styles/global.css';
import { ToastProvider } from '@/shared/providers/ToastProvider';
import { NavigationProgress } from '@/shared/components/NavigationProgress';
import { Suspense } from 'react';

const sfUiDisplay = localFont({
    src: [
        {
            path: './fonts/SFUIDisplay-Ultralight.otf',
            weight: '100',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Thin.otf',
            weight: '200',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Light.ttf',
            weight: '300',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Regular.otf',
            weight: '400',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Medium.otf',
            weight: '500',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Semibold.otf',
            weight: '600',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Bold.ttf',
            weight: '700',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Heavy.otf',
            weight: '800',
            style: 'normal',
        },
        {
            path: './fonts/SFUIDisplay-Black.otf',
            weight: '900',
            style: 'normal',
        },
    ],
    variable: '--font-sf-ui',
});

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
            <body className={`${sfUiDisplay.variable} font-sans`}>
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