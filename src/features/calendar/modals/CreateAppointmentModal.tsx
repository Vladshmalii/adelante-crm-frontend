'use client';

import { useState, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { TimePicker } from '@/shared/components/ui/TimePicker';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Card } from '../components/ui/Card';
import { Radio, RadioGroup } from '@/shared/components/ui/Radio';
import { useToast } from '@/shared/hooks/useToast';

import { StaffMember, Appointment, AppointmentStatus, AppointmentType } from '../types';
import { Client } from '@/features/clients/types';
import { CLIENTS_MOCK } from '@/features/clients/data/mockClients';
import { MOCK_SERVICES } from '@/features/services/data/mockServices';
import { Search, UserPlus, UserCheck, Users, Info, HelpCircle, Scissors, Sparkles, Clock, Minus, Plus, Check } from 'lucide-react';
import { Tooltip } from '@/shared/components/ui/Tooltip';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import clsx from 'clsx';

interface CreateAppointmentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (data: CreateAppointmentData) => void;
    staff: StaffMember[];
    appointments: Appointment[];
    initialStaffId?: string;
    initialTime?: string;
    initialDate?: string;
}

export interface CreateAppointmentData {
    staffId: string;
    clientName: string;
    clientPhone: string;
    clientId?: string | number;
    selectedServiceIds: (string | number)[];
    service: string;
    startTime: string;
    endTime: string;
    date: string;
    type: AppointmentType;
    notes: string;
    price: number;
    isForAnotherPerson: boolean;
}

const APPOINTMENT_TYPES: { value: AppointmentType; label: string }[] = [
    { value: 'standard', label: 'Стандартний' },
    { value: 'important', label: 'Важливий' },
    { value: 'special', label: 'Особливий' },
];

