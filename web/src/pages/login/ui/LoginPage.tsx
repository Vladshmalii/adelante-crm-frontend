import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { LoginForm, ProFormText } from '@ant-design/pro-components';
import { Link, useNavigate } from '@tanstack/react-router';
import { Alert, Flex } from 'antd';

import { errorMessage } from '@/shared/api';
import { useLogo } from '@/shared/theme';

import { useLoginMutation } from '../api/login.mutation';

interface LoginPageProps {
  /** Куда вернуть пользователя после входа (приходит из ?redirect=). */
  redirectTo?: string;
}

export function LoginPage({ redirectTo }: LoginPageProps) {
  const logo = useLogo();
  const navigate = useNavigate();
  const login = useLoginMutation();

  return (
    <Flex align="center" justify="center" style={{ minHeight: '100%' }}>
      <LoginForm<{ email: string; password: string }>
        logo={logo}
        title="Adelante CRM"
        subTitle="Вхід до панелі салону"
        submitter={{ searchConfig: { submitText: 'Увійти' } }}
        loading={login.isPending}
        onFinish={async (values) => {
          await login.mutateAsync(values);
          await navigate({ to: redirectTo ?? '/', replace: true });
        }}
        message={
          login.error && (
            <Alert
              type="error"
              showIcon
              title={errorMessage(login.error)}
              style={{ marginBottom: 24 }}
            />
          )
        }
      >
        <ProFormText
          name="email"
          fieldProps={{ size: 'large', prefix: <MailOutlined />, autoComplete: 'email' }}
          placeholder="Email"
          rules={[
            { required: true, message: 'Вкажіть email' },
            { type: 'email', message: 'Невірний формат email' },
          ]}
        />
        <ProFormText.Password
          name="password"
          fieldProps={{ size: 'large', prefix: <LockOutlined />, autoComplete: 'current-password' }}
          placeholder="Пароль"
          rules={[{ required: true, message: 'Вкажіть пароль' }]}
        />
        <div style={{ textAlign: 'right', marginBottom: 24 }}>
          <Link to="/forgot-password">Забули пароль?</Link>
        </div>
      </LoginForm>
    </Flex>
  );
}
