import type { Metadata } from 'next';
import '@/styles/global.css';

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
        <body>{children}</body>
        </html>
    );
}