/**
 * Валідує email адресу
 */
export function validateEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

/**
 * Валідує український номер телефону
 */
export function validatePhone(phone: string): boolean {
    const cleaned = phone.replace(/\D/g, '');

    // Перевіряємо формат +380XXXXXXXXX або 0XXXXXXXXX
    return (
        (cleaned.startsWith('380') && cleaned.length === 12) ||
        (cleaned.startsWith('0') && cleaned.length === 10)
    );
}

/**
 * Валідує, чи є значення порожнім
 */
export function validateRequired(value: string | number | null | undefined): boolean {
    if (value === null || value === undefined) {
        return false;
    }

    if (typeof value === 'string') {
        return value.trim().length > 0;
    }

    return true;
}

/**
 * Валідує мінімальну довжину
 */
export function validateMinLength(value: string, minLength: number): boolean {
    return value.length >= minLength;
}

/**
 * Валідує максимальну довжину
 */
export function validateMaxLength(value: string, maxLength: number): boolean {
    return value.length <= maxLength;
}

/**
 * Валідує діапазон чисел
 */
export function validateRange(value: number, min: number, max: number): boolean {
    return value >= min && value <= max;
}

/**
 * Валідує URL
 */
export function validateUrl(url: string): boolean {
    try {
        new URL(url);
        return true;
    } catch {
        return false;
    }
}
