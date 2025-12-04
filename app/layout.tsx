import type { Metadata } from 'next';
import '@/styles/global.css';
import { ToastProvider } from '@/shared/providers/ToastProvider';

export const metadata: Metadata = {
    title: 'Adelante CRM — Розклад',
    description: 'Система управління салоном краси',
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html lang="uk">
        <body>
        <ToastProvider>{children}</ToastProvider>
        </body>
        </html>
    );
}