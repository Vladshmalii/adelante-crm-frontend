'use client';

import { AppShell } from '@/shared/components/layout/AppShell';
import { ClientsLayout } from '@/features/clients/components/ClientsLayout';

export default function ClientsPage() {
    return (
        <AppShell activeSection="clients">
            <ClientsLayout />
        </AppShell>
    );
}