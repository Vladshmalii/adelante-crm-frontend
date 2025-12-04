import { useState } from 'react';
import { DatePicker } from '@/shared/components/ui/DatePicker';
import { Input } from '@/shared/components/ui/Input';
import { Textarea } from '@/shared/components/ui/Textarea';
import { Checkbox } from '@/shared/components/ui/Checkbox';

type WorkDayKey = 'mon' | 'tue' | 'wed' | 'thu' | 'fri' | 'sat' | 'sun';

interface WorkDayConfig {
  enabled: boolean;
  from: string;
  to: string;
}

const WEEK_DAYS: { key: WorkDayKey; label: string }[] = [
  { key: 'mon', label: 'Понеділок' },
  { key: 'tue', label: 'Вівторок' },
  { key: 'wed', label: 'Середа' },
  { key: 'thu', label: 'Четвер' },
  { key: 'fri', label: 'П\'ятниця' },
  { key: 'sat', label: 'Субота' },
  { key: 'sun', label: 'Неділя' },
];

const inputClasses =
  "w-full px-3 py-2 text-sm bg-background border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-ring";

export function SalonSettings() {
  const [salonName, setSalonName] = useState('Adelante Beauty Studio');
  const [legalName, setLegalName] = useState('ФОП Прикладова О.О.');
  const [phone, setPhone] = useState('+380');
  const [email, setEmail] = useState('info@salon.ua');
  const [website, setWebsite] = useState('');
  const [instagram, setInstagram] = useState('');
  const [facebook, setFacebook] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Київ');
  const [description, setDescription] = useState('');
  const [openingDate, setOpeningDate] = useState('');

  const [workSchedule, setWorkSchedule] = useState<Record<WorkDayKey, WorkDayConfig>>({
    mon: { enabled: true, from: '09:00', to: '18:00' },
    tue: { enabled: true, from: '09:00', to: '18:00' },
    wed: { enabled: true, from: '09:00', to: '18:00' },
    thu: { enabled: true, from: '09:00', to: '18:00' },
    fri: { enabled: true, from: '09:00', to: '18:00' },
    sat: { enabled: false, from: '10:00', to: '16:00' },
    sun: { enabled: false, from: '10:00', to: '16:00' },
  });

  const handleWorkDayChange = (day: WorkDayKey, field: keyof WorkDayConfig, value: string | boolean) => {
    setWorkSchedule(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value as never,
      },
    }));
  };

  const handleSave = () => {
    console.log('Зберегти налаштування салону', {
      salonName,
      legalName,
      phone,
      email,
      website,
      instagram,
      facebook,
      address,
      city,
      description,
      openingDate,
      workSchedule,
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      <section className="bg-card border border-border rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Інформація про салон</h2>
            <p className="text-sm text-muted-foreground">
              Основні дані, які бачать клієнти та співробітники.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-accent text-accent-foreground hover:bg-accent/90 transition-colors"
          >
            Зберегти
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="md:col-span-2">
            <Input
              label="Назва салону"
              type="text"
              value={salonName}
              onChange={(e) => setSalonName(e.target.value)}
              placeholder="Введіть назву салону"
            />
          </div>

          <Input
            label="Юридична назва"
            type="text"
            value={legalName}
            onChange={(e) => setLegalName(e.target.value)}
            placeholder="Наприклад: ФОП ..."
          />

          <Input
            label="Місто"
            type="text"
            value={city}
            onChange={(e) => setCity(e.target.value)}
            placeholder="Наприклад: Київ"
          />

          <div className="md:col-span-2">
            <Input
              label="Адреса"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Вулиця, будинок, офіс"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <Input
            label="Телефон салону"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+380"
          />

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="example@salon.ua"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <Input
            label="Сайт"
            type="text"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
            placeholder="https://..."
          />

          <Input
            label="Instagram"
            type="text"
            value={instagram}
            onChange={(e) => setInstagram(e.target.value)}
            placeholder="@salon_instagram"
          />

          <Input
            label="Facebook"
            type="text"
            value={facebook}
            onChange={(e) => setFacebook(e.target.value)}
            placeholder="Посилання або @сторінка"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Дата відкриття салону
            </label>
            <DatePicker
              value={openingDate}
              onChange={setOpeningDate}
              placeholder="Оберіть дату"
            />
          </div>

          <Textarea
            label="Короткий опис"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Напишіть кілька речень про салон, формат, спеціалізацію тощо"
            rows={3}
          />
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <div className="mb-4">
          <h2 className="text-lg font-semibold mb-1">Графік роботи салону</h2>
          <p className="text-sm text-muted-foreground">
            Налаштуйте робочі дні та години прийому клієнтів.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="border-b border-border text-xs text-muted-foreground">
                <th className="py-2 pr-4 text-left font-medium">День</th>
                <th className="py-2 pr-4 text-left font-medium">Відкрито</th>
                <th className="py-2 pr-4 text-left font-medium">З</th>
                <th className="py-2 pr-4 text-left font-medium">До</th>
              </tr>
            </thead>
            <tbody>
              {WEEK_DAYS.map((day) => {
                const config = workSchedule[day.key];
                return (
                  <tr key={day.key} className="border-b border-border/60 last:border-0">
                    <td className="py-2 pr-4 align-middle text-foreground">{day.label}</td>
                    <td className="py-2 pr-4 align-middle">
                      <div className="flex items-center gap-2">
                        <Checkbox
                          checked={config.enabled}
                          onChange={(e) => handleWorkDayChange(day.key, 'enabled', e.target.checked)}
                        />
                        <span className="text-xs text-muted-foreground">
                          {config.enabled ? 'Працює' : 'Вихідний'}
                        </span>
                      </div>
                    </td>
                    <td className="py-2 pr-2 align-middle w-28">
                      <input
                        type="time"
                        value={config.from}
                        onChange={(e) => handleWorkDayChange(day.key, 'from', e.target.value)}
                        className={inputClasses}
                        disabled={!config.enabled}
                      />
                    </td>
                    <td className="py-2 pr-2 align-middle w-28">
                      <input
                        type="time"
                        value={config.to}
                        onChange={(e) => handleWorkDayChange(day.key, 'to', e.target.value)}
                        className={inputClasses}
                        disabled={!config.enabled}
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
