import { ProConfigProvider } from '@ant-design/pro-components';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { RouterProvider } from '@tanstack/react-router';
import { App as AntApp, ConfigProvider, theme } from 'antd';
import ukUA from 'antd/locale/uk_UA';
import dayjs from 'dayjs';
import 'dayjs/locale/uk';
import { useEffect } from 'react';

import { type ThemeMode, usePreferencesStore } from '@/shared/preferences';
import { getTheme } from '@/shared/theme';

import { queryClient } from './query-client';
import { router } from './router';

dayjs.locale('uk');

/**
 * Тема для всей страницы, а не только для компонентов antd: ConfigProvider красит компоненты,
 * а фон `body` и системные элементы (скроллбары, автозаполнение) оставляет браузеру. Поэтому
 * страницы вне ProLayout (вход, восстановление пароля, 404) были белыми с тёмными полями.
 * Здесь фон, цвет текста и `color-scheme` берутся из токенов — новым страницам ничего делать
 * не нужно.
 */
function ThemeSync({ mode }: { mode: ThemeMode }) {
  const { token } = theme.useToken();
  useEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = mode;
    root.style.colorScheme = mode;
    root.style.backgroundColor = token.colorBgLayout;
    document.body.style.backgroundColor = token.colorBgLayout;
    document.body.style.color = token.colorText;
  }, [mode, token.colorBgLayout, token.colorText]);
  return null;
}

export function App() {
  const themeMode = usePreferencesStore((s) => s.themeMode);

  return (
    <QueryClientProvider client={queryClient}>
      <ConfigProvider locale={ukUA} theme={getTheme(themeMode)}>
        <ThemeSync mode={themeMode} />
        <ProConfigProvider dark={themeMode === 'dark'}>
          {/* AntApp даёт message/notification/modal с учётом темы через App.useApp() */}
          <AntApp>
            <RouterProvider router={router} />
          </AntApp>
        </ProConfigProvider>
      </ConfigProvider>
      <ReactQueryDevtools buttonPosition="bottom-left" />
    </QueryClientProvider>
  );
}
