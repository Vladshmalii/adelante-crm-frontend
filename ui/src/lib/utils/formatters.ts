/**
 * Форматує дату в український формат
 */
export function formatDate(date: string | Date, includeTime: boolean = false): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();

    if (includeTime) {
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        return `${day}.${month}.${year} ${hours}:${minutes}`;
    }

    return `${day}.${month}.${year}`;
}

/**
 * Форматує суму в гривні
 */
export function formatCurrency(amount: number): string {
    return `${amount.toLocaleString('uk-UA')} ₴`;
}

/**
 * Форматує номер телефону
 */
export function formatPhone(phone: string): string {
    // Видаляємо всі символи крім цифр
    const cleaned = phone.replace(/\D/g, '');

    // Форматуємо +380 XX XXX XX XX
    if (cleaned.startsWith('380') && cleaned.length === 12) {
        return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 5)} ${cleaned.slice(5, 8)} ${cleaned.slice(8, 10)} ${cleaned.slice(10)}`;
    }

    // Форматуємо 0XX XXX XX XX
    if (cleaned.startsWith('0') && cleaned.length === 10) {
        return `${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 8)} ${cleaned.slice(8)}`;
    }

    return phone;
}

/**
 * Форматує тривалість в години та хвилини
 */
export function formatDuration(minutes: number): string {
    if (minutes < 60) {
        return `${minutes} хв`;
    }

    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;

    if (mins === 0) {
        return `${hours} год`;
    }

    return `${hours} год ${mins} хв`;
}

/**
 * Форматує відсоток
 */
export function formatPercent(value: number): string {
    return `${value}%`;
}

/**
 * Скорочує текст до вказаної довжини
 */
export function truncate(text: string, maxLength: number): string {
    if (text.length <= maxLength) {
        return text;
    }
    return text.slice(0, maxLength) + '...';
}
