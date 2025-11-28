'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/layout/TopBar';
import { CalendarFilters } from './CalendarFilters';
import { CalendarGrid } from './grid/CalendarGrid';
import { CreateAppointmentModal, CreateAppointmentData } from '../modals/CreateAppointmentModal';
import { AppointmentDetailsModal } from '../modals/AppointmentDetailsModal';
import { mockStaff, mockAppointments } from '../data/mockAppointments';
import { Appointment, CalendarView } from '../types';

export function DailyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('day');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
        mockStaff.map((s) => s.id)
    );
    const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
    const [newAppointmentData, setNewAppointmentData] = useState<{
        staffId?: string;
        time?: string;
    }>({});

    // Фильтрация майстеров
    const filteredStaff = mockStaff.filter((staff) =>
        selectedStaffIds.includes(staff.id)
    );

    // Фильтрация записей по дате и майстерам
    const currentDateStr = currentDate.toISOString().split('T')[0];
    const filteredAppointments = appointments.filter(
        (apt) =>
            apt.date === currentDateStr && selectedStaffIds.includes(apt.staffId)
    );

    const handleAppointmentClick = (appointment: Appointment) => {
        setSelectedAppointment(appointment);
        setDetailsModalOpen(true);
    };

    const handleSlotClick = (staffId: string, time: string) => {
        setNewAppointmentData({ staffId, time });
        setCreateModalOpen(true);
    };

    const handleCreateAppointment = (data: CreateAppointmentData) => {
        const newAppointment: Appointment = {
            id: `apt-${Date.now()}`,
            ...data,
            status: 'scheduled',
        };
        setAppointments([...appointments, newAppointment]);
    };

    const handleUpdateAppointment = (id: string, updates: Partial<Appointment>) => {
        setAppointments(
            appointments.map((apt) => (apt.id === id ? { ...apt, ...updates } : apt))
        );
    };

    const handleDeleteAppointment = (id: string) => {
        setAppointments(appointments.filter((apt) => apt.id !== id));
    };

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
            <TopBar
                currentDate={currentDate}
                onDateChange={setCurrentDate}
                view={view}
                onViewChange={setView}
            />

            {/* Filters */}
            <CalendarFilters
                staff={mockStaff}
                selectedStaffIds={selectedStaffIds}
                onStaffFilterChange={setSelectedStaffIds}
            />

            {/* Calendar Grid */}
            <div className="flex-1 overflow-hidden">
                <CalendarGrid
                    staff={filteredStaff}
                    appointments={filteredAppointments}
                    onAppointmentClick={handleAppointmentClick}
                    onSlotClick={handleSlotClick}
                />
            </div>

            {/* Modals */}
            <CreateAppointmentModal
                isOpen={createModalOpen}
                onClose={() => {
                    setCreateModalOpen(false);
                    setNewAppointmentData({});
                }}
                onSave={handleCreateAppointment}
                staff={mockStaff}
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
                staff={mockStaff}
                onUpdate={handleUpdateAppointment}
                onDelete={handleDeleteAppointment}
            />
        </div>
    );
}