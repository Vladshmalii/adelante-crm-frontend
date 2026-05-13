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
    required
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
        <div className={clsx("w-full", className)}>
            {label && (
                <label className="block text-[11px] font-black text-muted-foreground uppercase tracking-widest mb-1.5 ml-1">
                    {label} {required && <span className="text-destructive">*</span>}
                </label>
            )}
            <div className="flex items-center bg-background border border-border/50 rounded-xl p-1 h-[42px] focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary transition-all shadow-sm">
                <button 
                    type="button" 
                    onClick={handleDecrement}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground/60 hover:text-primary transition-all active:scale-90"
                >
                    <Minus size={14} strokeWidth={3} />
                </button>
                <input 
                    type="number" 
                    step={step} 
                    value={value} 
                    onChange={(e) => onChange(Number(e.target.value))}
                    placeholder={placeholder}
                    className="flex-1 bg-transparent text-center font-black text-sm text-foreground focus:outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <button 
                    type="button" 
                    onClick={handleIncrement}
                    className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted/50 text-muted-foreground/60 hover:text-primary transition-all active:scale-90"
                >
                    <Plus size={14} strokeWidth={3} />
                </button>
            </div>
        </div>
    );
}
