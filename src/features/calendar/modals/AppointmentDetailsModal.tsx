'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/shared/hooks/useToast';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Appointment, AppointmentStatus, StaffMember } from '@/features/calendar/types';
import {
    Clock, User, Phone, FileText, Banknote, Eye, EyeOff,
    Calendar as CalendarIcon, CheckCircle2, Trash2, Edit3,
    MoreHorizontal, Sparkles, UserCheck, ShieldAlert,
    Star, Info, ChevronRight, MapPin, CreditCard, ExternalLink,
    ShoppingBag, MessageSquare, UserX, XCircle, Ban
} from 'lucide-react';
import { VisitCompletionModal } from './VisitCompletionModal';
import { useClientsStore } from '@/stores/useClientsStore';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import clsx from 'clsx';

interface AppointmentDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment | null;
    staff: StaffMember[];
    onUpdate: (id: string, updates: Partial<Appointment>) => void;
    onDelete: (id: string) => void;
    onEdit: () => void;
    isAdmin: boolean;
}

export function AppointmentDetailsModal({
    isOpen,
    onClose,
    appointment,
    staff,
    onUpdate,
    onDelete,
    onEdit,
    isAdmin,
}: AppointmentDetailsModalProps) {
    const router = useRouter();
    const toast = useToast();
    const [isEditing, setIsEditing] = useState(false);
    const [editedData, setEditedData] = useState<Partial<Appointment>>({});
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);

    const addVisit = useClientsStore((state) => state.addVisit);

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
            toast.success('Запис видалено', 'Успіх');
            onClose();
        }
    };

    const handleStatusChange = (status: AppointmentStatus) => {
        if (status === 'completed' && appointment.status !== 'completed') {
            setIsCompletionModalOpen(true);
        } else {
            onUpdate(appointment.id, { status });
        }
    };

    const handleVisitComplete = (visitData: { notes: string; photos: string[] }) => {
        // Update appointment status
        onUpdate(appointment.id, {
            status: 'completed',
            notes: visitData.notes
        });

        // If we have a clientId, also add a visit record
        if (appointment.clientId) {
            addVisit(appointment.clientId, {
                id: Date.now().toString(),
                clientId: appointment.clientId,
                appointmentId: appointment.id,
                date: new Date().toISOString(),
                serviceName: appointment.service,
                staffId: appointment.staffId || '',
                staffName: currentStaff?.name || '',
                notes: visitData.notes,
                photos: visitData.photos,
                status: 'completed'
            });
        }

        toast.success('Візит завершено та занесено в історію');
    };

    const getStatusColor = (status: AppointmentStatus) => {
        switch (status) {
            case 'confirmed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
            case 'arrived': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300';
            case 'completed': return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
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
            case 'completed': return 'Оплачено';
        }
    };

    const getStatusIcon = (status: AppointmentStatus) => {
        switch (status) {
            case 'scheduled': return <CalendarIcon className="w-3.5 h-3.5" />;
            case 'confirmed': return <UserCheck className="w-3.5 h-3.5" />;
            case 'arrived': return <MapPin className="w-3.5 h-3.5" />;
            case 'no-show': return <UserX className="w-3.5 h-3.5" />;
            case 'cancelled': return <Ban className="w-3.5 h-3.5" />;
            case 'completed': return <CheckCircle2 className="w-3.5 h-3.5" />;
        }
    };

    const getActiveStatusClasses = (status: AppointmentStatus) => {
        switch (status) {
            case 'scheduled': return 'bg-blue-500 text-white';
            case 'confirmed': return 'bg-indigo-500 text-white';
            case 'arrived': return 'bg-emerald-500 text-white';
            case 'completed': return 'bg-green-600 text-white';
            case 'cancelled': return 'bg-rose-500 text-white';
            case 'no-show': return 'bg-amber-500 text-white';
            default: return 'bg-primary text-white';
        }
    };

    const isActiveStatus = (status: AppointmentStatus) => {
        return appointment?.status === status;
    };

    const detailItemClass = "p-4 bg-muted/50 rounded-lg border border-border/50 hover:bg-muted/80 transition-colors";
    const labelClass = "flex items-center gap-2 text-sm text-muted-foreground mb-1";
    const valueClass = "font-semibold text-foreground font-heading";

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            header={
                <div className={clsx(
                    "p-6 sm:p-8 border-b border-border relative overflow-hidden transition-all duration-500",
                    appointment.type === 'important' ? "bg-amber-500/5 dark:bg-amber-500/10" :
                        appointment.type === 'special' ? "bg-purple-500/5 dark:bg-purple-500/10" :
                            "bg-muted/20"
                )}>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-3">
                                <div className={clsx(
                                    "w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner transition-colors duration-500",
                                    isActiveStatus(appointment.status)
                                        ? getActiveStatusClasses(appointment.status)
                                        : "bg-muted text-muted-foreground"
                                )}>
                                    {getStatusIcon(appointment.status)}
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-0.5">
                                        <div className="text-[10px] font-black uppercase tracking-[0.2em] opacity-40">Деталі запису</div>
                                        {appointment.type !== 'standard' && (
                                            <div className={clsx(
                                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                                appointment.type === 'important' ? "bg-amber-500 text-white shadow-lg shadow-amber-500/20" : "bg-purple-600 text-white shadow-lg shadow-purple-600/20"
                                            )}>
                                                {appointment.type === 'important' ? 'Важливо' : 'Особливо'}
                                            </div>
                                        )}
                                    </div>
                                    <h2 className="text-xl font-black text-foreground">
                                        ID: {appointment.id.slice(-6).toUpperCase()}
                                    </h2>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" onClick={onEdit} className="h-10 w-10 p-0 rounded-xl bg-background border border-border/50 hover:text-primary hover:border-primary/30">
                                    <Edit3 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={handleDelete} className="h-10 w-10 p-0 rounded-xl bg-background border border-border/50 hover:text-destructive hover:border-destructive/30">
                                    <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" onClick={onClose} className="h-10 w-10 p-0 rounded-xl bg-background border border-border/50">
                                    <XCircle className="w-4 h-4" />
                                </Button>
                            </div>
                        </div>

                        {/* Status Switcher */}
                        <div className="flex gap-2 overflow-x-auto py-4 px-2 -mx-2 scrollbar-none">
                            {(['scheduled', 'confirmed', 'arrived', 'completed', 'cancelled', 'no-show'] as AppointmentStatus[]).map((status) => {
                                const isActive = appointment.status === status;
                                return (
                                    <div key={status} className="py-2 px-1">
                                        <button
                                            onClick={() => handleStatusChange(status)}
                                            className={clsx(
                                                "flex items-center gap-2 px-4 py-2.5 rounded-2xl text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 border-2 outline-none focus:outline-none",
                                                isActive
                                                    ? clsx(getActiveStatusClasses(status), "border-transparent z-10")
                                                    : "bg-background/40 text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                                            )}
                                        >
                                            {getStatusIcon(status)}
                                            {getStatusLabel(status)}
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            }
            footer={
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2 h-2 rounded-full bg-green-500" />
                            Створено менеджером
                        </div>
                        <div className="w-1 h-1 rounded-full bg-border" />
                        <span>24.12.2025, 12:45</span>
                    </div>
                    <Button variant="primary" onClick={onClose} className="px-10 rounded-2xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]">
                        Зрозуміло
                    </Button>
                </div>
            }
        >
            <div className="space-y-10 py-2">
                {/* SECTION: MASTER & TIME */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Час та Майстер</h3>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-muted/10 border border-border/50 rounded-3xl flex items-center gap-4 group hover:bg-muted/20 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-primary/5 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                                <CalendarIcon className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Дата та час</div>
                                <div className="text-sm font-bold">
                                    {new Date(appointment.date).toLocaleDateString('uk-UA', { day: '2-digit', month: 'long' })}
                                    <span className="mx-2 opacity-20">|</span>
                                    {appointment.startTime} — {appointment.endTime}
                                </div>
                            </div>
                        </div>
                        <div className="p-4 bg-muted/10 border border-border/50 rounded-3xl flex items-center gap-4 group hover:bg-muted/20 transition-all">
                            <div className="w-12 h-12 rounded-2xl bg-purple-500/5 flex items-center justify-center text-purple-600 group-hover:scale-110 transition-transform">
                                <User className="w-5 h-5" />
                            </div>
                            <div className="flex-1">
                                <div className="text-[10px] font-black uppercase tracking-widest opacity-40 mb-1">Виконавець</div>
                                <div className="text-sm font-bold">{currentStaff?.name || 'Майстер не знайдений'}</div>
                                <div className="text-[10px] font-medium opacity-60 italic">{getRoleLabel(currentStaff?.role)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION: CLIENT */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Інформація про клієнта</h3>
                    </div>
                    <div className="p-5 bg-background shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] border border-border/60 rounded-3xl relative group">
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-6">
                            <div className="flex items-center gap-5">
                                <div className="relative">
                                    <div className="w-16 h-16 rounded-2xl bg-muted/50 flex items-center justify-center text-muted-foreground border border-border/50">
                                        <UserCheck className="w-8 h-8" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                                    </div>
                                </div>
                                <div>
                                    <h4 className="text-lg font-black text-foreground mb-1 flex items-center gap-2">
                                        {appointment.clientName}
                                        <span className="px-2 py-0.5 bg-green-500/10 text-green-600 text-[9px] font-black uppercase tracking-wider rounded-lg">Постійний</span>
                                    </h4>
                                    <div className="flex items-center gap-4">
                                        <div className="flex items-center gap-1.5 group/phone cursor-pointer">
                                            <Phone className="w-3.5 h-3.5 text-primary" />
                                            <a href={`tel:${appointment.clientPhone}`} className="text-sm font-bold text-muted-foreground group-hover/phone:text-primary transition-colors">
                                                {isAdmin && isPhoneVisible ? appointment.clientPhone : getMaskedPhone(appointment.clientPhone)}
                                            </a>
                                            {isAdmin && (
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setIsPhoneVisible(!isPhoneVisible); }}
                                                    className="p-1 hover:bg-muted rounded-md transition-colors"
                                                >
                                                    {isPhoneVisible ? <EyeOff size={12} /> : <Eye size={12} />}
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    if (appointment.clientId) {
                                        router.push(`/clients?id=${appointment.clientId}`);
                                        onClose();
                                    } else {
                                        toast.error('ID клієнта не знайдено');
                                    }
                                }}
                                className="rounded-xl border border-border/50 hover:bg-primary/5 hover:text-primary group/link w-full md:w-auto focus-visible:ring-0 focus-visible:ring-offset-0"
                            >
                                <ExternalLink className="w-4 h-4 mr-2 group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                Картка
                            </Button>
                        </div>

                        <div className="grid grid-cols-3 divide-x divide-border/50 border-t border-border/50 pt-5">
                            <div className="px-4 first:pl-0">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Рівень</div>
                                <div className="flex items-center gap-1.5 text-amber-500">
                                    <Sparkles className="w-3.5 h-3.5" />
                                    <span className="text-xs font-bold font-heading">Diamond</span>
                                </div>
                            </div>
                            <div className="px-4">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Візити</div>
                                <div className="text-xs font-bold leading-none">12 <span className="text-[10px] opacity-40">разів</span></div>
                            </div>
                            <div className="px-4 last:pr-0">
                                <div className="text-[9px] font-black uppercase tracking-widest opacity-40 mb-1">Бонуси</div>
                                <div className="text-xs font-bold leading-none">1,250 <span className="text-[10px] opacity-40">₴</span></div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION: SERVICES */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Послуги та Вартість</h3>
                    </div>
                    <div className="space-y-3">
                        <div className="p-5 bg-primary/5 border border-primary/10 rounded-3xl flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 rounded-2xl bg-white dark:bg-zinc-900 border border-primary/10 flex items-center justify-center text-primary shadow-sm">
                                    <ShoppingBag className="w-5 h-5" />
                                </div>
                                <div>
                                    <div className="text-sm font-bold">{appointment.service}</div>
                                    <div className="text-[10px] font-medium text-muted-foreground italic">Категорія: Манікюр</div>
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-2xl font-black text-primary leading-tight">
                                    {appointment.price} <span className="text-sm font-bold opacity-50">грн</span>
                                </div>
                                <div className="text-[10px] font-medium text-muted-foreground flex items-center justify-end gap-1">
                                    <Clock size={10} /> 90 хв
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION: ADDITIONAL */}
                <section className="space-y-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Додатково</h3>
                    </div>
                    <div className="grid grid-cols-1 gap-4">
                        <div className="p-5 bg-muted/5 border border-border/50 rounded-3xl">
                            <div className="flex items-center gap-2 mb-3">
                                <MessageSquare className="w-4 h-4 text-muted-foreground" />
                                <span className="text-[10px] font-black uppercase tracking-widest opacity-40">Коментар до запису</span>
                            </div>
                            <p className="text-sm font-medium leading-relaxed italic opacity-80">
                                {appointment.notes || 'Коментарі відсутні'}
                            </p>
                        </div>
                    </div>
                </section>
            </div>

            <VisitCompletionModal
                isOpen={isCompletionModalOpen}
                onClose={() => setIsCompletionModalOpen(false)}
                appointment={appointment}
                staff={staff}
                onComplete={handleVisitComplete}
            />
        </Modal>
    );
}