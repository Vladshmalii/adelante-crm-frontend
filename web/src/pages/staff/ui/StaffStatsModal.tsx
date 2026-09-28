import { StatisticCard } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { DatePicker, Modal, Space, Spin } from 'antd';
import type { Dayjs } from 'dayjs';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { formatMoney, inSalonTz } from '@/shared/lib';

import { staffStatsQueryOptions } from '../api/staff.queries';
import { staffFullName } from '../model/labels';

type Staff = Schema<'StaffOut'>;

interface StaffStatsModalProps {
  staff: Staff | null;
  onClose: () => void;
}

/** Статистика мастера за период. Доступна только суперюзеру (выручка — финансовые данные). */
export function StaffStatsModal({ staff, onClose }: StaffStatsModalProps) {
  return (
    <Modal
      title={staff ? `Статистика: ${staffFullName(staff)}` : 'Статистика'}
      open={!!staff}
      onCancel={onClose}
      footer={null}
      width={760}
      destroyOnHidden
    >
      {staff && <Stats staffId={staff.id} />}
    </Modal>
  );
}

function Stats({ staffId }: { staffId: string }) {
  const now = inSalonTz(new Date());
  const [range, setRange] = useState<[Dayjs, Dayjs]>([now.startOf('month'), now.endOf('month')]);
  const [from, to] = range.map((d) => d.format('YYYY-MM-DD')) as [string, string];
  const { data, isPending } = useQuery(staffStatsQueryOptions(staffId, from, to));

  return (
    <Space orientation="vertical" size="large" style={{ width: '100%' }}>
      <DatePicker.RangePicker
        value={range}
        allowClear={false}
        format="DD.MM.YYYY"
        onChange={(value) => {
          if (value?.[0] && value[1]) setRange([value[0], value[1]]);
        }}
      />
      {isPending || !data ? (
        <Spin />
      ) : (
        <StatisticCard.Group direction="row">
          <StatisticCard statistic={{ title: 'Виручка', value: formatMoney(data.revenue) }} />
          <StatisticCard statistic={{ title: 'Завершених візитів', value: data.visits }} />
          <StatisticCard statistic={{ title: 'Середній чек', value: formatMoney(data.avgCheck) }} />
          <StatisticCard
            statistic={{ title: 'Середній рейтинг', value: data.rating?.toFixed(1) ?? '—' }}
          />
        </StatisticCard.Group>
      )}
    </Space>
  );
}