export function CreateAppointmentModal({
    isOpen,
    onClose,
    onSave,
    staff,
    appointments,
    initialStaffId,
    initialTime,
    initialDate,
}: CreateAppointmentModalProps) {
    const toast = useToast();

    const addMinutes = (time: string, minutes: number) => {
        if (!time || !time.includes(':')) time = '09:00';
        const parts = time.split(':');
        const h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        const total = h * 60 + m + minutes;
        const hh = Math.floor(total / 60 % 24).toString().padStart(2, '0');
        const mm = (total % 60).toString().padStart(2, '0');
        return `${hh}:${mm}`;
    };

    const buildInitialFormData = (): CreateAppointmentData => {
        const baseStaffId = initialStaffId || 'unassigned';
        const baseStart = initialTime || '10:00';
        const baseEnd = addMinutes(baseStart, 30);

        return {
            staffId: baseStaffId,
            clientName: '',
            clientPhone: '',
            selectedServiceIds: [],
            service: '',
            startTime: baseStart,
            endTime: baseEnd,
            date: initialDate || new Date().toISOString().split('T')[0],
            type: 'standard',
            notes: '',
            price: 0,
            isForAnotherPerson: false,
        };
    };

    const [formData, setFormData] = useState<CreateAppointmentData>(buildInitialFormData);
    const [timeError, setTimeError] = useState<string | null>(null);
    const [foundClients, setFoundClients] = useState<Client[]>([]);
    const [selectedClient, setSelectedClient] = useState<Client | null>(null);

    useEffect(() => {
        if (formData.clientPhone.length >= 5) {
            const query = formData.clientPhone.replace(/\D/g, '');
            const found = CLIENTS_MOCK.filter(c => c.phone.replace(/\D/g, '').includes(query));
            setFoundClients(found);
        } else {
            setFoundClients([]);
        }
    }, [formData.clientPhone]);

    const handleSelectClient = (client: Client) => {
        setSelectedClient(client);
        setFormData(prev => ({
            ...prev,
            clientId: client.id,
            clientName: `${client.firstName} ${client.lastName || ''}`.trim(),
            clientPhone: client.phone
        }));
        setFoundClients([]);
    };

    const isTimeSlotOccupied = (staffId: string, date: string, start: string, end: string) => {
        const sMins = start.split(':').reduce((h: number, m: string) => h * 60 + Number(m), 0);
        const eMins = end.split(':').reduce((h: number, m: string) => h * 60 + Number(m), 0);

        return (appointments || []).some(apt => {
            if (apt.staffId?.toString() !== staffId || apt.date !== date) return false;
            const aStart = apt.startTime.split(':').reduce((h: number, m: string) => h * 60 + Number(m), 0);
            const aEnd = apt.endTime.split(':').reduce((h: number, m: string) => h * 60 + Number(m), 0);
            return sMins < aEnd && eMins > aStart;
        });
    };

    const formatPhone = (val: string) => {
        const digits = val.replace(/\D/g, '').slice(0, 12);
        if (!digits) return '';
        if (digits.length <= 3) return `+${digits}`;
        // Only add closing bracket if we have more than 5 digits (operator code is full + next digit started)
        if (digits.length <= 5) return `+${digits.slice(0, 3)} (${digits.slice(3)}`;
        if (digits.length <= 8) return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5)}`;
        if (digits.length <= 10) return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8)}`;
        return `+${digits.slice(0, 3)} (${digits.slice(3, 5)}) ${digits.slice(5, 8)}-${digits.slice(8, 10)}-${digits.slice(10)}`;
    };

    const findNearestAvailableSlot = () => {
        const { staffId, date, startTime, selectedServiceIds } = formData;

        // Calculate dynamic duration based on services or default to 30 mins
        const selectedServices = MOCK_SERVICES.filter(s => (selectedServiceIds || []).includes(s.id));
        const duration = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 30;

        const [h, m] = startTime.split(':').map(Number);
        const currentMins = h * 60 + m;

        // Search for the next 12 hours with 15-minute steps
        for (let i = 0; i < 48; i++) {
            const nextStartMins = currentMins + i * 15;
            const nextStartTime = `${Math.floor((nextStartMins / 60) % 24).toString().padStart(2, '0')}:${(nextStartMins % 60).toString().padStart(2, '0')}`;
            const nextEndTime = addMinutes(nextStartTime, duration);

            if (!isTimeSlotOccupied(staffId, date, nextStartTime, nextEndTime)) {
                // We manually update both because handleStartTimeChange would recalculate based on duration anyway
                setFormData(prev => ({
                    ...prev,
                    startTime: nextStartTime,
                    endTime: nextEndTime
                }));
                toast.success(`Знайдено вільний час: ${nextStartTime} - ${nextEndTime}`);
                return;
            }
        }
        toast.error('Не вдалося знайти вільне вікно такої тривалості на цю дату');
    };

    useEffect(() => {
        const occupied = isTimeSlotOccupied(formData.staffId, formData.date, formData.startTime, formData.endTime);
        if (occupied) {
            setTimeError('Цей час вже зайнятий майстром');
        } else {
            setTimeError(null);
        }
    }, [formData.startTime, formData.endTime, formData.staffId, formData.date, appointments]);

    useEffect(() => {
        if (isOpen) {
            const initial = buildInitialFormData();
            setFormData({
                ...initial,
                staffId: initialStaffId || 'unassigned',
                startTime: initialTime || initial.startTime,
                endTime: initialTime ? addMinutes(initialTime, 30) : initial.endTime,
                date: initialDate || initial.date,
                selectedServiceIds: [],
            });
            setSelectedClient(null);
            setFoundClients([]);
        }
    }, [isOpen, initialTime, initialDate, initialStaffId, staff.length]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        let finalNotes = formData.notes;
        if (formData.isForAnotherPerson) {
            const dateStr = new Date().toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' });
            finalNotes = `Записував(ла) ${dateStr} для ${formData.clientName}\n${finalNotes}`.trim();
        }

        onSave({ ...formData, notes: finalNotes });
        onClose();
        setFormData(buildInitialFormData());
        toast.success(formData.clientId ? 'Запис створено для постійного клієнта' : 'Запис створено (новий клієнт)', 'Успіх');
    };

    const handleChange = (field: keyof CreateAppointmentData, value: any) => {
        if (field === 'clientPhone') {
            value = formatPhone(value);
        }

        setFormData(prev => {
            const next = { ...prev, [field]: value };

            if (field === 'selectedServiceIds') {
                const selectedServices = MOCK_SERVICES.filter(s => value.includes(s.id));
                const totalPrice = selectedServices.reduce((sum, s) => sum + s.price, 0);
                const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0);

                next.price = totalPrice;
                next.service = selectedServices.map(s => s.name).join(', ');
                next.endTime = addMinutes(prev.startTime, totalDuration || 30);
            }

            return next;
        });

        if (field === 'clientPhone' && selectedClient) {
            setSelectedClient(null);
        }
    };

    const handleStartTimeChange = (time: string) => {
        setFormData(prev => {
            const next = { ...prev, startTime: time };

            // Расчитываем длительность текущего выбора
            const selectedServices = MOCK_SERVICES.filter(s => (prev.selectedServiceIds || []).includes(s.id));
            const totalDuration = selectedServices.reduce((sum, s) => sum + s.duration, 0) || 30;

            // При изменении времени начала, время окончания сдвигается на длительность услуг
            next.endTime = addMinutes(time, totalDuration);

            return next;
        });
    };

    const handleEndTimeChange = (time: string) => {
        setFormData(prev => {
            const [sh, sm] = prev.startTime.split(':').map(Number);
            const [eh, em] = time.split(':').map(Number);
            const startTotal = sh * 60 + sm;
            const endTotal = eh * 60 + em;

            if (endTotal <= startTotal) {
                return { ...prev, endTime: addMinutes(prev.startTime, 15) };
            }

            return { ...prev, endTime: time };
        });
    };

    const staffOptions = [
        {
            value: 'unassigned',
            label: 'Без майстра',
            description: 'Загальна черга',
            group: 'Черга',
            icon: (
                <div className="w-full h-full rounded-full bg-muted flex items-center justify-center text-muted-foreground font-bold text-xs uppercase">
                    ?
                </div>
            )
        },
        ...staff.map(s => ({
            value: s.id,
            label: s.name,
            description: getRoleLabel(s.role),
            group: s.role.includes('master') ? 'Майстри' : 'Адміністрація',
            icon: (
                <div className="w-full h-full rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xs uppercase">
                    {s.name.split(' ').map(n => n[0]).join('')}
                </div>
            )
        }))
    ];

    const getServiceIcon = (category: string) => {
        if (category.includes('зал')) return <Scissors className="w-4 h-4" />;
        if (category.includes('Нігтьовий')) return <Sparkles className="w-4 h-4 text-pink-500" />;
        if (category.includes('Космет')) return <Sparkles className="w-4 h-4 text-green-500" />;
        return <Scissors className="w-4 h-4" />;
    };

    const serviceOptions = MOCK_SERVICES.map(s => ({
        value: s.id,
        label: s.name,
        description: `${s.duration} хв • ${s.price} грн`,
        group: s.category,
        icon: (
            <div className="w-full h-full rounded-lg bg-secondary/50 flex items-center justify-center text-muted-foreground">
                {getServiceIcon(s.category)}
            </div>
        )
    }));

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Створити запис"
            size="lg"
            footer={
                <div className="flex justify-end gap-3">
                    <Button type="button" variant="secondary" onClick={onClose} className="font-semibold px-6">
                        Скасувати
                    </Button>
                    <Button
                        type="button"
                        variant="primary"
                        disabled={!!timeError}
                        className="font-bold px-10 shadow-lg shadow-primary/20"
                        onClick={() => {
                            const form = document.getElementById('create-appointment-form') as HTMLFormElement;
                            form?.requestSubmit();
                        }}
                    >
                        Створити запис
                    </Button>
                </div>
            }
        >
            <form id="create-appointment-form" onSubmit={handleSubmit} className="space-y-8">
                {/* SECTION: MASTER & TIME */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Майстер та час</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4 bg-muted/20 p-4 rounded-3xl border border-border/50">
                        <Dropdown
                            label="Майстер"
                            value={formData.staffId}
                            options={staffOptions}
                            onChange={(val) => handleChange('staffId', val)}
                            searchable
                            grouping
                        />
                        <DatePicker
                            label="Дата"
                            value={formData.date}
                            onChange={(val) => handleChange('date', val)}
                        />
                        <div className="relative">
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="text-sm font-medium text-foreground">Час початку</label>
                                {timeError && (
                                    <button
                                        type="button"
                                        onClick={findNearestAvailableSlot}
                                        className="text-[10px] text-primary hover:underline font-bold flex items-center gap-1"
                                    >
                                        <Search size={10} />
                                        Знайти вільний час
                                    </button>
                                )}
                            </div>
                            <TimePicker
                                value={formData.startTime}
                                onChange={handleStartTimeChange}
                                error={timeError || undefined}
                            />
                        </div>
                        <TimePicker
                            label="Час закінчення"
                            value={formData.endTime}
                            onChange={handleEndTimeChange}
                            error={timeError ? "" : undefined}
                        />
                    </div>
                </section>

                {/* SECTION: CLIENT INFORMATION */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Клієнт</h3>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Ім'я клієнта"
                            required
                            value={formData.clientName}
                            onChange={(e) => handleChange('clientName', e.target.value)}
                            placeholder="Введіть ім'я"
                            disabled={!!selectedClient && !formData.isForAnotherPerson}
                        />
                        <div className="relative">
                            <Input
                                label="Телефон"
                                type="tel"
                                value={formData.clientPhone}
                                onChange={(e) => handleChange('clientPhone', e.target.value)}
                                placeholder="+380 XX XXX XXXX"
                                className={clsx(
                                    "pl-10 transition-all duration-300",
                                    selectedClient && "border-green-500/50 bg-green-500/5 shadow-[0_0_20px_-5px_rgba(34,197,94,0.15)]"
                                )}
                            />
                            <div className={clsx(
                                "absolute left-3.5 bottom-0 h-[42px] flex items-center transition-colors duration-300",
                                selectedClient ? "text-green-500" : "text-muted-foreground"
                            )}>
                                <Search className="w-4 h-4" />
                            </div>

                            {foundClients.length > 0 && !selectedClient && (
                                <div className="absolute z-50 top-full left-0 right-0 mt-2 bg-background border border-border rounded-2xl shadow-2xl overflow-hidden animate-in fade-in slide-in-from-top-4 duration-300">
                                    <div className="p-3 bg-muted/50 border-b border-border flex items-center gap-2">
                                        <Users className="w-4 h-4 text-primary" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Вірогідні клієнти</span>
                                    </div>
                                    <div className="max-h-[240px] overflow-y-auto scrollbar-thin">
                                        {foundClients.map(client => (
                                            <button
                                                key={client.id}
                                                type="button"
                                                onClick={() => handleSelectClient(client)}
                                                className="w-full p-4 flex items-center justify-between hover:bg-muted transition-all border-b border-border last:border-0 group"
                                            >
                                                <div className="text-left">
                                                    <div className="font-bold text-sm group-hover:text-primary transition-colors">{client.firstName} {client.lastName}</div>
                                                    <div className="text-xs text-muted-foreground font-medium">{client.phone}</div>
                                                </div>
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className={clsx(
                                                        "text-[9px] px-2 py-0.5 rounded-lg font-black uppercase tracking-wider",
                                                        client.segment === 'repeat' ? "bg-green-500/10 text-green-600" : "bg-blue-500/10 text-blue-600"
                                                    )}>
                                                        {client.segment === 'repeat' ? 'Постійний' : 'Новий'}
                                                    </span>
                                                    <div className="text-[9px] text-muted-foreground font-bold italic opacity-50">
                                                        {client.totalVisits} візитів
                                                    </div>
                                                </div>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {selectedClient && (
                            <div className="col-span-2 p-4 bg-primary/5 border border-primary/10 rounded-2xl flex items-center gap-5 animate-in slide-in-from-bottom-2 duration-400">
                                <div className="relative">
                                    <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner">
                                        <UserCheck className="w-8 h-8" />
                                    </div>
                                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full border-2 border-background flex items-center justify-center">
                                        <Check className="w-3 h-3 text-white stroke-[4]" />
                                    </div>
                                </div>
                                <div className="flex-1 grid grid-cols-3 gap-6">
                                    <div className="space-y-1">
                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.15em] opacity-60">Ранг</div>
                                        <div className="text-xs font-bold text-primary flex items-center gap-1.5">
                                            <Sparkles className="w-3 h-3" />
                                            {selectedClient.segment === 'repeat' ? 'Постійний' : 'Новий'}
                                        </div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.15em] opacity-60">Візити</div>
                                        <div className="text-xs font-bold leading-none">{selectedClient.totalVisits} <span className="text-[10px] opacity-40">раз</span></div>
                                    </div>
                                    <div className="space-y-1">
                                        <div className="text-[9px] text-muted-foreground uppercase font-black tracking-[0.15em] opacity-60">Останній раз</div>
                                        <div className="text-xs font-bold leading-none">
                                            {selectedClient.lastVisit ? new Date(selectedClient.lastVisit).toLocaleDateString('uk-UA', { day: '2-digit', month: '2-digit' }) : '—'}
                                        </div>
                                    </div>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => {
                                        setSelectedClient(null);
                                        setFormData(prev => ({
                                            ...prev,
                                            clientId: undefined,
                                            clientName: '',
                                            clientPhone: ''
                                        }));
                                    }}
                                    className="h-8 text-[10px] font-black uppercase text-muted-foreground hover:text-destructive hover:bg-destructive/5 rounded-xl transition-all"
                                >
                                    Скинути
                                </Button>
                            </div>
                        )}

                        <div
                            className="col-span-2 flex items-center gap-3 p-4 bg-muted/10 rounded-2xl border border-dashed border-border group hover:border-primary/50 transition-all cursor-pointer select-none"
                            onClick={() => handleChange('isForAnotherPerson', !formData.isForAnotherPerson)}
                        >
                            <Checkbox
                                id="isForAnotherPerson"
                                checked={formData.isForAnotherPerson}
                                onChange={(checked) => handleChange('isForAnotherPerson', checked)}
                                label="Записую іншу людину"
                                className="font-bold text-sm"
                            />
                            <Tooltip content="Виберіть, якщо записуєте одну людину, а прийде інша. Система додасть відповідну нотатку майстру.">
                                <div className="p-1.5 rounded-xl bg-background border border-border text-muted-foreground group-hover:text-primary transition-colors" onClick={(e) => e.stopPropagation()}>
                                    <Info className="w-3.5 h-3.5" />
                                </div>
                            </Tooltip>
                        </div>
                    </div>
                </section>

                {/* SECTION: SERVICES & PRICE */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Послуги та оплата</h3>
                    </div>
                    <div className="space-y-3">
                        <Dropdown
                            label="Вибір послуг"
                            value={formData.selectedServiceIds || []}
                            options={serviceOptions}
                            onChange={(val) => handleChange('selectedServiceIds', val)}
                            multiple
                            grouping
                            collapsible
                            searchable
                            placeholder="Що будемо робити?"
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground opacity-70">Ціна (грн)</label>
                                <div className="flex items-center bg-background border border-border rounded-xl p-1 h-[46px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all">
                                    <button
                                        type="button"
                                        onClick={() => handleChange('price', Math.max(0, (formData.price || 0) - 50))}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all active:scale-90"
                                    >
                                        <Minus size={14} strokeWidth={3} />
                                    </button>
                                    <input
                                        type="number"
                                        value={formData.price}
                                        onChange={(e) => handleChange('price', Number(e.target.value))}
                                        className="flex-1 bg-transparent text-center font-black text-lg text-primary focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => handleChange('price', (formData.price || 0) + 50)}
                                        className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-muted text-muted-foreground hover:text-primary transition-all active:scale-90"
                                    >
                                        <Plus size={14} strokeWidth={3} />
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-sm font-medium text-foreground opacity-70">Тривалість</label>
                                <div className="h-[46px] px-4 bg-muted/30 border border-border rounded-xl flex items-center justify-between group shadow-inner">
                                    <div className="flex items-center gap-2.5 text-muted-foreground group-hover:text-primary transition-colors">
                                        <Clock className="w-4 h-4" />
                                        <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Час</span>
                                    </div>
                                    <span className="text-lg font-black text-foreground">
                                        {MOCK_SERVICES.filter(s => (formData.selectedServiceIds || []).includes(s.id))
                                            .reduce((sum, s) => sum + s.duration, 0)} <span className="text-xs font-bold opacity-40">хв</span>
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* SECTION: ADDITIONAL */}
                <section className="space-y-4">
                    <div className="flex items-center gap-2 mb-2">
                        <div className="w-1 h-4 bg-primary rounded-full" />
                        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/70">Додатково</h3>
                    </div>
                    <div className="space-y-6">
                        <div className="space-y-3">
                            <label className="block text-[10px] font-black text-foreground uppercase tracking-[0.2em] opacity-40">Рівень важливості</label>
                            <RadioGroup orientation="horizontal" className="flex gap-4">
                                {APPOINTMENT_TYPES.map((type) => (
                                    <Radio
                                        key={type.value}
                                        name="appointment-type"
                                        value={type.value}
                                        checked={formData.type === type.value}
                                        onChange={() => handleChange('type', type.value)}
                                        label={type.label}
                                    />
                                ))}
                            </RadioGroup>
                        </div>
                        <Textarea
                            label="Коментар до візиту"
                            value={formData.notes}
                            onChange={(e) => handleChange('notes', e.target.value)}
                            placeholder="Особливі побажання, алергії або важливі деталі..."
                            rows={3}
                            className="resize-none bg-muted/5 border-muted-foreground/20 rounded-2xl"
                        />
                    </div>
                </section>
            </form>
        </Modal>
    );
}