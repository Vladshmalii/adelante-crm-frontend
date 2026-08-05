'use client';

import { Bell, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

export interface Notification {
    id: string;
    title: string;
    message: string;
    time: string;
    isRead: boolean;
    type: 'info' | 'warning' | 'success' | 'error';
    url?: string;
}

interface NotificationsDropdownProps {
    notifications: Notification[];
    onMarkAsRead: (id: string) => void;
    onMarkAllAsRead: () => void;
    onDelete: (id: string) => void;
}

export function NotificationsDropdown({
    notifications,
    onMarkAsRead,
    onMarkAllAsRead,
    onDelete,
}: NotificationsDropdownProps) {
    const router = useRouter();
    const [isOpen, setIsOpen] = useState(false);
    const [coords, setCoords] = useState({ top: 0, left: 0 });
    const dropdownRef = useRef<HTMLDivElement>(null);

    const unreadCount = notifications.filter((n) => !n.isRead).length;

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                const portalElement = document.getElementById('notifications-dropdown-portal');
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

    const getStatusStyles = (type: Notification['type'], isRead: boolean) => {
        switch (type) {
            case 'success':
                return {
                    bg: isRead ? 'bg-emerald-500/5' : 'bg-emerald-500/10',
                    indicator: 'bg-emerald-500',
                    dot: 'bg-emerald-500',
                    text: 'text-emerald-500',
                };
            case 'warning':
                return {
                    bg: isRead ? 'bg-amber-500/5' : 'bg-amber-500/10',
                    indicator: 'bg-amber-500',
                    dot: 'bg-amber-500',
                    text: 'text-amber-500',
                };
            case 'error':
                return {
                    bg: isRead ? 'bg-destructive/5' : 'bg-destructive/10',
                    indicator: 'bg-destructive',
                    dot: 'bg-destructive',
                    text: 'text-destructive',
                };
            default:
                return {
                    bg: isRead ? 'bg-primary/5' : 'bg-primary/10',
                    indicator: 'bg-primary',
                    dot: 'bg-primary',
                    text: 'text-primary',
                };
        }
    };

    const toggleDropdown = () => {
        if (!isOpen && dropdownRef.current) {
            const rect = dropdownRef.current.getBoundingClientRect();
            setCoords({
                top: rect.bottom + 8,
                left: rect.right - 384,
            });
        }
        setIsOpen((prev) => !prev);
    };

    const dropdownContent = (
        <div
            id="notifications-dropdown-portal"
            className="animate-in fade-in slide-in-from-top-2 fixed z-[9999] w-[380px] overflow-hidden rounded-3xl border-2 border-border/40 bg-card/95 shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] backdrop-blur-xl duration-300"
            style={{
                top: coords.top,
                left: coords.left,
            }}
        >
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-6 py-4">
                <div className="flex items-center gap-2">
                    <div className="h-4 w-1.5 rounded-full bg-primary" />
                    <h3 className="font-heading text-xs font-black uppercase tracking-widest text-foreground">
                        Сповіщення
                    </h3>
                    {unreadCount > 0 && (
                        <span className="ml-2 rounded-md bg-destructive px-1.5 py-0.5 text-[10px] font-black text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-[10px] font-black uppercase tracking-wider text-muted-foreground transition-colors hover:text-primary"
                    >
                        Позначити все
                    </button>
                )}
            </div>

            <div className="scrollbar-thin max-h-96 overflow-y-auto">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Немає сповіщень
                    </div>
                ) : (
                    notifications.map((notification) => {
                        const styles = getStatusStyles(notification.type, notification.isRead);
                        return (
                            <div
                                key={notification.id}
                                onClick={() => {
                                    if (!notification.isRead) {
                                        onMarkAsRead(notification.id);
                                    }
                                    if (notification.url) {
                                        router.push(notification.url);
                                    }
                                }}
                                className={clsx(
                                    'group relative cursor-pointer border-b border-border/30 px-6 py-4 transition-all duration-300',
                                    !notification.isRead
                                        ? 'bg-primary/[0.03]'
                                        : 'hover:bg-muted/50',
                                )}
                            >
                                {/* Left Indicator Bar */}
                                <div
                                    className={clsx(
                                        'absolute inset-y-2 left-0 w-1 rounded-r-full transition-colors',
                                        !notification.isRead
                                            ? styles.indicator
                                            : 'bg-transparent group-hover:bg-border',
                                    )}
                                />

                                <div className="flex items-start gap-4">
                                    <div className="min-w-0 flex-1">
                                        <div className="mb-1 flex items-start justify-between gap-3">
                                            <div className="flex items-center gap-2">
                                                {!notification.isRead && (
                                                    <div
                                                        className={clsx(
                                                            'h-1.5 w-1.5 rounded-full',
                                                            styles.dot,
                                                        )}
                                                    />
                                                )}
                                                <h4
                                                    className={clsx(
                                                        'text-sm font-bold tracking-tight',
                                                        !notification.isRead
                                                            ? 'text-foreground'
                                                            : 'text-muted-foreground',
                                                    )}
                                                >
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(notification.id);
                                                }}
                                                className="-m-1 p-1 text-muted-foreground transition-colors hover:text-destructive"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p
                                            className={clsx(
                                                'mb-3 text-xs leading-relaxed',
                                                !notification.isRead
                                                    ? 'text-foreground/70'
                                                    : 'text-muted-foreground/60',
                                            )}
                                        >
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground/40">
                                                {notification.time}
                                            </span>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMarkAsRead(notification.id);
                                                    }}
                                                    className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-widest text-primary transition-colors hover:text-primary/80"
                                                >
                                                    <Check size={12} strokeWidth={3} />
                                                    Прочитано
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={toggleDropdown}
                className={clsx(
                    'group relative rounded-2xl p-2.5 transition-colors duration-300 active:scale-95',
                    'flex h-10 w-10 items-center justify-center',
                    'border shadow-sm',
                    isOpen
                        ? 'border-primary bg-primary text-white shadow-primary/20'
                        : 'border-transparent text-muted-foreground hover:border-border/50 hover:bg-muted hover:text-foreground',
                )}
            >
                <Bell
                    className={clsx(
                        'h-5 w-5 transition-transform duration-300',
                        isOpen ? 'scale-110' : 'group-hover:rotate-12',
                    )}
                />
                {unreadCount > 0 && (
                    <span
                        className={clsx(
                            'absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-background transition-all duration-300',
                            isOpen ? 'bg-white ring-primary' : 'animate-pulse bg-destructive',
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
