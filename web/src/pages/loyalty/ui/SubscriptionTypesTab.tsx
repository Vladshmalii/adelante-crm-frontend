import {
  CopyOutlined,
  EditOutlined,
  InboxOutlined,
  PlusOutlined,
  UndoOutlined,
} from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Input, Popconfirm, Segmented, Space, Tooltip, Typography } from 'antd';
import { useMemo, useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { formatMoney } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  activationModeLabels,
  durationLabel,
  subscriptionTypesQueryOptions,
  typeUnitsLabel,
  useSaveSubscriptionType,
} from '@/widgets/subscriptions';

import { SubscriptionTypeFormModal } from './SubscriptionTypeFormModal';

type SubscriptionType = Schema<'SubscriptionTypeOut'>;
type View = 'active' | 'archive';

/**
 * Лояльність → Абонементи → «Типи абонементів» (суперюзер, frontend-subscriptions.md, 2.1):
 * Активні / Архів, поиск по названию, «+ Додати тип», «Копіювати» — форма создания с полями
 * копии. Удаления нет — только архив (`isActive = false`): архивный тип не продаётся, проданные
 * работают. Правка типа на проданные абонементы не влияет (снимок).
 */
export function SubscriptionTypesTab() {
  const { message } = App.useApp();
  const types = useQuery(subscriptionTypesQueryOptions());
  const save = useSaveSubscriptionType();
  const [view, setView] = useState<View>('active');
  const [query, setQuery] = useState('');
  const [form, setForm] = useState<{ type?: SubscriptionType; copy?: boolean } | null>(null);
  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (types.data ?? [])
      .filter((t) => t.isActive === (view === 'active') && (!q || t.name.toLowerCase().includes(q)))
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk'));
  }, [types.data, view, query]);

  const setArchived = (t: SubscriptionType, archived: boolean) =>
    save.mutateAsync({ id: t.id, body: { isActive: !archived } }).then(
      () => void message.success(archived ? 'Тип перенесено в архів' : 'Тип повернуто з архіву'),
      (e: unknown) => void message.error(errorMessage(e)),
    );

  const columns: ProColumns<SubscriptionType>[] = [
    {
      title: 'Назва',
      key: 'name',
      render: (_, t) => (
        <Space orientation="vertical" size={0}>
          <Typography.Link
            onClick={() => {
              setForm({ type: t });
            }}
          >
            {t.name}
          </Typography.Link>
          <Typography.Text type="secondary">
            {activationModeLabels[t.activationMode]}
            {t.freezeAllowed && ' · можна заморозити'}
          </Typography.Text>
        </Space>
      ),
    },
    { title: 'Ціна', key: 'price', align: 'right', render: (_, t) => formatMoney(t.price) },
    { title: 'Одиниці', key: 'units', render: (_, t) => typeUnitsLabel(t) },
    {
      title: 'Термін',
      key: 'duration',
      render: (_, t) => durationLabel(t.durationValue, t.durationUnit),
    },
    {
      title: 'Випущено',
      key: 'issuedCount',
      align: 'right',
      tooltip: 'Продано абонементів цього типу, крім анульованих',
      render: (_, t) => t.issuedCount,
    },
    {
      title: '',
      key: 'actions',
      width: 120,
      render: (_, t) => (
        <Space size={0}>
          <Tooltip title="Копіювати">
            <Button
              type="text"
              aria-label="Копіювати"
              icon={<CopyOutlined />}
              onClick={() => {
                setForm({ type: t, copy: true });
              }}
            />
          </Tooltip>
          <Button
            type="text"
            aria-label="Редагувати"
            icon={<EditOutlined />}
            onClick={() => {
              setForm({ type: t });
            }}
          />
          {t.isActive ? (
            <Popconfirm
              title={`Архівувати «${t.name}»?`}
              description="Тип перестане продаватися. Продані абонементи діють далі."
              okText="Архівувати"
              cancelText="Скасувати"
              onConfirm={() => setArchived(t, true)}
            >
              <Button type="text" aria-label="Архівувати" icon={<InboxOutlined />} />
            </Popconfirm>
          ) : (
            <Tooltip title="Повернути з архіву">
              <Button
                type="text"
                aria-label="Повернути з архіву"
                icon={<UndoOutlined />}
                onClick={() => void setArchived(t, false)}
              />
            </Tooltip>
          )}
        </Space>
      ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={types.error} onRetry={() => void types.refetch()} />
      <ProTable<SubscriptionType>
        rowKey="id"
        headerTitle="Абонементи Мережа Adelante"
        tooltip="Абонемент діє в усіх салонах мережі. Зміни типу не впливають на продані абонементи"
        columns={columns}
        dataSource={visible}
        loading={types.isFetching}
        search={false}
        pagination={{ pageSize: 20, hideOnSinglePage: true, showSizeChanger: false }}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void types.refetch(), density: true }}
        toolBarRender={() => [
          <Segmented<View>
            key="view"
            value={view}
            onChange={setView}
            options={[
              { value: 'active', label: 'Активні' },
              { value: 'archive', label: 'Архів' },
            ]}
          />,
          <Input.Search
            key="search"
            allowClear
            placeholder="Пошук за назвою"
            style={{ width: 220 }}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
            }}
          />,
          <Button
            key="create"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setForm({});
            }}
          >
            Додати тип
          </Button>,
        ]}
      />
      <SubscriptionTypeFormModal
        open={form !== null}
        type={form?.type}
        copy={form?.copy}
        onClose={() => {
          setForm(null);
        }}
      />
    </>
  );
}
