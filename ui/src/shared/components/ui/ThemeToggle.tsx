'use client';

import { useState, useEffect } from 'react';
import { Sun, Moon, Monitor } from 'lucide-react';
import { useTheme } from '@/shared/hooks/useTheme';
import clsx from 'clsx';

interface ThemeToggleProps {
    className?: string;
    variant?: 'icon' | 'buttons' | 'dropdown';
}

export function ThemeToggle({ className, variant = 'icon' }: ThemeToggleProps) {
    const { theme, setTheme, isDark } = useTheme();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) {
        return <div className={clsx(variant === 'icon' ? 'h-9 w-9' : 'h-8 w-full', className)} />;
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={() => setTheme(isDark ? 'light' : 'dark')}
                className={clsx(
                    'rounded-lg p-2 transition-colors',
                    'text-muted-foreground hover:bg-accent/50 hover:text-foreground',
                    className,
                )}
                aria-label={isDark ? 'Увімкнути світлу тему' : 'Увімкнути темну тему'}
            >
                {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
            </button>
        );
    }

    if (variant === 'buttons') {
        const options: {
            value: 'light' | 'dark' | 'system';
            icon: React.ReactNode;
            label: string;
        }[] = [
            { value: 'light', icon: <Sun className="h-4 w-4" />, label: 'Світла' },
            { value: 'dark', icon: <Moon className="h-4 w-4" />, label: 'Темна' },
            { value: 'system', icon: <Monitor className="h-4 w-4" />, label: 'Система' },
        ];

        return (
            <div className={clsx('flex gap-1 rounded-lg bg-muted p-1', className)}>
                {options.map((option) => (
                    <button
                        key={option.value}
                        onClick={() => setTheme(option.value)}
                        className={clsx(
                            'flex items-center gap-2 rounded-md px-3 py-1.5 text-sm font-medium transition-all',
                            theme === option.value
                                ? 'bg-card text-foreground shadow-sm'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {option.icon}
                        <span className="hidden sm:inline">{option.label}</span>
                    </button>
                ))}
            </div>
        );
    }

    return null;
}
