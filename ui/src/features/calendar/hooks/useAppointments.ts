import { useState, useEffect } from 'react';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { appointmentsApi, type CreateAppointmentPayload } from '@/lib/api/appointments';
import { mockAppointments } from '../data/mockAppointments';
import { USE_MOCK_DATA } from '@/lib/config';
import type { Appointment } from '../types';

interface UseAppointmentsOptions {
    dateFrom?: string;
    dateTo?: string;
    staffId?: string | number;
    status?: string;
}

export function useAppointments(options: UseAppointmentsOptions = {}) {
    const { appointments, setAppointments, setLoading, isLoading } = useCalendarStore();
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAppointments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [options.dateFrom, options.dateTo, options.staffId, options.status]);

    const loadAppointments = async () => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                let filtered = [...mockAppointments];
                if (options.dateFrom)
                    filtered = filtered.filter((a) => a.date >= options.dateFrom!);
                if (options.dateTo) filtered = filtered.filter((a) => a.date <= options.dateTo!);
                if (options.staffId) {
                    filtered = filtered.filter(
                        (a) => a.staffId?.toString() === options.staffId?.toString(),
                    );
                }
                if (options.status) filtered = filtered.filter((a) => a.status === options.status);
                setAppointments(filtered);
            } else {
                const data = await appointmentsApi.getAll({
                    dateFrom: options.dateFrom,
                    dateTo: options.dateTo,
                    staffId: options.staffId?.toString(),
                    status: options.status,
                });
                setAppointments(data);
            }
        } catch (err) {
            console.error('Failed to load appointments:', err);
            setError(err instanceof Error ? err.message : 'Failed to load appointments');
        } finally {
            setLoading(false);
        }
    };

    const createAppointment = async (
        data: Omit<Appointment, 'id' | 'createdAt' | 'updatedAt'> & {
            clientId?: string | number;
            selectedServiceIds?: (string | number)[];
        },
    ) => {
        try {
            setLoading(true);
            setError(null);

            if (USE_MOCK_DATA) {
                const newAppointment: Appointment = { ...data, id: Date.now().toString() };
                setAppointments([...appointments, newAppointment]);
                return newAppointment;
            }

            if (!data.staffId) {
                throw new Error(
                    'Оберіть майстра — запис без майстра поки не підтримується backend',
                );
            }
            // Backend підтримує лише одну послугу на запис — беремо першу
            // з вибраних (мультивибір послуг лишається UI-зручністю).
            const serviceId = data.selectedServiceIds?.[0];
            if (!serviceId) {
                throw new Error('Оберіть хоча б одну послугу');
            }

            const payload: CreateAppointmentPayload = {
                staffId: data.staffId,
                serviceId: String(serviceId),
                date: data.date,
                startTime: data.startTime,
                type: data.type,
                notes: data.notes,
                visitorName: data.isForAnotherPerson ? data.otherPersonName : undefined,
                visitorPhone: data.isForAnotherPerson ? data.otherPersonPhone : undefined,
            };
            if (data.clientId) {
                payload.clientId = String(data.clientId);
            } else {
                payload.newClient = { name: data.clientName, phone: data.clientPhone || '' };
            }

            const newAppointment = await appointmentsApi.create(payload);
            setAppointments([...appointments, newAppointment]);
            return newAppointment;
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
                setAppointments(
                    appointments.map((a) =>
                        a.id.toString() === id.toString() ? { ...a, ...data } : a,
                    ),
                );
                return;
            }

            // Зміна статусу — окремий ендпоінт (не приймається generic PATCH).
            // "completed" — через complete (payments поки порожні: UI вибору
            // способу оплати з'явиться разом зі сторінкою фінансів).
            let updated: Appointment | null = null;
            if (data.status === 'completed') {
                updated = await appointmentsApi.complete(String(id), {
                    payments: [],
                    notes: data.notes,
                });
            } else if (data.status) {
                updated = await appointmentsApi.updateStatus(String(id), data.status);
            }

            const { status: _status, ...rest } = data;
            const hasOtherFields = Object.values(rest).some((v) => v !== undefined);
            if (hasOtherFields && data.status !== 'completed') {
                updated = await appointmentsApi.update(String(id), {
                    staffId: rest.staffId,
                    date: rest.date,
                    startTime: rest.startTime,
                    type: rest.type,
                    notes: rest.notes,
                });
            }

            if (updated) {
                const finalUpdated = updated;
                setAppointments(
                    appointments.map((a) =>
                        a.id.toString() === finalUpdated.id.toString() ? finalUpdated : a,
                    ),
                );
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
                setAppointments(
                    appointments.map((a) =>
                        a.id.toString() === id.toString()
                            ? { ...a, status: status as Appointment['status'] }
                            : a,
                    ),
                );
                return;
            }

            const updated = await appointmentsApi.updateStatus(String(id), status);
            setAppointments(
                appointments.map((a) => (a.id.toString() === updated.id.toString() ? updated : a)),
            );
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
                setAppointments(appointments.filter((a) => a.id !== id));
                return;
            }

            await appointmentsApi.delete(String(id));
            await loadAppointments();
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
