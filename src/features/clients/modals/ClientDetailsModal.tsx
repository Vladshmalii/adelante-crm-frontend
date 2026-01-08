'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { ClientTag } from '../ui/ClientTag';
import type { Client } from '../types';
import { mockUserProfile } from '@/features/profile/data/mockProfile';
import { User, Phone, Mail, Calendar, Banknote, Percent, CreditCard, Eye, EyeOff } from 'lucide-react';

interface ClientDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    client: Client | null;
}

export function ClientDetailsModal({ isOpen, onClose, onEdit, onDelete, client }: ClientDetailsModalProps) {
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
            minute: '2-digit'
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

    const InfoRow = ({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) => (
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0 hover:bg-muted/30 transition-colors px-2 rounded-lg">
            <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mb-0.5">{label}</p>
                <p className="text-base text-foreground font-medium">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі клієнта" size="lg">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center shadow-lg shadow-primary/20">
                        <User className="w-8 h-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-bold text-foreground font-heading mb-1">
                            {isAdmin && isPhoneVisible
                                ? getFullName(client.firstName, client.middleName, client.lastName)
                                : getPublicName(client.firstName, client.middleName)}
                        </h3>
                        <ClientTag segment={client.segment} size="md" />
                    </div>
                </div>

                {/* Tabs */}
                <div className="flex border-b border-border gap-6">
                    <button
                        onClick={() => setActiveTab('info')}
                        className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'info'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Загальна інформація
                        {activeTab === 'info' && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`pb-3 text-sm font-semibold transition-all relative ${activeTab === 'history'
                            ? 'text-primary'
                            : 'text-muted-foreground hover:text-foreground'
                            }`}
                    >
                        Історія відвідувань
                        {activeTab === 'history' && (
                            <div className="absolute bottom-[-1px] left-0 right-0 h-0.5 bg-primary rounded-full" />
                        )}
                    </button>
                </div>

                <div className="min-h-[400px]">
                    {activeTab === 'info' ? (
                        <div className="space-y-6 animate-in fade-in slide-in-from-left-4 duration-300">
                            {/* Contact Info */}
                            <div className="space-y-2">
                                <h4 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-2">Контактна інформація</h4>
                                <div className="bg-muted/30 rounded-xl p-2 border border-border/50">
                                    <div className="flex items-start gap-3 py-3 border-b border-border/50 hover:bg-muted/50 transition-colors px-2 rounded-lg">
                                        <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between mb-0.5">
                                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Телефон</p>
                                                {isAdmin && (
                                                    <button
                                                        type="button"
                                                        onClick={() => setIsPhoneVisible((prev) => !prev)}
                                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-white hover:text-primary hover:border-primary transition-all duration-200"
                                                    >
                                                        {isPhoneVisible ? (
                                                            <EyeOff className="w-3.5 h-3.5" />
                                                        ) : (
                                                            <Eye className="w-3.5 h-3.5" />
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                            <p className="text-base text-foreground font-medium">
                                                {isAdmin && isPhoneVisible ? client.phone : getMaskedPhone(client.phone)}
                                            </p>
                                        </div>
                                    </div>
                                    {client.email && (
                                        <InfoRow
                                            icon={Mail}
                                            label="Email"
                                            value={isAdmin && isPhoneVisible ? client.email : 'Приховано'}
                                        />
                                    )}
                                </div>
                            </div>

                            {/* Visit & Financial Info Grid */}
                            <div className="grid grid-cols-2 gap-6">
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-2">Відвідування</h4>
                                    <div className="bg-muted/30 rounded-xl p-2 border border-border/50 h-full">
                                        <InfoRow icon={Calendar} label="Перше" value={formatDate(client.firstVisit)} />
                                        <InfoRow icon={Calendar} label="Останнє" value={formatDate(client.lastVisit)} />
                                        <InfoRow icon={CreditCard} label="Кількість" value={client.totalVisits} />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="text-sm font-bold text-foreground/70 uppercase tracking-widest px-2">Фінанси</h4>
                                    <div className="bg-muted/30 rounded-xl p-2 border border-border/50 h-full">
                                        <InfoRow icon={Banknote} label="Витрачено" value={`${client.totalSpent.toLocaleString('uk-UA')} ₴`} />
                                        <InfoRow icon={Percent} label="Знижка" value={`${client.discount}%`} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
                            {!isStaff ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border px-6">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <EyeOff className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <h5 className="text-base font-semibold text-foreground mb-1">Доступ обмежено</h5>
                                    <p className="text-sm text-muted-foreground">
                                        Історія відвідувань доступна лише співробітникам салону.
                                    </p>
                                </div>
                            ) : (!Array.isArray(client.visits) || client.visits.length === 0) ? (
                                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/20 rounded-2xl border border-dashed border-border px-6">
                                    <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-4">
                                        <Calendar className="w-6 h-6 text-muted-foreground" />
                                    </div>
                                    <h5 className="text-base font-semibold text-foreground mb-1">Історія порожня</h5>
                                    <p className="text-sm text-muted-foreground">
                                        У цього клієнта ще не було завершених відвідувань.
                                    </p>
                                </div>
                            ) : (
                                <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                                    {client.visits.map((visit) => (
                                        <div key={visit.id} className="bg-card border border-border rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <span className="text-xs font-bold text-primary uppercase tracking-wider">{visit.serviceName}</span>
                                                    <h5 className="text-sm font-semibold text-foreground mt-0.5">{visit.staffName}</h5>
                                                </div>
                                                <span className="text-xs text-muted-foreground font-medium bg-muted px-2 py-1 rounded-md">
                                                    {formatDate(visit.date)}
                                                </span>
                                            </div>

                                            {visit.notes && (
                                                <div className="bg-muted/50 rounded-lg p-3 mb-4">
                                                    <div className="flex items-center gap-2 mb-1.5">
                                                        <Mail className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Нотатки майстра</span>
                                                    </div>
                                                    <p className="text-sm text-foreground/80 leading-relaxed italic">
                                                        «{visit.notes}»
                                                    </p>
                                                </div>
                                            )}

                                            {visit.photos && visit.photos.length > 0 && (
                                                <div className="space-y-2">
                                                    <div className="flex items-center gap-2">
                                                        <Calendar className="w-3.5 h-3.5 text-primary" />
                                                        <span className="text-[10px] font-bold text-foreground/60 uppercase tracking-widest">Фото процедури ({visit.photos.length})</span>
                                                    </div>
                                                    <div className="grid grid-cols-4 gap-2">
                                                        {visit.photos.map((photo, idx) => (
                                                            <div key={idx} className="aspect-square rounded-lg overflow-hidden border border-border group cursor-zoom-in relative">
                                                                <img
                                                                    src={photo}
                                                                    alt={`Фото ${idx + 1}`}
                                                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                                                                />
                                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
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
                <div className="flex gap-3 pt-6 border-t border-border">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onEdit}
                        className="hover:bg-secondary/80 font-semibold"
                    >
                        Редагувати профіль
                    </Button>
                    <Button
                        variant="danger"
                        fullWidth
                        onClick={onDelete}
                        className="font-semibold"
                    >
                        Видалити клієнта
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
