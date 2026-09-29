import { BellOutlined } from '@ant-design/icons';
import { App, Space, Switch, Typography } from 'antd';

import { errorMessage, type Schema } from '@/shared/api';

import { useUpdateRecord } from '../api/calendar.mutations';
import { reminderStatus } from '../model/reminder';

type RecordItem = Schema<'RecordOut'>;

/** «Сповіщення про візит»: выключатель и статус напоминания в Telegram. */
export function ReminderBlock({ record, editable }: { record: RecordItem; editable: boolean }) {
  const { message } = App.useApp();
  const update = useUpdateRecord();
  const status = reminderStatus(record);

  return (
    <Space orientation="vertical">
      <Space>
        <BellOutlined />
        <Switch
          checked={record.reminderEnabled}
          disabled={!editable}
          loading={update.isPending}
          onChange={(reminderEnabled) =>
            void update
              .mutateAsync({ id: record.id, body: { reminderEnabled } })
              .catch((e: unknown) => void message.error(errorMessage(e)))
          }
        />
        <span>Нагадування клієнту в Telegram за 30 хв</span>
      </Space>
      <Typography.Text type={status.type}>{status.text}</Typography.Text>
    </Space>
  );
}
