import { StopOutlined } from '@ant-design/icons';
import { type ProColumns, ProTable } from '@ant-design/pro-components';
import { useQuery } from '@tanstack/react-query';
import { Button, Input, Select, Space, Tag, Typography } from 'antd';
import { useState } from 'react';

import type { Schema } from '@/shared/api';
import { meQueryOptions } from '@/shared/auth';
import { formatDateTime, formatMoney, useDebouncedValue } from '@/shared/lib';
import { QueryErrorAlert } from '@/shared/ui';
import {
  CancelCertificateModal,
  CertificateHistory,
  certificatesRegistryQueryOptions,
  certificateStatusLabels,
  certificateValidity,
} from '@/widgets/certificates';

type Certificate = Schema<'CertificateOut'>;
type Status = Schema<'CertificateStatus'>;

const PER_PAGE = 25;

/**
 * «Фінанси → Сертифікати» (суперюзер, certificates.md, раздел 8, п. 4): реестр сертификатов
 * сети — поиск по коду, фильтры по статусу и салону продажи, история, аннулирование.
 */
export function CertificatesRegistryTab() {
  const me = useQuery(meQueryOptions);
  const salons = me.data?.salons ?? [];
  const [code, setCode] = useState('');
  const debouncedCode = useDebouncedValue(code);
  const [status, setStatus] = useState<Status>();
  const [soldSalonId, setSoldSalonId] = useState<string>();
  const [page, setPage] = useState(1);
  const [cancelling, setCancelling] = useState<Certificate | null>(null);
  const registry = useQuery(
    certificatesRegistryQueryOptions({
      code: debouncedCode.trim(),
      status,
      soldSalonId,
      page,
      perPage: PER_PAGE,
    }),
  );
  const salonName = (id: string) => salons.find((s) => s.id === id)?.name ?? '—';

  const columns: ProColumns<Certificate>[] = [
    {
      title: 'Код',
      key: 'code',
      render: (_, c) => (
        <Typography.Text code copyable={{ text: c.code }}>
          {c.code}
        </Typography.Text>
      ),
    },
    {
      title: 'Сертифікат',
      key: 'name',
      render: (_, c) => (
        <Space orientation="vertical" size={0}>
          {c.name}
          <Typography.Text type="secondary">
            {c.scope === 'services' ? 'На послуги' : 'На все'} · {certificateValidity(c.expiresAt)}
          </Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Залишок',
      key: 'balance',
      align: 'right',
      render: (_, c) => `${formatMoney(c.balance)} з ${formatMoney(c.amount)}`,
    },
    {
      title: 'Статус',
      key: 'status',
      render: (_, c) => (
        <Space orientation="vertical" size={0}>
          <Tag color={certificateStatusLabels[c.status].color}>
            {certificateStatusLabels[c.status].text}
          </Tag>
          {c.cancelReason && <Typography.Text type="secondary">{c.cancelReason}</Typography.Text>}
        </Space>
      ),
    },
    { title: 'Власник', key: 'owner', render: (_, c) => c.owner?.name ?? '—' },
    { title: 'Покупець', key: 'buyer', render: (_, c) => c.buyer?.name ?? '—' },
    {
      title: 'Продано',
      key: 'sold',
      render: (_, c) => `${salonName(c.soldSalonId)} · ${formatDateTime(c.createdAt)}`,
    },
    {
      title: '',
      key: 'actions',
      width: 56,
      render: (_, c) =>
        c.status !== 'cancelled' && (
          <Button
            type="text"
            danger
            aria-label={`Анулювати ${c.code}`}
            icon={<StopOutlined />}
            onClick={() => {
              setCancelling(c);
            }}
          />
        ),
    },
  ];

  return (
    <>
      <QueryErrorAlert error={registry.error} onRetry={() => void registry.refetch()} />
      <ProTable<Certificate>
        rowKey="id"
        headerTitle="Сертифікати мережі"
        columns={columns}
        dataSource={registry.data?.data}
        loading={registry.isFetching}
        search={false}
        columnEmptyText="—"
        scroll={{ x: 'max-content' }}
        options={{ reload: () => void registry.refetch(), density: true }}
        expandable={{ expandedRowRender: (c) => <CertificateHistory certificateId={c.id} /> }}
        toolBarRender={() => [
          <Input.Search
            key="code"
            allowClear
            placeholder="Код сертифіката"
            style={{ width: 220 }}
            value={code}
            onChange={(e) => {
              setCode(e.target.value);
              setPage(1);
            }}
          />,
          <Select<Status>
            key="status"
            allowClear
            placeholder="Статус"
            style={{ width: 170 }}
            value={status}
            onChange={(value) => {
              setStatus(value);
              setPage(1);
            }}
            options={Object.entries(certificateStatusLabels).map(([value, { text }]) => ({
              value: value as Status,
              label: text,
            }))}
          />,
          <Select<string>
            key="salon"
            allowClear
            placeholder="Салон продажу"
            style={{ width: 200 }}
            value={soldSalonId}
            onChange={(value) => {
              setSoldSalonId(value);
              setPage(1);
            }}
            options={salons.map((s) => ({ value: s.id, label: s.name }))}
          />,
        ]}
        pagination={{
          current: page,
          pageSize: PER_PAGE,
          total: registry.data?.meta?.total ?? 0,
          showSizeChanger: false,
          onChange: setPage,
        }}
      />
      <CancelCertificateModal
        certificate={cancelling}
        onClose={() => {
          setCancelling(null);
        }}
      />
    </>
  );
}
