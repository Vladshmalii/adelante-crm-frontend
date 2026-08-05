'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { ClientTag } from '../ui/ClientTag';
import type { Client } from '../types';
import { mockUserProfile } from '@/features/profile/data/mockProfile';
import {
    User,
    Phone,
    Mail,
    Calendar,
    Banknote,
    Percent,
    CreditCard,
    Eye,
    EyeOff,
} from 'lucide-react';

interface ClientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    client: Client | null;
}

export function ClientDetailsModal({
    isOpen,
    onClose,
    onEdit,
    onDelete,
    client,
}: ClientDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<'info' | 'history'>('info');
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);

    const isStaff = ['administrator', 'master', 'owner'].includes(mockUserProfile.role);
    const isAdmin = mockUserProfile.role === 'administrator';

    if (!client) return null;

    const formatDate = (dateString?: string) => {
        if (!dateString) return '—';
        const date = new Date(dateString);
        return date.toLocaleDateString('uk-UA', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
    };

    const getPublicName = (firstName: string, middleName?: string) => {
        if (middleName) {
            return `${firstName} ${middleName}`;
        }
        return firstName;
    };

    const getFullName = (firstName: string, middleName?: string, lastName?: string) => {
        const parts = [firstName, middleName, lastName].filter(Boolean);
        return parts.join(' ');
    };

    const InfoRow = ({
        icon: Icon,
        label,
        value,
    }: {
        icon: any;
        label: string;
        value: string | number;
    }) => (
        <div className="flex items-start gap-3 rounded-lg border-b border-border px-2 py-3 transition-colors last:border-0 hover:bg-muted/30">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {label}
                </p>
                <p className="text-base font-medium text-foreground">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі клієнта" size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60 shadow-lg shadow-primary/20">
                        <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                        <h3 className="mb-1 font-heading text-xl font-bold text-foreground">
                            {isAdmin && isPhoneVisible
                                ? getFullName(client.firstName, client.middleName, client.lastName)
                                : getPublicName(client.firstName, client.middleName)}
                        </h3>
                        <ClientTag segment={client.segment} size="md" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex gap-6 border-b border-border">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`relative pb-3 text-sm font-semibold transition-all ${
                            activeTab === 'info'
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Загальна інформація
                        {activeTab === 'info' && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-primary" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`relative pb-3 text-sm font-semibold transition-all ${
                            activeTab === 'history'
                                ? 'text-primary'
                                : 'text-muted-foreground hover:text-foreground'
                        }`}
                    >
                        Історія відвідувань
                        {activeTab === 'history' && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 rounded-full bg-primary" />
                        )}
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'info' ? (
                        <div className="animate-in fade-in slide-in-from-left-4 space-y-6 duration-300">
                            {/* Contact Info */}
                            <div className="space-y-2">
                                <h4 className="px-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                    Контактна інформація
                                </h4>
                                <div className="rounded-xl border border-border/50 bg-muted/30 p-2">
                                    <div className="flex items-start gap-3 rounded-lg border-b border-border/50 px-2 py-3 transition-colors hover:bg-muted/50">
                                        <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                                        <div className="min-w-0 flex-1">
                                            <div className="mb-0.5 flex items-center justify-between">
                                                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                                                    Телефон
                                                </p>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setIsPhoneVisible((prev) => !prev)
                                                        }
                                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-all duration-200 hover:border-primary hover:bg-white hover:text-primary"
                                                    >
                                                        {isPhoneVisible ? (
                                                            <EyeOff className="h-3.5 w-3.5" />
                                                        ) : (
                                                            <Eye className="h-3.5 w-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-base font-medium text-foreground">
                                                {isAdmin && isPhoneVisible
                                                    ? client.phone
                                                    : getMaskedPhone(client.phone)}
                                            </p>
                                        </div>
                                    </div>
                                    {client.email && (
                                        <InfoRow
                                            icon={Mail}
                                            label="Email"
                                            value={
                                                isAdmin && isPhoneVisible
                                                    ? client.email
                                                    : 'Приховано'
                                            }
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Visit & Financial Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="px-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                        Відвідування
                                    </h4>
                                    <div className="h-full rounded-xl border border-border/50 bg-muted/30 p-2">
                                        <InfoRow
                                            icon={Calendar}
                                            label="Перше"
                                            value={formatDate(client.firstVisit)}
                                        />
                                        <InfoRow
                                            icon={Calendar}
                                            label="Останнє"
                                            value={formatDate(client.lastVisit)}
                                        />
                                        <InfoRow
                                            icon={CreditCard}
                                            label="Кількість"
                                            value={client.totalVisits}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="px-2 text-sm font-bold uppercase tracking-widest text-foreground/70">
                                        Фінанси
                                    </h4>
                                    <div className="h-full rounded-xl border border-border/50 bg-muted/30 p-2">
                                        <InfoRow
                                            icon={Banknote}
                                            label="Витрачено"
                                            value={`${client.totalSpent.toLocaleString('uk-UA')} ₴`}
                                        />
                                        <InfoRow
                                            icon={Percent}
                                            label="Знижка"
                                            value={`${client.discount}%`}
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="animate-in fade-in slide-in-from-right-4 space-y-6 duration-300">
                            {!isStaff ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <EyeOff className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h5 className="mb-1 text-base font-semibold text-foreground">
                                        Доступ обмежено
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                        Історія відвідувань доступна лише співробітникам салону.
                                    </p>
                                </div>
                            ) : !Array.isArray(client.visits) || client.visits.length === 0 ? (
                                <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-muted/20 px-6 py-12 text-center">
                                    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                    <h5 className="mb-1 text-base font-semibold text-foreground">
                                        Історія порожня
                                    </h5>
                                    <p className="text-sm text-muted-foreground">
                                        У цього клієнта ще не було завершених відвідувань.
                                    </p>
                                </div>
                            ) : (
                                <div className="custom-scrollbar max-h-[500px] space-y-4 overflow-y-auto pr-2">
                                    {client.visits.map((visit) => (
                                        <div
                                            key={visit.id}
                                            className="rounded-xl border border-border bg-card p-4 shadow-sm transition-shadow hover:shadow-md"
                                        >
                                            <div className="mb-3 flex items-start justify-between">
                                                <div>
                                                    <span className="text-xs font-bold uppercase tracking-wider text-primary">
                                                        {visit.serviceName}
                                                    </span>
                                                    <h5 className="mt-0.5 text-sm font-semibold text-foreground">
                                                        {visit.staffName}
                                                    </h5>
                                                </div>
                                                <span className="rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
                                                    {formatDate(visit.date)}
                                                </span>
                                            </div>

                                            {visit.notes && (
                                                <div className="mb-4 rounded-lg bg-muted/50 p-3">
                                                    <div className="mb-1.5 flex items-center gap-2">
                                                        <Mail className="h-3.5 w-3.5 text-primary" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                                                            Нотатки майстра
                                                        </span>
                                                    </div>
                                                    <p className="text-sm italic leading-relaxed text-foreground/80">
                                                        «{visit.notes}»
                                                    </p>
                                                </div>
                                            )}

                                            {visit.photos && visit.photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="h-3.5 w-3.5 text-primary" />
                                                        <span className="text-[10px] font-bold uppercase tracking-widest text-foreground/60">
                                                            Фото процедури ({visit.photos.length})
                                                        </span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {visit.photos.map((photo, idx) => (
                                                            <div
                                                                key={idx}
                                                                className="group relative aspect-square cursor-zoom-in overflow-hidden rounded-lg border border-border"
                                                            >
                                                                <img
                                                                    src={photo}
                                                                    alt={`Фото ${idx + 1}`}
                                                                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 transition-colors group-hover:bg-black/20" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-border pt-6">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onEdit}
                        className="font-semibold hover:bg-secondary/80"
                    >
                        Редагувати профіль
                    </Button>
                    <Button variant="danger" fullWidth onClick={onDelete} className="font-semibold">
                        Видалити клієнта
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
