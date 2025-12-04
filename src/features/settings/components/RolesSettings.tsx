import { useState } from 'react';
import { STAFF_MOCK } from '@/features/staff/data/mockStaff';
import type { StaffRole } from '@/features/staff/types';
import { Dropdown } from '@/shared/components/ui/Dropdown';

type PermissionLevel = 'none' | 'view' | 'edit' | 'full';

interface Role {
  id: string;
  name: string;
  description: string;
  usersCount: number;
}

interface ModulePermission {
  id: string;
  label: string;
}

const ROLES: Role[] = [
  {
    id: 'master',
    name: 'Майстер',
    description: 'Працює з клієнтами, бачить свій розклад та свої записи.',
    usersCount: 5,
  },
  {
    id: 'administrator',
    name: 'Адміністратор',
    description: 'Керує записами, клієнтами, розкладом майстрів та оплатами.',
    usersCount: 2,
  },
  {
    id: 'manager',
    name: 'Менеджер',
    description: 'Має розширені права доступу до фінансів, звітів та налаштувань.',
    usersCount: 1,
  },
];

const MODULES: ModulePermission[] = [
  { id: 'clients', label: 'Клієнти' },
  { id: 'staff', label: 'Співробітники' },
  { id: 'services', label: 'Послуги' },
  { id: 'inventory', label: 'Склад' },
  { id: 'finances', label: 'Фінанси' },
  { id: 'overview', label: 'Огляд' },
  { id: 'settings', label: 'Налаштування' },
];

const PERMISSION_LABELS: { value: PermissionLevel; label: string }[] = [
  { value: 'none', label: 'Немає доступу' },
  { value: 'view', label: 'Перегляд' },
  { value: 'edit', label: 'Редагування' },
  { value: 'full', label: 'Повний доступ' },
];

type RolePermissionsState = Record<string, Record<string, PermissionLevel>>;

const getInitialPermissions = (): RolePermissionsState => ({
  master: {
    clients: 'view',
    staff: 'none',
    services: 'view',
    inventory: 'none',
    finances: 'none',
    overview: 'view',
    settings: 'none',
  },
  administrator: {
    clients: 'edit',
    staff: 'edit',
    services: 'edit',
    inventory: 'view',
    finances: 'view',
    overview: 'full',
    settings: 'view',
  },
  manager: {
    clients: 'full',
    staff: 'full',
    services: 'full',
    inventory: 'full',
    finances: 'full',
    overview: 'full',
    settings: 'full',
  },
});

