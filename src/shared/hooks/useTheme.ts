'use client';

import { useEffect, useState } from 'react';

type Theme = 'light' | 'dark' | 'system';

// Функция для получения начальной темы синхронно
function getInitialTheme(): Theme {
    if (typeof window === 'undefined') return 'light';
    
    try {
        const stored = localStorage.getItem('theme') as Theme | null;
        return stored || 'system';
    } catch {
        return 'system';
    }
}

// Функция для определения эффективной темы
function resolveTheme(theme: Theme): 'light' | 'dark' {
    if (theme === 'system') {
        if (typeof window === 'undefined') return 'light';
        return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return theme;
}

export function useTheme() {
    const [theme, setThemeState] = useState<Theme>(getInitialTheme);
    const [resolvedTheme, setResolvedTheme] = useState<'light' | 'dark'>(() => resolveTheme(getInitialTheme()));

    useEffect(() => {
        const root = document.documentElement;

        let effectiveTheme: 'light' | 'dark' = 'light';

        if (theme === 'system') {
            effectiveTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        } else {
            effectiveTheme = theme;
        }

        setResolvedTheme(effectiveTheme);

        if (effectiveTheme === 'dark') {
            root.classList.add('dark');
        } else {
            root.classList.remove('dark');
        }
    }, [theme]);

    useEffect(() => {
        if (theme !== 'system') return;

        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

        const handleChange = (e: MediaQueryListEvent) => {
            const effectiveTheme = e.matches ? 'dark' : 'light';
            setResolvedTheme(effectiveTheme);

            if (effectiveTheme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        mediaQuery.addEventListener('change', handleChange);
        return () => mediaQuery.removeEventListener('change', handleChange);
    }, [theme]);

    const setTheme = (newTheme: Theme) => {
        setThemeState(newTheme);
        localStorage.setItem('theme', newTheme);
    };

    return {
        theme,
        resolvedTheme,
        setTheme,
        isDark: resolvedTheme === 'dark',
    };
}
