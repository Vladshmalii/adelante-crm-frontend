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

export function RolesList({
    roles,
    isLoading,
    onCreate,
    onEdit,
    onDelete,
    onDuplicate,
}: RolesListProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [roleToDelete, setRoleToDelete] = useState<Role | null>(null);

    const itemsPerPage = 10;

    // Filter roles based on search
    const filteredRoles = roles.filter(
        (role) =>
            role.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            role.description.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    // Pagination
    const totalPages = Math.ceil(filteredRoles.length / itemsPerPage);
    const paginatedRoles = filteredRoles.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage,
    );

    const getPermissionsCount = (permissions: Record<string, any>) => {
        return Object.values(permissions).filter(
            (val) => val === true || (typeof val === 'string' && val.length > 0),
        ).length;
    };

    const formatDate = (isoString: string) => {
        return new Intl.DateTimeFormat('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
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
                    <Skeleton className="h-10 w-64" />
                    <Skeleton className="h-10 w-32" />
                </div>
                <div className="overflow-hidden rounded-lg border border-border bg-card">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-4 border-b border-border p-4">
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-6 w-1/4" />
                            <Skeleton className="h-6 w-1/4" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full flex-col space-y-6">
            <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
                <div>
                    <h2 className="text-xl font-semibold">Управління ролями</h2>
                    <p className="mt-1 text-sm text-muted-foreground">
                        Створюйте та налаштовуйте права доступу для співробітників
                    </p>
                </div>
                <Button onClick={onCreate} className="flex shrink-0 items-center gap-2">
                    <Plus size={18} />
                    <span>Створити роль</span>
                </Button>
            </div>

            <div className="flex items-center gap-4">
                <SearchInput
                    placeholder="Пошук ролей..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="max-w-md"
                />
            </div>

            {filteredRoles.length === 0 ? (
                <EmptyState
                    icon={<Shield className="h-8 w-8 text-muted-foreground" />}
                    title="Ролей не знайдено"
                    description={
                        searchQuery
                            ? 'Спробуйте змінити критерії пошуку'
                            : 'Створіть першу роль для управління доступами'
                    }
                    action={
                        !searchQuery ? (
                            <Button onClick={onCreate} className="flex items-center gap-2">
                                <Plus size={18} />
                                <span>Створити роль</span>
                            </Button>
                        ) : undefined
                    }
                />
            ) : (
                <div className="flex-1 overflow-x-auto rounded-lg border border-border bg-card">
                    <table className="min-w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-border bg-muted/40 text-muted-foreground">
                                <th className="px-4 py-3 font-medium">Назва ролі</th>
                                <th className="px-4 py-3 font-medium">Користувачів</th>
                                <th className="px-4 py-3 font-medium">Доступів</th>
                                <th className="px-4 py-3 font-medium">Дата створення</th>
                                <th className="px-4 py-3 text-right font-medium">Дії</th>
                            </tr>
                        </thead>
                        <tbody>
                            {paginatedRoles.map((role) => (
                                <tr
                                    key={role.id}
                                    className="border-b border-border/70 transition-colors hover:bg-muted/20"
                                >
                                    <td className="px-4 py-3">
                                        <div className="font-medium text-foreground">
                                            {role.name}
                                        </div>
                                        {role.description && (
                                            <div className="mt-0.5 line-clamp-1 text-xs text-muted-foreground">
                                                {role.description}
                                            </div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="inline-flex items-center justify-center rounded-full bg-primary/10 px-2 py-1 text-xs font-medium text-primary">
                                            {role.usersCount}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {getPermissionsCount(role.permissions)} дозволів
                                    </td>
                                    <td className="px-4 py-3 text-muted-foreground">
                                        {formatDate(role.createdAt)}
                                    </td>
                                    <td className="px-4 py-3 text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onEdit(role)}
                                                className="h-8 w-8"
                                            >
                                                <Edit2 size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => onDuplicate(role)}
                                                className="h-8 w-8"
                                            >
                                                <Copy size={16} />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => setRoleToDelete(role)}
                                                className="h-8 w-8 text-destructive hover:text-destructive"
                                            >
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
                <div className="mt-4 flex justify-center">
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
