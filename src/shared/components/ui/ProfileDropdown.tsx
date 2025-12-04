"use client";

import { User, Settings, LogOut, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StaffRole } from '@/features/staff/types';

interface ProfileDropdownProps {
    userName: string;
    userRole: StaffRole;
    userAvatar?: string;
    onProfileClick: () => void;
    onSettingsClick: () => void;
    onLogout: () => void;
}

const ROLE_LABELS: Record<StaffRole, string> = {
    master: 'Майстер',
    administrator: 'Адміністратор',
    manager: 'Менеджер',
};

export function ProfileDropdown({
    userName,
    userRole,
    userAvatar,
    onProfileClick,
    onSettingsClick,
    onLogout,
}: ProfileDropdownProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                const portalElement = document.getElementById('profile-dropdown-portal');
                if (portalElement && portalElement.contains(event.target as Node)) {
                    return;
                }
                setIsOpen(false);
            }
        };

        const handleResize = () => {
            if (isOpen) setIsOpen(false);
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('resize', handleResize);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('resize', handleResize);
        };
    }, [isOpen]);

    const toggleDropdown = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8,
                left: rect.right - 256,
            });
        }
        setIsOpen(prev => !prev);
    };

    const handleProfileClick = () => {
        setIsOpen(false);
        onProfileClick();
    };

    const handleSettingsClick = () => {
        setIsOpen(false);
        onSettingsClick();
    };

    const handleLogout = () => {
        setIsOpen(false);
        onLogout();
    };

    const dropdownContent = (
        <div
            id="profile-dropdown-portal"
            className="fixed w-64 bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: coords.top,
                left: coords.left,
            }}
        >
            <div className="px-4 py-3 border-b border-border">
                <div className="flex items-center gap-3">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt={userName}
                            className="w-10 h-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <UserCircle className="w-6 h-6 text-primary" />
                        </div>
                    )}
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                            {userName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                            {ROLE_LABELS[userRole]}
                        </p>
                    </div>
                </div>
            </div>

            <div className="py-1">
                <button
                    onClick={handleProfileClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                    <User size={18} className="text-muted-foreground" />
                    Мій профіль
                </button>
                <button
                    onClick={handleSettingsClick}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors"
                >
                    <Settings size={18} className="text-muted-foreground" />
                    Налаштування
                </button>
            </div>

            <div className="border-t border-border py-1">
                <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10 transition-colors"
                >
                    <LogOut size={18} />
                    Вийти
                </button>
            </div>
        </div>
    );

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={toggleDropdown}
                className="hidden sm:flex items-center gap-2 p-1.5 hover:bg-accent rounded-lg transition-all active:scale-95"
            >
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userName}
                        className="w-8 h-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                        <User className="w-5 h-5 text-primary" />
                    </div>
                )}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
