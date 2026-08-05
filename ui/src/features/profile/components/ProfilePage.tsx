'use client';

import { useState } from 'react';
import {
    UserCircle,
    Mail,
    Phone,
    Calendar,
    MapPin,
    Users,
    Briefcase,
    Banknote,
    Clock,
    Edit2,
    Save,
    X,
} from 'lucide-react';
import { UserProfile, ProfileFormData } from '../types';
import { StaffRole } from '@/features/staff/types';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';
import { Button } from '@/shared/components/ui/Button';

interface ProfilePageProps {
    profile: UserProfile;
    onSave: (data: ProfileFormData) => void;
}

const EDITABLE_FIELDS_BY_ROLE: Record<string, (keyof ProfileFormData)[]> = {
    master: ['phone', 'email', 'address', 'emergencyContact', 'emergencyPhone'],
    administrator: [
        'firstName',
        'lastName',
        'phone',
        'email',
        'birthDate',
        'address',
        'emergencyContact',
        'emergencyPhone',
        'specialization',
        'workSchedule',
    ],
    admin: [
        'firstName',
        'lastName',
        'phone',
        'email',
        'birthDate',
        'address',
        'emergencyContact',
        'emergencyPhone',
        'specialization',
        'workSchedule',
    ],
    manager: ['phone', 'email', 'address', 'emergencyContact', 'emergencyPhone'],
    receptionist: ['phone', 'email', 'address', 'emergencyContact', 'emergencyPhone'],
};

