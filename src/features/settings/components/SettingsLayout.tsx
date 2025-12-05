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

export function SettingsLayout({ activeTab }: SettingsLayoutProps) {
	return (
		<div className="h-full flex flex-col">
			<div className="flex-1 overflow-y-auto p-4 sm:p-6">
				{activeTab === 'salon' && <SalonSettings />}
				{activeTab === 'profile' && <ProfileSettings />}
				{activeTab === 'roles' && <RolesSettings />}
				{activeTab === 'general' && <GeneralSettings />}
				{activeTab === 'reports' && <ReportsSettings />}
			</div>
		</div>
	);
}
