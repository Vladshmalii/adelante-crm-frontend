import { LockOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Link } from '@tanstack/react-router';
import { Alert, Button, Flex, Result } from 'antd';

import { errorMessage } from '@/shared/api';
import { useLogo } from '@/shared/theme';

import { useResetPassword } from '../api/password.mutations';

interface Values {
  password: string;
  confirm: string;
}

/** Страница по ссылке из письма: `/reset-password?token=…`. */
export function ResetPasswordPage({ token }: { token?: string }) {
  const logo = useLogo();
  const reset = useResetPassword();

  if (!token) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
        <Result
          status="warning"
          title="Посилання недійсне"
          subTitle="У посиланні немає коду для зміни пароля. Запросіть нове."
          extra={
            <Link to="/forgot-password">
              <Button type="primary">Запросити нове посилання</Button>
            </Link>
          }
        />
      </Flex>
    );
  }

  if (reset.isSuccess) {
    return (
      <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
        <Result
          status="success"
          title="Пароль змінено"
          subTitle="Тепер увійдіть з новим паролем."
          extra={
            <Link to="/login">
              <Button type="primary">Увійти</Button>
            </Link>
          }
        />
      </Flex>
    );
  }

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
      <LoginForm<Values>
        logo={logo}
        title="Новий пароль"
        subTitle="Мінімум 8 символів"
        submitter={{ searchConfig: { submitText: 'Зберегти пароль' } }}
        loading={reset.isPending}
        onFinish={async ({ password }) => {
          await reset.mutateAsync({ token, password }).catch(() => undefined);
        }}
        message={
          reset.isError && (
            <Alert
              type="error"
              showIcon
              title={errorMessage(reset.error)}
              description={<Link to="/forgot-password">Запросити нове посилання</Link>}
              style={{ marginBottom: 24 }}
            />
          )
        }
      >
        <ProFormText.Password
          name="password"
          fieldProps={{ size: 'large', prefix: <LockOutlined />, autoComplete: 'new-password' }}
          placeholder="Новий пароль"
          rules={[
            { required: true, message: 'Вкажіть пароль' },
            { min: 8, message: 'Мінімум 8 символів' },
          ]}
        />
        <ProFormText.Password
          name="confirm"
          dependencies={['password']}
          fieldProps={{ size: 'large', prefix: <LockOutlined />, autoComplete: 'new-password' }}
          placeholder="Повторіть пароль"
          rules={[
            { required: true, message: 'Повторіть пароль' },
            ({ getFieldValue }) => ({
              validator: (_, value?: string) =>
                !value || value === getFieldValue('password')
                  ? Promise.resolve()
                  : Promise.reject(new Error('Паролі не збігаються')),
            }),
          ]}
        />
      </LoginForm>
    </Flex>
  );
}
