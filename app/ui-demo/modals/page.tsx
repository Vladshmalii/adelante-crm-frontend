'use client';

import { useState } from 'react';
import { Button } from '@/shared/components/ui/Button';
import { Modal } from '@/shared/components/ui/Modal';
import { ConfirmDialog } from '@/shared/components/ui/ConfirmDialog';
import { useToast } from '@/shared/hooks/useToast';
import { Input } from '@/shared/components/ui/Input';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { GlobalLoader } from '@/shared/components/ui/GlobalLoader';

export default function ModalsDemo() {
    const toast = useToast();
    const [isBasicModalOpen, setIsBasicModalOpen] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [confirmVariant, setConfirmVariant] = useState<'danger' | 'warning' | 'info'>('warning');
    const [isGlobalLoaderLoading, setIsGlobalLoaderLoading] = useState(false);

    const openConfirm = (variant: 'danger' | 'warning' | 'info') => {
        setConfirmVariant(variant);
        setIsConfirmOpen(true);
    };

    const showLoader = () => {
        setIsGlobalLoaderLoading(true);
        setTimeout(() => setIsGlobalLoaderLoading(false), 3000);
    };

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            <h1 className="text-3xl font-bold text-foreground font-heading">Модальні вікна та діалоги</h1>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Базове модальне вікно</h2>
                <Button onClick={() => setIsBasicModalOpen(true)}>Відкрити модальне вікно</Button>

                <Modal
                    isOpen={isBasicModalOpen}
                    onClose={() => setIsBasicModalOpen(false)}
                    title="Заголовок модального вікна"
                >
                    <div className="space-y-4">
                        <p className="text-foreground">
                            Це вміст базового модального вікна. Ви можете розмістити тут будь-що.
                        </p>
                        <ul className="list-disc list-inside text-muted-foreground space-y-1">
                            <li>Підтримує різні розміри (sm, md, lg, xl, full)</li>
                            <li>Анімований вхід/вихід</li>
                            <li>Закриття при кліку на фон</li>
                        </ul>
                        <div className="flex justify-end pt-4">
                            <Button variant="primary" onClick={() => setIsBasicModalOpen(false)}>
                                Закрити
                            </Button>
                        </div>
                    </div>
                </Modal>
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Діалоги підтвердження</h2>
                <div className="flex flex-wrap gap-4">
                    <Button
                        variant="secondary"
                        onClick={() => openConfirm('warning')}
                        className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"
                    >
                        Попередження
                    </Button>
                    <Button
                        variant="danger"
                        onClick={() => openConfirm('danger')}
                    >
                        Небезпечна дія
                    </Button>
                    <Button
                        variant="primary"
                        onClick={() => openConfirm('info')}
                    >
                        Інформація
                    </Button>
                </div>

                <ConfirmDialog
                    isOpen={isConfirmOpen}
                    onClose={() => setIsConfirmOpen(false)}
                    onConfirm={() => {
                        toast.success('Дію підтверджено!');
                        setIsConfirmOpen(false);
                    }}
                    title={
                        confirmVariant === 'danger' ? 'Видалити елемент?' :
                            confirmVariant === 'warning' ? 'Дія потребує уваги' :
                                'Інформація'
                    }
                    message={
                        confirmVariant === 'danger' ? 'Цю дію не можна скасувати. Ви впевнені, що хочете видалити цей елемент?' :
                            confirmVariant === 'warning' ? 'Ви впевнені, що хочете продовжити виконання цієї дії?' :
                                'Ви бажаєте продовжити цю операцію?'
                    }
                    variant={confirmVariant}
                    confirmText={confirmVariant === 'danger' ? 'Видалити' : 'Підтвердити'}
                />
            </section>

            <section className="space-y-4">
                <h2 className="text-xl font-semibold text-foreground">Глобальний Лоадер</h2>
                <Button onClick={showLoader} variant="secondary">
                    Показати Global Loader (3s)
                </Button>
                <GlobalLoader isLoading={isGlobalLoaderLoading} />
            </section>

            <FormModalDemo />
        </div>
    );
}

function FormModalDemo() {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        role: 'user',
        notifications: true,
        bio: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1500));
        setIsLoading(false);
        setIsOpen(false);
        toast.success('Користувача успішно створено!');
        setFormData({ name: '', email: '', role: 'user', notifications: true, bio: '' });
    };

    return (
        <section className="space-y-4">
            <h2 className="text-xl font-semibold text-foreground">Модальне вікно з формою</h2>
            <Button onClick={() => setIsOpen(true)} variant="primary">
                Відкрити форму
            </Button>

            <Modal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                title="Створити нового користувача"
                size="lg"
            >
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                            label="ПІБ"
                            placeholder="Іван Іванов"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                        />
                        <Input
                            label="Електронна пошта"
                            type="email"
                            placeholder="ivan@example.com"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                        />
                    </div>

                    <Dropdown
                        label="Роль користувача"
                        value={formData.role}
                        onChange={(value) => setFormData({ ...formData, role: value as string })}
                        options={[
                            { value: 'admin', label: 'Адміністратор' },
                            { value: 'manager', label: 'Менеджер' },
                            { value: 'user', label: 'Користувач' },
                            { value: 'viewer', label: 'Спостерігач' },
                        ]}
                    />

                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">
                            Про себе
                        </label>
                        <textarea
                            className="w-full px-3 py-2 bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring min-h-[100px]"
                            placeholder="Розкажіть трохи про цього користувача..."
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                        />
                    </div>

                    <Checkbox
                        label="Увімкнути email сповіщення"
                        checked={formData.notifications}
                        onChange={(e) => setFormData({ ...formData, notifications: e.target.checked })}
                    />

                    <div className="flex justify-end gap-3 pt-4 border-t border-border">
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => setIsOpen(false)}
                            disabled={isLoading}
                        >
                            Скасувати
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            isLoading={isLoading}
                        >
                            Створити
                        </Button>
                    </div>
                </form>
            </Modal>
        </section>
    );
}