export function RolesSettings() {
  const [selectedRoleId, setSelectedRoleId] = useState<string>('administrator');
  const [permissions, setPermissions] = useState<RolePermissionsState>(getInitialPermissions);
  const [staffRoles, setStaffRoles] = useState<Record<string, StaffRole>>(() => {
    const initial: Record<string, StaffRole> = {};
    STAFF_MOCK.forEach((staff) => {
      initial[staff.id] = staff.role;
    });
    return initial;
  });

  const selectedRole = ROLES.find((role) => role.id === selectedRoleId) ?? ROLES[0];

  const handleChangePermission = (moduleId: string, level: PermissionLevel) => {
    setPermissions((prev) => ({
      ...prev,
      [selectedRole.id]: {
        ...prev[selectedRole.id],
        [moduleId]: level,
      },
    }));
  };

  const handleApplyTemplate = (template: 'readonly' | 'manager') => {
    setPermissions((prev) => {
      const current = { ...prev[selectedRole.id] };
      const updated: Record<string, PermissionLevel> = {};
      MODULES.forEach((mod) => {
        updated[mod.id] =
          template === 'readonly'
            ? mod.id === 'overview'
              ? 'view'
              : 'view'
            : 'full';
      });
      return {
        ...prev,
        [selectedRole.id]: {
          ...current,
          ...updated,
        },
      };
    });
  };

  const handleSave = () => {
    // TODO: інтеграція з API збереження ролей та доступів
    console.log('Зберегти права доступу для ролей', permissions);
    console.log('Оновлені ролі співробітників', staffRoles);
  };

  const handleChangeStaffRole = (staffId: string, role: StaffRole) => {
    setStaffRoles((prev) => ({
      ...prev,
      [staffId]: role,
    }));
  };

  return (
    <div className="space-y-8 max-w-6xl">
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Ролі в системі</h2>
            <p className="text-sm text-muted-foreground">
              Оберіть роль, для якої хочете налаштувати права доступу.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Зберегти зміни
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="md:col-span-1 space-y-3">
            {ROLES.map((role) => {
              const isActive = role.id === selectedRole.id;
              return (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => setSelectedRoleId(role.id)}
                  className={`w-full text-left rounded-lg border px-4 py-3 text-sm transition-colors ${
                    isActive
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-background border-border text-foreground hover:bg-white/5'
                  }`}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-medium">{role.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {role.usersCount} користувач(ів)
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2">{role.description}</p>
                </button>
              );
            })}
          </div>

          <div className="md:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-semibold mb-1">Права доступу для ролі: {selectedRole.name}</h3>
                <p className="text-xs text-muted-foreground">
                  Налаштуйте, які дії може виконувати користувач у кожному модулі.
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('readonly')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-white/5"
                >
                  Тільки перегляд
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyTemplate('manager')}
                  className="px-3 py-1.5 text-xs rounded-lg border border-border text-muted-foreground hover:bg-white/5"
                >
                  Повні права
                </button>
              </div>
            </div>

            <div className="overflow-x-auto border border-border rounded-lg">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="bg-muted/40 text-xs text-muted-foreground">
                    <th className="py-2 px-4 text-left font-medium w-48">Модуль</th>
                    {PERMISSION_LABELS.map((perm) => (
                      <th key={perm.value} className="py-2 px-3 text-left font-medium">
                        {perm.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {MODULES.map((module) => {
                    const rolePerms = permissions[selectedRole.id] || {};
                    const currentLevel = (rolePerms[module.id] || 'none') as PermissionLevel;
                    return (
                      <tr key={module.id} className="border-t border-border/70">
                        <td className="py-2 px-4 text-sm text-foreground">{module.label}</td>
                        {PERMISSION_LABELS.map((perm) => {
                          const isActive = currentLevel === perm.value;
                          return (
                            <td key={perm.value} className="py-1.5 px-3">
                              <button
                                type="button"
                                onClick={() => handleChangePermission(module.id, perm.value)}
                                className={`w-full h-8 flex items-center justify-center text-xs rounded-md border px-2 transition-colors ${
                                  isActive
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-background border-border text-muted-foreground hover:bg-white/5'
                                }`}
                              >
                                {isActive ? '✓' : ''}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Прив'язка ролей до співробітників</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Швидка зміна ролей для співробітників салону.
        </p>
        <div className="overflow-x-auto border border-border rounded-lg">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-muted/40 text-xs text-muted-foreground">
                <th className="py-2 px-4 text-left font-medium">Співробітник</th>
                <th className="py-2 px-4 text-left font-medium">Телефон</th>
                <th className="py-2 px-4 text-left font-medium">Поточна роль</th>
              </tr>
            </thead>
            <tbody>
              {STAFF_MOCK.map((staff) => (
                <tr key={staff.id} className="border-t border-border/70">
                  <td className="py-2 px-4 text-sm text-foreground whitespace-nowrap">
                    {staff.name}
                  </td>
                  <td className="py-2 px-4 text-sm text-muted-foreground whitespace-nowrap">
                    {staff.phone}
                  </td>
                  <td className="py-2 px-4 text-sm min-w-[180px]">
                    <Dropdown
                      value={staffRoles[staff.id]}
                      onChange={(value) => handleChangeStaffRole(staff.id, value as StaffRole)}
                      options={[
                        { value: 'master', label: 'Майстер' },
                        { value: 'administrator', label: 'Адміністратор' },
                        { value: 'manager', label: 'Менеджер' },
                      ]}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
