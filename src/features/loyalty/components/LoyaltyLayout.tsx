'use client';

import { useState } from 'react';
import { LoyaltyHeader } from './LoyaltyHeader';
import { LoyaltyTabs } from './LoyaltyTabs';
import { BonusesView } from './BonusesView';
import { DiscountsView } from './DiscountsView';
import { CertificatesView } from './CertificatesView';
import { ClientBonusesView } from './ClientBonusesView';
import { CreateBonusModal } from '../modals/CreateBonusModal';
import { CreateDiscountModal } from '../modals/CreateDiscountModal';
import { CreateCertificateModal } from '../modals/CreateCertificateModal';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';
import type { BonusProgram, Discount, Certificate, LoyaltyTab } from '../types';

export function LoyaltyLayout() {
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState<LoyaltyTab>('bonuses');
    const [searchQuery, setSearchQuery] = useState('');

    const [isCreateBonusModalOpen, setIsCreateBonusModalOpen] = useState(false);
    const [isCreateDiscountModalOpen, setIsCreateDiscountModalOpen] = useState(false);
    const [isCreateCertificateModalOpen, setIsCreateCertificateModalOpen] = useState(false);

    const [editingBonus, setEditingBonus] = useState<BonusProgram | null>(null);
    const [editingDiscount, setEditingDiscount] = useState<Discount | null>(null);

    const handleAddNew = () => {
        switch (activeTab) {
            case 'bonuses':
                setEditingBonus(null);
                setIsCreateBonusModalOpen(true);
                break;
            case 'discounts':
                setEditingDiscount(null);
                setIsCreateDiscountModalOpen(true);
                break;
            case 'certificates':
                setIsCreateCertificateModalOpen(true);
                break;
        }
    };

    const handleEditBonus = (bonus: BonusProgram) => {
        setEditingBonus(bonus);
        setIsCreateBonusModalOpen(true);
    };

    const handleEditDiscount = (discount: Discount) => {
        setEditingDiscount(discount);
        setIsCreateDiscountModalOpen(true);
    };

    const handleSaveBonus = (data: Partial<BonusProgram>) => {
        console.log('Save bonus:', data);
        setIsCreateBonusModalOpen(false);
        setEditingBonus(null);
    };

    const handleSaveDiscount = (data: Partial<Discount>) => {
        console.log('Save discount:', data);
        setIsCreateDiscountModalOpen(false);
        setEditingDiscount(null);
    };

    const handleSaveCertificate = (data: Partial<Certificate>) => {
        console.log('Save certificate:', data);
        setIsCreateCertificateModalOpen(false);
    };

    const getAddButtonLabel = () => {
        switch (activeTab) {
            case 'bonuses':
                return 'Додати програму';
            case 'discounts':
                return 'Додати знижку';
            case 'certificates':
                return 'Створити сертифікат';
            default:
                return '';
        }
    };

    return (
        <div className="p-6">
            <GlobalLoader isLoading={isLoading} />

            <LoyaltyHeader
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onAddNew={handleAddNew}
                addButtonLabel={getAddButtonLabel()}
                showAddButton={activeTab !== 'clientBonuses'}
            />

            <LoyaltyTabs
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />

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
                    <CertificatesView
                        searchQuery={searchQuery}
                    />
                )}
                {activeTab === 'clientBonuses' && (
                    <ClientBonusesView
                        searchQuery={searchQuery}
                    />
                )}
            </div>

            <CreateBonusModal
                isOpen={isCreateBonusModalOpen}
                onClose={() => {
                    setIsCreateBonusModalOpen(false);
                    setEditingBonus(null);
                }}
                onSave={handleSaveBonus}
                bonus={editingBonus}
            />

            <CreateDiscountModal
                isOpen={isCreateDiscountModalOpen}
                onClose={() => {
                    setIsCreateDiscountModalOpen(false);
                    setEditingDiscount(null);
                }}
                onSave={handleSaveDiscount}
                discount={editingDiscount}
            />

            <CreateCertificateModal
                isOpen={isCreateCertificateModalOpen}
                onClose={() => setIsCreateCertificateModalOpen(false)}
                onSave={handleSaveCertificate}
            />
        </div>
    );
}
