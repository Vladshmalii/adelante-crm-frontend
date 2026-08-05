'use client';

import { User, Settings, LogOut, UserCircle } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { StaffRole } from '@/features/staff/types';
import { getRoleLabel } from '@/features/staff/utils/roleTranslations';

interface ProfileDropdownProps {
    userName: string;
    userRole: StaffRole;
    userAvatar?: string;
    onProfileClick: () => void;
    onSettingsClick: () => void;
    onLogout: () => void;
}

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
        setIsOpen((prev) => !prev);
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
            className="animate-in fade-in zoom-in-95 fixed z-[9999] w-64 overflow-hidden rounded-lg border border-border bg-card shadow-lg duration-100"
            style={{
                top: coords.top,
                left: coords.left,
            }}
        >
            <div className="border-b border-border px-4 py-3">
                <div className="flex items-center gap-3">
                    {userAvatar ? (
                        <img
                            src={userAvatar}
                            alt={userName}
                            className="h-10 w-10 rounded-full object-cover"
                        />
                    ) : (
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                            <UserCircle className="h-6 w-6 text-primary" />
                        </div>
                    )}
                    <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-foreground">{userName}</p>
                        <p className="text-xs text-muted-foreground">{getRoleLabel(userRole)}</p>
                    </div>
                </div>
            </div>

            <div className="py-1">
                <button
                    onClick={handleProfileClick}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                    <User size={18} className="text-muted-foreground" />
                    Мій профіль
                </button>
                <button
                    onClick={handleSettingsClick}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-foreground transition-colors hover:bg-secondary"
                >
                    <Settings size={18} className="text-muted-foreground" />
                    Налаштування
                </button>
            </div>

            <div className="border-t border-border py-1">
                <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-destructive transition-colors hover:bg-destructive/10"
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
                className="hidden items-center gap-2 rounded-lg p-1.5 transition-all hover:bg-accent active:scale-95 sm:flex"
            >
                {userAvatar ? (
                    <img
                        src={userAvatar}
                        alt={userName}
                        className="h-8 w-8 rounded-full object-cover"
                    />
                ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10">
                        <User className="h-5 w-5 text-primary" />
                    </div>
                )}
            </button>

            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(dropdownContent, document.body)}
        </div>
    );
}
