'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { ButtonGroup } from '@/shared/components/ui/ButtonGroup';
import { ExternalLink } from 'lucide-react';

export default function ErrorsDemo() {
    const [activePage, setActivePage] = useState<'404' | '500'>('404');

    // Для 500 використовуємо спеціальну демо-сторінку, бо /500 не існує за замовчуванням
    const getUrl = (page: '404' | '500') =>
        page === '404' ? '/non-existent-page-demo' : '/demo-500';

    return (
        <div className="mx-auto max-w-6xl space-y-6 p-8">
            <div className="flex items-center justify-between">
                <h1 className="font-heading text-3xl font-bold text-foreground">Демо помилок</h1>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => window.open(getUrl(activePage), '_blank')}
                    >
                        Відкрити в новій вкладці <ExternalLink className="ml-2 h-4 w-4" />
                    </Button>
                    <ButtonGroup>
                        <Button
                            onClick={() => setActivePage('404')}
                            variant={activePage === '404' ? 'primary' : 'secondary'}
                        >
                            Сторінка 404
                        </Button>
                        <Button
                            onClick={() => setActivePage('500')}
                            variant={activePage === '500' ? 'primary' : 'secondary'}
                        >
                            Сторінка 500
                        </Button>
                    </ButtonGroup>
                </div>
            </div>

            <div className="relative h-[850px] overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                <iframe src={getUrl(activePage)} className="h-full w-full" title="Errors Demo" />
            </div>

            <div className="text-center text-sm text-muted-foreground">
                * Відображаються реальні сторінки помилок через iframe
            </div>
        </div>
    );
}
