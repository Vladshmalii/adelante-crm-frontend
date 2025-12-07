'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink } from 'lucide-react';

export function WidgetSettings() {
    const [copied, setCopied] = useState(false);

    const widgeUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/widget/booking`
        : 'https://crm.adelante.com/widget/booking';

    const iframeCode = `<iframe src="${widgeUrl}" width="100%" height="800" frameborder="0" style="border:none; overflow:hidden; border-radius:12px;"></iframe>`;

    const handleCopy = () => {
        navigator.clipboard.writeText(iframeCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <div className="max-w-4xl space-y-6">
            <div className="bg-card border border-border rounded-lg p-6">
                <h2 className="text-xl font-semibold mb-2">Віджет онлайн-запису</h2>
                <p className="text-muted-foreground mb-6">
                    Розмістіть цей код на вашому веб-сайті, щоб дозволити клієнтам записуватися онлайн.
                </p>

                <div className="space-y-4">
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Код для вставки
                        </label>
                        <div className="relative">
                            <pre className="p-4 bg-muted rounded-lg text-sm font-mono overflow-x-auto border border-border">
                                {iframeCode}
                            </pre>
                            <button
                                onClick={handleCopy}
                                className="absolute top-2 right-2 p-2 hover:bg-background/50 rounded-md transition-colors text-muted-foreground hover:text-foreground"
                                title="Копіювати код"
                            >
                                {copied ? <Check size={16} className="text-green-500" /> : <Copy size={16} />}
                            </button>
                        </div>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Попередній перегляд
                        </label>
                        <div className="border border-border rounded-lg overflow-hidden bg-background">
                            <iframe
                                src={widgeUrl}
                                width="100%"
                                height="500"
                                className="border-0"
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <a
                            href={widgeUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-2 text-sm text-primary hover:underline"
                        >
                            Відкрити в новому вікні
                            <ExternalLink size={14} />
                        </a>
                    </div>
                </div>
            </div>
        </div>
    );
}
