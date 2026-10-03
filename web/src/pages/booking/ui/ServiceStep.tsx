import { useQuery } from '@tanstack/react-query';
import { Empty, Input, Space, Spin, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';

import { servicesQueryOptions } from '../api/booking.api';
import { formatDuration, groupServices } from '../model/booking';
import { ChoiceCard, StepTitle } from './BookingShell';

type Service = Schema<'app__api__booking__router__ServiceOut'>;

interface ServiceStepProps {
  slug: string;
  selectedId?: string;
  onSelect: (service: Service) => void;
}

/** Шаг 1: одна услуга (в записи с сайта услуга одна). Категории — чипами, поиск — если много. */
export function ServiceStep({ slug, selectedId, onSelect }: ServiceStepProps) {
  const { data = [], isPending, error, refetch } = useQuery(servicesQueryOptions(slug));
  const [category, setCategory] = useState<string | null>(null);
  const [query, setQuery] = useState('');

  const filtered = data.filter(
    (s) =>
      (!category || s.category_id === category) &&
      (!query.trim() || s.name.toLowerCase().includes(query.trim().toLowerCase())),
  );
  const groups = groupServices(filtered);
  const categories = groupServices(data);

  return (
    <>
      <StepTitle title="Оберіть послугу" subtitle="Виберіть послугу, яку бажаєте отримати" />
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      {isPending ? (
        <Spin style={{ display: 'block', margin: '40px auto' }} />
      ) : (
        <>
          {data.length > 8 && (
            <Input.Search
              allowClear
              placeholder="Пошук послуги"
              style={{ marginBottom: 12 }}
              onChange={(e) => {
                setQuery(e.target.value);
              }}
            />
          )}
          {categories.length > 1 && (
            <Space size={[8, 8]} wrap style={{ marginBottom: 16 }}>
              <Tag.CheckableTag
                checked={category === null}
                onChange={() => {
                  setCategory(null);
                }}
                style={{ padding: '4px 14px', borderRadius: 999 }}
              >
                Усі
              </Tag.CheckableTag>
              {categories.map((c) => (
                <Tag.CheckableTag
                  key={c.id}
                  checked={category === c.id}
                  onChange={() => {
                    setCategory(c.id);
                  }}
                  style={{ padding: '4px 14px', borderRadius: 999 }}
                >
                  {c.name}
                </Tag.CheckableTag>
              ))}
            </Space>
          )}
          {groups.length === 0 && <Empty description="Послуг не знайдено" />}
          {groups.map((g) => (
            <div key={g.id} style={{ marginBottom: 16 }}>
              {categories.length > 1 && (
                <Typography.Text
                  type="secondary"
                  strong
                  style={{ display: 'block', marginBottom: 8, fontSize: 13 }}
                >
                  {g.name}
                </Typography.Text>
              )}
              <Space orientation="vertical" size={10} style={{ display: 'flex' }}>
                {g.services.map((s) => (
                  <ChoiceCard
                    key={s.id}
                    selected={s.id === selectedId}
                    onClick={() => {
                      onSelect(s);
                    }}
                    extra={<Typography.Text strong>{formatMoney(s.price)}</Typography.Text>}
                  >
                    <Typography.Text strong style={{ display: 'block' }}>
                      {s.name}
                    </Typography.Text>
                    <Typography.Text type="secondary" style={{ fontSize: 13 }}>
                      {formatDuration(s.duration_minutes)}
                      {s.description ? ` · ${s.description}` : ''}
                    </Typography.Text>
                  </ChoiceCard>
                ))}
              </Space>
            </div>
          ))}
        </>
      )}
    </>
  );
}
