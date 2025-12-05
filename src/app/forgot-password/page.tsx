'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('');
    const [errors, setErrors] = useState<{ email?: string }>({});
    const [submitted, setSubmitted] = useState(false);
    const toast = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { email?: string } = {};

        if (!email) {
            newErrors.email = 'Введіть email';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Введіть email для відновлення пароля');
            return;
        }

        toast.success('Посилання для відновлення пароля надіслано');
        setSubmitted(true);
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] bg-card border border-border rounded-3xl shadow-2xl shadow-black/10 overflow-hidden">
                <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 relative">
                    <div
                        className="absolute inset-0 opacity-20 pointer-events-none"
                        style={{
                            backgroundImage:
                                'radial-gradient(circle at 0 0, rgba(255,255,255,0.35) 0, transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3) 0, transparent 55%)',
                        }}
                    />
                    <div className="relative space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight font-heading">Adelante CRM</h1>
                        <p className="text-sm text-primary-foreground/90 max-w-sm">
                            Відновіть доступ до панелі керування салоном. Посилання для скидання пароля буде надіслано на вашу пошту.
                        </p>
                    </div>
                    <div className="relative mt-8 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.35)]" />
                            <span className="font-medium">Безпечно відновлення доступу</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.35)]" />
                            <span className="font-medium">Посилання діє обмежений час</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Відновлення доступу</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
                                Забули пароль?
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Введіть email, з яким ви входите в систему. Ми надішлемо інструкцію для скидання пароля.
                            </p>
                        </div>

                        {submitted ? (
                            <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm">
                                <p className="font-medium text-foreground">Посилання на скидання пароля надіслано</p>
                                <p className="text-muted-foreground">
                                    Якщо лист не з&apos;явився протягом декількох хвилин, перевірте папку &quot;Спам&quot; або спробуйте ще раз.
                                </p>
                                <a href="/login" className="text-primary hover:text-primary/80 font-medium text-sm">
                                    Повернутися до входу
                                </a>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="you@example.com"
                                    error={errors.email}
                                />

                                <Button type="submit" variant="primary" size="md" fullWidth>
                                    Надіслати посилання
                                </Button>

                                <div className="flex items-center justify-center text-sm">
                                    <a href="/login" className="text-muted-foreground hover:text-foreground">
                                        Повернутися до сторінки входу
                                    </a>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
