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
                <h2 className="mb-2 text-xl font-semibold text-foreground">Ваші контактні дані</h2>
                <p className="text-muted-foreground">Вкажіть ваші дані для підтвердження запису</p>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Ім&apos;я та прізвище *
                    </label>
                    <input
                        type="text"
                        value={data.clientName || ''}
                        onChange={(e) => onUpdate({ clientName: e.target.value })}
                        placeholder="Іван Петренко"
                        className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Телефон *
                    </label>
                    <input
                        type="tel"
                        value={data.clientPhone || ''}
                        onChange={(e) => onUpdate({ clientPhone: e.target.value })}
                        placeholder="+380 XX XXX XX XX"
                        className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                        required
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Email (опціонально)
                    </label>
                    <input
                        type="email"
                        value={data.clientEmail || ''}
                        onChange={(e) => onUpdate({ clientEmail: e.target.value })}
                        placeholder="email@example.com"
                        className="w-full rounded-xl border border-input-border bg-input px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>

                <div>
                    <label className="mb-2 block text-sm font-medium text-foreground">
                        Коментар (опціонально)
                    </label>
                    <textarea
                        value={data.comment || ''}
                        onChange={(e) => onUpdate({ comment: e.target.value })}
                        placeholder="Додаткові побажання..."
                        rows={3}
                        className="w-full resize-none rounded-xl border border-input-border bg-input px-4 py-3 text-foreground transition-all placeholder:text-muted-foreground focus:border-transparent focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                </div>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                <p className="text-sm text-muted-foreground">
                    Після підтвердження запису ви отримаєте SMS з деталями візиту
                </p>
            </div>
        </div>
    );
}
