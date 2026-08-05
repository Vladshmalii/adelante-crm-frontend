'use client';

import { Minus, Plus } from 'lucide-react';
import clsx from 'clsx';

interface NumberInputProps {
    label?: string;
    value: number;
    onChange: (value: number) => void;
    min?: number;
    max?: number;
    step?: number;
    placeholder?: string;
    className?: string;
    required?: boolean;
}

export function NumberInput({
    label,
    value,
    onChange,
    min = 0,
    max,
    step = 1,
    placeholder,
    className,
    required,
}: NumberInputProps) {
    const handleDecrement = () => {
        const newValue = Math.max(min, (value || 0) - step);
        onChange(newValue);
    };

    const handleIncrement = () => {
        const newValue = (value || 0) + step;
        if (max !== undefined && newValue > max) return;
        onChange(newValue);
    };

    return (
        <div className={clsx('w-full', className)}>
            {label && (
                <label className="mb-1.5 ml-1 block text-[11px] font-black uppercase tracking-widest text-muted-foreground">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <div className="flex h-[42px] items-center rounded-xl border border-border/50 bg-background p-1 shadow-sm transition-all focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/20">
                <button
                    type="button"
                    onClick={handleDecrement}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-primary active:scale-90"
                >
                    <Minus size={14} strokeWidth={3} />
                </button>
                <input
                    type="number"
                    step={step}
                    value={value}
                    onChange={(e) => onChange(Number(e.target.value))}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-center text-sm font-black text-foreground [appearance:textfield] focus:outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                />
                <button
                    type="button"
                    onClick={handleIncrement}
                    className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground/60 transition-all hover:bg-muted/50 hover:text-primary active:scale-90"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
