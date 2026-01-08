'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Send } from 'lucide-react';
import { Input } from '@/shared/components/ui/Input';
import { Button } from '@/shared/components/ui/Button';
import { useToast } from '@/shared/hooks/useToast';
import { useAuth } from '@/shared/hooks/useAuth';
import { USE_MOCK_DATA } from '@/lib/config';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
    const [loading, setLoading] = useState(false);
    const toast = useToast();
    const router = useRouter();
    const { login } = useAuth();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const newErrors: { email?: string; password?: string } = {};

        if (!email) {
            newErrors.email = 'Введіть email';
        }

        if (!password) {
            newErrors.password = 'Введіть пароль';
        }

        setErrors(newErrors);

        if (Object.keys(newErrors).length > 0) {
            toast.error('Заповніть всі обовʼязкові поля');
            return;
        }

        try {
            setLoading(true);
            await login(email, password);
            toast.success('Вхід виконано успішно');
            router.push('/calendar');
        } catch (err) {
            console.error(err);
            const msg = err instanceof Error ? err.message : 'Не вдалося увійти';
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-accent/20 flex items-center justify-center px-4 py-8" suppressHydrationWarning>
            <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-[1.1fr,1fr] bg-card border border-border rounded-3xl shadow-2xl shadow-black/10 overflow-hidden" suppressHydrationWarning>
                <div className="hidden lg:flex flex-col justify-between bg-gradient-to-br from-primary to-primary/80 text-primary-foreground p-8 relative" suppressHydrationWarning>
                    <div className="absolute inset-0 opacity-20 pointer-events-none" style={{
                        backgroundImage:
                            'radial-gradient(circle at 0 0, rgba(255,255,255,0.35) 0, transparent 55%), radial-gradient(circle at 100% 100%, rgba(255,255,255,0.3) 0, transparent 55%)',
                    }} suppressHydrationWarning />
                    <div className="relative space-y-4">
                        <h1 className="text-3xl font-extrabold tracking-tight font-heading">
                            Adelante CRM
                        </h1>
                        <p className="text-sm text-primary-foreground/90 max-w-sm">
                            Єдина панель керування салоном: календар записів, база клієнтів, фінанси та склад в одному інтерфейсі.
                        </p>
                    </div>
                    <div className="relative mt-8 space-y-3 text-sm">
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_0_6px_rgba(16,185,129,0.35)]" />
                            <span className="font-medium">Онлайн-запис 24/7</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-sky-300 shadow-[0_0_0_6px_rgba(125,211,252,0.35)]" />
                            <span className="font-medium">Контроль завантаженості майстрів</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <span className="w-2 h-2 rounded-full bg-amber-300 shadow-[0_0_0_6px_rgba(252,211,77,0.35)]" />
                            <span className="font-medium">Звітність та аналітика в один клік</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center justify-center p-6 sm:p-10">
                    <div className="w-full max-w-sm space-y-6">
                        <div className="space-y-2 text-center lg:text-left">
                            <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground">Панель керування салоном</p>
                            <h2 className="text-2xl sm:text-3xl font-bold text-foreground font-heading tracking-tight">
                                Вхід в систему
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                Увійдіть, щоб працювати з записами, клієнтами та фінансами салону.
                            </p>
                        </div>

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

                            <Input
                                label="Пароль"
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="Введіть пароль"
                                error={errors.password}
                            />

                            <div className="flex items-center justify-between text-sm">
                                <a href="/setup" className="text-muted-foreground hover:text-foreground font-medium">
                                    Перший вхід?
                                </a>
                                <a href="/forgot-password" className="text-primary hover:text-primary/80 font-medium">
                                    Забули пароль?
                                </a>
                            </div>

                            <Button type="submit" variant="primary" size="md" fullWidth disabled={loading}>
                                Увійти
                            </Button>
                        </form>

                        <div className="relative pt-4">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="h-px flex-1 bg-border" />
                                <span className="text-xs uppercase tracking-[0.2em] text-muted-foreground">
                                    або увійти через
                                </span>
                                <div className="h-px flex-1 bg-border" />
                            </div>

                            <Button
                                type="button"
                                variant="secondary"
                                size="md"
                                fullWidth
                                className="flex items-center justify-center gap-2 bg-[#229ED9]/5 border-[#229ED9]/40 text-[#229ED9] hover:bg-[#229ED9]/10 hover:border-[#229ED9]/60"
                                onClick={() => {
                                    // TODO: інтеграція з Telegram ботом (deep link/redirect)
                                    console.log('Login with Telegram');
                                }}
                           >
                                <Send className="w-4 h-4" />
                                <span className="font-medium">Увійти через Telegram</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