export function ProfilePage({ profile, onSave }: ProfilePageProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState<ProfileFormData>({
        firstName: profile.firstName,
        lastName: profile.lastName,
        email: profile.email,
        phone: profile.phone,
        birthDate: profile.birthDate,
        address: profile.address,
        emergencyContact: profile.emergencyContact,
        emergencyPhone: profile.emergencyPhone,
        specialization: profile.specialization,
        workSchedule: profile.workSchedule,
    });

    const editableFields = EDITABLE_FIELDS_BY_ROLE[profile.role] || [];

    const handleChange = (field: keyof ProfileFormData, value: string) => {
        setFormData({ ...formData, [field]: value });
    };

    const handleSave = () => {
        onSave(formData);
        setIsEditing(false);
    };

    const handleCancel = () => {
        setFormData({
            firstName: profile.firstName,
            lastName: profile.lastName,
            email: profile.email,
            phone: profile.phone,
            birthDate: profile.birthDate,
            address: profile.address,
            emergencyContact: profile.emergencyContact,
            emergencyPhone: profile.emergencyPhone,
            specialization: profile.specialization,
            workSchedule: profile.workSchedule,
        });
        setIsEditing(false);
    };

    const isFieldEditable = (field: keyof ProfileFormData) => {
        return editableFields.includes(field);
    };

    const renderField = (
        label: string,
        value: string | undefined,
        field: keyof ProfileFormData,
        icon: React.ReactNode,
        type: 'text' | 'email' | 'tel' | 'date' = 'text',
    ) => {
        const editable = isFieldEditable(field);
        const displayValue = isEditing ? formData[field] : value;

        return (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                    {isEditing && editable ? (
                        <input
                            type={type}
                            value={formData[field] || ''}
                            onChange={(e) => handleChange(field, e.target.value)}
                            className="w-full rounded border border-border bg-background px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    ) : (
                        <p className="text-sm font-medium text-foreground">{displayValue || '—'}</p>
                    )}
                </div>
            </div>
        );
    };

    const renderReadOnlyField = (
        label: string,
        value: string | number | undefined,
        icon: React.ReactNode,
    ) => {
        return (
            <div className="flex items-start gap-3 rounded-lg border border-border bg-card p-4">
                <div className="mt-0.5 text-muted-foreground">{icon}</div>
                <div className="min-w-0 flex-1">
                    <p className="mb-1 text-xs text-muted-foreground">{label}</p>
                    <p className="text-sm font-medium text-foreground">{value || '—'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="mx-auto max-w-4xl p-6">
            <div className="mb-6 flex items-center justify-between">
                <h1 className="font-heading text-2xl font-semibold text-foreground">Мій профіль</h1>

                {!isEditing ? (
                    <Button onClick={() => setIsEditing(true)} leftIcon={<Edit2 size={18} />}>
                        Редагувати
                    </Button>
                ) : (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="secondary"
                            onClick={handleCancel}
                            leftIcon={<X size={18} />}
                        >
                            Скасувати
                        </Button>
                        <Button onClick={handleSave} leftIcon={<Save size={18} />}>
                            Зберегти
                        </Button>
                    </div>
                )}
            </div>

            <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-4">
                    {profile.avatar ? (
                        <img
                            src={profile.avatar}
                            alt={`${profile.firstName} ${profile.lastName}`}
                            className="h-20 w-20 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                            <UserCircle className="h-12 w-12 text-primary" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground">
                            {getRoleLabel(profile.role)}
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderField("Ім'я", profile.firstName, 'firstName', <UserCircle size={20} />)}
                    {renderField(
                        'Прізвище',
                        profile.lastName,
                        'lastName',
                        <UserCircle size={20} />,
                    )}
                    {renderField('Email', profile.email, 'email', <Mail size={20} />, 'email')}
                    {renderField('Телефон', profile.phone, 'phone', <Phone size={20} />, 'tel')}
                    {renderField(
                        'Дата народження',
                        profile.birthDate,
                        'birthDate',
                        <Calendar size={20} />,
                        'date',
                    )}
                    {renderReadOnlyField(
                        'Дата прийому на роботу',
                        profile.hireDate,
                        <Briefcase size={20} />,
                    )}
                </div>
            </div>

            {profile.role === 'master' && (
                <div className="mb-6 rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                        Професійна інформація
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(
                            'Спеціалізація',
                            profile.specialization,
                            'specialization',
                            <Briefcase size={20} />,
                        )}
                        {renderField(
                            'Графік роботи',
                            profile.workSchedule,
                            'workSchedule',
                            <Clock size={20} />,
                        )}
                        {renderReadOnlyField(
                            'Оклад',
                            profile.salary ? `${profile.salary} грн` : undefined,
                            <Banknote size={20} />,
                        )}
                        {renderReadOnlyField(
                            'Комісія',
                            profile.commission ? `${profile.commission}%` : undefined,
                            <Banknote size={20} />,
                        )}
                    </div>
                </div>
            )}

            {(profile.role === 'administrator' || profile.role === 'admin') && (
                <div className="mb-6 rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                        Адміністративна інформація
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderField(
                            'Спеціалізація',
                            profile.specialization,
                            'specialization',
                            <Briefcase size={20} />,
                        )}
                        {renderField(
                            'Графік роботи',
                            profile.workSchedule,
                            'workSchedule',
                            <Clock size={20} />,
                        )}
                        {renderReadOnlyField(
                            'Оклад',
                            profile.salary ? `${profile.salary} грн` : undefined,
                            <Banknote size={20} />,
                        )}
                    </div>
                </div>
            )}

            {profile.role === 'manager' && (
                <div className="mb-6 rounded-lg border border-border bg-card p-6">
                    <h3 className="mb-4 text-lg font-semibold text-foreground">
                        Управлінська інформація
                    </h3>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                        {renderReadOnlyField(
                            'Оклад',
                            profile.salary ? `${profile.salary} грн` : undefined,
                            <Banknote size={20} />,
                        )}
                        {renderReadOnlyField(
                            'Графік роботи',
                            profile.workSchedule,
                            <Clock size={20} />,
                        )}
                    </div>
                </div>
            )}

            <div className="mb-6 rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">Додаткова інформація</h3>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                    {renderField('Адреса', profile.address, 'address', <MapPin size={20} />)}
                    {renderField(
                        'Контактна особа (екстрений випадок)',
                        profile.emergencyContact,
                        'emergencyContact',
                        <Users size={20} />,
                    )}
                    {renderField(
                        'Телефон (екстрений випадок)',
                        profile.emergencyPhone,
                        'emergencyPhone',
                        <Phone size={20} />,
                        'tel',
                    )}
                </div>
            </div>

            <div className="rounded-lg border border-border bg-card p-6">
                <h3 className="mb-4 text-lg font-semibold text-foreground">
                    Інтеграція з Telegram
                </h3>
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-foreground">
                            {profile.telegramConnected
                                ? 'Telegram підключено'
                                : 'Telegram не підключено'}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                            {profile.telegramConnected
                                ? 'Ви отримуєте сповіщення про записи в Telegram'
                                : 'Підключіть Telegram для отримання сповіщень про записи'}
                        </p>
                    </div>
                    {!profile.telegramConnected && (
                        <a
                            href={`https://t.me/AdelanteCrmBot?start=${profile.id}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded-lg bg-blue-500 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-blue-600"
                        >
                            Підключити
                        </a>
                    )}
                </div>
            </div>
        </div>
    );
}
