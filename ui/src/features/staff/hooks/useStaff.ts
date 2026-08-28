import { useState, useEffect } from 'react';
import { useStaffStore } from '@/stores/useStaffStore';
import { staffApi, type StaffWritePayload } from '@/lib/api/staff';
import { STAFF_MOCK } from '../data/mockStaff';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Staff } from '../types';

interface UseStaffOptions {
    search?: string;
    role?: string;
    status?: string;
    page?: number;
    limit?: number;
}

export function useStaff(options: UseStaffOptions = {}) {
    const { staff, pagination, setStaff, setPagination, setLoading, isLoading } = useStaffStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadStaff();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.search, options.role, options.status, options.page, options.limit]);

    const loadStaff = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                let filtered = [...STAFF_MOCK].map((s) => ({
                    ...s,
                    isActive: s.isActive ?? s.status !== 'fired',
                    status: s.status ?? (s.isActive ? 'active' : 'fired'),
                }));

                if (options.search) {
                    const search = options.search.toLowerCase();
                    filtered = filtered.filter(
                        (s) =>
                            s.firstName?.toLowerCase().includes(search) ||
                            s.lastName?.toLowerCase().includes(search) ||
                            s.phone?.toLowerCase().includes(search),
                    );
                }
                if (options.role) {
                    filtered = filtered.filter((s) => s.role === options.role);
                }
                if (options.status) {
                    filtered = filtered.filter((s) => s.status === options.status);
                }

                const perPage = options.limit || 25;
                const page = options.page || 1;
                const pageItems = filtered.slice((page - 1) * perPage, page * perPage);

                setStaff(pageItems);
                setPagination({
                    page,
                    perPage,
                    total: filtered.length,
                    totalPages: Math.max(1, Math.ceil(filtered.length / perPage)),
                });
            } else {
                const { items, meta } = await staffApi.getAll({
                    search: options.search,
                    role: options.role,
                    status: options.status,
                    page: options.page || 1,
                    perPage: options.limit || 25,
                });
                setStaff(items);
                setPagination(meta);
            }
        } catch (err) {
            console.error('Failed to load staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to load staff');
        } finally {
            setLoading(false);
        }
    };

    const createStaff = async (data: StaffWritePayload) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                const newStaff: Staff = {
                    ...data,
                    id: Date.now(),
                    role: data.role ?? 'master',
                    status: 'active',
                    isActive: true,
                    createdAt: new Date().toISOString(),
                };
                setStaff([...staff, newStaff]);
                return newStaff;
            }

            const newStaff = await staffApi.create(data);
            await loadStaff();
            return newStaff;
        } catch (err) {
            console.error('Failed to create staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to create staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateStaff = async (id: string | number, data: Partial<StaffWritePayload>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                const updated = staff.map((s) => (s.id === id ? { ...s, ...data } : s));
                setStaff(updated);
                return;
            }

            await staffApi.update(String(id), data);
            await loadStaff();
        } catch (err) {
            console.error('Failed to update staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to update staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const fireStaff = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                setStaff(
                    staff.map((s) =>
                        s.id === id ? { ...s, status: 'fired', isActive: false } : s,
                    ),
                );
                return;
            }

            await staffApi.fire(String(id));
            await loadStaff();
        } catch (err) {
            console.error('Failed to fire staff:', err);
            setError(err instanceof Error ? err.message : 'Failed to fire staff');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        staff,
        pagination,
        isLoading,
        error,
        loadStaff,
        createStaff,
        updateStaff,
        deleteStaff: fireStaff,
    };
}
