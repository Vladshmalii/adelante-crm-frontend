'use client';

import { useUIStore } from '@/stores/useUIStore';
import { useCalendarStore } from '@/stores/useCalendarStore';
import { useHotkeys } from '@/shared/hooks/useHotkeys';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { CreateAppointmentModal, CreateAppointmentData } from '@/features/calendar/modals/CreateAppointmentModal';
import { mockStaff } from '@/features/calendar/data/mockAppointments';

export function GlobalCommandRegistry() {
    const { setSearchOpen } = useUIStore();
    const { isCreateModalOpen, setCreateModalOpen, createModalProps, addAppointment } = useCalendarStore();

    // Hotkeys
    useHotkeys('ctrl+k', () => setSearchOpen(true));
    useHotkeys('cmd+k', () => setSearchOpen(true));
    useHotkeys('alt+n', () => setCreateModalOpen(true));

    const handleCreateAppointment = (data: CreateAppointmentData) => {
        const newAppointment = {
            id: `apt-${Date.now()}`,
            staffId: data.staffId,
            clientName: data.clientName,
            clientPhone: data.clientPhone,
            service: data.service,
            startTime: data.startTime,
            endTime: data.endTime,
            date: data.date,
            type: data.type,
            status: 'scheduled' as const, // Reset to scheduled as per types.ts
            notes: data.notes,
            price: data.price
        };
        addAppointment(newAppointment);
    };

    return (
        <>
            <GlobalSearchDialog />

            <CreateAppointmentModal
                isOpen={isCreateModalOpen}
                onClose={() => setCreateModalOpen(false)}
                onSave={handleCreateAppointment}
                staff={mockStaff}
                appointments={[]}
                initialStaffId={createModalProps?.initialStaffId}
                initialTime={createModalProps?.initialTime}
                initialDate={createModalProps?.initialDate}
            />
        </>
    );
}
