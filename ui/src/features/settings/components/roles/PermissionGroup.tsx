import { useState } from 'react';
import { PermissionModuleConfig, PermissionItemConfig } from '../../config/permissions.config';
import { Switch } from '@/shared/components/ui/Switch';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { PermissionItem } from './PermissionItem';
import { cn } from '@/lib/utils/cn';

interface PermissionGroupProps {
    module: PermissionModuleConfig;
    permissions: Record<string, any>;
    onChange: (id: string, value: any) => void;
}

export function PermissionGroup({ module, permissions, onChange }: PermissionGroupProps) {
    const [isOpen, setIsOpen] = useState(false);

    // Check if module is globally enabled
    const moduleEnabledKey = `${module.id}.enabled`;
    const isEnabled = permissions[moduleEnabledKey] === true;

    // Count active permissions in this module
    const countActivePermissions = (items: PermissionItemConfig[]): number => {
        let count = 0;
        items.forEach((item) => {
            const val = permissions[item.id];
            if (val === true || (typeof val === 'string' && val !== '')) {
                count++;
            }
            if (item.children) {
                count += countActivePermissions(item.children);
            }
        });
        return count;
    };

    const activeCount = countActivePermissions(module.permissions);

    // Total countable permissions
    const getTotalPermissions = (items: PermissionItemConfig[]): number => {
        let count = 0;
        items.forEach((item) => {
            count++;
            if (item.children) {
                count += getTotalPermissions(item.children);
            }
        });
        return count;
    };

    const totalCount = getTotalPermissions(module.permissions);

    const handleToggleModule = (checked: boolean) => {
        onChange(moduleEnabledKey, checked);
        if (!checked) {
            // Uncheck all permissions in this module
            const clearPermissions = (items: PermissionItemConfig[]) => {
                items.forEach((item) => {
                    onChange(item.id, item.type === 'select' ? '' : false);
                    if (item.children) {
                        clearPermissions(item.children);
                    }
                });
            };
            clearPermissions(module.permissions);
        }
    };

    return (
        <div className="overflow-hidden rounded-lg border border-border bg-card transition-all duration-200">
            <div
                className={cn(
                    'flex cursor-pointer items-center justify-between p-4 transition-colors hover:bg-muted/50',
                    isOpen && 'border-b border-border bg-muted/20',
                )}
                onClick={() => setIsOpen(!isOpen)}
            >
                <div className="flex items-center gap-4">
                    <div onClick={(e) => e.stopPropagation()}>
                        <Switch
                            checked={isEnabled}
                            onChange={(e) => handleToggleModule(e.target.checked)}
                        />
                    </div>
                    <div>
                        <h3 className="text-sm font-medium text-foreground">{module.title}</h3>
                        <p className="mt-0.5 text-xs text-muted-foreground">
                            {isEnabled ? `Вибрано ${activeCount} з ${totalCount}` : 'Вимкнено'}
                        </p>
                    </div>
                </div>

                <button
                    className="p-1 text-muted-foreground transition-colors hover:text-foreground"
                    onClick={(e) => {
                        e.stopPropagation();
                        setIsOpen(!isOpen);
                    }}
                >
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>

            <div
                className={cn(
                    'grid transition-all duration-200 ease-in-out',
                    isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
                )}
            >
                <div className="overflow-hidden">
                    <div className="mt-4 bg-card p-4 pt-0">
                        <div className="flex flex-col gap-2">
                            {module.permissions.map((item) => (
                                <PermissionItem
                                    key={item.id}
                                    item={item}
                                    permissions={permissions}
                                    onChange={onChange}
                                    disabled={!isEnabled}
                                />
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
