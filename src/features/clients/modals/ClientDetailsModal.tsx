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
    if (!client) return null;

    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const isAdmin = mockUserProfile.role === 'administrator';

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
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
        <div className="flex items-start gap-3 py-3 border-b border-border last:border-0">
            <Icon className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
                <p className="text-sm text-muted-foreground mb-0.5">{label}</p>
                <p className="text-base text-foreground font-medium">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі клієнта" size="md">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 pb-4 border-b border-border">
                    <div className="w-16 h-16 bg-gradient-to-br from-primary to-primary/60 rounded-full flex items-center justify-center">
                        <User className="w-8 h-8 text-white" />
                    </div>
                    <div className="flex-1">
                        <h3 className="text-xl font-semibold text-foreground font-heading">
                            {isAdmin && isPhoneVisible
                                ? getFullName(client.firstName, client.middleName, client.lastName)
                                : getPublicName(client.firstName, client.middleName)}
                        </h3>
                        <ClientTag segment={client.segment} size="md" />
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Контактна інформація</h4>
                    <div className="flex items-start gap-3 py-3 border-b border-border">
                        <Phone className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between mb-0.5">
                                <p className="text-sm text-muted-foreground">Телефон</p>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsPhoneVisible((prev) => !prev)}
                                        className="inline-flex items-center justify-center w-7 h-7 rounded-full border border-border text-muted-foreground hover:bg-secondary transition-colors"
                                    >
                                        {isPhoneVisible ? (
                                            <EyeOff className="w-4 h-4" />
                                        ) : (
                                            <Eye className="w-4 h-4" />
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

                {/* Visit Info */}
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Інформація про відвідування</h4>
                    <InfoRow icon={Calendar} label="Перше відвідування" value={formatDate(client.firstVisit)} />
                    <InfoRow icon={Calendar} label="Останнє відвідування" value={formatDate(client.lastVisit)} />
                    <InfoRow icon={CreditCard} label="Кількість відвідувань" value={client.visits} />
                </div>

                {/* Financial Info */}
                <div className="space-y-1">
                    <h4 className="text-sm font-semibold text-foreground mb-3">Фінансова інформація</h4>
                    <InfoRow icon={Banknote} label="Всього витрачено" value={`${client.totalSpent.toLocaleString('uk-UA')} ₴`} />
                    <InfoRow icon={Percent} label="Знижка" value={`${client.discount}%`} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-4 border-t border-border">
                    <Button
                        variant="secondary"
                        fullWidth
                        onClick={onEdit}
                    >
                        Редагувати
                    </Button>
                    <Button
                        variant="danger"
                        fullWidth
                        onClick={onDelete}
                    >
                        Видалити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
