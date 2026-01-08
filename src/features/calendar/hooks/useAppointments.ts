import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { appointmentsApi } from '@/lib/api/appointments';
import { mockAppointments } from '../data/mockAppointments';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Appointment } from '../types';
import type { Appointment as ApiAppointment } from '@/lib/api/appointments';

interface UseAppointmentsOptions {
    dateFrom?: string;
    dateTo?: string;
    staffId?: string | number;
    status?: string;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
    const { appointments, setAppointments, setLoading, isLoading } = useCalendarStore();
    const [error, setError] = useState<string | null>(null);

    const mapApiToAppointment = (a: ApiAppointment): Appointment => ({
        id: a.id.toString(),
        staffId: a.staffId !== undefined && a.staffId !== null ? a.staffId.toString() : 'unassigned',
        clientName: a.clientName,
        clientPhone: a.clientPhone,
        service: (a as any).serviceName || (a as any).service || '',
        startTime: a.startTime,
        endTime: a.endTime,
        date: a.date,
        status: a.status as Appointment['status'],
        type: (a as any).type || 'standard',
        notes: a.notes,
        price: a.price,
    });

    useEffect(() => {
        loadAppointments();
    }, [options.dateFrom, options.dateTo, options.staffId, options.status]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Використовуємо мокові дані
                let filtered = [...mockAppointments].map((a: any) => ({
                    ...a,
                    id: a.id,
                }));

                // Фільтруємо по датах
                if (options.dateFrom) {
                    filtered = filtered.filter((a) => a.date >= options.dateFrom!);
                }
                if (options.dateTo) {
                    filtered = filtered.filter((a) => a.date <= options.dateTo!);
                }

                // Фільтруємо по співробітнику
                if (options.staffId) {
                    filtered = filtered.filter((a) => a.staffId?.toString() === options.staffId?.toString());
                }

                // Фільтруємо по статусу
                if (options.status) {
                    filtered = filtered.filter((a) => a.status === options.status);
                }

                // Імітуємо затримку мережі
                await new Promise((resolve) => setTimeout(resolve, 300));

                setAppointments(filtered);
            } else {
                // Використовуємо реальний API
                const parsedStaffId =
                    typeof options.staffId === 'string'
                        ? Number.isNaN(parseInt(options.staffId)) ? undefined : parseInt(options.staffId)
                        : options.staffId;

                const data = await appointmentsApi.getAll({
                    dateFrom: options.dateFrom,
                    dateTo: options.dateTo,
                    staffId: parsedStaffId,
                    status: options.status,
                });

                const mapped = data.map(mapApiToAppointment);
                setAppointments(mapped as any);
            }
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setError(err instanceof Error ? err.message : 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const createAppointment = async (data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка створення
                const newAppointment: Appointment = {
                    ...data,
                    id: Date.now().toString(),
                };

                setAppointments([...appointments, newAppointment]);
                return newAppointment;
            } else {
                // Реальний API
                const staffIdRaw = typeof data.staffId === 'string' ? parseInt(data.staffId) : data.staffId;
                const payload: any = {
                    clientName: data.clientName,
                    clientPhone: data.clientPhone,
                    service: data.service,
                    startTime: data.startTime,
                    endTime: data.endTime,
                    date: data.date,
                    status: data.status,
                    type: data.type,
                    notes: data.notes,
                    price: data.price,
                };
                if (staffIdRaw !== undefined && staffIdRaw !== null && !Number.isNaN(staffIdRaw)) {
                    payload.staffId = staffIdRaw;
                }

                const newAppointment = await appointmentsApi.create(payload);
                const mapped = mapApiToAppointment(newAppointment as any);
                setAppointments([...appointments, mapped]);
                return mapped;
            }
        } catch (err) {
            console.error('Failed to create appointment:', err);
            setError(err instanceof Error ? err.message : 'Failed to create appointment');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAppointment = async (id: string | number, data: Partial<Appointment>) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення
                const updated = appointments.map((a) =>
                    a.id.toString() === id.toString() ? { ...a, ...data } : a
                );
                setAppointments(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedAppointment = await appointmentsApi.update(numId, {
                    ...data,
                    staffId: data.staffId ? (typeof data.staffId === 'string' ? parseInt(data.staffId) : data.staffId) : undefined,
                } as any);
                const mapped = mapApiToAppointment(updatedAppointment as any);
                const updated = appointments.map((a) =>
                    a.id.toString() === mapped.id.toString() ? mapped : a
                );
                setAppointments(updated);
            }
        } catch (err) {
            console.error('Failed to update appointment:', err);
            setError(err instanceof Error ? err.message : 'Failed to update appointment');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const updateAppointmentStatus = async (id: string | number, status: string) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка оновлення статусу
                const updated = appointments.map((a) =>
                    a.id.toString() === id.toString() ? { ...a, status: status as Appointment['status'] } : a
                );
                setAppointments(updated);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                const updatedAppointment = await appointmentsApi.updateStatus(numId, status as any);
                const mapped = mapApiToAppointment(updatedAppointment as any);
                const updated = appointments.map((a) =>
                    a.id.toString() === mapped.id.toString() ? mapped : a
                );
                setAppointments(updated);
            }
        } catch (err) {
            console.error('Failed to update appointment status:', err);
            setError(err instanceof Error ? err.message : 'Failed to update appointment status');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const deleteAppointment = async (id: string | number) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                // Мокова логіка видалення
                const filtered = appointments.filter((a) => a.id !== id);
                setAppointments(filtered);
            } else {
                // Реальний API
                const numId = typeof id === 'string' ? parseInt(id) : id;
                await appointmentsApi.delete(numId);
                const filtered = appointments.filter((a) => a.id !== id);
                setAppointments(filtered);
            }
        } catch (err) {
            console.error('Failed to delete appointment:', err);
            setError(err instanceof Error ? err.message : 'Failed to delete appointment');
            throw err;
        } finally {
            setLoading(false);
        }
    };

    return {
        appointments,
        isLoading,
        error,
        loadAppointments,
        createAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
    };
}

