'use client';

import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronDown, Store } from 'lucide-react';
import clsx from 'clsx';
import apiClient from '@/lib/api/client';
import { useAuthStore } from '@/stores/useAuthStore';
import type { AuthSalon } from '@/lib/api/auth';

export function SalonSwitcher() {
    const { user, currentSalonId, setCurrentSalonId } = useAuthStore();
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });
    const triggerRef = useRef<HTMLButtonElement>(null);
    const portalRef = useRef<HTMLDivElement>(null);

    const salons: AuthSalon[] = user?.salons ?? [];
    const activeSalon = salons.find((s) => s.id === currentSalonId) ?? salons[0];

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                triggerRef.current &&
                !triggerRef.current.contains(event.target as Node) &&
                portalRef.current &&
                !portalRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };
        const handleResize = () => setIsOpen(false);
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
        if (salons.length < 2) return;
        if (!isOpen && triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            setCoords({ top: rect.bottom + 8, left: rect.left, width: Math.max(rect.width, 220) });
        }
        setIsOpen((prev) => !prev);
    };

    const handleSelect = (salon: AuthSalon) => {
        setIsOpen(false);
        if (salon.id === currentSalonId) return;
        // Дані на всіх сторінках завантажуються при монтуванні через X-Salon-Id —
        // єдиний надійний спосіб їх перезавантажити для нового салону це
        // повне перезавантаження сторінки.
        apiClient.setSalonId(salon.id);
        setCurrentSalonId(salon.id);
        window.location.reload();
    };

    if (!activeSalon) return null;

    const dropdownContent = (
        <div
            ref={portalRef}
            className="fixed bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100 py-1"
            style={{ top: coords.top, left: coords.left, minWidth: coords.width }}
        >
            {salons.map((salon) => (
                <button
                    key={salon.id}
                    onClick={() => handleSelect(salon)}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2.5 text-sm text-foreground hover:bg-secondary transition-colors text-left"
                >
                    <span className="truncate">{salon.name}</span>
                    {salon.id === activeSalon.id && (
                        <Check size={16} className="text-primary flex-shrink-0" />
                    )}
                </button>
            ))}
        </div>
    );

    return (
        <div className="flex items-center gap-2 overflow-hidden w-full">
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center shadow-lg shadow-primary/20 flex-shrink-0">
                <Store className="w-4 h-4 text-primary-foreground" />
            </div>
            <button
                ref={triggerRef}
                onClick={toggleDropdown}
                disabled={salons.length < 2}
                className={clsx(
                    'flex-1 flex items-center justify-between gap-1 min-w-0 rounded-lg px-1.5 py-1 -mx-1.5 transition-colors text-left',
                    salons.length >= 2 && 'hover:bg-sidebar-active cursor-pointer',
                )}
                title={activeSalon.name}
            >
                <span className="font-heading font-bold text-sm tracking-tight truncate">
                    {activeSalon.name}
                </span>
                {salons.length >= 2 && (
                    <ChevronDown
                        className={clsx(
                            'w-3.5 h-3.5 text-sidebar-muted flex-shrink-0 transition-transform',
                            isOpen && 'rotate-180',
                        )}
                    />
                )}
            </button>
            {isOpen &&
                typeof document !== 'undefined' &&
                createPortal(dropdownContent, document.body)}
        </div>
    );
}
