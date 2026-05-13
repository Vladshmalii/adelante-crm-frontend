'use client';

import { useState } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { ChartCard } from './ChartCard';
import clsx from 'clsx';

interface DonutChartItem {
    name: string;
    value: number;
    percent?: number;
    color?: string;
    subLabel?: string;
}

interface DonutChartProps {
    title: string;
    subtitle?: string;
    data: DonutChartItem[];
    totalLabel?: string;
    totalValue?: string | number;
    className?: string;
    valuePrefix?: string;
    valueSuffix?: string;
}

const DEFAULT_COLORS = [
    'hsl(var(--primary))',
    'hsl(var(--accent))',
    'hsl(176 73% 60%)',
    'hsl(24 95% 70%)',
    'hsl(280 65% 60%)',
    'hsl(340 75% 60%)',
];

export function DonutChart({
    title,
    subtitle,
    data,
    totalLabel = 'Всього',
    totalValue,
    className,
    valuePrefix = '',
    valueSuffix = '',
}: DonutChartProps) {
    const [activeIndex, setActiveIndex] = useState<number | null>(null);
    const computedTotal = totalValue ?? data.reduce((sum, item) => sum + item.value, 0);

    const activeItem = activeIndex !== null ? data[activeIndex] : null;

    return (
        <ChartCard title={title} className={className}>
            {subtitle && (
                <p className="text-sm text-muted-foreground mb-4 -mt-2">{subtitle}</p>
            )}

            <div className="flex flex-col h-full overflow-hidden">
                <div className="relative h-[220px] w-full mb-6 mt-2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={data}
                                cx="50%"
                                cy="50%"
                                innerRadius={70}
                                outerRadius={95}
                                paddingAngle={5}
                                dataKey="value"
                                stroke="none"
                                onMouseEnter={(_, index) => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                            >
                                {data.map((entry, index) => (
                                    <Cell 
                                        key={`cell-${index}`} 
                                        fill={entry.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length]} 
                                        className="hover:opacity-80 transition-opacity duration-300 outline-none cursor-pointer"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>
                    
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none transition-all duration-300">
                        {!activeItem ? (
                            <div className="flex flex-col items-center animate-in fade-in duration-300">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">{totalLabel}</span>
                                <div className="text-2xl font-black text-foreground">
                                    {valuePrefix}
                                    {typeof computedTotal === 'number' 
                                        ? computedTotal.toLocaleString() 
                                        : computedTotal}
                                    {typeof computedTotal === 'number' ? valueSuffix : ''}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center animate-in fade-in zoom-in-95 duration-300">
                                <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60 truncate max-w-[120px] text-center mb-1">
                                    {activeItem.name}
                                </span>
                                <div className="text-2xl font-black text-foreground">
                                    {valuePrefix}{activeItem.value.toLocaleString()}{valueSuffix}
                                </div>
                                {activeItem.percent !== undefined && (
                                    <div className="text-[10px] font-bold text-primary mt-1 bg-primary/10 px-2 py-0.5 rounded-full">
                                        {activeItem.percent}%
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-2 overflow-y-auto pr-2 scrollbar-thin">
                    {data.map((item, index) => {
                        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                        const isActive = activeIndex === index;
                        return (
                            <div 
                                key={item.name} 
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                className={clsx(
                                    "group flex items-center justify-between p-3 rounded-2xl border transition-all duration-300 cursor-default",
                                    isActive 
                                        ? "bg-muted/50 border-border translate-x-1" 
                                        : "bg-muted/20 border-transparent hover:border-border hover:bg-muted/40"
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="w-1.5 h-6 rounded-full transition-transform group-hover:scale-y-110 duration-300"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div>
                                        <div className="text-xs font-black text-foreground/80">{item.name}</div>
                                        {(item.subLabel || item.percent !== undefined) && (
                                            <div className="text-[10px] font-bold text-muted-foreground/60 uppercase">
                                                {item.subLabel || `${item.percent}%`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-foreground">
                                        {valuePrefix}{item.value.toLocaleString()}{valueSuffix}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </ChartCard>
    );
}
