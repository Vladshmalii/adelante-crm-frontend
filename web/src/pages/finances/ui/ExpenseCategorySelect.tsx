import { PlusOutlined } from '@ant-design/icons';
import { useQuery } from '@tanstack/react-query';
import { App, Divider, Select, Typography } from 'antd';
import { useState } from 'react';

import { errorMessage } from '@/shared/api';

import { useCreateExpenseCategory } from '../api/finances.mutations';
import { expenseCategoriesQueryOptions } from '../api/finances.queries';

interface ExpenseCategorySelectProps {
  /** Название категории: в операции хранится снапшот названия, не id. */
  value?: string;
  onChange?: (value: string | undefined) => void;
}

/**
 * Категория расхода из справочника, с поиском. Если по запросу ничего нет — категорию
 * можно добавить прямо из списка (полное управление — «Категорії витрат» у кас).
 */
export function ExpenseCategorySelect({ value, onChange }: ExpenseCategorySelectProps) {
  const { message } = App.useApp();
  const { data, isFetching } = useQuery(expenseCategoriesQueryOptions());
  const create = useCreateExpenseCategory();
  const [query, setQuery] = useState('');
  const name = query.trim();
  const exists = (data ?? []).some((c) => c.name.toLowerCase() === name.toLowerCase());

  const add = () => {
    create.mutate(name, {
      onSuccess: (category) => {
        onChange?.(category.name);
        setQuery('');
        void message.success('Категорію додано');
      },
      onError: (e) => void message.error(errorMessage(e)),
    });
  };

  return (
    <Select
      value={value}
      onChange={onChange}
      allowClear
      placeholder="Оберіть категорію"
      loading={isFetching}
      showSearch={{ optionFilterProp: 'label', searchValue: query, onSearch: setQuery }}
      options={(data ?? []).map((c) => ({ value: c.name, label: c.name }))}
      popupRender={(menu) => (
        <>
          {menu}
          {name && !exists && (
            <>
              <Divider style={{ margin: '4px 0' }} />
              <Typography.Link
                disabled={create.isPending}
                style={{ display: 'block', padding: '4px 12px' }}
                onClick={add}
              >
                <PlusOutlined /> Додати «{name}»
              </Typography.Link>
            </>
          )}
        </>
      )}
    />
  );
}
