import { useState } from 'react';
import { useInventoryStore } from '@/stores/useInventoryStore';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Trash2, Plus } from 'lucide-react';
import { useToast } from '@/shared/hooks/useToast';

interface InventoryCategoriesModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function InventoryCategoriesModal({ isOpen, onClose }: InventoryCategoriesModalProps) {
    const { categories, setCategories, products, setProducts } = useInventoryStore();
    const [newCategoryName, setNewCategoryName] = useState('');
    const [categoryToDelete, setCategoryToDelete] = useState<{ value: string; label: string } | null>(null);
    const [relatedProductsCount, setRelatedProductsCount] = useState(0);
    const toast = useToast();

    const relatedProductsList = categoryToDelete ? products.filter(p => p.category === categoryToDelete.value) : [];

    const handleAddCategory = () => {
        const name = newCategoryName.trim();
        if (!name) {
            toast.error('Помилка', 'Назва категорії не може бути порожньою');
            return;
        }

        const value = name.toLowerCase().replace(/\s+/g, '-');
        if (categories.find(c => c.value === value || c.label.toLowerCase() === name.toLowerCase())) {
            toast.error('Помилка', 'Категорія з такою назвою вже існує');
            return;
        }

        setCategories([...categories, { value, label: name }]);
        setNewCategoryName('');
        toast.success('Успіх', 'Категорію успішно додано');
    };

    const initiateDelete = (category: { value: string; label: string }) => {
        const count = products.filter(p => p.category === category.value).length;
        if (count > 0) {
            setRelatedProductsCount(count);
            setCategoryToDelete(category);
        } else {
            setCategories(categories.filter(c => c.value !== category.value));
            toast.success('Успіх', 'Категорію видалено');
        }
    };

    const confirmDeleteAction = (action: 'delete_products' | 'move_to_uncategorized') => {
        if (!categoryToDelete) return;

        if (action === 'delete_products') {
            const remainingProducts = products.filter(p => p.category !== categoryToDelete.value);
            setProducts(remainingProducts);
        } else {
            const updatedProducts = products.map(p => 
                p.category === categoryToDelete.value ? { ...p, category: 'uncategorized' } : p
            );
            setProducts(updatedProducts);
        }

        setCategories(categories.filter(c => c.value !== categoryToDelete.value));
        setCategoryToDelete(null);
        toast.success('Успіх', 'Категорію та повʼязані дані оновлено');
    };

    return (
        <Modal isOpen={isOpen} onClose={() => { setCategoryToDelete(null); onClose(); }} title={categoryToDelete ? "Видалення категорії" : "Управління категоріями"}>
            {categoryToDelete ? (
                <div className="space-y-4 text-sm text-foreground/80 pb-2">
                    <p className="text-base">Категорія <strong className="text-foreground">{categoryToDelete.label}</strong> містить <strong className="text-foreground">{relatedProductsCount}</strong> товарів.</p>
                    
                    <div className="my-4 max-h-40 overflow-y-auto border border-border rounded-lg bg-background/50">
                        <table className="w-full text-left text-xs">
                            <thead className="bg-secondary/40 sticky top-0 backdrop-blur-sm z-10 border-b border-border">
                                <tr>
                                    <th className="px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px]">Назва</th>
                                    <th className="px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] w-24">Артикул</th>
                                    <th className="px-3 py-2.5 font-medium text-muted-foreground uppercase tracking-wider text-[10px] w-20 text-right">Залишок</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/40">
                                {relatedProductsList.map(p => (
                                    <tr key={p.id} className="hover:bg-secondary/20">
                                        <td className="px-3 py-2 font-bold text-foreground truncate max-w-[200px]" title={p.name}>{p.name}</td>
                                        <td className="px-3 py-2 text-muted-foreground font-medium opacity-80">{p.sku}</td>
                                        <td className="px-3 py-2 text-right font-black text-foreground">{p.quantity}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="mb-2 pt-2 text-muted-foreground font-medium">Виберіть дію, що робити з цими товарами при видаленні категорії:</p>
                    <div className="flex flex-col gap-3 pt-4 border-t border-border">
                        <Button variant="danger" onClick={() => confirmDeleteAction('delete_products')}>
                            Видалити категорію разом з товарами
                        </Button>
                        <Button variant="outline" onClick={() => confirmDeleteAction('move_to_uncategorized')}>
                            Видалити категорію, а товари перенести в "Без категорії"
                        </Button>
                        <Button variant="secondary" onClick={() => setCategoryToDelete(null)} className="mt-2">
                            Скасувати
                        </Button>
                    </div>
                </div>
            ) : (
            <div className="space-y-6">
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={newCategoryName}
                        onChange={(e) => setNewCategoryName(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
                        placeholder="Назва нової категорії..."
                        className="flex-1 px-4 py-2 bg-background border border-border rounded-xl focus:outline-none focus:border-primary"
                    />
                    <Button variant="primary" onClick={handleAddCategory}>
                        <Plus size={18} className="mr-2" />
                        Додати
                    </Button>
                </div>

                <div className="bg-card border border-border rounded-xl divide-y divide-border overflow-hidden">
                    {categories.length > 0 ? (
                        categories.map((category) => (
                            <div key={category.value} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                                <div className="font-medium text-sm">{category.label}</div>
                                <button
                                    onClick={() => initiateDelete(category)}
                                    disabled={category.value === 'uncategorized'}
                                    className={`p-2 rounded-lg transition-colors ${category.value === 'uncategorized' ? 'text-muted-foreground/30 cursor-not-allowed' : 'text-muted-foreground hover:text-destructive hover:bg-destructive/10'}`}
                                >
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-muted-foreground">
                            Немає категорій
                        </div>
                    )}
                </div>
                
                <div className="pt-4 border-t border-border flex justify-end">
                    <Button variant="outline" onClick={onClose}>
                        Закрити
                    </Button>
                </div>
            </div>
            )}
        </Modal>
    );
}
