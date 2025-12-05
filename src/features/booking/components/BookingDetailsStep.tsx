'use client';

import type { BookingFormData } from '../types';

interface BookingDetailsStepProps {
    data: Partial<BookingFormData>;
    onUpdate: (data: Partial<BookingFormData>) => void;
}

export function BookingDetailsStep({ data, onUpdate }: BookingDetailsStepProps) {
    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-xl font-semibold text-foreground mb-2">
                    Ваші контактні дані
                </h2>
                <p className="text-muted-foreground">
                    Вкажіть ваші дані для підтвердження запису
                </p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Ім&apos;я та прізвище *
                    </label>
                    <input
                        type="text"
                        value={data.clientName || ''}
                        onChange={(e) => onUpdate({ clientName: e.target.value })}
                        placeholder="Іван Петренко"
                        className="w-full px-4 py-3 rounded-xl border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Телефон *
                    </label>
                    <input
                        type="tel"
                        value={data.clientPhone || ''}
                        onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                        placeholder="+380 XX XXX XX XX"
                        className="w-full px-4 py-3 rounded-xl border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        required
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Email (опціонально)
                    </label>
                    <input
                        type="email"
                        value={data.clientEmail || ''}
                        onChange={(e) => onUpdate({ clientEmail: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full px-4 py-3 rounded-xl border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                        Коментар (опціонально)
                    </label>
                    <textarea
                        value={data.comment || ''}
                        onChange={(e) => onUpdate({ comment: e.target.value })}
                        placeholder="Додаткові побажання..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-input-border bg-input text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                    />
                </div>
            </div>

            <div className="p-4 bg-primary/5 rounded-xl border border-primary/20">
                <p className="text-sm text-muted-foreground">
                    Після підтвердження запису ви отримаєте SMS з деталями візиту
                </p>
            </div>
        </div>
    );
}
