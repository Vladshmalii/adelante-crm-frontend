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
    ShoppingBag, MessageSquare, UserX, XCircle, Ban,
    Scissors, Repeat, Bell, Receipt, History, ListTree, MessageCircle
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
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const [isCompletionModalOpen, setIsCompletionModalOpen] = useState(false);
    const [notes, setNotes] = useState('');

    const addVisit = useClientsStore((state) => state.addVisit);

    if (!appointment) return null;

    const currentStaff = staff.find((s) => s.id === appointment.staffId);

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
        onUpdate(appointment.id, {
            status: 'completed',
            notes: visitData.notes
        });

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

    const getStatusLabel = (status: AppointmentStatus) => {
        switch (status) {
            case 'scheduled': return 'Очікування';
            case 'confirmed': return 'Підтверджено';
            case 'arrived': return 'Клієнт прийшов';
            case 'no-show': return 'Не прийшов';
            case 'cancelled': return 'Відмінено';
            case 'completed': return 'Оплачено';
        }
    };

    const getActiveStatusClasses = (status: AppointmentStatus) => {
        switch (status) {
            case 'scheduled': return 'bg-amber-500 text-white border-amber-500';
            case 'confirmed': return 'bg-indigo-500 text-white border-indigo-500';
            case 'arrived': return 'bg-emerald-500 text-white border-emerald-500';
            case 'completed': return 'bg-green-600 text-white border-green-600';
            case 'cancelled': return 'bg-rose-500 text-white border-rose-500';
            case 'no-show': return 'bg-orange-600 text-white border-orange-600';
            default: return 'bg-primary text-white border-primary';
        }
    };

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    // Calculate duration
    const [hStart, mStart] = appointment.startTime.split(':').map(Number);
    const [hEnd, mEnd] = appointment.endTime.split(':').map(Number);
    const durationMins = (hEnd * 60 + mEnd) - (hStart * 60 + mStart);

    const dateFormatted = new Date(appointment.date).toLocaleDateString('uk-UA', { day: 'numeric', month: 'long' });

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="2xl"
            position="right"
            header={
                <div className="p-4 sm:p-5 border-b border-border bg-card flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={onClose}
                            className="p-1.5 -ml-2 rounded-xl hover:bg-accent hover:text-accent-foreground transition-all text-muted-foreground"
                        >
                            <ChevronRight className="w-5 h-5" />
                        </button>
                        <div className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60">Деталі запису</div>
                        {appointment.type !== 'standard' && (
                            <div className={clsx(
                                "px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest",
                                appointment.type === 'important' ? "bg-amber-500 text-white" : "bg-purple-600 text-white"
                            )}>
                                {appointment.type === 'important' ? 'Важливо' : 'Особливо'}
                            </div>
                        )}
                    </div>
                    <div className="flex gap-2">
                        <Button variant="ghost" size="sm" onClick={onEdit} className="h-9 w-9 p-0 rounded-xl bg-background border border-border/50 hover:text-primary hover:border-primary/30">
                            <Edit3 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={handleDelete} className="h-9 w-9 p-0 rounded-xl bg-background border border-border/50 hover:text-destructive hover:border-destructive/30">
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            }
            footer={
                <div className="flex justify-end">
                    <Button variant="primary" onClick={onClose} className="px-10 rounded-2xl shadow-lg shadow-primary/20 font-black uppercase tracking-widest text-[11px]">
                        Зберегти зміни
                    </Button>
                </div>
            }
        >
            {/* 3-Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr_280px] gap-6 min-h-[500px]">

                {/* === LEFT COLUMN: Master, Time, Actions === */}
                <div className="space-y-5 lg:border-r lg:border-border/30 lg:pr-6">
                    {/* Master */}
                    <div className="space-y-1">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                                <Scissors className="w-5 h-5" />
                            </div>
                            <div>
                                <div className="text-sm font-bold">{currentStaff?.name || 'Без майстра'}</div>
                                <div className="text-[10px] font-medium text-muted-foreground italic">{getRoleLabel(currentStaff?.role)}</div>
                            </div>
                        </div>
                    </div>

                    {/* Date & Time */}
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-bold">{dateFormatted}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-muted-foreground" />
                            <span className="text-sm font-bold">{appointment.startTime}–{appointment.endTime}</span>
                            <span className="text-[10px] text-muted-foreground font-medium">· {durationMins} хвилин</span>
                        </div>
                    </div>

                    <div className="border-t border-border/30 pt-4">
                        <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Ресурси</div>
                        <div className="text-xs text-muted-foreground italic">Не вибрано</div>
                    </div>

                    {/* Pinned Fields - Comment */}
                    <div className="border-t border-border/30 pt-4 space-y-2">
                        <div className="flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-muted-foreground/40" />
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40">Закріплені поля</span>
                        </div>
                        <div className="text-[10px] font-bold text-muted-foreground/60 mb-1">Коментар до запису</div>
                        <textarea
                            className="w-full text-xs bg-muted/20 border border-border/50 rounded-xl p-3 resize-none focus:outline-none focus:ring-1 focus:ring-primary/30 text-foreground placeholder:text-muted-foreground/40"
                            rows={3}
                            placeholder="Додати коментар..."
                            defaultValue={appointment.notes || ''}
                        />
                    </div>

                    {/* Quick Action Buttons */}
                    <div className="border-t border-border/30 pt-4">
                        <div className="grid grid-cols-2 gap-2">
                            {[
                                { icon: ListTree, label: 'Розширені поля' },
                                { icon: Repeat, label: 'Повторення запису' },
                                { icon: Bell, label: 'Сповіщення про візит' },
                                { icon: Receipt, label: 'Списання витрат' },
                            ].map((action, i) => (
                                <button key={i} className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground">
                                    <action.icon className="w-4 h-4" />
                                    <span className="text-[9px] font-bold text-center leading-tight">{action.label}</span>
                                </button>
                            ))}
                        </div>
                        <button className="w-full mt-2 flex items-center justify-center gap-1.5 p-2.5 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground">
                            <History className="w-4 h-4" />
                            <span className="text-[9px] font-bold">Історія змін</span>
                        </button>
                    </div>
                </div>

                {/* === CENTER COLUMN: Status, Service, Payment === */}
                <div className="space-y-6">
                    {/* Status Switcher */}
                    <div className="flex flex-wrap gap-2">
                        {(['scheduled', 'arrived', 'no-show', 'confirmed'] as AppointmentStatus[]).map((status) => {
                            const isActive = appointment.status === status;
                            return (
                                <button
                                    key={status}
                                    onClick={() => handleStatusChange(status)}
                                    className={clsx(
                                        "px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-wider whitespace-nowrap transition-all duration-300 border-2",
                                        isActive
                                            ? getActiveStatusClasses(status)
                                            : "bg-background text-muted-foreground border-border/50 hover:border-primary/30 hover:text-foreground"
                                    )}
                                >
                                    {status === 'arrived' && '+ '}{getStatusLabel(status)}
                                </button>
                            );
                        })}
                    </div>

                    {/* Service Card */}
                    <div className="p-5 bg-muted/10 border border-border/50 rounded-2xl">
                        <div className="flex items-center justify-between mb-1">
                            <div className="text-xs text-muted-foreground font-medium">
                                {currentStaff?.name || 'Майстер'} · {durationMins} хв.
                            </div>
                        </div>
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-base font-bold mb-1">{appointment.service}</div>
                                <div className="text-xs text-muted-foreground">
                                    {appointment.price ? `${Math.round(appointment.price * 0.8)} – ${appointment.price} ₴` : '—'}
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-primary">
                                    {appointment.price || 0} <span className="text-sm opacity-50">₴</span>
                                </span>
                                <ChevronRight className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                        </div>
                    </div>

                    {/* Payment Status */}
                    <div className="flex items-center justify-between px-1">
                        <span className="text-sm font-bold text-muted-foreground">Оплачено повністю</span>
                        <button className="px-4 py-2 rounded-xl border border-dashed border-primary/40 text-primary text-[11px] font-black uppercase tracking-wider hover:bg-primary/5 transition-all">
                            Переглянути деталі
                        </button>
                    </div>
                </div>

                {/* === RIGHT COLUMN: Client Info === */}
                <div className="space-y-5 lg:border-l lg:border-border/30 lg:pl-6">
                    {/* Client Avatar & Name */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-sm uppercase">
                                {appointment.clientName?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'КЛ'}
                            </div>
                            <div>
                                <div className="text-sm font-bold">{appointment.clientName}</div>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                    <Phone className="w-3 h-3" />
                                    {isAdmin && isPhoneVisible ? appointment.clientPhone : getMaskedPhone(appointment.clientPhone)}
                                </div>
                            </div>
                        </div>
                        <button className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1">
                            <Edit3 className="w-3 h-3" /> Змінити
                        </button>
                    </div>

                    {appointment.isForAnotherPerson && (
                        <div className="p-3 bg-primary/5 border border-primary/20 rounded-xl">
                            <div className="text-[10px] font-black uppercase tracking-widest text-primary mb-1">Гість (Хто прийде)</div>
                            <div className="text-sm font-bold">{appointment.otherPersonName || "Ім'я не вказано"}</div>
                            {appointment.otherPersonPhone ? (
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Phone className="w-3 h-3" />
                                    <span>{getMaskedPhone(appointment.otherPersonPhone)}</span>
                                </div>
                            ) : (
                                <div className="text-xs text-muted-foreground mt-0.5">
                                    Зв'язок через: <span className="font-bold">{appointment.clientName}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* WhatsApp Button */}
                    <button className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold text-xs transition-all">
                        <MessageCircle className="w-4 h-4" />
                        ЧАТ В WHATSAPP
                    </button>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { icon: User, label: 'Профіль клієнта' },
                            { icon: History, label: 'Історія візитів' },
                            { icon: MoreHorizontal, label: 'Ще' },
                        ].map((action, i) => (
                            <button
                                key={i}
                                onClick={() => {
                                    if (action.label === 'Профіль клієнта' && appointment.clientId) {
                                        router.push(`/clients?id=${appointment.clientId}`);
                                        onClose();
                                    }
                                }}
                                className="flex flex-col items-center gap-1.5 p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-muted/30 transition-all text-muted-foreground hover:text-foreground"
                            >
                                <action.icon className="w-4 h-4" />
                                <span className="text-[9px] font-bold text-center leading-tight">{action.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30" />

                    {/* Additional Info */}
                    <div className="space-y-3">
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Додатковий телефон</div>
                            <div className="text-xs font-bold">—</div>
                        </div>
                        <div>
                            <div className="text-[10px] font-black uppercase tracking-widest text-muted-foreground/40 mb-1">Примітка про клієнта</div>
                            <div className="text-xs font-bold text-muted-foreground italic">—</div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30" />

                    {/* Client Statistics */}
                    <div className="space-y-3">
                        <div className="text-xs font-bold">Статистика</div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <div className="text-[10px] text-muted-foreground/60 font-medium">Останній візит</div>
                                <div className="text-xs font-bold">
                                    {new Date(appointment.date).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' })} {appointment.startTime}
                                </div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground/60 font-medium">Всього візитів</div>
                                <div className="text-xs font-bold">1</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground/60 font-medium">Баланс</div>
                                <div className="text-xs font-bold">0</div>
                            </div>
                            <div>
                                <div className="text-[10px] text-muted-foreground/60 font-medium">Продано</div>
                                <div className="text-xs font-bold">{appointment.price || 0}</div>
                            </div>
                            <div className="col-span-2">
                                <div className="text-[10px] text-muted-foreground/60 font-medium">Оплачено</div>
                                <div className="text-xs font-bold">{appointment.price || 0}</div>
                            </div>
                        </div>
                    </div>

                    {/* Divider */}
                    <div className="border-t border-border/30" />

                    {/* Loyalty */}
                    <div className="space-y-2">
                        <div className="text-xs font-bold">Лояльність</div>
                        <div className="flex items-center gap-2">
                            <Star className="w-4 h-4 text-amber-500" />
                            <div>
                                <div className="text-xs font-bold">Карта лояльності</div>
                                <div className="text-[10px] text-muted-foreground">Карта лояльності</div>
                            </div>
                        </div>
                    </div>
                </div>
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