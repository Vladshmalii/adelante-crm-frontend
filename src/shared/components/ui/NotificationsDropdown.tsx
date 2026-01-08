"use client";

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

    const unreadCount = notifications.filter(n => !n.isRead).length;

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
                    text: 'text-emerald-500'
                };
            case 'warning':
                return {
                    bg: isRead ? 'bg-amber-500/5' : 'bg-amber-500/10',
                    indicator: 'bg-amber-500',
                    dot: 'bg-amber-500',
                    text: 'text-amber-500'
                };
            case 'error':
                return {
                    bg: isRead ? 'bg-destructive/5' : 'bg-destructive/10',
                    indicator: 'bg-destructive',
                    dot: 'bg-destructive',
                    text: 'text-destructive'
                };
            default:
                return {
                    bg: isRead ? 'bg-primary/5' : 'bg-primary/10',
                    indicator: 'bg-primary',
                    dot: 'bg-primary',
                    text: 'text-primary'
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
        setIsOpen(prev => !prev);
    };

    const dropdownContent = (
        <div
            id="notifications-dropdown-portal"
            className="fixed w-[380px] bg-card/95 backdrop-blur-xl border-2 border-border/40 rounded-3xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.2)] z-[9999] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-300"
            style={{
                top: coords.top,
                left: coords.left,
            }}
        >
            <div className="flex items-center justify-between px-6 py-4 border-b border-border/50 bg-muted/30">
                <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-primary rounded-full" />
                    <h3 className="text-xs font-black uppercase tracking-widest text-foreground font-heading">Сповіщення</h3>
                    {unreadCount > 0 && (
                        <span className="ml-2 px-1.5 py-0.5 rounded-md bg-destructive text-[10px] font-black text-white">
                            {unreadCount}
                        </span>
                    )}
                </div>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-[10px] font-black uppercase tracking-wider text-muted-foreground hover:text-primary transition-colors"
                    >
                        Позначити все
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin">
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
                                    "relative cursor-pointer px-6 py-4 border-b border-border/30 transition-all duration-300 group",
                                    !notification.isRead ? "bg-primary/[0.03]" : "hover:bg-muted/50"
                                )}
                            >
                                {/* Left Indicator Bar */}
                                <div className={clsx(
                                    "absolute left-0 inset-y-2 w-1 transition-colors rounded-r-full",
                                    !notification.isRead ? styles.indicator : "bg-transparent group-hover:bg-border"
                                )} />

                                <div className="flex items-start gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between gap-3 mb-1">
                                            <div className="flex items-center gap-2">
                                                {!notification.isRead && (
                                                    <div className={clsx("w-1.5 h-1.5 rounded-full", styles.dot)} />
                                                )}
                                                <h4 className={clsx(
                                                    "text-sm tracking-tight font-bold",
                                                    !notification.isRead ? "text-foreground" : "text-muted-foreground"
                                                )}>
                                                    {notification.title}
                                                </h4>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onDelete(notification.id);
                                                }}
                                                className="text-muted-foreground hover:text-destructive transition-colors p-1 -m-1"
                                            >
                                                <X size={14} />
                                            </button>
                                        </div>
                                        <p className={clsx(
                                            "text-xs leading-relaxed mb-3",
                                            !notification.isRead ? "text-foreground/70" : "text-muted-foreground/60"
                                        )}>
                                            {notification.message}
                                        </p>
                                        <div className="flex items-center justify-between">
                                            <span className="text-[10px] font-bold text-muted-foreground/40 uppercase tracking-wider">
                                                {notification.time}
                                            </span>
                                            {!notification.isRead && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        onMarkAsRead(notification.id);
                                                    }}
                                                    className="text-[10px] font-black uppercase tracking-widest text-primary hover:text-primary/80 transition-colors flex items-center gap-1.5"
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
                    "relative p-2.5 rounded-2xl transition-colors duration-300 active:scale-95 group",
                    "w-10 h-10 flex items-center justify-center",
                    "border shadow-sm",
                    isOpen
                        ? "bg-primary text-white border-primary shadow-primary/20"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground border-transparent hover:border-border/50"
                )}
            >
                <Bell className={clsx("w-5 h-5 transition-transform duration-300", isOpen ? "scale-110" : "group-hover:rotate-12")} />
                {unreadCount > 0 && (
                    <span className={clsx(
                        "absolute top-1.5 right-1.5 w-2.5 h-2.5 rounded-full ring-2 ring-background transition-all duration-300",
                        isOpen ? "bg-white ring-primary" : "bg-destructive animate-pulse"
                    )} />
                )}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
