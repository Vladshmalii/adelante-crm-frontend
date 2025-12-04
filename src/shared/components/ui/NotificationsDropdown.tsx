"use client";

import { Bell, Check, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

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

    const getTypeColor = (type: Notification['type']) => {
        switch (type) {
            case 'success':
                return 'bg-green-500/10 text-green-600';
            case 'warning':
                return 'bg-yellow-500/10 text-yellow-600';
            case 'error':
                return 'bg-red-500/10 text-red-600';
            default:
                return 'bg-blue-500/10 text-blue-600';
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
            className="fixed w-96 bg-card border border-border rounded-lg shadow-lg z-[9999] overflow-hidden animate-in fade-in zoom-in-95 duration-100"
            style={{
                top: coords.top,
                left: coords.left,
            }}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                <h3 className="text-sm font-semibold text-foreground">Сповіщення</h3>
                {unreadCount > 0 && (
                    <button
                        onClick={onMarkAllAsRead}
                        className="text-xs text-primary hover:text-primary/80 transition-colors"
                    >
                        Позначити все як прочитане
                    </button>
                )}
            </div>

            <div className="max-h-96 overflow-y-auto scrollbar-thin">
                {notifications.length === 0 ? (
                    <div className="px-4 py-8 text-center text-sm text-muted-foreground">
                        Немає сповіщень
                    </div>
                ) : (
                    notifications.map((notification) => (
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
                            className={`cursor-pointer px-4 py-3 border-b border-border last:border-b-0 hover:bg-primary/10 hover:text-primary transition-colors ${!notification.isRead ? 'bg-primary/5' : ''
                                }`}
                        >
                            <div className="flex items-start gap-3">
                                <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${getTypeColor(notification.type)}`} />
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-start justify-between gap-2">
                                        <h4 className="text-sm font-medium text-foreground">
                                            {notification.title}
                                        </h4>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDelete(notification.id);
                                            }}
                                            className="text-muted-foreground hover:text-foreground transition-colors flex-shrink-0"
                                        >
                                            <X size={14} />
                                        </button>
                                    </div>
                                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                        {notification.message}
                                    </p>
                                    <div className="flex items-center justify-between mt-2">
                                        <span className="text-xs text-muted-foreground">
                                            {notification.time}
                                        </span>
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onMarkAsRead(notification.id);
                                                }}
                                                className="text-xs text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                                            >
                                                <Check size={12} />
                                                Прочитано
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );

    return (
        <div ref={dropdownRef} className="relative">
            <button
                onClick={toggleDropdown}
                className="relative p-1.5 sm:p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-all active:scale-95"
            >
                <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 sm:top-1.5 sm:right-1.5 w-2 h-2 bg-destructive rounded-full ring-2 ring-background animate-pulse" />
                )}
            </button>

            {isOpen && typeof document !== 'undefined' && createPortal(dropdownContent, document.body)}
        </div>
    );
}
