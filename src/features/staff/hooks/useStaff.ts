import { useState, useEffect } from 'react';
import { useStaffStore } from '@/stores/useStaffStore';
import { staffApi, StaffMember } from '@/lib/api/staff';
import { STAFF_MOCK } from '../data/mockStaff';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Staff } from '../types';

interface UseStaffOptions {
    search?: string;
    position?: string;
    isActive?: boolean;
}

export function useStaff(options: UseStaffOptions = {}) {
    const { staff, setStaff, setLoading, isLoading } = useStaffStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStaff();
    }, [options.search, options.position, options.isActive]);

    const loadStaff = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...STAFF_MOCK].map((s: any) => ({
                    ...s,
                    id: s.id,
                    isActive: s.isActive ?? s.status !== 'fired',
                    status: s.status ?? (s.isActive ? 'active' : 'fired'),
                }));

                // Фільтруємо по пошуку
                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter(
                        (s) =>
                            s.firstName?.toLowerCase().includes(search) ||
                            s.lastName?.toLowerCase().includes(search) ||
                            s.phone?.toLowerCase().includes(search) ||
                            s.email?.toLowerCase().includes(search)
                    );
                }

                // Фільтруємо по позиції
                if (options.position) {
                    filtered = filtered.filter((s) => s.position === options.position);
                }

                // Фільтруємо по статусу
                if (options.isActive !== undefined) {
                    filtered = filtered.filter((s) => s.isActive === options.isActive);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setStaff(filtered);
            } else {
                // Використовуємо реальний API
                const data = await staffApi.getAll({
                    search: options.search,
                    position: options.position,
                    isActive: options.isActive,
                });

                const mapped: Staff[] = data.map((s: StaffMember) => ({
                    id: s.id,
                    firstName: s.firstName,
                    lastName: s.lastName,
                    phone: s.phone,
                    email: s.email,
                    role: s.position,
                    position: s.position,
                    status: s.isActive ? 'active' : 'fired',
                    isActive: s.isActive,
                    salary: s.salary ?? 0,
                    commission: s.commission ?? 0,
                    hireDate: s.hireDate,
                    avatar: s.avatar,
                    specialization: s.specializations?.[0],
                    specializations: s.specializations,
                    createdAt: s.createdAt,
                    updatedAt: s.updatedAt,
                }));

                setStaff(mapped as any);
            }
        } catch (err) {
            console.error('Failed to load staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const createStaff = async (data: Omit<Staff, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newStaff: Staff = {
                    ...data,
                    id: Date.now(),
                    createdAt: new Date().toISOString(),
                    isActive: data.isActive ?? true,
                    status: data.status ?? (data.isActive ? 'active' : 'fired'),
                };

                setStaff([...staff, newStaff]);
                return newStaff;
            } else {
                // Реальний API
                const newStaff = await staffApi.create({
                    firstName: data.firstName,
                    lastName: data.lastName || '',
                    phone: data.phone,
                    email: data.email,
                    position: data.position || data.role,
                    specializations: data.specializations,
                });

                const mapped: Staff = {
                    ...newStaff,
                    role: newStaff.position,
                    status: newStaff.isActive ? 'active' : 'fired',
                    specialization: newStaff.specializations?.[0],
                };

                setStaff([...staff, mapped]);
                return mapped;
            }
        } catch (err) {
            console.error('Failed to create staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to create staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateStaff = async (id: string | number, data: Partial<Staff>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення
                const updated = staff.map((s) =>
                    s.id === id ? { ...s, ...data } : s
                );
                setStaff(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedStaff = await staffApi.update(numId, {
                    firstName: data.firstName,
                    lastName: data.lastName,
                    phone: data.phone,
                    email: data.email,
                    position: data.position || data.role,
                    specializations: data.specializations,
                });
                const mapped: Staff = {
                    ...updatedStaff,
                    role: updatedStaff.position,
                    status: updatedStaff.isActive ? 'active' : 'fired',
                    specialization: updatedStaff.specializations?.[0],
                };

                const updated = staff.map((s) =>
                    s.id === mapped.id ? mapped : s
                );
                setStaff(updated);
            }
        } catch (err) {
            console.error('Failed to update staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to update staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteStaff = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка видалення
                const filtered = staff.filter((s) => s.id !== id);
                setStaff(filtered);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                await staffApi.delete(numId);
                const filtered = staff.filter((s) => s.id !== id);
                setStaff(filtered);
            }
        } catch (err) {
            console.error('Failed to delete staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        staff,
        isLoading,
        error,
        loadStaff,
        createStaff,
        updateStaff,
        deleteStaff,
    };
}

