import {
  ArrowDownOutlined,
  ArrowUpOutlined,
  DeleteOutlined,
  EditOutlined,
  PlusOutlined,
} from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Input, Modal, Popconfirm, Space, Table } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';
import {
  certificateCategoriesQueryOptions,
  certificateTemplatesQueryOptions,
  NO_CATEGORY,
  useDeleteCertificateCategory,
  useSaveCertificateCategory,
} from '@/widgets/certificates';

type Category = Schema<'CertificateCategoryOut'>;

const byOrder = (a: Category, b: Category) =>
  a.sortOrder - b.sortOrder || a.name.localeCompare(b.name, 'uk');

/**
 * Категории шаблонов сертификатов (суперюзер, certificates.md, 13.4, С4): создать,
 * переименовать, порядок (стрелки), удалить — шаблоны удалённой категории становятся
 * «Без категорії». Название уникально без учёта регистра (409 — текстом бекенда).
 */
export function CertificateCategoriesModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery({
    ...certificateCategoriesQueryOptions(),
    enabled: open,
  });
  const templates = useQuery({ ...certificateTemplatesQueryOptions(), enabled: open });
  const save = useSaveCertificateCategory();
  const remove = useDeleteCertificateCategory();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [moving, setMoving] = useState(false);
  const categories = [...(data ?? [])].sort(byOrder);
  const templatesIn = (id: string) =>
    (templates.data ?? []).filter((t) => t.categoryId === id).length;

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    const last = categories.at(-1);
    save.mutate(
      { body: { name, sortOrder: last ? last.sortOrder + 1 : 0 } },
      {
        onSuccess: () => {
          setNewName('');
          void message.success('Категорію додано');
        },
        onError: (e) => void message.error(errorMessage(e)),
      },
    );
  };

  const saveRename = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    save.mutate(
      { id: editing.id, body: { name } },
      {
        onSuccess: () => {
          setEditing(null);
          void message.success('Категорію перейменовано');
        },
        onError: (e) => void message.error(errorMessage(e)),
      },
    );
  };

  /** Переставить категорию и перенумеровать порядок 0, 1, 2… — меняются только сдвинутые. */
  const move = async (index: number, delta: -1 | 1) => {
    const next = [...categories];
    const [item] = next.splice(index, 1);
    if (!item) return;
    next.splice(index + delta, 0, item);
    setMoving(true);
    try {
      for (const [i, c] of next.entries()) {
        if (c.sortOrder !== i) await save.mutateAsync({ id: c.id, body: { sortOrder: i } });
      }
    } catch (e) {
      void message.error(errorMessage(e));
    } finally {
      setMoving(false);
    }
  };

  return (
    <Modal
      title="Категорії сертифікатів"
      open={open}
      onCancel={onClose}
      footer={null}
      width={560}
      destroyOnHidden
    >
      <QueryErrorAlert error={error} onRetry={() => void refetch()} />
      <Space.Compact style={{ width: '100%', marginBottom: 16 }}>
        <Input
          placeholder="Нова категорія"
          value={newName}
          maxLength={128}
          onChange={(e) => {
            setNewName(e.target.value);
          }}
          onPressEnter={add}
        />
        <Button
          type="primary"
          icon={<PlusOutlined />}
          loading={save.isPending && !editing && !moving}
          disabled={!newName.trim()}
          onClick={add}
        >
          Додати
        </Button>
      </Space.Compact>
      <Table<Category>
        rowKey="id"
        size="small"
        pagination={false}
        loading={isFetching || moving}
        dataSource={categories}
        locale={{ emptyText: `Категорій немає — усі шаблони «${NO_CATEGORY}»` }}
        columns={[
          {
            title: 'Назва',
            key: 'name',
            render: (_, c) =>
              editing?.id === c.id ? (
                <Input
                  autoFocus
                  size="small"
                  value={editing.name}
                  maxLength={128}
                  onChange={(e) => {
                    setEditing({ id: c.id, name: e.target.value });
                  }}
                  onPressEnter={saveRename}
                  onBlur={() => {
                    setEditing(null);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') setEditing(null);
                  }}
                />
              ) : (
                c.name
              ),
          },
          {
            title: 'Типів',
            key: 'templates',
            align: 'right',
            width: 80,
            render: (_, c) => templatesIn(c.id),
          },
          {
            title: '',
            key: 'actions',
            width: 150,
            render: (_, c, index) => (
              <Space size={0}>
                <Button
                  type="text"
                  size="small"
                  aria-label="Вище"
                  icon={<ArrowUpOutlined />}
                  disabled={index === 0 || moving}
                  onClick={() => void move(index, -1)}
                />
                <Button
                  type="text"
                  size="small"
                  aria-label="Нижче"
                  icon={<ArrowDownOutlined />}
                  disabled={index === categories.length - 1 || moving}
                  onClick={() => void move(index, 1)}
                />
                <Button
                  type="text"
                  size="small"
                  aria-label="Перейменувати"
                  icon={<EditOutlined />}
                  onMouseDown={(e) => {
                    // Не даём полю ввода соседней строки потерять фокус раньше клика.
                    e.preventDefault();
                  }}
                  onClick={() => {
                    setEditing({ id: c.id, name: c.name });
                  }}
                />
                <Popconfirm
                  title={`Видалити категорію «${c.name}»?`}
                  description={
                    templatesIn(c.id) > 0
                      ? `Шаблони (${String(templatesIn(c.id))}) стануть «${NO_CATEGORY}».`
                      : 'Категорія порожня.'
                  }
                  okText="Видалити"
                  okButtonProps={{ danger: true }}
                  cancelText="Скасувати"
                  onConfirm={() =>
                    remove.mutateAsync(c.id).then(
                      () => void message.success('Категорію видалено'),
                      (e: unknown) => void message.error(errorMessage(e)),
                    )
                  }
                >
                  <Button
                    type="text"
                    size="small"
                    danger
                    aria-label="Видалити"
                    icon={<DeleteOutlined />}
                  />
                </Popconfirm>
              </Space>
            ),
          },
        ]}
      />
    </Modal>
  );
}
