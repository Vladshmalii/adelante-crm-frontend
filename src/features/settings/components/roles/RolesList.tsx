import { useState } from 'react';
import { Role } from './types';
import { Button } from '@/shared/components/ui/Button';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Pagination } from '@/shared/components/ui/Pagination';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Skeleton } from '@/shared/components/ui/Skeleton';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Plus, MoreVertical, Edit2, Copy, Trash2, Shield } from 'lucide-react';

interface RolesListProps {
  roles: Role[];
  isLoading?: boolean;
  onCreate: () => void;
  onEdit: (role: Role) => void;
  onDelete: (roleId: string) => void;
  onDuplicate: (role: Role) => void;
}

export function RolesList({ roles, isLoading, onCreate, onEdit, onDelete, onDuplicate }: RolesListProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

  const itemsPerPage = 10;

  // Filter roles based on search
  const filteredRoles = roles.filter(role => 
    role.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    role.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Pagination
  const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
  const paginatedRoles = filteredRoles.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const getPermissionsCount = (permissions: Record<string, any>) => {
    return Object.values(permissions).filter(val => val === true || (typeof val === 'string' && val.length > 0)).length;
  };

  const formatDate = (isoString: string) => {
    return new Intl.DateTimeFormat('uk-UA', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(new Date(isoString));
  };

  const handleDeleteConfirm = () => {
    if (roleToDelete) {
      onDelete(roleToDelete.id);
      setRoleToDelete(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between">
          <Skeleton className="w-64 h-10" />
          <Skeleton className="w-32 h-10" />
        </div>
        <div className="border border-border rounded-lg bg-card overflow-hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex gap-4 p-4 border-b border-border">
              <Skeleton className="w-1/4 h-6" />
              <Skeleton className="w-1/4 h-6" />
              <Skeleton className="w-1/4 h-6" />
              <Skeleton className="w-1/4 h-6" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-semibold">Управління ролями</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Створюйте та налаштовуйте права доступу для співробітників
          </p>
        </div>
        <Button onClick={onCreate} className="shrink-0 flex items-center gap-2">
          <Plus size={18} />
          <span>Створити роль</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          placeholder="Пошук ролей..."
          value={searchQuery}
          onChange={setSearchQuery}
          className="max-w-md"
        />
      </div>

      {filteredRoles.length === 0 ? (
        <EmptyState
          icon={<Shield className="w-8 h-8 text-muted-foreground" />}
          title="Ролей не знайдено"
          description={searchQuery ? "Спробуйте змінити критерії пошуку" : "Створіть першу роль для управління доступами"}
          action={!searchQuery ? (
            <Button onClick={onCreate} className="flex items-center gap-2">
              <Plus size={18} />
              <span>Створити роль</span>
            </Button>
          ) : undefined}
        />
      ) : (
        <div className="border border-border rounded-lg bg-card overflow-x-auto flex-1">
          <table className="min-w-full text-sm text-left">
            <thead>
              <tr className="bg-muted/40 text-muted-foreground border-b border-border">
                <th className="py-3 px-4 font-medium">Назва ролі</th>
                <th className="py-3 px-4 font-medium">Користувачів</th>
                <th className="py-3 px-4 font-medium">Доступів</th>
                <th className="py-3 px-4 font-medium">Дата створення</th>
                <th className="py-3 px-4 font-medium text-right">Дії</th>
              </tr>
            </thead>
            <tbody>
              {paginatedRoles.map((role) => (
                <tr key={role.id} className="border-b border-border/70 hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4">
                    <div className="font-medium text-foreground">{role.name}</div>
                    {role.description && (
                      <div className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{role.description}</div>
                    )}
                  </td>
                  <td className="py-3 px-4">
                    <div className="inline-flex items-center justify-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                      {role.usersCount}
                    </div>
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {getPermissionsCount(role.permissions)} дозволів
                  </td>
                  <td className="py-3 px-4 text-muted-foreground">
                    {formatDate(role.createdAt)}
                  </td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(role)} className="h-8 w-8">
                        <Edit2 size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => onDuplicate(role)} className="h-8 w-8">
                        <Copy size={16} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setRoleToDelete(role)} className="h-8 w-8 text-destructive hover:text-destructive">
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={setCurrentPage}
          />
        </div>
      )}

      <ConfirmDialog
        isOpen={!!roleToDelete}
        onClose={() => setRoleToDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Видалити роль?"
        description={`Ви впевнені, що хочете видалити роль "${roleToDelete?.name}"? Ця дія незворотна.`}
        confirmText="Видалити"
        cancelText="Скасувати"
        variant="danger"
      />
    </div>
  );
}
