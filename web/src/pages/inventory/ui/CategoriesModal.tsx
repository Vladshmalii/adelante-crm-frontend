import { DeleteOutlined, EditOutlined, LockOutlined, PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Button, Input, Modal, Radio, Space, Table, Tooltip, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage, type Schema } from '@/shared/api';
import { QueryErrorAlert } from '@/shared/ui';

import {
  useCreateCategory,
  useDeleteCategory,
  useRenameCategory,
} from '../api/inventory.mutations';
import { inventoryCategoriesQueryOptions } from '../api/inventory.queries';

type Category = Schema<'app__api__admin__inventory__CategoryOut'>;
type DeleteMode = Schema<'CategoryDeleteMode'>;

interface CategoriesModalProps {
  open: boolean;
  onClose: () => void;
}

/** Категории склада. Системная «Без категорії» не переименовывается и не удаляется. */
export function CategoriesModal({ open, onClose }: CategoriesModalProps) {
  const { message } = App.useApp();
  const { data, error, isFetching, refetch } = useQuery({
    ...inventoryCategoriesQueryOptions(),
    enabled: open,
  });
  const create = useCreateCategory();
  const rename = useRenameCategory();
  const [newName, setNewName] = useState('');
  const [editing, setEditing] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState<Category | null>(null);

  const add = () => {
    const name = newName.trim();
    if (!name) return;
    create.mutate(name, {
      onSuccess: () => {
        setNewName('');
        void message.success('Категорію додано');
      },
      onError: (e) => void message.error(errorMessage(e)),
    });
  };

  const saveRename = () => {
    if (!editing) return;
    const name = editing.name.trim();
    if (!name) return;
    rename.mutate(
      { id: editing.id, name },
      {
        onSuccess: () => {
          setEditing(null);
          void message.success('Категорію перейменовано');
        },
        onError: (e) => void message.error(errorMessage(e)),
      },
    );
  };

  return (
    <Modal
      title="Категорії товарів"
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
          loading={create.isPending}
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
        loading={isFetching}
        dataSource={data}
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
                <Space>
                  {c.name}
                  {c.isSystem && (
                    <Tooltip title="Системна категорія">
                      <LockOutlined />
                    </Tooltip>
                  )}
                </Space>
              ),
          },
          { title: 'Товарів', dataIndex: 'productsCount', align: 'right', width: 90 },
          {
            title: '',
            key: 'actions',
            width: 88,
            render: (_, c) =>
              !c.isSystem && (
                <Space size={0}>
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
                  <Button
                    type="text"
                    size="small"
                    danger
                    aria-label="Видалити"
                    icon={<DeleteOutlined />}
                    onClick={() => {
                      setDeleting(c);
                    }}
                  />
                </Space>
              ),
          },
        ]}
      />
      <DeleteCategoryModal
        category={deleting}
        onClose={() => {
          setDeleting(null);
        }}
      />
    </Modal>
  );
}

/** Удаление: пустая категория — просто подтверждение; непустая — выбор судьбы товаров. */
function DeleteCategoryModal({
  category,
  onClose,
}: {
  category: Category | null;
  onClose: () => void;
}) {
  const { message } = App.useApp();
  const remove = useDeleteCategory();
  const [mode, setMode] = useState<DeleteMode>('move_to_uncategorized');
  const hasProducts = (category?.productsCount ?? 0) > 0;

  return (
    <Modal
      title={category ? `Видалити категорію «${category.name}»?` : ''}
      open={!!category}
      onCancel={onClose}
      destroyOnHidden
      okText="Видалити"
      okButtonProps={{ danger: true, loading: remove.isPending }}
      cancelText="Скасувати"
      afterClose={() => {
        setMode('move_to_uncategorized');
      }}
      onOk={() => {
        if (!category) return;
        remove.mutate(
          { id: category.id, mode },
          {
            onSuccess: () => {
              void message.success('Категорію видалено');
              onClose();
            },
            onError: (e) => void message.error(errorMessage(e)),
          },
        );
      }}
    >
      {hasProducts ? (
        <>
          <Typography.Paragraph>
            У категорії {category?.productsCount} товар(ів). Що з ними зробити?
          </Typography.Paragraph>
          <Radio.Group
            orientation="vertical"
            value={mode}
            onChange={(e) => {
              setMode(e.target.value as DeleteMode);
            }}
            options={[
              { value: 'move_to_uncategorized', label: 'Перенести в «Без категорії»' },
              { value: 'delete_products', label: 'Видалити разом з товарами' },
            ]}
          />
        </>
      ) : (
        <Typography.Paragraph>Категорія порожня.</Typography.Paragraph>
      )}
    </Modal>
  );
}
