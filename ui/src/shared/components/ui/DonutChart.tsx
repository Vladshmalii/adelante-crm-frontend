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
            {subtitle && <p className="-mt-2 mb-4 text-sm text-muted-foreground">{subtitle}</p>}

            <div className="flex h-full flex-col overflow-hidden">
                <div className="relative mb-6 mt-2 h-[220px] w-full">
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
                                        fill={
                                            entry.color ||
                                            DEFAULT_COLORS[index % DEFAULT_COLORS.length]
                                        }
                                        className="cursor-pointer outline-none transition-opacity duration-300 hover:opacity-80"
                                    />
                                ))}
                            </Pie>
                        </PieChart>
                    </ResponsiveContainer>

                    <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center transition-all duration-300">
                        {!activeItem ? (
                            <div className="animate-in fade-in flex flex-col items-center duration-300">
                                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/50">
                                    {totalLabel}
                                </span>
                                <div className="text-2xl font-black text-foreground">
                                    {valuePrefix}
                                    {typeof computedTotal === 'number'
                                        ? computedTotal.toLocaleString()
                                        : computedTotal}
                                    {typeof computedTotal === 'number' ? valueSuffix : ''}
                                </div>
                            </div>
                        ) : (
                            <div className="animate-in fade-in zoom-in-95 flex flex-col items-center duration-300">
                                <span className="mb-1 max-w-[120px] truncate text-center text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground/60">
                                    {activeItem.name}
                                </span>
                                <div className="text-2xl font-black text-foreground">
                                    {valuePrefix}
                                    {activeItem.value.toLocaleString()}
                                    {valueSuffix}
                                </div>
                                {activeItem.percent !== undefined && (
                                    <div className="mt-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                                        {activeItem.percent}%
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="scrollbar-thin space-y-2 overflow-y-auto pr-2">
                    {data.map((item, index) => {
                        const color = item.color || DEFAULT_COLORS[index % DEFAULT_COLORS.length];
                        const isActive = activeIndex === index;
                        return (
                            <div
                                key={item.name}
                                onMouseEnter={() => setActiveIndex(index)}
                                onMouseLeave={() => setActiveIndex(null)}
                                className={clsx(
                                    'group flex cursor-default items-center justify-between rounded-2xl border p-3 transition-all duration-300',
                                    isActive
                                        ? 'translate-x-1 border-border bg-muted/50'
                                        : 'border-transparent bg-muted/20 hover:border-border hover:bg-muted/40',
                                )}
                            >
                                <div className="flex items-center gap-3">
                                    <div
                                        className="h-6 w-1.5 rounded-full transition-transform duration-300 group-hover:scale-y-110"
                                        style={{ backgroundColor: color }}
                                    />
                                    <div>
                                        <div className="text-xs font-black text-foreground/80">
                                            {item.name}
                                        </div>
                                        {(item.subLabel || item.percent !== undefined) && (
                                            <div className="text-[10px] font-bold uppercase text-muted-foreground/60">
                                                {item.subLabel || `${item.percent}%`}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-sm font-black text-foreground">
                                        {valuePrefix}
                                        {item.value.toLocaleString()}
                                        {valueSuffix}
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
