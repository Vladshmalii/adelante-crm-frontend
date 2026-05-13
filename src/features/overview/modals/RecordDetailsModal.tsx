'use client';

import { useState, useRef, useEffect } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Record } from '../types';
import { 
    Calendar, Clock, User, Phone, Briefcase, CreditCard, 
    Info, History, Camera, UserCheck, ShieldCheck, 
    Maximize2, MapPin, Receipt, MessageSquare, Plus, X, Upload
} from 'lucide-react';
import { Badge } from '@/shared/components/ui/Badge';
import { useToast } from '@/shared/hooks/useToast';
import { RECORD_STATUS_LABELS, PAYMENT_STATUS_LABELS, RECORD_SOURCE_LABELS } from '../constants';
import clsx from 'clsx';

interface RecordDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    record: Record | null;
}

type ModalTab = 'details' | 'finances' | 'audit' | 'media';

export function RecordDetailsModal({ isOpen, onClose, record }: RecordDetailsModalProps) {
    const [activeTab, setActiveTab] = useState<ModalTab>('details');
    const [localPhotos, setLocalPhotos] = useState<string[]>([]);
    const [isDragging, setIsDragging] = useState(false);
    const [selectedImage, setSelectedImage] = useState<string | null>(null);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const toast = useToast();

    useEffect(() => {
        if (record) {
            setLocalPhotos(record.photos || []);
            setActiveTab('details');
        }
    }, [record]);

    if (!record) return null;

    const handlePhotoUpload = (files: FileList | null) => {
        if (!files || files.length === 0) return;
        
        const newPhotos: string[] = [];
        Array.from(files).forEach(file => {
            if (file.type.startsWith('image/')) {
                newPhotos.push(URL.createObjectURL(file));
            }
        });

        if (newPhotos.length > 0) {
            setLocalPhotos(prev => [...prev, ...newPhotos]);
            toast.success(newPhotos.length === 1 ? 'Фото успішно додано' : `Додано ${newPhotos.length} фото`, 'Успіх');
        }
    };

    const onDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const onDragLeave = () => {
        setIsDragging(false);
    };

    const onDrop = (e: React.DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        handlePhotoUpload(e.dataTransfer.files);
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleString('uk-UA', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const formatTimeOnly = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' });
    };

    const tabs = [
        { id: 'details', label: 'Запис', icon: Info },
        { id: 'finances', label: 'Фінанси', icon: Receipt },
        { id: 'audit', label: 'Аудит', icon: History },
        { id: 'media', label: 'Медіа', icon: Camera },
    ];

    return (
        <>
            <Modal isOpen={isOpen} onClose={onClose} title={`Аудит запису #${record.id}`} size="xl">
                <div className="flex flex-col gap-6">
                    {/* Header Info */}
                    <div className="flex items-center justify-between p-4 bg-secondary/10 rounded-2xl border border-border/50">
                        <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <UserCheck size={24} />
                            </div>
                            <div>
                                <h3 className="font-bold text-lg leading-none">{record.client}</h3>
                                <p className="text-sm text-muted-foreground mt-1">{record.phone}</p>
                            </div>
                        </div>
                        <div className="flex flex-col items-end gap-2">
                            <Badge variant={record.status === 'completed' ? 'success' : record.status === 'cancelled' ? 'danger' : 'warning'}>
                                {RECORD_STATUS_LABELS[record.status]}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">
                                Створено: {formatDate(record.createdAt)}
                            </span>
                        </div>
                    </div>

                    {/* Tabs Navigation */}
                    <div className="flex gap-2 p-1 bg-secondary/20 rounded-xl">
                        {tabs.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id as ModalTab)}
                                className={clsx(
                                    "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-all duration-300",
                                    activeTab === tab.id 
                                        ? "bg-background text-primary shadow-sm" 
                                        : "text-muted-foreground hover:bg-background/50"
                                )}
                            >
                                <tab.icon size={16} />
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {/* Tab Content */}
                    <div className="min-h-[350px]">
                        {activeTab === 'details' && (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="space-y-6">
                                    <section>
                                        <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Briefcase size={12} /> Основна інформація
                                        </h4>
                                        <div className="space-y-4">
                                            <DetailItem icon={Briefcase} label="Послуга" value={record.service} />
                                            <DetailItem icon={User} label="Майстер" value={record.employee} />
                                            <DetailItem icon={MapPin} label="Джерело" value={RECORD_SOURCE_LABELS[record.source]} />
                                        </div>
                                    </section>
                                    <section>
                                        <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <Clock size={12} /> Часові відмітки
                                        </h4>
                                        <div className="space-y-4">
                                            <DetailItem icon={Calendar} label="Плановий час" value={formatDate(record.visitTime)} />
                                            <DetailItem icon={Clock} label="Фактичний час" value={record.actualStartTime ? `${formatTimeOnly(record.actualStartTime)} - ${record.actualEndTime ? formatTimeOnly(record.actualEndTime) : '...'}` : 'Не розпочато'} />
                                        </div>
                                    </section>
                                </div>
                                <div className="space-y-6">
                                    <section className="h-full">
                                        <h4 className="text-[11px] font-bold text-muted-foreground/60 uppercase tracking-widest mb-4 flex items-center gap-2">
                                            <MessageSquare size={12} /> Коментарі та нотатки
                                        </h4>
                                        <div className="p-4 bg-muted/30 rounded-xl border border-border/50 h-[calc(100%-2rem)] min-h-[120px]">
                                            <p className="text-sm text-foreground italic">
                                                {record.internalNotes || "Додаткові нотатки відсутні..."}
                                            </p>
                                        </div>
                                    </section>
                                </div>
                            </div>
                        )}

                        {activeTab === 'finances' && (
                            <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <FinanceCard label="Сума до оплати" value={`${record.amount || 0} ₴`} color="primary" />
                                    <FinanceCard label="Статус" value={PAYMENT_STATUS_LABELS[record.paymentStatus]} color={record.paymentStatus === 'paid' ? 'success' : 'warning'} />
                                    <FinanceCard label="Метод" value={record.paymentMethod === 'cash' ? 'Готівка' : record.paymentMethod === 'card' ? 'Карта' : 'Не вказано'} color="secondary" />
                                </div>
                                <div className="p-4 bg-secondary/10 rounded-2xl border border-border/50 space-y-4">
                                    <h4 className="text-sm font-bold">Закриття запису</h4>
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-widest">Хто закрив</p>
                                            <p className="font-medium mt-1">{record.closedBy || '—'}</p>
                                        </div>
                                        <div>
                                            <p className="text-muted-foreground text-xs uppercase tracking-widest">Коли закрили</p>
                                            <p className="font-medium mt-1">{record.closedAt ? formatDate(record.closedAt) : '—'}</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {activeTab === 'audit' && (
                            <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-300">
                                <div className="relative pl-8 space-y-8 before:absolute before:left-3 before:top-2 before:bottom-2 before:w-px before:bg-border">
                                    {record.history?.map((item, index) => (
                                        <div key={index} className="relative">
                                            <div className="absolute -left-[25px] top-1 w-2.5 h-2.5 rounded-full bg-primary border-2 border-background z-10" />
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center justify-between text-xs">
                                                    <span className="font-bold text-foreground">{item.action}</span>
                                                    <span className="text-muted-foreground/60">{formatDate(item.date)}</span>
                                                </div>
                                                <p className="text-sm text-muted-foreground">{item.details}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] text-primary/70 mt-1">
                                                    <ShieldCheck size={10} />
                                                    <span>Виконавець: {item.author}</span>
                                                </div>
                                            </div>
                                        </div>
                                    )) || (
                                        <div className="text-center py-12 text-muted-foreground">
                                            <History size={40} className="mx-auto mb-2 opacity-20" />
                                            <p>Історія змін для цього запису відсутня</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {activeTab === 'media' && (
                            <div 
                                className={clsx(
                                    "animate-in fade-in slide-in-from-bottom-2 duration-300 h-full min-h-[300px] rounded-2xl border-2 border-dashed transition-all duration-300",
                                    isDragging ? "border-primary bg-primary/5 scale-[0.99]" : "border-transparent"
                                )}
                                onDragOver={onDragOver}
                                onDragLeave={onDragLeave}
                                onDrop={onDrop}
                            >
                                <div className="flex flex-col gap-6 h-full">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={(e) => handlePhotoUpload(e.target.files)}
                                        accept="image/*"
                                        multiple
                                        className="hidden"
                                    />
                                    
                                    {localPhotos.length > 0 ? (
                                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-2">
                                            {localPhotos.map((photo, i) => (
                                                <div key={i} className="aspect-square rounded-xl overflow-hidden border border-border group relative">
                                                    <img src={photo} alt={`Record photo ${i}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                                                        <button 
                                                            onClick={() => setSelectedImage(photo)}
                                                            className="h-9 w-9 bg-white/20 hover:bg-white/40 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110"
                                                        >
                                                            <Maximize2 size={18} />
                                                        </button>
                                                        <button 
                                                            onClick={() => setLocalPhotos(prev => prev.filter((_, index) => index !== i))}
                                                            className="h-9 w-9 bg-red-500/40 hover:bg-red-500/60 backdrop-blur-md rounded-full flex items-center justify-center text-white transition-all transform hover:scale-110"
                                                        >
                                                            <X size={18} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            
                                            {/* Quick Add Button */}
                                            <button 
                                                onClick={() => fileInputRef.current?.click()}
                                                className="aspect-square rounded-xl border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary hover:text-primary hover:bg-primary/5 transition-all duration-300"
                                            >
                                                <Plus size={24} />
                                                <span className="text-[10px] font-bold uppercase mt-1">Додати</span>
                                            </button>
                                        </div>
                                    ) : (
                                        <div 
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex-1 flex flex-col items-center justify-center py-12 text-muted-foreground cursor-pointer group"
                                        >
                                            <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-4 group-hover:bg-primary/10 group-hover:text-primary transition-all duration-500 transform group-hover:scale-110">
                                                <Upload size={32} />
                                            </div>
                                            <p className="text-lg font-bold text-foreground mb-1">Завантажте фото</p>
                                            <p className="text-sm opacity-60">Натисніть або перетягніть файли сюди</p>
                                            <div className="mt-6 flex gap-2">
                                                <Badge variant="secondary">JPG</Badge>
                                                <Badge variant="secondary">PNG</Badge>
                                                <Badge variant="secondary">HEIC</Badge>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="flex justify-end pt-6 border-t border-border">
                        <Button type="button" variant="secondary" onClick={onClose} className="rounded-xl px-8">
                            Закрити
                        </Button>
                    </div>
                </div>
            </Modal>

            {/* Fullscreen Preview (Lightbox) */}
            {selectedImage && (
                <div 
                    className="fixed inset-0 z-[9999] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-300"
                    onClick={() => setSelectedImage(null)}
                >
                    <button 
                        className="absolute top-6 right-6 h-12 w-12 bg-white/10 hover:bg-white/20 rounded-full flex items-center justify-center text-white backdrop-blur-md transition-all"
                        onClick={() => setSelectedImage(null)}
                    >
                        <X size={24} />
                    </button>
                    <img 
                        src={selectedImage} 
                        alt="Full size preview" 
                        className="max-w-full max-h-full object-contain shadow-2xl rounded-lg animate-in zoom-in-95 duration-300"
                        onClick={(e) => e.stopPropagation()}
                    />
                </div>
            )}
        </>
    );
}

function DetailItem({ icon: Icon, label, value }: { icon: any, label: string, value: string }) {
    return (
        <div className="flex items-center justify-between group">
            <div className="flex items-center gap-3 text-muted-foreground">
                <Icon size={16} className="text-muted-foreground/40 group-hover:text-primary transition-colors duration-300" />
                <span className="text-sm">{label}</span>
            </div>
            <span className="text-sm font-bold text-foreground">{value}</span>
        </div>
    );
}

function FinanceCard({ label, value, color }: { label: string, value: string, color: 'primary' | 'success' | 'warning' | 'secondary' }) {
    const colors = {
        primary: "bg-primary/10 text-primary border-primary/20",
        success: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
        warning: "bg-amber-500/10 text-amber-500 border-amber-500/20",
        secondary: "bg-secondary text-secondary-foreground border-border",
    };

    return (
        <div className={clsx("p-4 rounded-2xl border text-center", colors[color])}>
            <p className="text-[10px] uppercase tracking-widest font-bold opacity-70 mb-1">{label}</p>
            <p className="text-xl font-black">{value}</p>
        </div>
    );
}
