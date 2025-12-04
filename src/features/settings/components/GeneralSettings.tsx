import { useState } from 'react';

const toggleClasses =
  'relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer';
const knobClasses =
  'inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform';

export function GeneralSettings() {
  const [emailNotifications, setEmailNotifications] = useState(true);
  const [inAppNotifications, setInAppNotifications] = useState(true);
  const [marketingNotifications, setMarketingNotifications] = useState(false);
  const [telegramConnected] = useState(false);
  const [phoneIntegration] = useState(false);
  const [calendarIntegration] = useState(false);

  return (
    <div className="space-y-8 max-w-4xl">
      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-2">Тема інтерфейсу</h2>
        <p className="text-sm text-muted-foreground mb-4">
          Наразі використовується єдина тема, узгоджена з дизайном системи.
        </p>
        <div className="flex items-center justify-between bg-background border border-border rounded-lg px-4 py-3">
          <div>
            <p className="text-sm font-medium">Поточна тема</p>
            <p className="text-xs text-muted-foreground">Світла тема Adelante CRM</p>
          </div>
          <span className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
            За замовчуванням
          </span>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Налаштування сповіщень</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Email-сповіщення</p>
              <p className="text-xs text-muted-foreground">
                Надсилати листи про нові записи, перенесення та скасування.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setEmailNotifications((v) => !v)}
              className={`${toggleClasses} ${
                emailNotifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`${knobClasses} ${
                  emailNotifications ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Сповіщення в системі</p>
              <p className="text-xs text-muted-foreground">
                Показувати сповіщення у дзвіночку в хедері.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setInAppNotifications((v) => !v)}
              className={`${toggleClasses} ${
                inAppNotifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`${knobClasses} ${
                  inAppNotifications ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium">Маркетингові сповіщення</p>
              <p className="text-xs text-muted-foreground">
                Періодичні поради по роботі з CRM та оновлення функціоналу.
              </p>
            </div>
            <button
              type="button"
              onClick={() => setMarketingNotifications((v) => !v)}
              className={`${toggleClasses} ${
                marketingNotifications ? 'bg-primary' : 'bg-border'
              }`}
            >
              <span
                className={`${knobClasses} ${
                  marketingNotifications ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>
      </section>

      <section className="bg-card border border-border rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">Інтеграції</h2>
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-4 bg-background border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">Telegram-бот</p>
              <p className="text-xs text-muted-foreground">
                Надсилання сповіщень у Telegram про нові записи та зміни.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-white/5"
            >
              {telegramConnected ? 'Підключено' : 'Підключити'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 bg-background border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">IP-телефонія</p>
              <p className="text-xs text-muted-foreground">
                Планується інтеграція з популярними сервісами телефонії.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-white/5"
            >
              {phoneIntegration ? 'Налаштовано' : 'Налаштувати'}
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 bg-background border border-border rounded-lg px-4 py-3">
            <div>
              <p className="text-sm font-medium">Календарі</p>
              <p className="text-xs text-muted-foreground">
                Синхронізація записів з Google Calendar, Apple Calendar тощо.
              </p>
            </div>
            <button
              type="button"
              className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border text-muted-foreground hover:bg-white/5"
            >
              {calendarIntegration ? 'Налаштовано' : 'Налаштувати'}
            </button>
          </div>
        </div>
      </section>
    </div>
  );
}
