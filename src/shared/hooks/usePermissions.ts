import { useCallback, useMemo } from 'react';

type Permission =
    | 'calendar.view'
    | 'calendar.create'
    | 'calendar.edit'
    | 'calendar.delete'
    | 'clients.view'
    | 'clients.create'
    | 'clients.edit'
    | 'clients.delete'
    | 'clients.export'
    | 'staff.view'
    | 'staff.create'
    | 'staff.edit'
    | 'staff.delete'
    | 'services.view'
    | 'services.create'
    | 'services.edit'
    | 'services.delete'
    | 'finances.view'
    | 'finances.create'
    | 'finances.edit'
    | 'finances.delete'
    | 'finances.export'
    | 'inventory.view'
    | 'inventory.create'
    | 'inventory.edit'
    | 'inventory.delete'
    | 'settings.view'
    | 'settings.edit'
    | 'reports.view'
    | 'reports.export';

type Role = 'admin' | 'manager' | 'staff';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
    admin: [
        'calendar.view', 'calendar.create', 'calendar.edit', 'calendar.delete',
        'clients.view', 'clients.create', 'clients.edit', 'clients.delete', 'clients.export',
        'staff.view', 'staff.create', 'staff.edit', 'staff.delete',
        'services.view', 'services.create', 'services.edit', 'services.delete',
        'finances.view', 'finances.create', 'finances.edit', 'finances.delete', 'finances.export',
        'inventory.view', 'inventory.create', 'inventory.edit', 'inventory.delete',
        'settings.view', 'settings.edit',
        'reports.view', 'reports.export',
    ],
    manager: [
        'calendar.view', 'calendar.create', 'calendar.edit',
        'clients.view', 'clients.create', 'clients.edit', 'clients.export',
        'staff.view',
        'services.view',
        'finances.view', 'finances.create',
        'inventory.view', 'inventory.create', 'inventory.edit',
        'reports.view',
    ],
    staff: [
        'calendar.view', 'calendar.create', 'calendar.edit',
        'clients.view',
        'services.view',
    ],
};

interface UsePermissionsOptions {
    role?: Role;
    customPermissions?: Permission[];
}

interface UsePermissionsResult {
    hasPermission: (permission: Permission) => boolean;
    hasAnyPermission: (permissions: Permission[]) => boolean;
    hasAllPermissions: (permissions: Permission[]) => boolean;
    canAccess: (module: string) => boolean;
    permissions: Permission[];
    role: Role | null;
}

export function usePermissions({
    role = 'staff',
    customPermissions,
}: UsePermissionsOptions = {}): UsePermissionsResult {
    const permissions = useMemo(() => {
        if (customPermissions) return customPermissions;
        return ROLE_PERMISSIONS[role] || [];
    }, [role, customPermissions]);

    const hasPermission = useCallback((permission: Permission): boolean => {
        return permissions.includes(permission);
    }, [permissions]);

    const hasAnyPermission = useCallback((perms: Permission[]): boolean => {
        return perms.some(p => permissions.includes(p));
    }, [permissions]);

    const hasAllPermissions = useCallback((perms: Permission[]): boolean => {
        return perms.every(p => permissions.includes(p));
    }, [permissions]);

    const canAccess = useCallback((module: string): boolean => {
        const viewPermission = `${module}.view` as Permission;
        return permissions.includes(viewPermission);
    }, [permissions]);

    return {
        hasPermission,
        hasAnyPermission,
        hasAllPermissions,
        canAccess,
        permissions,
        role: customPermissions ? null : role,
    };
}
