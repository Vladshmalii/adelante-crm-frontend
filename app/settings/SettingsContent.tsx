'use client';

import { useSearchParams } from 'next/navigation';
import { SettingsLayout } from '@/features/settings/components/SettingsLayout';

export function SettingsContent() {
    const searchParams = useSearchParams();
    const activeTab = (searchParams.get('tab') || 'salon') as 'salon' | 'profile' | 'roles' | 'general';

    return <SettingsLayout activeTab={activeTab} />;
}
