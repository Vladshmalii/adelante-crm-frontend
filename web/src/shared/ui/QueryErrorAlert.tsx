import { Alert, Button } from 'antd';

import { errorMessage } from '@/shared/api';

interface QueryErrorAlertProps {
  error: unknown;
  onRetry: () => void;
}

/** Ошибка фоновой загрузки данных на уже открытой странице. */
export function QueryErrorAlert({ error, onRetry }: QueryErrorAlertProps) {
  if (!error) return null;
  return (
    <Alert
      type="error"
      showIcon
      style={{ marginBottom: 16 }}
      title="Не вдалося завантажити дані"
      description={errorMessage(error)}
      action={
        <Button size="small" onClick={onRetry}>
          Повторити
        </Button>
      }
    />
  );
}
