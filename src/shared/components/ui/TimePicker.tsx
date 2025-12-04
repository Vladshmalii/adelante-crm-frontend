"use client";

import { Clock, ChevronDown } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface TimePickerProps {
    label?: string;
    value: string;
    onChange: (time: string) => void;
    placeholder?: string;
    min?: string;
    max?: string;
    step?: number;
    error?: string;
}

export function TimePicker({
    label,
    value,
    onChange,
    placeholder = "Оберіть час",
    min,
    max,
    step = 300,
    error,
}: TimePickerProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [hour, minute] = useMemo(() => {
        if (!value || !value.includes(":")) return ["", ""];
        const [h, m] = value.split(":");
        return [h || "", m || ""];
    }, [value]);

    const triggerRef = useRef<HTMLButtonElement | null>(null);
    const [coords, setCoords] = useState({ top: 0, left: 0, width: 0 });

    const hourOptions = useMemo(() => {
        const items: string[] = [];
        const startHour = min ? parseInt(min.split(":")[0]) : 8;
        const endHour = max ? parseInt(max.split(":")[0]) : 21;

        for (let h = startHour; h <= endHour; h++) {
            items.push(h.toString().padStart(2, "0"));
        }
        return items;
    }, [min, max]);

    const minuteOptions = useMemo(() => {
        const stepMinutes = step ? Math.max(1, step / 60) : 15; // step в секундах, по умолчанию 15 хв
        const items: string[] = [];
        for (let m = 0; m < 60; m += stepMinutes) {
            items.push(m.toString().padStart(2, "0"));
        }
        return items;
    }, [step]);

    const formattedValue = useMemo(() => {
        if (!hour && !minute) return "";
        const h = (hour || "00").padStart(2, "0");
        const m = (minute || "00").padStart(2, "0");
        return `${h}:${m}`;
    }, [hour, minute]);

    const openDropdown = () => {
        if (triggerRef.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            // фиксированная, чуть меньшая ширина для компактного дропдауна
            const width = Math.min(rect.width, 260);
            setCoords({
                top: rect.bottom + 4,
                left: rect.left,
                width,
            });
        }
        setIsOpen(true);
    };

    const closeDropdown = () => setIsOpen(false);

    useEffect(() => {
        if (!isOpen) return;

        const handleClickOutside = (event: MouseEvent) => {
            const portal = document.getElementById("timepicker-portal");
            if (
                triggerRef.current &&
                (triggerRef.current === event.target ||
                    triggerRef.current.contains(event.target as Node))
            ) {
                return;
            }
            if (portal && portal.contains(event.target as Node)) {
                return;
            }
            setIsOpen(false);
        };

        const handleResize = () => setIsOpen(false);

        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("resize", handleResize);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("resize", handleResize);
        };
    }, [isOpen]);

    const handleSelectHour = (h: string) => {
        // повторный клик по активному часу сбрасывает на первый в списке
        const isSame = h === hour;
        const newHour = isSame ? (hourOptions[0] || "00") : h;
        const newMinute = minute || "00";
        onChange(`${newHour}:${newMinute}`);
    };

    const handleSelectMinute = (m: string) => {
        // повторный клик по активным хвилинам сбрасывает на первые в списке
        const isSame = m === minute;
        const newMinute = isSame ? (minuteOptions[0] || "00") : m;
        const newHour = hour || hourOptions[0] || "00";
        onChange(`${newHour}:${newMinute}`);
    };

    const dropdown = (
        <div
            id="timepicker-portal"
            className="fixed z-[9999] bg-card border border-border rounded-lg shadow-lg animate-in fade-in zoom-in-95 duration-100"
            style={{ top: coords.top, left: coords.left, width: coords.width }}
        >
            <div className="grid grid-cols-2 divide-x divide-border max-h-64 overflow-y-auto">
                <div className="py-2">
                    <div className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Година
                    </div>
                    {hourOptions.map((h) => {
                        const isActive = h === hour;
                        return (
                            <button
                                key={h}
                                type="button"
                                onClick={() => handleSelectHour(h)}
                                className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                                        : "hover:bg-primary/10 hover:text-primary"
                                }`}
                            >
                                {h}
                            </button>
                        );
                    })}
                </div>
                <div className="py-2">
                    <div className="px-3 pb-1 text-xs font-medium text-muted-foreground uppercase tracking-wide">
                        Хвилини
                    </div>
                    {minuteOptions.map((m) => {
                        const isActive = m === minute;
                        return (
                            <button
                                key={m}
                                type="button"
                                onClick={() => handleSelectMinute(m)}
                                className={`w-full px-3 py-1.5 text-left text-sm transition-colors ${
                                    isActive
                                        ? "bg-primary text-primary-foreground hover:bg-primary/80"
                                        : "hover:bg-primary/10 hover:text-primary"
                                }`}
                            >
                                {m}
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );

    return (
        <div className="space-y-1.5">
            {label && (
                <label className="block text-sm font-medium text-foreground">
                    {label}
                </label>
            )}
            <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <button
                    type="button"
                    ref={triggerRef}
                    onClick={() => (isOpen ? closeDropdown() : openDropdown())}
                    className={`w-full flex items-center justify-between gap-2 pl-9 pr-3 py-2 text-sm bg-background border rounded-lg transition-colors ${
                        error ? "border-destructive" : "border-border hover:border-primary/50"
                    } ${isOpen ? "ring-2 ring-ring border-transparent" : ""}`}
                >
                    <span className={formattedValue ? "text-foreground" : "text-muted-foreground"}>
                        {formattedValue || placeholder}
                    </span>
                    <ChevronDown
                        size={16}
                        className={`text-muted-foreground transition-transform ${
                            isOpen ? "rotate-180" : ""
                        }`}
                    />
                </button>
            </div>
            {error && <p className="text-xs text-destructive mt-0.5">{error}</p>}
            {isOpen && typeof document !== "undefined" && createPortal(dropdown, document.body)}
        </div>
    );
}
