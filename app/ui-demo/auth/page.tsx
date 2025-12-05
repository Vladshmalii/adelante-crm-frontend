'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';
import { ExternalLink } from 'lucide-react';

export default function AuthDemo() {
    const [activePage, setActivePage] = useState<'login' | 'forgot'>('login');

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-3xl font-bold text-foreground font-heading">Демо авторизації</h1>
                <div className="flex gap-2">
                    <Button variant="ghost" onClick={() => window.open(activePage === 'login' ? '/login' : '/forgot-password', '_blank')}>
                        Відкрити в новій вкладці <ExternalLink className="ml-2 w-4 h-4" />
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

            <div className="border border-border rounded-xl overflow-hidden shadow-2xl bg-background h-[850px] relative">
                <iframe
                    src={activePage === 'login' ? '/login' : '/forgot-password'}
                    className="w-full h-full"
                    title="Auth Demo"
                />
            </div>

            <div className="text-sm text-muted-foreground text-center">
                * Відображаються реальні сторінки програми через iframe
            </div>
        </div>
    );
}
