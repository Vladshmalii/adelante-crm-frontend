'use client';

import { useEffect, useState } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';

interface NavigationProgressProps {
    color?: string;
    height?: number;
}

export function NavigationProgress({ color, height = 3 }: NavigationProgressProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const [loading, setLoading] = useState(false);
    const [progress, setProgress] = useState(0);

    useEffect(() => {
        setLoading(true);
        setProgress(30);

        const timer1 = setTimeout(() => setProgress(60), 100);
        const timer2 = setTimeout(() => setProgress(80), 200);
        const timer3 = setTimeout(() => {
            setProgress(100);
            setTimeout(() => setLoading(false), 200);
        }, 300);

        return () => {
            clearTimeout(timer1);
            clearTimeout(timer2);
            clearTimeout(timer3);
        };
    }, [pathname, searchParams]);

    if (!loading) return null;

    return (
        <div
            className="fixed top-0 left-0 right-0 z-[9999]"
            style={{ height }}
        >
            <div
                className="h-full transition-all duration-300 ease-out bg-primary"
                style={{
                    width: `${progress}%`,
                    backgroundColor: color,
                    boxShadow: '0 0 10px hsl(var(--primary)), 0 0 5px hsl(var(--primary))',
                }}
            />
        </div>
    );
}
