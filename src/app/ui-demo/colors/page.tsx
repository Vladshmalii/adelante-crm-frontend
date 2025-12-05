'use client';

import { useEffect, useRef, useState } from 'react';

function rgbToHex(rgb: string) {
    if (!rgb || rgb === 'rgba(0, 0, 0, 0)') return '';
    const values = rgb.match(/\d+/g);
    if (!values || values.length < 3) return rgb;

    const r = parseInt(values[0]);
    const g = parseInt(values[1]);
    const b = parseInt(values[2]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
}

function ColorSwatch({ name, className, textClassName = "text-white" }: { name: string, className: string, textClassName?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [hex, setHex] = useState('');

    useEffect(() => {
        if (ref.current) {
            const rgb = window.getComputedStyle(ref.current).backgroundColor;
            setHex(rgbToHex(rgb));
        }
    }, []);

    return (
        <div className="flex flex-col gap-2">
            <div
                ref={ref}
                className={`h-24 w-full rounded-lg shadow-sm flex flex-col items-center justify-center ${className}`}
            >
                <span className={`font-mono text-sm font-medium ${textClassName}`}>
                    {name}
                </span>
                <span className={`text-xs mt-1 opacity-80 ${textClassName}`}>
                    {hex}
                </span>
            </div>
            <span className="text-xs text-muted-foreground text-center">{name.replace('bg-', '')}</span>
        </div>
    );
}

export default function ColorsDemo() {
    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            <h1 className="text-3xl font-bold text-foreground font-heading">Color Palette</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Main Colors</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ColorSwatch name="bg-primary" className="bg-primary" />
                    <ColorSwatch name="bg-primary-hover" className="bg-primary-hover" />
                    <ColorSwatch name="bg-primary-foreground" className="bg-primary-foreground" textClassName="text-primary" />
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Secondary / Accent</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ColorSwatch name="bg-secondary" className="bg-secondary" textClassName="text-secondary-foreground" />
                    <ColorSwatch name="bg-secondary-hover" className="bg-secondary-hover" textClassName="text-secondary-foreground" />
                    <ColorSwatch name="bg-secondary-foreground" className="bg-secondary-foreground" textClassName="text-secondary" />
                    <ColorSwatch name="bg-accent" className="bg-accent" textClassName="text-accent-foreground" />
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Destructive (Error)</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ColorSwatch name="bg-destructive" className="bg-destructive" />
                    <ColorSwatch name="bg-destructive-hover" className="bg-destructive-hover" />
                    <ColorSwatch name="bg-destructive-foreground" className="bg-destructive-foreground" textClassName="text-destructive" />
                </div>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Base & Structure</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <ColorSwatch name="bg-background" className="bg-background" textClassName="text-foreground border border-border" />
                    <ColorSwatch name="bg-foreground" className="bg-foreground" textClassName="text-background" />
                    <ColorSwatch name="bg-card" className="bg-card" textClassName="text-card-foreground border border-border" />
                    <ColorSwatch name="bg-card-foreground" className="bg-card-foreground" textClassName="text-card" />
                    <ColorSwatch name="bg-muted" className="bg-muted" textClassName="text-muted-foreground" />
                    <ColorSwatch name="bg-muted-foreground" className="bg-muted-foreground" textClassName="text-muted" />
                    <ColorSwatch name="bg-border" className="bg-border" textClassName="text-foreground" />
                    <ColorSwatch name="bg-input" className="bg-input" textClassName="text-foreground" />
                </div>
            </section>
        </div>
    );
}
