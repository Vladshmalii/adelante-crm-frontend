'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Badge } from '@/shared/components/ui/Badge';
import type { Staff } from '../types';
import { mockUserProfile } from '@/features/profile/data/mockProfile';
import { getRoleLabel } from '../utils/roleTranslations';
import {
    User,
    Phone,
    Mail,
    Calendar,
    Banknote,
    Percent,
    Briefcase,
    Clock,
    Eye,
    EyeOff,
} from 'lucide-react';

interface StaffDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    onEdit: () => void;
    onDelete: () => void;
    staff: Staff | null;
}

export function StaffDetailsModal({
    isOpen,
    onClose,
    onEdit,
    onDelete,
    staff,
}: StaffDetailsModalProps) {
    const [isPhoneVisible, setIsPhoneVisible] = useState(false);
    const isAdmin = mockUserProfile.role === 'administrator';

    if (!staff) return null;

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const day = date.getDate().toString().padStart(2, '0');
        const month = (date.getMonth() + 1).toString().padStart(2, '0');
        const year = date.getFullYear();
        return `${day}.${month}.${year}`;
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            active: 'Активний',
            vacation: 'У відпустці',
            sick: 'На лікарняному',
            fired: 'Звільнений',
        };
        return labels[status] || status;
    };

    const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'danger' => {
        const variants: Record<string, 'success' | 'warning' | 'info' | 'danger'> = {
            active: 'success',
            vacation: 'info',
            sick: 'warning',
            fired: 'danger',
        };
        return variants[status] || ('default' as any);
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

    const getMaskedPhone = (phone?: string) => {
        if (!phone) return '';
        const digits = phone.replace(/\D/g, '');
        if (digits.length <= 4) return digits;
        const last4 = digits.slice(-4);
        return `•••• ${last4}`;
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
        <div className="flex items-start gap-3 border-b border-border py-3 last:border-0">
            <Icon className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
            <div className="min-w-0 flex-1">
                <p className="mb-0.5 text-sm text-muted-foreground">{label}</p>
                <p className="text-base font-medium text-foreground">{value}</p>
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Деталі співробітника" size="md">
            <div className="space-y-6">
                {/* Header */}
                <div className="flex items-center gap-4 border-b border-border pb-4">
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary/60">
                        <User className="h-8 w-8 text-primary-foreground" />
                    </div>
                    <div className="flex-1">
                        <h3 className="font-heading text-xl font-semibold text-foreground">
                            {isAdmin && isPhoneVisible
                                ? getFullName(staff.firstName, staff.middleName, staff.lastName)
                                : getPublicName(staff.firstName, staff.middleName)}
                        </h3>
                        <div className="mt-1 flex gap-2">
                            <Badge variant="primary" size="sm">
                                {getRoleLabel(staff.role)}
                            </Badge>
                            <Badge variant={getStatusVariant(staff.status)} size="sm">
                                {getStatusLabel(staff.status)}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Contact Info */}
                <div className="space-y-1">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Контактна інформація
                    </h4>
                    <div className="flex items-start gap-3 border-b border-border py-3">
                        <Phone className="mt-0.5 h-5 w-5 flex-shrink-0 text-muted-foreground" />
                        <div className="min-w-0 flex-1">
                            <div className="mb-0.5 flex items-center justify-between">
                                <p className="text-sm text-muted-foreground">Телефон</p>
                                {isAdmin && (
                                    <button
                                        type="button"
                                        onClick={() => setIsPhoneVisible((prev) => !prev)}
                                        className="inline-flex h-7 w-7 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:bg-secondary"
                                    >
                                        {isPhoneVisible ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </button>
                                )}
                            </div>
                            <p className="text-base font-medium text-foreground">
                                {isAdmin && isPhoneVisible
                                    ? staff.phone
                                    : getMaskedPhone(staff.phone)}
                            </p>
                        </div>
                    </div>
                    {staff.email && (
                        <InfoRow
                            icon={Mail}
                            label="Email"
                            value={isAdmin && isPhoneVisible ? staff.email : 'Приховано'}
                        />
                    )}
                </div>

                {/* Work Info */}
                <div className="space-y-1">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Робоча інформація
                    </h4>
                    <InfoRow
                        icon={Calendar}
                        label="Дата прийому"
                        value={staff.hireDate ? formatDate(staff.hireDate) : '—'}
                    />
                    {staff.specialization && (
                        <InfoRow
                            icon={Briefcase}
                            label="Спеціалізація"
                            value={staff.specialization}
                        />
                    )}
                    {staff.workSchedule && (
                        <InfoRow icon={Clock} label="Графік роботи" value={staff.workSchedule} />
                    )}
                </div>

                {/* Financial Info */}
                <div className="space-y-1">
                    <h4 className="mb-3 text-sm font-semibold text-foreground">
                        Фінансова інформація
                    </h4>
                    <InfoRow
                        icon={Banknote}
                        label="Зарплата"
                        value={
                            staff.salary !== undefined
                                ? `${staff.salary.toLocaleString('uk-UA')} ₴`
                                : '—'
                        }
                    />
                    <InfoRow icon={Percent} label="Комісія" value={`${staff.commission}%`} />
                </div>

                {/* Actions */}
                <div className="flex gap-3 border-t border-border pt-4">
                    <Button variant="secondary" fullWidth onClick={onEdit}>
                        Редагувати
                    </Button>
                    <Button variant="danger" fullWidth onClick={onDelete}>
                        Видалити
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
