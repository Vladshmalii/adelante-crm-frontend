'use client';

import { useState } from 'react';
import { LoyaltyTabs } from '@/features/loyalty/components/LoyaltyTabs';
import { LoyaltyHeader } from '@/features/loyalty/components/LoyaltyHeader';
import { BonusesView } from '@/features/loyalty/components/BonusesView';
import { DiscountsView } from '@/features/loyalty/components/DiscountsView';
import { CertificatesView } from '@/features/loyalty/components/CertificatesView';
import { ClientBonusesView } from '@/features/loyalty/components/ClientBonusesView';
import { CreateBonusModal } from '@/features/loyalty/modals/CreateBonusModal';
import { CreateDiscountModal } from '@/features/loyalty/modals/CreateDiscountModal';
import { CreateCertificateModal } from '@/features/loyalty/modals/CreateCertificateModal';
import type { LoyaltyTab, BonusProgram, Discount } from '@/features/loyalty/types';

const TAB_LABELS: Record<LoyaltyTab, string> = {
    bonuses: 'Додати програму',
    discounts: 'Додати знижку',
    certificates: 'Додати сертифікат',
    clientBonuses: '',
};

export default function LoyaltyDemoPage() {
    const [activeTab, setActiveTab] = useState<LoyaltyTab>('bonuses');
    const [searchQuery, setSearchQuery] = useState('');
    const [showBonusModal, setShowBonusModal] = useState(false);
    const [showDiscountModal, setShowDiscountModal] = useState(false);
    const [showCertificateModal, setShowCertificateModal] = useState(false);
    const [editingBonus, setEditingBonus] = useState<BonusProgram | null>(null);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    const handleAddClick = () => {
        if (activeTab === 'bonuses') {
            setEditingBonus(null);
            setShowBonusModal(true);
        } else if (activeTab === 'discounts') {
            setEditingDiscount(null);
            setShowDiscountModal(true);
        } else if (activeTab === 'certificates') {
            setShowCertificateModal(true);
        }
    };

    const handleEditBonus = (bonus: BonusProgram) => {
        setEditingBonus(bonus);
        setShowBonusModal(true);
    };

    const handleEditDiscount = (discount: Discount) => {
        setEditingDiscount(discount);
        setShowDiscountModal(true);
    };

    return (
        <div className="p-6 space-y-6">
            <div>
                <h1 className="text-2xl font-bold text-foreground mb-2">Модуль лояльності</h1>
                <p className="text-muted-foreground">
                    Демонстрація компонентів програми лояльності: бонусні програми, знижки,
                    сертифікати та бонуси клієнтів.
                </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-6">
                <LoyaltyHeader
                    searchQuery={searchQuery}
                    onSearchChange={setSearchQuery}
                    onAddNew={handleAddClick}
                    addButtonLabel={TAB_LABELS[activeTab]}
                    showAddButton={activeTab !== 'clientBonuses'}
                />

                <LoyaltyTabs activeTab={activeTab} onTabChange={setActiveTab} />

                <div className="mt-6">
                    {activeTab === 'bonuses' && (
                        <BonusesView
                            searchQuery={searchQuery}
                            onEdit={handleEditBonus}
                        />
                    )}
                    {activeTab === 'discounts' && (
                        <DiscountsView
                            searchQuery={searchQuery}
                            onEdit={handleEditDiscount}
                        />
                    )}
                    {activeTab === 'certificates' && (
                        <CertificatesView searchQuery={searchQuery} />
                    )}
                    {activeTab === 'clientBonuses' && (
                        <ClientBonusesView searchQuery={searchQuery} />
                    )}
                </div>
            </div>

            <CreateBonusModal
                isOpen={showBonusModal}
                onClose={() => setShowBonusModal(false)}
                onSave={(data) => {
                    console.log('Save bonus:', data);
                    setShowBonusModal(false);
                }}
                bonus={editingBonus}
            />

            <CreateDiscountModal
                isOpen={showDiscountModal}
                onClose={() => setShowDiscountModal(false)}
                onSave={(data) => {
                    console.log('Save discount:', data);
                    setShowDiscountModal(false);
                }}
                discount={editingDiscount}
            />

            <CreateCertificateModal
                isOpen={showCertificateModal}
                onClose={() => setShowCertificateModal(false)}
                onSave={(data) => {
                    console.log('Save certificate:', data);
                    setShowCertificateModal(false);
                }}
            />
        </div>
    );
}
