import { useState, FormEvent } from 'react';
import { Role } from './types';
import { PERMISSIONS_CONFIG } from '../../config/permissions.config';
import { PermissionGroup } from './PermissionGroup';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Button } from '@/shared/components/ui/Button';

interface RoleFormProps {
  initialData?: Role;
  onSave: (role: Role) => void;
  onCancel: () => void;
}

export function RoleForm({ initialData, onSave, onCancel }: RoleFormProps) {
  const [name, setName] = useState(initialData?.name || '');
  const [description, setDescription] = useState(initialData?.description || '');
  const [permissions, setPermissions] = useState<Record<string, any>>(initialData?.permissions || {});
  const [errors, setErrors] = useState<{name?: string}>({});

  const handlePermissionChange = (id: string, value: any) => {
    setPermissions(prev => ({
      ...prev,
      [id]: value
    }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setErrors({ name: 'Назва ролі обов\'язкова' });
      return;
    }

    // Check if at least one permission is selected or module is enabled
    const hasPermissions = Object.values(permissions).some(val => val === true || (typeof val === 'string' && val.length > 0));
    
    if (!hasPermissions) {
      // In a real app we might show a toast, for now just allow it or maybe alert
      // User requested "нельзя создать роль без permissions"
      alert("Оберіть хоча б одне право доступу");
      return;
    }

    const newRole: Role = {
      id: initialData?.id || Math.random().toString(36).substring(7),
      name,
      description,
      usersCount: initialData?.usersCount || 0,
      createdAt: initialData?.createdAt || new Date().toISOString(),
      permissions
    };

    onSave(newRole);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 h-full">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">{initialData ? 'Редагування ролі' : 'Створення ролі'}</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Налаштуйте загальну інформацію та права доступу.
          </p>
        </div>
        <div className="flex gap-3">
          <Button type="button" variant="outline" onClick={onCancel}>
            Скасувати
          </Button>
          <Button type="submit">
            Зберегти
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left column: Basic info */}
        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-medium mb-4 text-sm">Основна інформація</h3>
            <div className="flex flex-col gap-4">
              <Input
                label="Назва ролі *"
                placeholder="Напр., Адміністратор"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  if (errors.name) setErrors({});
                }}
                error={errors.name}
              />
              <Textarea
                label="Опис"
                placeholder="Короткий опис прав та обов'язків..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
              />
            </div>
          </div>
        </div>

        {/* Right column: Permissions */}
        <div className="md:col-span-2">
          <div className="bg-card border border-border rounded-lg p-5">
            <h3 className="font-medium mb-1 text-sm">Права доступу</h3>
            <p className="text-xs text-muted-foreground mb-4">
              Увімкніть необхідні модулі та налаштуйте детальні доступи.
            </p>
            <div className="flex flex-col gap-3">
              {PERMISSIONS_CONFIG.map(module => (
                <PermissionGroup
                  key={module.id}
                  module={module}
                  permissions={permissions}
                  onChange={handlePermissionChange}
                />
              ))}
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
