'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';

export default function ResetPasswordPage() {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [errors, setErrors] = useState<{ password?: string; confirmPassword?: string }>({});
    const [submitted, setSubmitted] = useState(false);
    const toast = useToast();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { password?: string; confirmPassword?: string } = {};

        if (!password) {
            newErrors.password = 'Введіть новий пароль';
        } else if (password.length < 8) {
            newErrors.password = 'Пароль має містити не менше 8 символів';
        }

        if (!confirmPassword) {
            newErrors.confirmPassword = 'Підтвердіть пароль';
        } else if (password !== confirmPassword) {
            newErrors.confirmPassword = 'Паролі не співпадають';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Перевірте коректність пароля');
            return;
        }

        toast.success('Пароль успішно змінено');
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
                            Встановіть новий пароль для доступу до панелі керування салоном.
                        </p>
                    </div>
                    <div className="relative mt-8 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.35)]" />
                            <span className="font-medium">Надійний захист вашого акаунта</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.35)]" />
                            <span className="font-medium">Пароль зберігається в зашифрованому вигляді</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Скидання пароля</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
                                Новий пароль
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Введіть новий пароль та підтвердження. Після збереження ви зможете увійти з новим паролем.
                            </p>
                        </div>

                        {submitted ? (
                            <div className="space-y-3 rounded-lg border border-emerald-500/40 bg-emerald-500/5 px-4 py-3 text-sm">
                                <p className="font-medium text-foreground">Пароль успішно змінено</p>
                                <p className="text-muted-foreground">
                                    Тепер ви можете увійти в систему, використовуючи новий пароль.
                                </p>
                                <a href="/login" className="text-primary hover:text-primary/80 font-medium text-sm">
                                    Перейти до входу
                                </a>
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <Input
                                    label="Новий пароль"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="Введіть новий пароль"
                                    error={errors.password}
                                />

                                <Input
                                    label="Підтвердження пароля"
                                    type="password"
                                    value={confirmPassword}
                                    onChange={(e) => setConfirmPassword(e.target.value)}
                                    required
                                    placeholder="Повторіть пароль"
                                    error={errors.confirmPassword}
                                />

                                <Button type="submit" variant="primary" size="md" fullWidth>
                                    Зберегти новий пароль
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
