'use client';

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { TopBar } from '@/shared/components/layout/TopBar';
import { CalendarFilters } from './CalendarFilters';
import { CalendarGrid } from './grid/CalendarGrid';
import { WeeklyCalendar } from './WeeklyCalendar';
import { MonthlyCalendar } from './MonthlyCalendar';
import { CreateAppointmentModal, CreateAppointmentData } from '../modals/CreateAppointmentModal';
import { AppointmentDetailsModal } from '../modals/AppointmentDetailsModal';
import { EditAppointmentModal } from '../modals/EditAppointmentModal';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { mockNotifications } from '../data/mockNotifications';
import { mockUserProfile } from '@/features/profile/data/mockProfile';
import { Appointment, CalendarView } from '../types';
import { Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileFormData } from '@/features/profile/types';
import { useAppointments } from '../hooks/useAppointments';
import { useStaff } from '@/features/staff/hooks/useStaff';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import { useToast } from '@/shared/hooks/useToast';

export function DailyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('day');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);
    const isAdmin = mockUserProfile.role === 'administrator';
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);
    const toast = useToast();
    const searchParams = useSearchParams();
    const router = useRouter();

    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [newAppointmentData, setNewAppointmentData] = useState<{
        staffId?: string;
        time?: string;
    }>({});

    const currentDateStr = currentDate.toISOString().split('T')[0];

    useEffect(() => {
        const createParam = searchParams.get('create');
        if (createParam) {
            setCreateModalOpen(true);

            // Cleanup: remove the 'create' param from the URL
            const params = new URLSearchParams(searchParams.toString());
            params.delete('create');
            const newQuery = params.toString();

            // Replace the URL without the create param to prevent re-opening on refresh
            // We use a small delay to ensure React has processed the setCreateModalOpen call
            const timer = setTimeout(() => {
                const path = window.location.pathname;
                router.replace(newQuery ? `${path}?${newQuery}` : path, { scroll: false });
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [searchParams, router]);

    const {
        staff: staffList,
        isLoading: staffLoading,
        error: staffError,
    } = useStaff({});

    const {
        appointments,
        isLoading: appointmentsLoading,
        error: appointmentsError,
        createAppointment,
        updateAppointment,
        updateAppointmentStatus,
        deleteAppointment,
    } = useAppointments({
        dateFrom: currentDateStr,
        dateTo: currentDateStr,
        staffId: selectedStaffIds.length === 1 ? selectedStaffIds[0] : undefined,
    });

    const [hasInitializedStaff, setHasInitializedStaff] = useState(false);
    useEffect(() => {
        if (staffList.length && !hasInitializedStaff) {
            setSelectedStaffIds(staffList.map((s) => s.id.toString()));
            setHasInitializedStaff(true);
        }
    }, [staffList, hasInitializedStaff]);

    const hasUnassignedAppointments = useMemo(
        () => appointments.some((a) => !a.staffId),
        [appointments]
    );

    const filteredStaff = useMemo(() => {
        const base = staffList
            .filter((staff) => selectedStaffIds.includes(staff.id.toString()))
            .map((s) => ({
                id: s.id.toString(),
                name: `${s.firstName} ${s.lastName || ''}`.trim(),
                role: s.role || 'master',
                color: s.specializations?.length ? '#5B8DEF' : '#7c3aed',
            }));

        // Если нет выбранных реальных мастеров и есть записи без мастера — показываем одну колонку "Без майстра"
        if (base.length === 0 && hasUnassignedAppointments) {
            return [
                {
                    id: 'unassigned',
                    name: 'Без майстра',
                    role: '',
                    color: '#94a3b8',
                },
            ];
        }

        return base;
    }, [staffList, selectedStaffIds, hasUnassignedAppointments]);

    const filteredAppointments = useMemo(
        () =>
            appointments.filter((apt) => {
                const sid = apt.staffId ? apt.staffId.toString() : 'unassigned';
                if (sid === 'unassigned') {
                    return apt.date === currentDateStr;
                }
                return apt.date === currentDateStr && selectedStaffIds.includes(sid);
            }),
        [appointments, currentDateStr, selectedStaffIds]
    );

    const handleAppointmentClick = useCallback((appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDetailsModalOpen(true);
    }, []);

    const handleSlotClick = useCallback((staffId: string, time: string) => {
        setNewAppointmentData({ staffId, time });
        setCreateModalOpen(true);
    }, []);

    const checkOverlap = (
        staffId: string | undefined,
        date: string,
        startTime: string,
        endTime: string,
        excludeId?: string
    ) => {
        if (!staffId) return false;

        const startMins = startTime.split(':').reduce((h, m) => +h * 60 + +m, 0);
        const endMins = endTime.split(':').reduce((h, m) => +h * 60 + +m, 0);

        return appointments.some((apt) => {
            if (apt.id === excludeId) return false;
            // Проверка на того же мастера и тот же день
            if (apt.staffId?.toString() !== staffId || apt.date !== date) return false;

            const aStart = apt.startTime.split(':').reduce((h, m) => +h * 60 + +m, 0);
            const aEnd = apt.endTime.split(':').reduce((h, m) => +h * 60 + +m, 0);

            // Пересечение интервалов
            return startMins < aEnd && endMins > aStart;
        });
    };

    const handleCreateAppointment = async (data: CreateAppointmentData) => {
        const staffId =
            data.staffId ||
            newAppointmentData.staffId ||
            selectedStaffIds[0] ||
            (staffList[0] ? staffList[0].id.toString() : '');

        if (checkOverlap(staffId, currentDateStr, data.startTime, data.endTime)) {
            toast.error('Цей час вже зайнятий іншим записом у цього майстра');
            return;
        }

        await createAppointment({
            ...data,
            staffId: staffId || undefined,
            status: 'scheduled',
            type: 'standard',
            date: currentDateStr,
        });
    };

    const handleUpdateAppointment = async (id: string, updates: Partial<Appointment>) => {
        // Если меняется время или мастер — проверяем наложения
        const appointment = appointments.find(a => a.id === id);
        if (appointment) {
            const staffId = updates.staffId?.toString() || appointment.staffId?.toString();
            const date = updates.date || appointment.date;
            const start = updates.startTime || appointment.startTime;
            const end = updates.endTime || appointment.endTime;

            if (checkOverlap(staffId, date, start, end, id)) {
                toast.error('Неможливо перенести: обраний час вже зайнятий');
                return;
            }
        }
        await updateAppointment(id, updates);

        // Оновлюємо вибраний запис для модалки, якщо вона відкрита
        if (selectedAppointment && selectedAppointment.id === id) {
            setSelectedAppointment(prev => prev ? { ...prev, ...updates } : null);
        }
    };

    const handleDeleteAppointment = async (id: string) => {
        await deleteAppointment(id);
        setDetailsModalOpen(false);
        setEditModalOpen(false);
    };

    const handleEditAppointment = () => {
        setDetailsModalOpen(false);
        setEditModalOpen(true);
    };

    const handleMarkNotificationAsRead = (id: string) => {
        setNotifications(notifications.map(n =>
            n.id === id ? { ...n, isRead: true } : n
        ));
    };

    const handleMarkAllNotificationsAsRead = () => {
        setNotifications(notifications.map(n => ({ ...n, isRead: true })));
    };

    const handleDeleteNotification = (id: string) => {
        setNotifications(notifications.filter(n => n.id !== id));
    };

    const handleProfileClick = () => {
        setProfileModalOpen(true);
    };

    const handleSettingsClick = () => {
        console.log('Відкрити налаштування');
    };

    const handleLogout = () => {
        console.log('Вийти з системи');
    };

    const handleSaveProfile = (data: ProfileFormData) => {
        console.log('Зберегти профіль:', data);
    };

    const handleDayClick = useCallback((date: Date) => {
        setCurrentDate(date);
        setView('day');
    }, []);

    const calendarContent = useMemo(() => {
        switch (view) {
            case 'week':
                return (
                    <WeeklyCalendar
                        currentDate={currentDate}
                        staff={filteredStaff}
                        appointments={appointments}
                        selectedStaffIds={selectedStaffIds}
                        onAppointmentClick={handleAppointmentClick}
                    />
                );
            case 'month':
                return (
                    <MonthlyCalendar
                        currentDate={currentDate}
                        staff={filteredStaff}
                        appointments={appointments}
                        selectedStaffIds={selectedStaffIds}
                        onAppointmentClick={handleAppointmentClick}
                        onDayClick={handleDayClick}
                    />
                );
            default:
                return (
                    <CalendarGrid
                        staff={filteredStaff}
                        appointments={filteredAppointments}
                        onAppointmentClick={handleAppointmentClick}
                        onSlotClick={handleSlotClick}
                        isAdmin={isAdmin}
                    />
                );
        }
    }, [view, currentDate, filteredStaff, filteredAppointments, isAdmin, handleAppointmentClick, handleSlotClick, handleDayClick]);

    return (
        <div className="h-full flex flex-col">
            <GlobalLoader isLoading={staffLoading || appointmentsLoading} />
            <TopBar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                view={view}
                onViewChange={setView}
                notifications={notifications}
                onMarkNotificationAsRead={handleMarkNotificationAsRead}
                onMarkAllNotificationsAsRead={handleMarkAllNotificationsAsRead}
                onDeleteNotification={handleDeleteNotification}
                userName="Марія Іванова"
                userRole="master"
                onProfileClick={handleProfileClick}
                onSettingsClick={handleSettingsClick}
                onLogout={handleLogout}
            />

            <CalendarFilters
                allStaff={staffList.map(s => ({
                    id: s.id.toString(),
                    name: `${s.firstName} ${s.lastName || ''}`.trim(),
                    role: s.role || 'master'
                }))}
                selectedStaffIds={selectedStaffIds}
                onStaffFilterChange={setSelectedStaffIds}
                appointments={appointments}
            />

            <div className="flex-1 min-h-0">
                {calendarContent}
            </div>

            <CreateAppointmentModal
                isOpen={createModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleCreateAppointment}
                staff={filteredStaff}
                appointments={appointments}
                initialStaffId={newAppointmentData.staffId}
                initialTime={newAppointmentData.time}
                initialDate={currentDateStr}
            />

            <AppointmentDetailsModal
                isOpen={detailsModalOpen}
                onClose={() => {
                    setDetailsModalOpen(false);
                    setSelectedAppointment(null);
                }}
                appointment={selectedAppointment}
                staff={filteredStaff}
                onUpdate={handleUpdateAppointment}
                onDelete={handleDeleteAppointment}
                onEdit={handleEditAppointment}
                isAdmin={isAdmin}
            />

            <EditAppointmentModal
                isOpen={editModalOpen}
                onClose={() => {
                    setEditModalOpen(false);
                    setSelectedAppointment(null);
                }}
                onSave={handleUpdateAppointment}
                onDelete={() => handleDeleteAppointment(selectedAppointment?.id || '')}
                appointment={selectedAppointment}
                staff={filteredStaff}
            />

            <ProfileModal
                isOpen={profileModalOpen}
                onClose={() => setProfileModalOpen(false)}
                profile={mockUserProfile}
                onSave={handleSaveProfile}
            />
        </div>
    );
}