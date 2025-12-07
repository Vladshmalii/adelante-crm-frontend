"use client";

import { SalonSettings } from './SalonSettings';
import { ProfileSettings } from './ProfileSettings';
import { RolesSettings } from './RolesSettings';
import { GeneralSettings } from './GeneralSettings';
import { ReportsSettings } from './ReportsSettings';
import { WidgetSettings } from './WidgetSettings';

export type SettingsTab = 'salon' | 'profile' | 'roles' | 'general' | 'reports' | 'widget';

interface SettingsLayoutProps {
	activeTab: SettingsTab;
}

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { cn } from '@/lib/utils/cn';
import { Building2, UserCircle, Shield, Settings, BarChart3, Globe } from 'lucide-react';

export function SettingsLayout({ activeTab }: SettingsLayoutProps) {
	const searchParams = useSearchParams();

	const tabs = [
		{ id: 'salon', label: 'Салон', icon: Building2 },
		{ id: 'profile', label: 'Профіль', icon: UserCircle },
		{ id: 'roles', label: 'Ролі та доступи', icon: Shield },
		{ id: 'general', label: 'Загальні', icon: Settings },
		{ id: 'reports', label: 'Звіти', icon: BarChart3 },
		{ id: 'widget', label: 'Віджет', icon: Globe },
	];

	return (
		<div className="h-full flex flex-col">
			<div className="px-4 sm:px-6 border-b border-border bg-card">
				<div className="flex items-center gap-1 overflow-x-auto scrollbar-hide -mx-4 px-4 sm:mx-0 sm:px-0">
					{tabs.map((tab) => {
						const isActive = activeTab === tab.id;
						const Icon = tab.icon;
						return (
							<Link
								key={tab.id}
								href={`/settings?tab=${tab.id}`}
								className={cn(
									"flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap",
									isActive
										? "border-primary text-primary"
										: "border-transparent text-muted-foreground hover:text-foreground hover:border-muted"
								)}
							>
								<Icon size={18} />
								{tab.label}
							</Link>
						);
					})}
				</div>
			</div>

			<div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/30">
				{activeTab === 'salon' && <SalonSettings />}
				{activeTab === 'profile' && <ProfileSettings />}
				{activeTab === 'roles' && <RolesSettings />}
				{activeTab === 'general' && <GeneralSettings />}
				{activeTab === 'reports' && <ReportsSettings />}
				{activeTab === 'widget' && <WidgetSettings />}
			</div>
		</div>
	);
}
