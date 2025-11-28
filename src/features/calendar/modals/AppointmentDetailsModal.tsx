'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Appointment, AppointmentStatus, StaffMember } from '@/features/calendar/types';
import { Clock, User, Phone, FileText, DollarSign, Calendar as CalendarIcon } from 'lucide-react';
import clsx from 'clsx';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    staff: StaffMember[];
    onUpdate: (id: string, updates: Partial<Appointment>) => void;
    onDelete: (id: string) => void;
}

export function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointment,
    staff,
    onUpdate,
    onDelete,
}: AppointmentDetailsModalProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Partial<Appointment>>({});

    if (!appointment) return null;

    const currentStaff = staff.find((s) => s.id === appointment.staffId);

    const handleSave = () => {
        onUpdate(appointment.id, editedData);
        setIsEditing(false);
        setEditedData({});
        onClose();
    };

    const handleDelete = () => {
        if (confirm('Ви впевнені, що хочете видалити цей запис?')) {
            onDelete(appointment.id);
            onClose();
        }
    };

    const handleStatusChange = (status: AppointmentStatus) => {
        onUpdate(appointment.id, { status });
    };

    const getStatusColor = (status: AppointmentStatus) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'arrived': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
            case 'paid': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300';
            case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
            case 'no-show': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300';
            default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
        }
    };

    const getStatusLabel = (status: AppointmentStatus) => {
        switch (status) {
            case 'scheduled': return 'Записано';
            case 'confirmed': return 'Підтверджено';
            case 'arrived': return 'Прийшов';
            case 'no-show': return 'Не прийшов';
            case 'cancelled': return 'Відмінено';
            case 'completed': return 'Завершено';
            case 'paid': return 'Оплачено';
        }
    };

    const detailItemClass = "p-4 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors";
    const labelClass = "flex items-center gap-2 text-sm text-muted-foreground mb-1";
    const valueClass = "font-semibold text-foreground font-heading";

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі запису" size="lg">
            <div className="space-y-6">
                {/* Status Pills */}
                <div className="flex flex-wrap gap-2">
                    {(['scheduled', 'confirmed', 'arrived', 'completed', 'paid', 'cancelled', 'no-show'] as AppointmentStatus[]).map((status) => (
                        <button
                            key={status}
                            onClick={() => handleStatusChange(status)}
                            className={clsx(
                                "px-3 py-1.5 rounded-full text-sm font-medium transition-all duration-200 active:scale-95",
                                appointment.status === status
                                    ? getStatusColor(status)
                                    : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                            )}
                        >
                            {getStatusLabel(status)}
                        </button>
                    ))}
                </div>

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4">
                    {/* Staff */}
                    <div className={clsx(detailItemClass, "col-span-2")}>
                        <div className={labelClass}>
                            <User className="w-4 h-4" />
                            <span>Майстер</span>
                        </div>
                        <div className={valueClass}>
                            {currentStaff?.name} — {currentStaff?.role}
                        </div>
                    </div>

                    {/* Date */}
                    <div className={detailItemClass}>
                        <div className={labelClass}>
                            <CalendarIcon className="w-4 h-4" />
                            <span>Дата</span>
                        </div>
                        <div className={valueClass}>
                            {new Date(appointment.date).toLocaleDateString('uk-UA', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                            })}
                        </div>
                    </div>

                    {/* Time */}
                    <div className={detailItemClass}>
                        <div className={labelClass}>
                            <Clock className="w-4 h-4" />
                            <span>Час</span>
                        </div>
                        <div className={valueClass}>
                            {appointment.startTime} — {appointment.endTime}
                        </div>
                    </div>

                    {/* Service */}
                    <div className={clsx(detailItemClass, "col-span-2")}>
                        <div className={labelClass}>Послуга</div>
                        <div className={valueClass}>{appointment.service}</div>
                    </div>

                    {/* Client Name */}
                    <div className={detailItemClass}>
                        <div className={labelClass}>
                            <User className="w-4 h-4" />
                            <span>Клієнт</span>
                        </div>
                        <div className={valueClass}>{appointment.clientName}</div>
                    </div>

                    {/* Client Phone */}
                    {appointment.clientPhone && (
                        <div className={detailItemClass}>
                            <div className={labelClass}>
                                <Phone className="w-4 h-4" />
                                <span>Телефон</span>
                            </div>
                            <div className={valueClass}>
                                <a href={`tel:${appointment.clientPhone}`} className="hover:text-primary transition-colors">
                                    {appointment.clientPhone}
                                </a>
                            </div>
                        </div>
                    )}

                    {/* Price */}
                    {appointment.price && (
                        <div className={detailItemClass}>
                            <div className={labelClass}>
                                <DollarSign className="w-4 h-4" />
                                <span>Вартість</span>
                            </div>
                            <div className={valueClass}>{appointment.price} грн</div>
                        </div>
                    )}

                    {/* Notes */}
                    {appointment.notes && (
                        <div className={clsx(detailItemClass, "col-span-2")}>
                            <div className={labelClass}>
                                <FileText className="w-4 h-4" />
                                <span>Коментар</span>
                            </div>
                            <div className="text-foreground">{appointment.notes}</div>
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex justify-between gap-3 pt-4 border-t border-border">
                    <Button variant="danger" onClick={handleDelete}>
                        Видалити
                    </Button>
                    <div className="flex gap-3">
                        <Button variant="secondary" onClick={onClose}>
                            Закрити
                        </Button>
                        <Button variant="primary" onClick={onClose}>
                            Зберегти
                        </Button>
                    </div>
                </div>
            </div>
        </Modal>
    );
}