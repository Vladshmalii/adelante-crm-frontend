import { type ErrorComponentProps, useRouter } from '@tanstack/react-router';
import { Button, Result } from 'antd';

import { errorMessage } from '@/shared/api';

/** Ошибка загрузки роута (beforeLoad/loader): вместо белого экрана — сообщение и повтор. */
export function RouteError({ error, reset }: ErrorComponentProps) {
  const router = useRouter();
  return (
    <Result
      status="error"
      title="Не вдалося завантажити сторінку"
      subTitle={errorMessage(error)}
      extra={
        <Button
          type="primary"
          onClick={() => {
            reset();
            void router.invalidate();
          }}
        >
          Спробувати ще раз
        </Button>
      }
    />
  );
}
