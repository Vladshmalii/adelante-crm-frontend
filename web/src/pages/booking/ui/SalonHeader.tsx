import {
  ClockCircleOutlined,
  EnvironmentOutlined,
  FacebookOutlined,
  GlobalOutlined,
  InstagramOutlined,
  PhoneOutlined,
} from '@ant-design/icons';
import { Collapse, Space, Typography } from 'antd';

import type { Schema } from '@/shared/api';
import { formatPhone } from '@/shared/lib';

type Salon = Schema<'app__api__booking__router__SalonOut'>;

const DAYS: [string, string][] = [
  ['monday', 'Понеділок'],
  ['tuesday', 'Вівторок'],
  ['wednesday', 'Середа'],
  ['thursday', 'Четвер'],
  ['friday', "П'ятниця"],
  ['saturday', 'Субота'],
  ['sunday', 'Неділя'],
];

/** Instagram: «@salon» или полная ссылка → ссылка. */
const instagramUrl = (value: string) =>
  /^https?:\/\//.test(value) ? value : `https://instagram.com/${value.replace(/^@/, '')}`;
const webUrl = (value: string) => (/^https?:\/\//.test(value) ? value : `https://${value}`);

/** Шапка сайта записи: салон, адрес, телефон, соцсети и часы работы. */
export function SalonHeader({ salon }: { salon: Salon }) {
  const address = [salon.city, salon.address].filter(Boolean).join(', ');
  return (
    <div style={{ textAlign: 'center', marginBottom: 8 }}>
      <Typography.Title level={2} style={{ margin: 0 }}>
        {salon.name}
      </Typography.Title>
      <Typography.Text type="secondary">
        Онлайн запис — оберіть послугу та зручний час
      </Typography.Text>
      <Space wrap size={[16, 4]} style={{ justifyContent: 'center', marginTop: 12 }}>
        {address && (
          <Typography.Text>
            <EnvironmentOutlined /> {address}
          </Typography.Text>
        )}
        {salon.phone && (
          <Typography.Link href={`tel:${salon.phone}`}>
            <PhoneOutlined /> {formatPhone(salon.phone)}
          </Typography.Link>
        )}
        {salon.instagram && (
          <Typography.Link href={instagramUrl(salon.instagram)} target="_blank">
            <InstagramOutlined /> Instagram
          </Typography.Link>
        )}
        {salon.facebook && (
          <Typography.Link href={webUrl(salon.facebook)} target="_blank">
            <FacebookOutlined /> Facebook
          </Typography.Link>
        )}
        {salon.website && (
          <Typography.Link href={webUrl(salon.website)} target="_blank">
            <GlobalOutlined /> Сайт
          </Typography.Link>
        )}
      </Space>
      {salon.schedule && (
        <Collapse
          ghost
          size="small"
          style={{ maxWidth: 360, margin: '4px auto 0' }}
          items={[
            {
              key: 'hours',
              label: (
                <span>
                  <ClockCircleOutlined /> Графік роботи
                </span>
              ),
              children: (
                <div style={{ textAlign: 'left' }}>
                  {DAYS.map(([key, label]) => {
                    const day = salon.schedule?.[key];
                    return (
                      <div
                        key={key}
                        style={{ display: 'flex', justifyContent: 'space-between', gap: 16 }}
                      >
                        <Typography.Text type="secondary">{label}</Typography.Text>
                        <Typography.Text>
                          {day?.is_work_day && day.start && day.end
                            ? `${day.start.slice(0, 5)}–${day.end.slice(0, 5)}`
                            : 'Вихідний'}
                        </Typography.Text>
                      </div>
                    );
                  })}
                </div>
              ),
            },
          ]}
        />
      )}
      {salon.description && (
        <Typography.Paragraph type="secondary" style={{ maxWidth: 560, margin: '8px auto 0' }}>
          {salon.description}
        </Typography.Paragraph>
      )}
    </div>
  );
}
