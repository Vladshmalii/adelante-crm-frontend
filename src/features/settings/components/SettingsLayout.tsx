"use client";

import { SalonSettings } from './SalonSettings';
import { ProfileSettings } from './ProfileSettings';
import { RolesSettings } from './RolesSettings';
import { GeneralSettings } from './GeneralSettings';
import { ReportsSettings } from './ReportsSettings';
export type SettingsTab = 'salon' | 'profile' | 'roles' | 'general' | 'reports';

interface SettingsLayoutProps {
	activeTab: SettingsTab;
}

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Building2, UserCircle, Shield, Settings, BarChart3 } from 'lucide-react';
import { PageTabs } from '@/shared/components/ui/PageTabs';

export function SettingsLayout({ activeTab }: SettingsLayoutProps) {
	const searchParams = useSearchParams();

	const tabs = [
		{ id: 'salon', label: 'Салон', icon: Building2 },
		{ id: 'profile', label: 'Профіль', icon: UserCircle },
		{ id: 'roles', label: 'Ролі та доступи', icon: Shield },
		{ id: 'general', label: 'Загальні', icon: Settings },
		{ id: 'reports', label: 'Звіти', icon: BarChart3 },
	];

	return (
		<div className="h-full flex flex-col">
			<PageTabs tabs={tabs} activeTab={activeTab} baseHref="/settings" />

			<div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
				{activeTab === 'salon' && <SalonSettings />}
				{activeTab === 'profile' && <ProfileSettings />}
				{activeTab === 'roles' && <RolesSettings />}
				{activeTab === 'general' && <GeneralSettings />}
				{activeTab === 'reports' && <ReportsSettings />}
			</div>
		</div>
	);
}
