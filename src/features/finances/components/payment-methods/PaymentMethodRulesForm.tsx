import { useState } from 'react';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Button } from '@/shared/components/ui/Button';
import { PAYMENT_METHOD_TYPES, COMMISSION_TYPES, COMMISSION_PAYERS } from '../../constants';
import { mockCashRegisters } from '../../data/mockCashRegisters';
import { PaymentMethod, PaymentMethodType, CommissionType, CommissionPayer } from '../../types';

interface PaymentMethodRulesFormProps {
    initialData?: PaymentMethod;
    onSave: (data: Omit<PaymentMethod, 'id'>) => void;
    onCancel: () => void;
}

export function PaymentMethodRulesForm({ initialData, onSave, onCancel }: PaymentMethodRulesFormProps) {
    const [name, setName] = useState(initialData?.name || '');
    const [type, setType] = useState<string>(initialData?.type || 'cash');
    const [cashRegister, setCashRegister] = useState(initialData?.cashRegister || '');
    const [commissionType, setCommissionType] = useState<string>(initialData?.commissionType || 'none');
    const [commissionValue, setCommissionValue] = useState(initialData?.commissionValue || 0);
    const [commissionPayer, setCommissionPayer] = useState<string>(initialData?.commissionPayer || 'salon');
    const [availableOnline, setAvailableOnline] = useState(initialData?.availableOnline || false);
    const [allowPartialPayment, setAllowPartialPayment] = useState(initialData?.allowPartialPayment || false);
    const [allowTips, setAllowTips] = useState(initialData?.allowTips || false);
    const [sortOrder, setSortOrder] = useState(initialData?.sortOrder || 1);
    const [isActive, setIsActive] = useState(initialData?.isActive ?? true);

    const cashRegisterOptions = mockCashRegisters.map(cr => ({ value: cr.name, label: cr.name }));

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            name,
            type: type as PaymentMethodType,
            cashRegister,
            commissionType: commissionType as CommissionType,
            commissionValue,
            commissionPayer: commissionPayer as CommissionPayer,
            availableOnline,
            allowPartialPayment,
            allowTips,
            sortOrder,
            isActive,
        });
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    Назва методу
                </label>
                <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Наприклад: Готівка"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                    required
                />
            </div>

            <Dropdown
                label="Тип"
                value={type}
                options={PAYMENT_METHOD_TYPES}
                onChange={(val) => setType(val as string)}
            />

            <Dropdown
                label="Прив'язана каса"
                value={cashRegister}
                options={cashRegisterOptions}
                onChange={(val) => setCashRegister(val as string)}
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Dropdown
                    label="Тип комісії"
                    value={commissionType}
                    options={COMMISSION_TYPES}
                    onChange={(val) => setCommissionType(val as string)}
                />

                {commissionType !== 'none' && (
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Значення комісії
                        </label>
                        <input
                            type="number"
                            value={commissionValue}
                            onChange={(e) => setCommissionValue(parseFloat(e.target.value))}
                            step="0.01"
                            min="0"
                            className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                    </div>
                )}
            </div>

            {commissionType !== 'none' && (
                <Dropdown
                    label="Хто сплачує комісію"
                    value={commissionPayer}
                    options={COMMISSION_PAYERS}
                    onChange={(val) => setCommissionPayer(val as string)}
                />
            )}

            <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">
                    Порядок сортування
                </label>
                <input
                    type="number"
                    value={sortOrder}
                    onChange={(e) => setSortOrder(parseInt(e.target.value))}
                    min="1"
                    className="w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                />
            </div>

            <div className="space-y-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={availableOnline}
                        onChange={(e) => setAvailableOnline(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-foreground">Доступний при онлайн-записі</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allowPartialPayment}
                        onChange={(e) => setAllowPartialPayment(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-foreground">Дозволити часткову оплату цим методом</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={allowTips}
                        onChange={(e) => setAllowTips(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-foreground">Дозволити як доплату/чайові</span>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={isActive}
                        onChange={(e) => setIsActive(e.target.checked)}
                        className="w-4 h-4 text-primary rounded focus:ring-2 focus:ring-ring"
                    />
                    <span className="text-sm text-foreground">Активний</span>
                </label>
            </div>

            <div className="flex gap-3 pt-4">
                <Button type="submit" fullWidth>
                    Зберегти
                </Button>
                <Button type="button" variant="secondary" onClick={onCancel} fullWidth>
                    Скасувати
                </Button>
            </div>
        </form>
    );
}