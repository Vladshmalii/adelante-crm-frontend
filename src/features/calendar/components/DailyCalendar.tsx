'use client';

import { useState } from 'react';
import { TopBar } from '@/shared/components/layout/TopBar';
import { CalendarFilters } from './CalendarFilters';
import { CalendarGrid } from './grid/CalendarGrid';
import { CreateAppointmentModal, CreateAppointmentData } from '../modals/CreateAppointmentModal';
import { AppointmentDetailsModal } from '../modals/AppointmentDetailsModal';
import { EditAppointmentModal } from '../modals/EditAppointmentModal';
import { ProfileModal } from '@/features/profile/modals/ProfileModal';
import { mockStaff, mockAppointments } from '../data/mockAppointments';
import { mockNotifications } from '../data/mockNotifications';
import { mockUserProfile } from '@/features/profile/data/mockProfile';
import { Appointment, CalendarView } from '../types';
import { Notification } from '@/shared/components/ui/NotificationsDropdown';
import { ProfileFormData } from '@/features/profile/types';

export function DailyCalendar() {
    const [currentDate, setCurrentDate] = useState(new Date());
    const [view, setView] = useState<CalendarView>('day');
    const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>(
        mockStaff.map((s) => s.id)
    );
    const [appointments, setAppointments] = useState<Appointment[]>(mockAppointments);
    const isAdmin = mockUserProfile.role === 'administrator';
    const [notifications, setNotifications] = useState<Notification[]>(mockNotifications);

    // Modal states
    const [createModalOpen, setCreateModalOpen] = useState(false);
    const [detailsModalOpen, setDetailsModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [profileModalOpen, setProfileModalOpen] = useState(false);
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

    return (
        <div className="h-screen flex flex-col">
            {/* Top Bar */}
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
                    isAdmin={isAdmin}
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
                staff={mockStaff}
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