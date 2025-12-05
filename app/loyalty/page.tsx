'use client';

import { Suspense } from 'react';
import { Sidebar } from '@/shared/components/layout/Sidebar';
import { LoyaltyLayout } from '@/features/loyalty/components/LoyaltyLayout';

export default function LoyaltyPage() {
    return (
        <div className="min-h-screen bg-background">
            <Suspense fallback={<aside className="hidden lg:flex fixed left-0 top-0 h-screen w-64 bg-sidebar flex-col z-40" />}>
                <Sidebar activeSection="loyalty" />
            </Suspense>
            <main className="lg:ml-64 min-h-screen">
                <LoyaltyLayout />
            </main>
        </div>
    );
}

