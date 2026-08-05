'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';
import { ExternalLink } from 'lucide-react';

export default function AuthDemo() {
    const [activePage, setActivePage] = useState<'login' | 'forgot'>('login');

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold text-foreground">
                    Демо авторизації
                </h1>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() =>
                            window.open(
                                activePage === 'login' ? '/login' : '/forgot-password',
                                '_blank',
                            )
                        }
                    >
                        Відкрити в новій вкладці <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <ButtonGroup>
                        <Button
                            onClick={() => setActivePage('login')}
                            variant={activePage === 'login' ? 'primary' : 'secondary'}
                        >
                            Вхід
                        </Button>
                        <Button
                            onClick={() => setActivePage('forgot')}
                            variant={activePage === 'forgot' ? 'primary' : 'secondary'}
                        >
                            Відновлення паролю
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            <div className="relative h-[850px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                <iframe
                    src={activePage === 'login' ? '/login' : '/forgot-password'}
                    className="h-full w-full"
                    title="Auth Demo"
                />
            </div>

            <div className="text-center text-sm text-muted-foreground">
                * Відображаються реальні сторінки програми через iframe
            </div>
        </div>
    );
}
