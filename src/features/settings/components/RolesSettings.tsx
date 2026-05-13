import { useState } from 'react';
import { ViewState, Role } from './roles/types';
import { RolesList } from './roles/RolesList';
import { RoleForm } from './roles/RoleForm';
import { STAFF_MOCK } from '@/features/staff/data/mockStaff';
import type { StaffRole } from '@/features/staff/types';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { Toast } from '@/shared/components/ui/Toast';

// Mock initial data
const INITIAL_ROLES: Role[] = [
  {
    id: '1',
    name: 'Адміністратор',
    description: 'Повний доступ до системи, окрім фінансів',
    usersCount: 2,
    createdAt: new Date().toISOString(),
    permissions: {
      'appointments.enabled': true,
      'appointments.view_clients_data': true,
      'appointments.create': true,
      'appointments.edit': true,
      'appointments.delete': true,
      'clients.enabled': true,
      'clients.list.show_contacts': true,
      'clients.card.show_phone': true,
      'overview.enabled': true,
      'overview.summary': true,
      'settings.enabled': true,
    }
  },
  {
    id: '2',
    name: 'Майстер',
    description: 'Тільки перегляд свого розкладу та записів',
    usersCount: 5,
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    permissions: {
      'appointments.enabled': true,
      'appointments.create': true,
      'appointments.edit': true,
      'clients.enabled': true,
      'clients.show': 'own',
    }
  }
];

export function RolesSettings() {
  const [view, setView] = useState<ViewState>('list');
  const [roles, setRoles] = useState<Role[]>(INITIAL_ROLES);
  const [editingRole, setEditingRole] = useState<Role | undefined>(undefined);
  
  // Staff Roles Management
  const [staffRoles, setStaffRoles] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    STAFF_MOCK.forEach((staff) => {
      // Map existing StaffRole enum to our new Role IDs where possible, 
      // or just pick the first role for mock purposes
      initial[staff.id] = staff.role === 'admin' ? '1' : '2';
    });
    return initial;
  });

  const handleCreate = () => {
    setEditingRole(undefined);
    setView('create');
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setView('edit');
  };

  const handleDuplicate = (role: Role) => {
    const duplicatedRole: Role = {
      ...role,
      id: Math.random().toString(36).substring(7),
      name: `${role.name} (Копія)`,
      usersCount: 0,
      createdAt: new Date().toISOString(),
    };
    setRoles([...roles, duplicatedRole]);
  };

  const handleDelete = (roleId: string) => {
    setRoles(roles.filter(r => r.id !== roleId));
  };

  const handleSaveRole = (role: Role) => {
    if (view === 'create') {
      setRoles([...roles, role]);
    } else {
      setRoles(roles.map(r => r.id === role.id ? role : r));
    }
    setView('list');
  };

  const handleChangeStaffRole = (staffId: string, roleId: string) => {
    setStaffRoles(prev => ({
      ...prev,
      [staffId]: roleId,
    }));
  };

  return (
    <div className="space-y-8 flex flex-col h-full max-w-7xl mx-auto">
      
      {/* Main Roles Management Area */}
      <div className="bg-card rounded-lg p-6 border border-border shadow-sm">
        {view === 'list' && (
          <RolesList
            roles={roles}
            onCreate={handleCreate}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onDuplicate={handleDuplicate}
          />
        )}
        
        {(view === 'create' || view === 'edit') && (
          <RoleForm
            initialData={editingRole}
            onSave={handleSaveRole}
            onCancel={() => setView('list')}
          />
        )}
      </div>

      {/* Staff Role Assignment Section */}
      {view === 'list' && (
        <section className="bg-card border border-border rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-2">Призначення ролей співробітникам</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Оберіть роль для кожного співробітника, щоб надати їм відповідні права доступу.
          </p>
          <div className="overflow-x-auto border border-border rounded-lg">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-muted/40 text-muted-foreground border-b border-border">
                  <th className="py-3 px-4 text-left font-medium">Співробітник</th>
                  <th className="py-3 px-4 text-left font-medium">Телефон</th>
                  <th className="py-3 px-4 text-left font-medium w-64">Поточна роль</th>
                </tr>
              </thead>
              <tbody>
                {STAFF_MOCK.map((staff) => (
                  <tr key={staff.id} className="border-b border-border/70 hover:bg-muted/20 transition-colors">
                    <td className="py-3 px-4 text-foreground font-medium">
                      {`${staff.firstName}${staff.middleName ? ' ' + staff.middleName : ''}${staff.lastName ? ' ' + staff.lastName : ''}`}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      {staff.phone}
                    </td>
                    <td className="py-3 px-4">
                      <Dropdown
                        value={staffRoles[String(staff.id)] || ''}
                        onChange={(value) => handleChangeStaffRole(String(staff.id), value)}
                        options={roles.map(r => ({ value: r.id, label: r.name }))}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </div>
  );
}
