"use client";

import { useState } from 'react';
import { UserCircle, Mail, Phone, Calendar, MapPin, Users, Briefcase, Banknote, Clock, Edit2, Save, X } from 'lucide-react';
import { UserProfile, ProfileFormData } from '../types';
import { StaffRole } from '@/features/staff/types';

interface ProfilePageProps {
    profile: UserProfile;
    onSave: (data: ProfileFormData) => void;
}

const ROLE_LABELS: Record<StaffRole, string> = {
    master: 'Майстер',
    administrator: 'Адміністратор',
    manager: 'Менеджер',
};

const EDITABLE_FIELDS_BY_ROLE: Record<StaffRole, (keyof ProfileFormData)[]> = {
    master: ['phone', 'email', 'address', 'emergencyContact', 'emergencyPhone'],
    administrator: ['firstName', 'lastName', 'phone', 'email', 'birthDate', 'address', 'emergencyContact', 'emergencyPhone', 'specialization', 'workSchedule'],
    manager: ['phone', 'email', 'address', 'emergencyContact', 'emergencyPhone'],
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

    const editableFields = EDITABLE_FIELDS_BY_ROLE[profile.role];

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
        type: 'text' | 'email' | 'tel' | 'date' = 'text'
    ) => {
        const editable = isFieldEditable(field);
        const displayValue = isEditing ? formData[field] : value;

        return (
            <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                <div className="text-muted-foreground mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    {isEditing && editable ? (
                        <input
                            type={type}
                            value={formData[field] || ''}
                            onChange={(e) => handleChange(field, e.target.value)}
                            className="w-full px-3 py-1.5 text-sm bg-background border border-border rounded focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    ) : (
                        <p className="text-sm text-foreground font-medium">
                            {displayValue || '—'}
                        </p>
                    )}
                </div>
            </div>
        );
    };

    const renderReadOnlyField = (label: string, value: string | number | undefined, icon: React.ReactNode) => {
        return (
            <div className="flex items-start gap-3 p-4 bg-card border border-border rounded-lg">
                <div className="text-muted-foreground mt-0.5">{icon}</div>
                <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground mb-1">{label}</p>
                    <p className="text-sm text-foreground font-medium">{value || '—'}</p>
                </div>
            </div>
        );
    };

    return (
        <div className="p-6 max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-6">
                <h1 className="text-2xl font-semibold text-foreground font-heading">Мій профіль</h1>

                {!isEditing ? (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                    >
                        <Edit2 size={18} />
                        Редагувати
                    </button>
                ) : (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={handleCancel}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-foreground bg-secondary hover:bg-secondary/80 rounded-lg transition-colors"
                        >
                            <X size={18} />
                            Скасувати
                        </button>
                        <button
                            onClick={handleSave}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-accent-foreground bg-accent hover:bg-accent/90 rounded-lg transition-colors"
                        >
                            <Save size={18} />
                            Зберегти
                        </button>
                    </div>
                )}
            </div>

            <div className="bg-card border border-border rounded-lg p-6 mb-6">
                <div className="flex items-center gap-4 mb-6">
                    {profile.avatar ? (
                        <img
                            src={profile.avatar}
                            alt={`${profile.firstName} ${profile.lastName}`}
                            className="w-20 h-20 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="w-12 h-12 text-primary" />
                        </div>
                    )}
                    <div>
                        <h2 className="text-xl font-semibold text-foreground">
                            {profile.firstName} {profile.lastName}
                        </h2>
                        <p className="text-sm text-muted-foreground">{ROLE_LABELS[profile.role]}</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Ім\'я', profile.firstName, 'firstName', <UserCircle size={20} />)}
                    {renderField('Прізвище', profile.lastName, 'lastName', <UserCircle size={20} />)}
                    {renderField('Email', profile.email, 'email', <Mail size={20} />, 'email')}
                    {renderField('Телефон', profile.phone, 'phone', <Phone size={20} />, 'tel')}
                    {renderField('Дата народження', profile.birthDate, 'birthDate', <Calendar size={20} />, 'date')}
                    {renderReadOnlyField('Дата прийому на роботу', profile.hireDate, <Briefcase size={20} />)}
                </div>
            </div>

            {profile.role === 'master' && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Професійна інформація</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderField('Спеціалізація', profile.specialization, 'specialization', <Briefcase size={20} />)}
                        {renderField('Графік роботи', profile.workSchedule, 'workSchedule', <Clock size={20} />)}
                        {renderReadOnlyField('Оклад', profile.salary ? `${profile.salary} грн` : undefined, <Banknote size={20} />)}
                        {renderReadOnlyField('Комісія', profile.commission ? `${profile.commission}%` : undefined, <Banknote size={20} />)}
                    </div>
                </div>
            )}

            {profile.role === 'administrator' && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Адміністративна інформація</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderField('Спеціалізація', profile.specialization, 'specialization', <Briefcase size={20} />)}
                        {renderField('Графік роботи', profile.workSchedule, 'workSchedule', <Clock size={20} />)}
                        {renderReadOnlyField('Оклад', profile.salary ? `${profile.salary} грн` : undefined, <Banknote size={20} />)}
                    </div>
                </div>
            )}

            {profile.role === 'manager' && (
                <div className="bg-card border border-border rounded-lg p-6 mb-6">
                    <h3 className="text-lg font-semibold text-foreground mb-4">Управлінська інформація</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {renderReadOnlyField('Оклад', profile.salary ? `${profile.salary} грн` : undefined, <Banknote size={20} />)}
                        {renderReadOnlyField('Графік роботи', profile.workSchedule, <Clock size={20} />)}
                    </div>
                </div>
            )}

            <div className="bg-card border border-border rounded-lg p-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">Додаткова інформація</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {renderField('Адреса', profile.address, 'address', <MapPin size={20} />)}
                    {renderField('Контактна особа (екстрений випадок)', profile.emergencyContact, 'emergencyContact', <Users size={20} />)}
                    {renderField('Телефон (екстрений випадок)', profile.emergencyPhone, 'emergencyPhone', <Phone size={20} />, 'tel')}
                </div>
            </div>
        </div>
    );
}
