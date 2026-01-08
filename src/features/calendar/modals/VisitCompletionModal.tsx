'use client';

import { useState } from 'react';
import { Modal } from '@/shared/components/ui/Modal';
import { Button } from '@/shared/components/ui/Button';
import { Textarea } from '@/shared/components/ui/Textarea';
import { FileUpload } from '@/shared/components/ui/FileUpload';
import { Appointment, StaffMember } from '@/features/calendar/types';
import { useToast } from '@/shared/hooks/useToast';
import { Camera, ClipboardList, CheckCircle2 } from 'lucide-react';

interface VisitCompletionModalProps {
    isOpen: boolean;
    onClose: () => void;
    appointment: Appointment;
    staff: StaffMember[];
    onComplete: (visitData: { notes: string; photos: string[] }) => void;
}

export function VisitCompletionModal({
    isOpen,
    onClose,
    appointment,
    staff,
    onComplete,
}: VisitCompletionModalProps) {
    const [notes, setNotes] = useState('');
    const [photos, setPhotos] = useState<string[]>([]);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const toast = useToast();

    const currentStaff = staff.find(s => s.id === appointment.staffId);

    const handleFilesChange = (files: File[]) => {
        // In a real app, we would upload these to a server and get URLs back.
        // For the mock, we'll convert them to object URLs.
        const newPhotoUrls = files.map(file => URL.createObjectURL(file));
        setPhotos(newPhotoUrls);
    };

    const handleSubmit = async () => {
        setIsSubmitting(true);
        try {
            // Simulate API call
            await new Promise(resolve => setTimeout(resolve, 800));
            onComplete({ notes, photos });
            toast.success('Візит успішно завершено та занесено в історію');
            onClose();
        } catch (error) {
            toast.error('Помилка при завершенні візиту');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Завершення візиту" size="md">
            <div className="space-y-6">
                <div className="bg-primary/5 rounded-2xl p-4 border border-primary/10 flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center text-primary">
                        <CheckCircle2 className="w-7 h-7" />
                    </div>
                    <div>
                        <h4 className="text-sm font-bold text-foreground uppercase tracking-widest">{appointment.service}</h4>
                        <p className="text-xs text-muted-foreground mt-0.5">
                            Майстер: <span className="font-semibold text-foreground">{currentStaff?.name || '—'}</span>
                        </p>
                    </div>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <ClipboardList className="w-4 h-4 text-primary" />
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-widest">
                            Нотатки майстра про клієнта
                        </label>
                    </div>
                    <Textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Наприклад: «Любить коротко», «Чутлива шкіра», «П'є чай»..."
                        rows={4}
                        className="resize-none"
                    />
                </div>

                <div className="space-y-3">
                    <div className="flex items-center gap-2 px-1">
                        <Camera className="w-4 h-4 text-primary" />
                        <label className="text-xs font-bold text-foreground/70 uppercase tracking-widest">
                            Фото процедури (1-10 фото)
                        </label>
                    </div>
                    <FileUpload
                        accept="image/*"
                        multiple={true}
                        onFilesChange={handleFilesChange}
                        maxSize={5 * 1024 * 1024}
                        helperText="Максимум 10 фото, до 5МБ кожне"
                    />
                </div>

                <div className="flex gap-3 pt-4 border-t border-border">
                    <Button variant="secondary" fullWidth onClick={onClose} disabled={isSubmitting}>
                        Скасувати
                    </Button>
                    <Button variant="primary" fullWidth onClick={handleSubmit} isLoading={isSubmitting}>
                        Завершити візит
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
