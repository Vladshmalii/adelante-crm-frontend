'use client';

import { useState } from 'react';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Checkbox } from '@/shared/components/ui/Checkbox';
import { Radio, RadioGroup } from '@/shared/components/ui/Radio';
import { Switch } from '@/shared/components/ui/Switch';
import { Select } from '@/shared/components/ui/Select';
import { Dropdown } from '@/shared/components/ui/Dropdown';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { RangeDatePicker } from '@/shared/components/ui/RangeDatePicker';
import { TimePicker } from '@/shared/components/ui/TimePicker';
import { FileUpload } from '@/shared/components/ui/FileUpload';
import { SearchInput } from '@/shared/components/ui/SearchInput';
import { Button } from '@/shared/components/ui/Button';

export default function FormsDemo() {
    const [formData, setFormData] = useState({
        text: '',
        textarea: '',
        checkbox: false,
        radio: 'option1',
        switch: false,
        select: '',
        multiSelect: [] as string[],
        dropdown: '',
        date: '',
        dateRange: { from: '', to: '' },
        time: '12:00',
        search: ''
    });

    return (
        <div className="p-8 max-w-4xl mx-auto space-y-12">
            <h1 className="text-3xl font-bold text-foreground font-heading">Елементи форми</h1>

            {/* Inputs & Textareas */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Текстові поля</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Input
                        label="Стандартне поле"
                        placeholder="Введіть текст..."
                        value={formData.text}
                        onChange={(e) => setFormData({ ...formData, text: e.target.value })}
                        helperText="Підказка для поля"
                    />
                    <Input
                        label="Поле з помилкою"
                        placeholder="Некоректні дані"
                        error="Це поле обов'язкове"
                    />
                    <Input
                        label="Вимкнене поле"
                        placeholder="Ввід заборонено"
                        disabled
                    />
                    <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Пошук</label>
                        <SearchInput
                            value={formData.search}
                            onChange={(e) => setFormData({ ...formData, search: e.target.value })}
                            placeholder="Пошук..."
                        />
                    </div>
                    <div className="col-span-1 md:col-span-2">
                        <Textarea
                            label="Текстова область"
                            placeholder="Введіть довге повідомлення..."
                            value={formData.textarea}
                            onChange={(e) => setFormData({ ...formData, textarea: e.target.value })}
                            rows={4}
                        />
                    </div>
                </div>
            </section>

            {/* Selects & Dropdowns */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Вибір та списки</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Select
                        label="Стандартний вибір"
                        options={[
                            { value: 'opt1', label: 'Опція 1' },
                            { value: 'opt2', label: 'Опція 2' },
                            { value: 'opt3', label: 'Опція 3' },
                        ]}
                        value={formData.select}
                        onChange={(val) => setFormData({ ...formData, select: val as string })}
                    />
                    <Select
                        label="Множинний вибір"
                        multiple
                        options={[
                            { value: 'react', label: 'React' },
                            { value: 'vue', label: 'Vue' },
                            { value: 'angular', label: 'Angular' },
                            { value: 'svelte', label: 'Svelte' },
                        ]}
                        value={formData.multiSelect}
                        onChange={(val) => setFormData({ ...formData, multiSelect: val as string[] })}
                    />
                    <Dropdown
                        label="Випадаючий список"
                        value={formData.dropdown}
                        onChange={(val) => setFormData({ ...formData, dropdown: val as string })}
                        options={[
                            { value: 'v1', label: 'Значення 1' },
                            { value: 'v2', label: 'Значення 2' },
                        ]}
                    />
                    <Select
                        label="Пошук у списку"
                        searchable
                        options={[
                            { value: 'us', label: 'США' },
                            { value: 'uk', label: 'Велика Британія' },
                            { value: 'ua', label: 'Україна' },
                            { value: 'de', label: 'Німеччина' },
                            { value: 'fr', label: 'Франція' },
                        ]}
                        value={formData.select}
                        onChange={(val) => setFormData({ ...formData, select: val as string })}
                    />
                </div>
            </section>

            {/* Date & Time */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Дата та Час</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <DatePicker
                        label="Вибір дати"
                        value={formData.date}
                        onChange={(val) => setFormData({ ...formData, date: val })}
                    />
                    <TimePicker
                        label="Вибір часу"
                        value={formData.time}
                        onChange={(val) => setFormData({ ...formData, time: val })}
                    />
                    <div className="col-span-1 md:col-span-2">
                        <label className="block text-sm font-medium text-foreground mb-1.5">Діапазон дат</label>
                        <RangeDatePicker
                            value={formData.dateRange}
                            onChange={(range) => setFormData({ ...formData, dateRange: range })}
                        />
                    </div>
                </div>
            </section>

            {/* Toggles & Checkboxes */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Перемикачі</h2>
                <div className="space-y-4">
                    <div className="flex flex-col gap-4">
                        <Checkbox
                            label="Я погоджуюсь з умовами"
                            checked={formData.checkbox}
                            onChange={(e) => setFormData({ ...formData, checkbox: e.target.checked })}
                        />
                        <Checkbox
                            label="Вимкнений чекбокс"
                            checked={true}
                            disabled
                        />
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-border">
                        <label className="text-sm font-medium text-foreground">Група радіо-кнопок</label>
                        <RadioGroup>
                            <Radio
                                label="Опція 1"
                                name="demo-radio"
                                value="option1"
                                checked={formData.radio === 'option1'}
                                onChange={() => setFormData({ ...formData, radio: 'option1' })}
                            />
                            <Radio
                                label="Опція 2"
                                name="demo-radio"
                                value="option2"
                                checked={formData.radio === 'option2'}
                                onChange={() => setFormData({ ...formData, radio: 'option2' })}
                            />
                            <Radio
                                label="Вимкнена опція"
                                name="demo-radio"
                                disabled
                            />
                        </RadioGroup>
                    </div>

                    <div className="flex flex-col gap-4 pt-4 border-t border-border">
                        <div className="flex items-center gap-8">
                            <Switch
                                label="Перемикач"
                                checked={formData.switch}
                                onChange={(e) => setFormData({ ...formData, switch: e.target.checked })}
                            />
                            <Switch
                                label="Вимкнено (On)"
                                checked={true}
                                disabled
                            />
                            <Switch
                                label="Вимкнено (Off)"
                                checked={false}
                                disabled
                            />
                        </div>
                    </div>
                </div>
            </section>

            {/* File Upload */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Завантаження файлів</h2>
                <FileUpload
                    label="Завантажити документи"
                    helperText="PDF, DOCX до 10MB"
                    maxSize={10 * 1024 * 1024}
                    onFilesChange={(files) => console.log(files)}
                />
            </section>
            {/* Schedule Settings Demo */}
            <section className="space-y-6">
                <h2 className="text-xl font-semibold text-foreground border-b border-border pb-2">Графік роботи (Складні форми)</h2>
                <div className="bg-card border border-border rounded-xl p-6 space-y-6 max-w-3xl">
                    <div className="space-y-2">
                        <h3 className="font-bold text-lg">Графік роботи салону</h3>
                        <p className="text-muted-foreground text-sm">Налаштуйте робочі дні та години прийому клієнтів.</p>
                    </div>

                    <div className="space-y-4">
                        <div className="grid grid-cols-[1fr,auto,1fr,1fr] gap-4 items-center text-sm font-medium text-muted-foreground mb-2">
                            <div>День</div>
                            <div>Відкрито</div>
                            <div>З</div>
                            <div>До</div>
                        </div>

                        {['Понеділок', 'Вівторок', 'Середа', 'Четвер', 'П\'ятниця', 'Субота', 'Неділя'].map((day, i) => {
                            const isWeekend = i >= 5;
                            return (
                                <div key={day} className="grid grid-cols-[1fr,auto,1fr,1fr] gap-4 items-center">
                                    <div className="font-medium">{day}</div>
                                    <div className="flex items-center gap-3 w-[120px]">
                                        <Checkbox checked={!isWeekend} id={`day-${i}`} />
                                        <label htmlFor={`day-${i}`} className="text-sm cursor-pointer select-none">
                                            {!isWeekend ? 'Працює' : 'Вихідний'}
                                        </label>
                                    </div>
                                    <TimePicker
                                        value={!isWeekend ? "09:00" : ""}
                                        disabled={isWeekend}
                                        onChange={() => { }}
                                        placeholder="10:00"
                                    />
                                    <TimePicker
                                        value={!isWeekend ? "18:00" : ""}
                                        disabled={isWeekend}
                                        onChange={() => { }}
                                        placeholder="16:00"
                                    />
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>
        </div>
    );
}
