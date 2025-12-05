'use client';

import { useMemo } from 'react';
import { Copy, CreditCard, CheckCircle2, Clock } from 'lucide-react';
import { Card } from '@/shared/components/ui/Card';
import { Badge } from '@/shared/components/ui/Badge';
import { EmptyState } from '@/shared/components/ui/EmptyState';
import { Progress } from '@/shared/components/ui/Progress';
import { useToast } from '@/shared/hooks/useToast';
import { mockCertificates } from '../data/mockLoyalty';
import type { Certificate } from '../types';

interface CertificatesViewProps {
    searchQuery: string;
}

export function CertificatesView({ searchQuery }: CertificatesViewProps) {
    const toast = useToast();

    const filteredCertificates = useMemo(() => {
        if (!searchQuery) return mockCertificates;

        const query = searchQuery.toLowerCase();
        return mockCertificates.filter(
            (cert) =>
                cert.code.toLowerCase().includes(query) ||
                cert.purchasedBy?.toLowerCase().includes(query) ||
                cert.purchasedFor?.toLowerCase().includes(query)
        );
    }, [searchQuery]);

    const handleCopyCode = (code: string) => {
        navigator.clipboard.writeText(code);
        toast.success('Код скопійовано');
    };

    const getCertificateStatus = (cert: Certificate) => {
        const now = new Date();
        const validUntil = new Date(cert.validUntil);

        if (cert.isUsed || cert.balance === 0) {
            return { label: 'Використано', variant: 'default' as const, icon: CheckCircle2 };
        }
        if (now > validUntil) {
            return { label: 'Прострочено', variant: 'danger' as const, icon: Clock };
        }
        return { label: 'Активний', variant: 'success' as const, icon: CreditCard };
    };

    if (filteredCertificates.length === 0) {
        return (
            <EmptyState
                title="Сертифікатів не знайдено"
                description={searchQuery ? 'Спробуйте змінити параметри пошуку' : 'Створіть перший сертифікат'}
            />
        );
    }

    return (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {filteredCertificates.map((cert) => {
                const status = getCertificateStatus(cert);
                const StatusIcon = status.icon;
                const usagePercent = ((cert.amount - cert.balance) / cert.amount) * 100;

                return (
                    <Card key={cert.id} className="p-5 hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                                    <StatusIcon size={24} className="text-primary" />
                                </div>
                                <div>
                                    <button
                                        onClick={() => handleCopyCode(cert.code)}
                                        className="flex items-center gap-1.5 font-mono text-sm font-medium text-foreground hover:text-primary transition-colors group"
                                    >
                                        {cert.code}
                                        <Copy size={14} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </button>
                                    <p className="text-xs text-muted-foreground mt-0.5">
                                        Придбано {new Date(cert.purchasedAt).toLocaleDateString('uk-UA')}
                                    </p>
                                </div>
                            </div>
                            <Badge variant={status.variant}>{status.label}</Badge>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div className="flex items-end justify-between">
                                <div>
                                    <p className="text-xs text-muted-foreground">Залишок</p>
                                    <p className="text-2xl font-bold text-foreground">{cert.balance} ₴</p>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    з {cert.amount} ₴
                                </p>
                            </div>
                            <Progress value={usagePercent} size="sm" />
                        </div>

                        <div className="space-y-2 pt-3 border-t border-border">
                            {cert.purchasedBy && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Від:</span>
                                    <span className="font-medium truncate ml-2">{cert.purchasedBy}</span>
                                </div>
                            )}
                            {cert.purchasedFor && (
                                <div className="flex justify-between text-sm">
                                    <span className="text-muted-foreground">Для:</span>
                                    <span className="font-medium truncate ml-2">{cert.purchasedFor}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Дійсний до:</span>
                                <span className="font-medium">
                                    {new Date(cert.validUntil).toLocaleDateString('uk-UA')}
                                </span>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}
