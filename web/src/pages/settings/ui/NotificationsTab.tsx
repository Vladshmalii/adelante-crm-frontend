import { ProCard, ProForm, ProFormDigit } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Spin, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';

import {
  notificationSettingsQueryOptions,
  useUpdateNotificationSettings,
} from '../api/settings.api';

/** Границы — как на бекенде (backend/docs/sms-reminders.md, раздел 4). */
export const REMINDER_LEAD_MIN = 15;
export const REMINDER_LEAD_MAX = 1440;

type FormValues = Schema<'NotificationSettingsPatchIn'>;

/** «Нагадування»: за сколько минут до визита напоминать клиенту (Telegram или SMS). */
export function NotificationsTab() {
  const { message } = App.useApp();
  const { data, error, isPending, refetch } = useQuery(notificationSettingsQueryOptions());
  const update = useUpdateNotificationSettings();

  if (isPending) return <Spin />;
  if (error) return <QueryErrorAlert error={error} onRetry={() => void refetch()} />;

  return (
    <ProCard variant="outlined">
      <ProForm<FormValues>
        key={JSON.stringify(data)}
        layout="vertical"
        initialValues={data}
        submitter={{
          searchConfig: { submitText: 'Зберегти', resetText: 'Скасувати зміни' },
        }}
        onFinish={async (values) => {
          if (values.reminderLeadMinutes === data.reminderLeadMinutes) {
            message.info('Змін немає');
            return true;
          }
          try {
            await update.mutateAsync(values);
            message.success('Налаштування нагадувань збережено');
            return true;
          } catch (e) {
            message.error(errorMessage(e));
            return false;
          }
        }}
      >
        <ProFormDigit
          name="reminderLeadMinutes"
          label="Нагадування клієнтам за N хвилин до візиту"
          width="sm"
          min={REMINDER_LEAD_MIN}
          max={REMINDER_LEAD_MAX}
          fieldProps={{ precision: 0, suffix: 'хв' }}
          rules={[
            { required: true, message: 'Вкажіть кількість хвилин' },
            {
              type: 'number',
              min: REMINDER_LEAD_MIN,
              max: REMINDER_LEAD_MAX,
              message: `Від ${REMINDER_LEAD_MIN} до ${REMINDER_LEAD_MAX} хвилин (доба)`,
            },
          ]}
        />
        <Typography.Paragraph type="secondary">
          Нагадування надходить у Telegram, якщо клієнт підключив бота, інакше — SMS. Канал
          змінюється в картці клієнта. Записи, створені пізніше моменту нагадування, його не
          отримують.
        </Typography.Paragraph>
      </ProForm>
    </ProCard>
  );
}
