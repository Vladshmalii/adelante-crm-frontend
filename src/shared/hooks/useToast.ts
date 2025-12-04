"use client";

import { useToastContext } from '../providers/ToastProvider';

export function useToast() {
    const ctx = useToastContext();
    return ctx;
}
